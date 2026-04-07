---
title: 'Lab 2A：Leader 选举实现指南'
description: '2A 要求你实现：选举超时、RequestVote RPC、心跳。完成后能通过 `TestInitialElection2A` 和 `TestReElection2A`。'
order: 1
source: 'mit-6.824'
sourceTitle: 'MIT 6.824 学习笔记'
section: 'labs'
sectionTitle: '实验'
subsection: 'lab2'
subsectionTitle: 'Lab 2 · Raft'
language: 'zh'
tags: ['docs', 'mit-6.824', 'labs', 'lab2']
---
## 第一步：初始化

在 `Make()` 里初始化所有字段：

```go
func Make(peers []*labrpc.ClientEnd, me int,
    persister *Persister, applyCh chan ApplyMsg) *Raft {
    rf := &Raft{}
    rf.peers = peers
    rf.persister = persister
    rf.me = me
    rf.applyCh = applyCh

    // 初始化持久化状态
    rf.currentTerm = 0
    rf.votedFor = -1
    rf.log = []LogEntry{{}}  // 索引 0 是占位符，实际日志从索引 1 开始

    // 初始化易失状态
    rf.commitIndex = 0
    rf.lastApplied = 0
    rf.state = "follower"
    rf.lastHeartbeat = time.Now()

    // 从持久化存储恢复状态
    rf.readPersist(persister.ReadRaftState())

    // 启动选举超时 goroutine
    go rf.ticker()

    return rf
}
```

---

## 第二步：选举超时 goroutine

这个 goroutine 定期检查是否需要发起选举：

```go
func (rf *Raft) ticker() {
    for !rf.killed() {
        // 随机选举超时：150ms 到 300ms 之间
        timeout := time.Duration(150+rand.Intn(150)) * time.Millisecond
        time.Sleep(timeout)

        rf.mu.Lock()
        // 如果是 Follower 或 Candidate，且超时了，发起选举
        if rf.state != "leader" &&
            time.Since(rf.lastHeartbeat) >= timeout {
            go rf.startElection()
        }
        rf.mu.Unlock()
    }
}
```

**为什么要随机超时**：如果所有节点同时超时，会同时发起选举，可能导致没有节点获得多数票（选票分散）。随机超时让节点在不同时间发起选举，减少冲突。

---

## 第三步：发起选举

```go
func (rf *Raft) startElection() {
    rf.mu.Lock()
    rf.state = "candidate"
    rf.currentTerm++
    rf.votedFor = rf.me
    rf.lastHeartbeat = time.Now()  // 重置超时计时器
    rf.persist()

    term := rf.currentTerm
    lastLogIndex := len(rf.log) - 1
    lastLogTerm := rf.log[lastLogIndex].Term
    rf.mu.Unlock()

    votes := 1  // 给自己投票
    var mu sync.Mutex

    for i := range rf.peers {
        if i == rf.me {
            continue
        }
        go func(server int) {
            args := RequestVoteArgs{
                Term:         term,
                CandidateId:  rf.me,
                LastLogIndex: lastLogIndex,
                LastLogTerm:  lastLogTerm,
            }
            reply := RequestVoteReply{}
            ok := rf.sendRequestVote(server, &args, &reply)
            if !ok {
                return
            }

            rf.mu.Lock()
            defer rf.mu.Unlock()

            // 如果对方的任期更大，退回 Follower
            if reply.Term > rf.currentTerm {
                rf.currentTerm = reply.Term
                rf.state = "follower"
                rf.votedFor = -1
                rf.persist()
                return
            }

            // 如果任期已经变了，忽略这个回复
            if rf.state != "candidate" || rf.currentTerm != term {
                return
            }

            if reply.VoteGranted {
                mu.Lock()
                votes++
                if votes > len(rf.peers)/2 {
                    mu.Unlock()
                    rf.becomeLeader()
                    return
                }
                mu.Unlock()
            }
        }(i)
    }
}
```

---

## 第四步：实现 RequestVote RPC

```go
type RequestVoteArgs struct {
    Term         int
    CandidateId  int
    LastLogIndex int
    LastLogTerm  int
}

type RequestVoteReply struct {
    Term        int
    VoteGranted bool
}

func (rf *Raft) RequestVote(args *RequestVoteArgs, reply *RequestVoteReply) {
    rf.mu.Lock()
    defer rf.mu.Unlock()

    reply.Term = rf.currentTerm
    reply.VoteGranted = false

    // 如果对方任期更小，拒绝
    if args.Term < rf.currentTerm {
        return
    }

    // 如果对方任期更大，更新自己的任期，退回 Follower
    if args.Term > rf.currentTerm {
        rf.currentTerm = args.Term
        rf.state = "follower"
        rf.votedFor = -1
        rf.persist()
    }

    // 检查是否已经投过票
    if rf.votedFor != -1 && rf.votedFor != args.CandidateId {
        return
    }

    // 检查候选人的日志是否至少和自己一样新（日志完整性检查）
    lastLogIndex := len(rf.log) - 1
    lastLogTerm := rf.log[lastLogIndex].Term
    if args.LastLogTerm < lastLogTerm ||
        (args.LastLogTerm == lastLogTerm && args.LastLogIndex < lastLogIndex) {
        return  // 候选人的日志比我旧，拒绝
    }

    // 投票
    rf.votedFor = args.CandidateId
    rf.lastHeartbeat = time.Now()  // 重置超时计时器
    rf.persist()
    reply.VoteGranted = true
}
```

---

## 第五步：成为 Leader，发送心跳

```go
func (rf *Raft) becomeLeader() {
    rf.state = "leader"
    // 初始化 nextIndex 和 matchIndex
    rf.nextIndex = make([]int, len(rf.peers))
    rf.matchIndex = make([]int, len(rf.peers))
    for i := range rf.peers {
        rf.nextIndex[i] = len(rf.log)
        rf.matchIndex[i] = 0
    }
    // 立即发心跳
    go rf.sendHeartbeats()
}

func (rf *Raft) sendHeartbeats() {
    for !rf.killed() {
        rf.mu.Lock()
        if rf.state != "leader" {
            rf.mu.Unlock()
            return
        }
        rf.mu.Unlock()

        for i := range rf.peers {
            if i == rf.me {
                continue
            }
            go rf.sendAppendEntries(i)
        }

        time.Sleep(100 * time.Millisecond)  // 每 100ms 发一次心跳
    }
}
```

---

## 2A 测试

```bash
cd labs/src/raft
go test -race -run 2A
```

**TestInitialElection2A**：验证启动后能选出 Leader，且只有一个 Leader。

**TestReElection2A**：验证 Leader 崩溃后能重新选出 Leader；网络分区恢复后能选出新 Leader。

---

## 常见错误

**错误 1：选举超时时间太短**

如果超时时间小于心跳间隔，Follower 会在收到心跳之前就发起选举。心跳间隔是 100ms，选举超时应该在 150ms-300ms 之间。

**错误 2：收到更大任期后没有退回 Follower**

任何时候收到更大任期的消息，都要立即退回 Follower，更新 currentTerm，清空 votedFor。

**错误 3：没有重置超时计时器**

投票给候选人时，要重置超时计时器（`lastHeartbeat = time.Now()`），否则可能在候选人成为 Leader 之前就发起新的选举。

