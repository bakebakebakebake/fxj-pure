---
title: 'Lab 3B：快照实现指南'
description: '当 Raft 日志越来越长，持久化和恢复会越来越慢。快照解决这个问题：把当前状态保存成快照，删除快照之前的日志。'
order: 2
source: 'mit-6.824'
sourceTitle: 'MIT 6.824 学习笔记'
section: 'labs'
sectionTitle: '实验'
subsection: 'lab3'
subsectionTitle: 'Lab 3 · KVRaft'
language: 'zh'
tags: ['docs', 'mit-6.824', 'labs', 'lab3']
---
## 索引偏移心智模型（最重要，先读这个）

引入快照后，日志被截断了，但外部的"逻辑索引"不变。这是 3B 最容易出 bug 的地方。

### 没有快照时

```
逻辑索引:  0   1   2   3   4   5   6
rf.log:   [_][T1][T1][T2][T2][T3][T3]
           ↑
         哨兵（占位）

rf.log[i] 就是逻辑索引 i 的日志
```

### 有快照后（快照到 index=3）

```
快照覆盖了 index 0-3，日志被截断：

逻辑索引:  0   1   2   3 | 4   5   6
                          ↑
                    lastIncludedIndex = 3

rf.log:              [T2][T2][T3][T3]
                      0   1   2   3   ← rf.log 的物理下标

逻辑索引 i → 物理下标 i - lastIncludedIndex
rf.log[i - lastIncludedIndex] 才是逻辑索引 i 的日志
```

### 转换公式

```
物理下标 = 逻辑索引 - lastIncludedIndex

rf.log[0]  对应逻辑索引 lastIncludedIndex（快照的最后一条）
rf.log[1]  对应逻辑索引 lastIncludedIndex + 1
...
len(rf.log) - 1 是物理长度，逻辑长度 = lastIncludedIndex + len(rf.log)
```

### 需要修改的所有地方

引入快照后，**每一处**涉及日志索引的代码都要改。用 `logAt(i)` 辅助函数统一处理：

```go
// 辅助函数：通过逻辑索引访问日志
func (rf *Raft) logAt(index int) LogEntry {
    return rf.log[index-rf.lastIncludedIndex]
}

// 辅助函数：日志的逻辑长度（最后一条的逻辑索引 + 1）
func (rf *Raft) logLen() int {
    return rf.lastIncludedIndex + len(rf.log)
}
```

需要修改的位置清单：

| 原来的写法 | 改成 |
|-----------|------|
| `rf.log[i]` | `rf.logAt(i)` |
| `len(rf.log)` | `rf.logLen()` |
| `rf.log[len(rf.log)-1]` | `rf.logAt(rf.logLen()-1)` |
| `rf.log[prevLogIndex].Term` | `rf.logAt(prevLogIndex).Term` |
| `rf.log[rf.nextIndex[i]:]` | `rf.log[rf.nextIndex[i]-rf.lastIncludedIndex:]` |
| `rf.log[rf.lastApplied].Command` | `rf.logAt(rf.lastApplied).Command` |

**RequestVote 里的日志比较也要改**：

```go
// 原来
lastLogIndex := len(rf.log) - 1
lastLogTerm := rf.log[lastLogIndex].Term

// 改成
lastLogIndex := rf.logLen() - 1
lastLogTerm := rf.logAt(lastLogIndex).Term
```

**AppendEntries 里的 PrevLogIndex 检查也要改**：

```go
// 原来
if args.PrevLogIndex >= len(rf.log) || rf.log[args.PrevLogIndex].Term != args.PrevLogTerm

// 改成（还要处理 PrevLogIndex 已经被快照覆盖的情况）
if args.PrevLogIndex < rf.lastIncludedIndex {
    // PrevLogIndex 已经在快照里了，说明 Leader 发的是旧数据
    reply.Success = false
    return
}
if args.PrevLogIndex >= rf.logLen() || rf.logAt(args.PrevLogIndex).Term != args.PrevLogTerm {
    // 日志不匹配
    ...
}
```

---

## 快照的触发时机

在 `applyLoop` 里，每次 apply 操作后，检查 Raft 日志大小：

```go
func (kv *KVServer) applyLoop() {
    for !kv.killed() {
        msg := <-kv.applyCh

        if msg.CommandValid {
            // 处理普通操作（同 3A）
            // ...

            // 检查是否需要快照
            if kv.maxraftstate != -1 &&
                kv.rf.RaftStateSize() >= kv.maxraftstate {
                kv.takeSnapshot(msg.CommandIndex)
            }
        } else {
            // 处理快照消息（InstallSnapshot）
            kv.installSnapshot(msg.Snapshot)
        }
    }
}
```

---

## 保存快照

