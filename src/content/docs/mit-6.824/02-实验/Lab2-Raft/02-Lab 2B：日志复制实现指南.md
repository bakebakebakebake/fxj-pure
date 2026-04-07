---
title: 'Lab 2B：日志复制实现指南'
description: '2B 要求你实现完整的日志复制。完成后能通过所有 2B 测试。'
order: 2
source: 'mit-6.824'
sourceTitle: 'MIT 6.824 学习笔记'
section: 'labs'
sectionTitle: '实验'
subsection: 'lab2'
subsectionTitle: 'Lab 2 · Raft'
language: 'zh'
tags: ['docs', 'mit-6.824', 'labs', 'lab2']
---
## AppendEntries RPC 的两个用途

1. **心跳**：`Entries` 为空，只用来重置 Follower 的超时计时器
2. **日志复制**：`Entries` 不为空，把新的日志条目发给 Follower

---

## AppendEntries 的参数和返回值

```go
type AppendEntriesArgs struct {
    Term         int        // Leader 的任期
    LeaderId     int        // Leader 的 ID（Follower 可以用来重定向客户端）
    PrevLogIndex int        // 新日志条目之前的日志索引
    PrevLogTerm  int        // PrevLogIndex 对应的任期
    Entries      []LogEntry // 要复制的日志条目（心跳时为空）
    LeaderCommit int        // Leader 的 commitIndex
}

type AppendEntriesReply struct {
    Term    int  // Follower 的当前任期
    Success bool // 是否成功
}
```

---

## 日志冲突解决：直觉理解

### Log Matching Property

Raft 的核心保证：如果两个节点在某个 index 的日志 term 相同，那么这之前的所有日志都完全相同。

AppendEntries 通过 `PrevLogIndex + PrevLogTerm` 来验证这个性质：
- Leader 说："我要在 index 5 之后追加日志，我的 index 5 是 term 2"
- Follower 检查自己的 index 5 是什么 term
  - 相同 → 我们在 index 5 之前的日志是一致的，可以追加
  - 不同 → 拒绝，我们的日志在某处出现了分歧

### 冲突场景图示

```
Leader 日志:   [_][T1][T1][T2][T2][T3][T3]
                0   1   2   3   4   5   6
                                ↑
                          nextIndex[follower] = 5

Follower 日志: [_][T1][T1][T4][T4]
                0   1   2   3   4
                            ↑
                       这里 term 不同！

第1轮：Leader 发 PrevLogIndex=4, PrevLogTerm=T2
       Follower: rf.log[4].Term=T4 ≠ T2 → 拒绝
       Leader: nextIndex-- → 4

第2轮：Leader 发 PrevLogIndex=3, PrevLogTerm=T2
       Follower: rf.log[3].Term=T4 ≠ T2 → 拒绝
       Leader: nextIndex-- → 3

第3轮：Leader 发 PrevLogIndex=2, PrevLogTerm=T1
       Follower: rf.log[2].Term=T1 = T1 → 接受！
       Follower 删除 log[3], log[4]，追加 Leader 的 log[3..6]
```

找到一致点后，Follower 删除冲突的日志，追加 Leader 的日志。这保证了所有节点最终日志一致。

---

## Follower 处理 AppendEntries

```go
func (rf *Raft) AppendEntries(args *AppendEntriesArgs, reply *AppendEntriesReply) {
    rf.mu.Lock()
    defer rf.mu.Unlock()

    reply.Term = rf.currentTerm
    reply.Success = false

    // 1. 如果 Leader 的任期更小，拒绝
    if args.Term < rf.currentTerm {
        return
    }

    // 2. 如果 Leader 的任期更大，更新自己
    if args.Term > rf.currentTerm {
        rf.currentTerm = args.Term
        rf.votedFor = -1
        rf.persist()
    }
    rf.state = "follower"
    rf.lastHeartbeat = time.Now()  // 重置超时计时器

    // 3. 检查 PrevLogIndex 和 PrevLogTerm 是否匹配
    if args.PrevLogIndex >= len(rf.log) ||
        rf.log[args.PrevLogIndex].Term != args.PrevLogTerm {
        return  // 日志不匹配，拒绝
    }

    // 4. 追加新日志条目（处理冲突）
    for i, entry := range args.Entries {
        index := args.PrevLogIndex + 1 + i
        if index < len(rf.log) {
            if rf.log[index].Term != entry.Term {
                // 冲突：删除从 index 开始的所有条目
                rf.log = rf.log[:index]
                rf.log = append(rf.log, args.Entries[i:]...)
                break
            }
            // 已经有这条日志了，跳过
        } else {
            // 追加新条目
            rf.log = append(rf.log, args.Entries[i:]...)
            break
        }
    }
    rf.persist()

    // 5. 更新 commitIndex
    if args.LeaderCommit > rf.commitIndex {
        rf.commitIndex = min(args.LeaderCommit, len(rf.log)-1)
        rf.applyEntries()
    }

    reply.Success = true
}
```

