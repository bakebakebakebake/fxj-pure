---
title: 'Raft 常见 Bug 和修复方法'
description: '---'
order: 6
source: 'mit-6.824'
sourceTitle: 'MIT 6.824 学习笔记'
section: 'labs'
sectionTitle: '实验'
subsection: 'lab2'
subsectionTitle: 'Lab 2 · Raft'
language: 'zh'
tags: ['docs', 'mit-6.824', 'labs', 'lab2']
---
## Bug 1：选举活锁（没有节点能成为 Leader）

**症状**：`TestInitialElection2A` 超时，没有 Leader 被选出。

**原因**：所有节点同时超时，同时发起选举，选票分散，没有节点获得多数票。然后又同时超时，再次选举，循环往复。

**修复**：确保选举超时是随机的，且范围足够大：
```go
timeout := time.Duration(150+rand.Intn(150)) * time.Millisecond
```

---

## Bug 2：双 Leader（两个节点都认为自己是 Leader）

**症状**：测试报告 "term X has 2 (>1) leaders"。

**原因**：收到更大任期时没有退回 Follower。

**修复**：在所有 RPC 处理函数和回复处理里，检查任期：
```go
if reply.Term > rf.currentTerm {
    rf.currentTerm = reply.Term
    rf.state = "follower"
    rf.votedFor = -1
    rf.persist()
    return
}
```

---

## Bug 3：日志不一致（apply 了不同的命令）

**症状**：测试报告 "apply error: commit index=X server=Y X != Z"。

**原因**：两个节点在同一个日志索引上 apply 了不同的命令。这是最严重的 bug，说明 Raft 的安全性被破坏了。

**可能原因**：
1. AppendEntries 里的日志冲突处理有 bug
2. commitIndex 更新逻辑有 bug
3. 提交了旧任期的日志（违反 Figure 8）

**排查**：
```go
// 在 apply 时打日志
log.Printf("[%d] apply index=%d term=%d command=%v",
    rf.me, index, rf.log[index].Term, rf.log[index].Command)
```

---

## Bug 4：TestBackup2B 失败（日志同步太慢）

**症状**：TestBackup2B 超时。

**原因**：nextIndex 每次只回退一步，在日志差距很大时需要很多轮 RPC 才能同步。

**优化**：让 Follower 在回复里带上冲突信息：

```go
type AppendEntriesReply struct {
    Term          int
    Success       bool
    ConflictTerm  int  // 冲突的任期
    ConflictIndex int  // 冲突任期的第一条日志索引
}

// Follower 处理冲突时
if args.PrevLogIndex >= len(rf.log) {
    reply.ConflictIndex = len(rf.log)
    reply.ConflictTerm = -1
} else {
    reply.ConflictTerm = rf.log[args.PrevLogIndex].Term
    // 找到这个任期的第一条日志
    for i := args.PrevLogIndex; i > 0; i-- {
        if rf.log[i-1].Term != reply.ConflictTerm {
            reply.ConflictIndex = i
            break
        }
    }
}

// Leader 处理回复时
if !reply.Success {
    if reply.ConflictTerm == -1 {
        rf.nextIndex[server] = reply.ConflictIndex
    } else {
        // 找到 Leader 日志里 ConflictTerm 的最后一条
        newIndex := reply.ConflictIndex
        for i := len(rf.log) - 1; i > 0; i-- {
            if rf.log[i].Term == reply.ConflictTerm {
                newIndex = i + 1
                break
            }
        }
        rf.nextIndex[server] = newIndex
    }
}
```

---

## Bug 5：2C 测试偶发失败

**症状**：2C 测试大部分时候通过，偶尔失败。

**原因**：某个地方修改了需要持久化的字段，但忘记调用 `persist()`。

**排查**：搜索所有修改 `currentTerm`、`votedFor`、`log` 的地方：

```bash
grep -n "currentTerm\|votedFor\|rf.log" labs/src/raft/raft.go
```

确认每处修改后都有 `rf.persist()`。

---

## Bug 6：apply 线程死锁

**症状**：程序卡住，所有测试超时。

**原因**：在持有锁的情况下向 `applyCh` 发送消息，而上层没有及时读取，导致阻塞。

**修复**：
```go
// 方法 1：在 goroutine 里发送
go func() {
    rf.applyCh <- msg
}()

// 方法 2：先收集消息，解锁后再发送
rf.mu.Lock()
var msgs []ApplyMsg
for rf.lastApplied < rf.commitIndex {
    rf.lastApplied++
    msgs = append(msgs, ApplyMsg{...})
}
rf.mu.Unlock()

for _, msg := range msgs {
    rf.applyCh <- msg
}
```

---

## 压力测试

Raft 的 bug 往往是偶发的，需要多次运行才能发现：

```bash
# 运行 100 次 2B 测试
for i in $(seq 1 100); do
    result=$(go test -race -run 2B 2>&1)
    if echo "$result" | grep -q "FAIL"; then
        echo "第 $i 次失败:"
        echo "$result"
        break
    fi
done
```