```go
func (kv *KVServer) takeSnapshot(index int) {
    // 序列化当前状态
    w := new(bytes.Buffer)
    e := labgob.NewEncoder(w)
    e.Encode(kv.data)
    e.Encode(kv.lastSeq)
    e.Encode(kv.lastResult)
    snapshot := w.Bytes()

    // 告诉 Raft 保存快照，并删除 index 之前的日志
    kv.rf.Snapshot(index, snapshot)
}
```

---

## 恢复快照

当节点重启，或者收到 Leader 发来的 InstallSnapshot 时，需要恢复快照：

```go
func (kv *KVServer) installSnapshot(snapshot []byte) {
    if snapshot == nil || len(snapshot) == 0 {
        return
    }

    r := bytes.NewBuffer(snapshot)
    d := labgob.NewDecoder(r)
    var data map[string]string
    var lastSeq map[int64]int
    var lastResult map[int64]OpResult

    if d.Decode(&data) != nil ||
       d.Decode(&lastSeq) != nil ||
       d.Decode(&lastResult) != nil {
        panic("installSnapshot: decode error")
    }

    kv.mu.Lock()
    kv.data = data
    kv.lastSeq = lastSeq
    kv.lastResult = lastResult
    kv.mu.Unlock()
}
```

---

## 修改 Raft 层：添加 Snapshot 接口

你需要在 `raft.go` 里实现 `Snapshot()` 方法：

```go
func (rf *Raft) Snapshot(index int, snapshot []byte) {
    rf.mu.Lock()
    defer rf.mu.Unlock()

    // 如果 index 已经被快照了，忽略
    if index <= rf.lastIncludedIndex {
        return
    }

    // 删除 index 之前的日志
    rf.log = rf.log[index-rf.lastIncludedIndex:]
    rf.lastIncludedIndex = index
    rf.lastIncludedTerm = rf.log[0].Term

    // 保存快照和 Raft 状态
    rf.persister.SaveStateAndSnapshot(rf.encodeState(), snapshot)
}
```

**注意**：引入快照后，日志索引的计算方式会变化。原来 `rf.log[i]` 对应日志索引 `i`，现在需要减去 `lastIncludedIndex`：

```go
// 日志索引 i 对应 rf.log[i - rf.lastIncludedIndex]
func (rf *Raft) logAt(index int) LogEntry {
    return rf.log[index-rf.lastIncludedIndex]
}
```

---

## 修改 Raft 层：处理 InstallSnapshot RPC

当 Follower 的日志落后太多（Leader 已经把需要的日志删掉了），Leader 需要发送快照：

```go
type InstallSnapshotArgs struct {
    Term              int
    LeaderId          int
    LastIncludedIndex int
    LastIncludedTerm  int
    Data              []byte
}

type InstallSnapshotReply struct {
    Term int
}

func (rf *Raft) InstallSnapshot(args *InstallSnapshotArgs, reply *InstallSnapshotReply) {
    rf.mu.Lock()
    defer rf.mu.Unlock()

    reply.Term = rf.currentTerm

    if args.Term < rf.currentTerm {
        return
    }

    if args.Term > rf.currentTerm {
        rf.currentTerm = args.Term
        rf.state = "follower"
        rf.votedFor = -1
        rf.persist()
    }
    rf.lastHeartbeat = time.Now()

    // 如果快照比当前状态旧，忽略
    if args.LastIncludedIndex <= rf.lastIncludedIndex {
        return
    }

    // 更新日志
    if args.LastIncludedIndex < rf.lastIncludedIndex+len(rf.log)-1 {
        rf.log = rf.log[args.LastIncludedIndex-rf.lastIncludedIndex:]
    } else {
        rf.log = []LogEntry{{Term: args.LastIncludedTerm}}
    }
    rf.lastIncludedIndex = args.LastIncludedIndex
    rf.lastIncludedTerm = args.LastIncludedTerm

    rf.persister.SaveStateAndSnapshot(rf.encodeState(), args.Data)

    // 通知 KVServer 安装快照
    rf.applyCh <- ApplyMsg{
        CommandValid: false,
        Snapshot:     args.Data,
    }
}
```

---

## 启动时恢复快照

在 `StartKVServer` 里，从持久化存储恢复快照：

```go
func StartKVServer(...) *KVServer {
    // ...

    // 恢复快照
    snapshot := persister.ReadSnapshot()
    if len(snapshot) > 0 {
        kv.installSnapshot(snapshot)
    }

    go kv.applyLoop()
    return kv
}
```

---

## 常见错误

**错误 1：快照后日志索引计算错误**

引入 `lastIncludedIndex` 后，所有涉及日志索引的地方都要调整。最容易出错的是 `AppendEntries` 里的 `PrevLogIndex` 检查。

**错误 2：快照和 Raft 状态没有原子保存**

必须用 `SaveStateAndSnapshot`（原子保存），不能分开保存。

**错误 3：没有处理 ApplyMsg 里的快照消息**

`applyCh` 里可能有两种消息：普通操作（`CommandValid=true`）和快照（`CommandValid=false`）。两种都要处理。