---

## Leader 发送 AppendEntries

```go
func (rf *Raft) sendAppendEntries(server int) {
    rf.mu.Lock()
    if rf.state != "leader" {
        rf.mu.Unlock()
        return
    }

    prevLogIndex := rf.nextIndex[server] - 1
    prevLogTerm := rf.log[prevLogIndex].Term
    entries := rf.log[rf.nextIndex[server]:]
    // 复制一份，避免持有锁时被修改
    entriesCopy := make([]LogEntry, len(entries))
    copy(entriesCopy, entries)

    args := AppendEntriesArgs{
        Term:         rf.currentTerm,
        LeaderId:     rf.me,
        PrevLogIndex: prevLogIndex,
        PrevLogTerm:  prevLogTerm,
        Entries:      entriesCopy,
        LeaderCommit: rf.commitIndex,
    }
    rf.mu.Unlock()

    reply := AppendEntriesReply{}
    ok := rf.peers[server].Call("Raft.AppendEntries", &args, &reply)
    if !ok {
        return
    }

    rf.mu.Lock()
    defer rf.mu.Unlock()

    // 如果对方任期更大，退回 Follower
    if reply.Term > rf.currentTerm {
        rf.currentTerm = reply.Term
        rf.state = "follower"
        rf.votedFor = -1
        rf.persist()
        return
    }

    // 如果任期已经变了，忽略
    if rf.state != "leader" || rf.currentTerm != args.Term {
        return
    }

    if reply.Success {
        // 更新 nextIndex 和 matchIndex
        rf.matchIndex[server] = args.PrevLogIndex + len(args.Entries)
        rf.nextIndex[server] = rf.matchIndex[server] + 1

        // 检查是否可以推进 commitIndex
        rf.updateCommitIndex()
    } else {
        // 日志不匹配，回退 nextIndex
        rf.nextIndex[server]--
        if rf.nextIndex[server] < 1 {
            rf.nextIndex[server] = 1
        }
    }
}
```

---

## 推进 commitIndex

当多数节点都有了某条日志，Leader 可以提交它：

```go
func (rf *Raft) updateCommitIndex() {
    // 从最新的日志往前找，找到多数节点都有的最高索引
    for n := len(rf.log) - 1; n > rf.commitIndex; n-- {
        // 只能提交当前任期的日志（论文 Figure 8 的要求）
        if rf.log[n].Term != rf.currentTerm {
            continue
        }
        count := 1  // 包括自己
        for i := range rf.peers {
            if i != rf.me && rf.matchIndex[i] >= n {
                count++
            }
        }
        if count > len(rf.peers)/2 {
            rf.commitIndex = n
            rf.applyEntries()
            break
        }
    }
}
```

---

## Figure 8：为什么不能提交旧 term 的日志

这是 Raft 最反直觉的规则，也是 2B 最容易出错的地方。

**错误直觉**：只要多数节点都有了某条日志，就可以提交它。

**反例场景**（5 个节点 S1-S5）：

```
Step 1: S1 是 term 2 的 Leader，写了 log[2]=T2，复制到 S2
        S1: [_][T1][T2]
        S2: [_][T1][T2]
        S3: [_][T1]
        S4: [_][T1]
        S5: [_][T1]

Step 2: S1 崩溃，S5 当选 term 3 的 Leader（S3/S4/S5 投票）
        S5 写了 log[2]=T3，但还没复制
        S5: [_][T1][T3]

Step 3: S5 崩溃，S1 重启，当选 term 4 的 Leader
        S1 把 log[2]=T2 复制到 S3（现在 S1/S2/S3 都有 T2）
        S1: [_][T1][T2]
        S2: [_][T1][T2]
        S3: [_][T1][T2]  ← 多数节点都有了！

        如果此时 S1 提交 log[2]=T2，然后 S1 崩溃...

Step 4: S5 重启，当选 term 5 的 Leader（S5 日志 term 更新）
        S5 把 log[2]=T3 覆盖给所有人
        S3: [_][T1][T3]  ← 已提交的 T2 被覆盖！数据丢失！
```

**Raft 的解决方案**：Leader 只提交当前 term 的日志。

在 Step 3，S1 不能直接提交 log[2]=T2（旧 term）。S1 必须先写一条 term 4 的新日志，等它被多数节点复制后，才能提交（同时间接提交 log[2]=T2）。

这就是 `updateCommitIndex` 里这个检查的原因：

```go
if rf.log[n].Term != rf.currentTerm {
    continue  // 不提交旧 term 的日志，跳过
}
```

---

## Apply 线程：把已提交的日志发给上层

```go
func (rf *Raft) applyEntries() {
    // 注意：这个函数在持有锁的情况下被调用
    // 但发送到 applyCh 可能阻塞，所以要在 goroutine 里发
    go func() {
        rf.mu.Lock()
        for rf.lastApplied < rf.commitIndex {
            rf.lastApplied++
            msg := ApplyMsg{
                CommandValid: true,
                Command:      rf.log[rf.lastApplied].Command,
                CommandIndex: rf.lastApplied,
            }
            rf.mu.Unlock()
            rf.applyCh <- msg
            rf.mu.Lock()
        }
        rf.mu.Unlock()
    }()
}
```

---

## 实现 Start()

客户端通过 `Start()` 提交新命令：

```go
func (rf *Raft) Start(command interface{}) (int, int, bool) {
    rf.mu.Lock()
    defer rf.mu.Unlock()

    if rf.state != "leader" {
        return -1, -1, false
    }

    // 追加到日志
    entry := LogEntry{
        Command: command,
        Term:    rf.currentTerm,
    }
    rf.log = append(rf.log, entry)
    rf.persist()

    index := len(rf.log) - 1
    term := rf.currentTerm

    // 立即触发日志复制
    for i := range rf.peers {
        if i != rf.me {
            go rf.sendAppendEntries(i)
        }
    }

    return index, term, true
}
```

---

## 常见错误

**错误 1：只能提交当前任期的日志**

见上方 Figure 8 章节。`updateCommitIndex` 里必须有 `rf.log[n].Term != rf.currentTerm` 的检查。

**错误 2：nextIndex 回退太慢（TestBackup2B 超时）**

每次失败只回退一步，在日志差距大时需要几百轮 RPC，`TestBackup2B` 会超时。

优化方案：Follower 在拒绝时返回冲突信息，Leader 一次跳过整个冲突 term：

```go
// AppendEntriesReply 加两个字段
type AppendEntriesReply struct {
    Term          int
    Success       bool
    ConflictTerm  int  // 冲突位置的 term（-1 表示日志太短）
    ConflictIndex int  // 该 term 的第一个 index
}

// Follower 拒绝时填充冲突信息（替换原来的 return）
if args.PrevLogIndex >= len(rf.log) {
    reply.ConflictTerm = -1
    reply.ConflictIndex = len(rf.log)
    return
}
if rf.log[args.PrevLogIndex].Term != args.PrevLogTerm {
    reply.ConflictTerm = rf.log[args.PrevLogIndex].Term
    reply.ConflictIndex = args.PrevLogIndex
    for reply.ConflictIndex > 0 &&
        rf.log[reply.ConflictIndex-1].Term == reply.ConflictTerm {
        reply.ConflictIndex--
    }
    return
}

// Leader 处理拒绝时（替换原来的 nextIndex[server]--）
if reply.ConflictTerm == -1 {
    rf.nextIndex[server] = reply.ConflictIndex
} else {
    newIndex := reply.ConflictIndex
    for i := len(rf.log) - 1; i >= 1; i-- {
        if rf.log[i].Term == reply.ConflictTerm {
            newIndex = i + 1
            break
        }
    }
    rf.nextIndex[server] = newIndex
}
```

**错误 3：apply 时持有锁**

发送到 `applyCh` 可能阻塞（如果上层没有及时读取）。如果在持有锁的情况下发送，会导致死锁。解决方案见上方 Apply 线程章节：在 goroutine 里发送，发送前释放锁。

