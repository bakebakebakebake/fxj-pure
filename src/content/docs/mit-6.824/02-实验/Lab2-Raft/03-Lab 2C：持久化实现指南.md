---
title: 'Lab 2C：持久化实现指南'
description: '2C 要求你在节点崩溃重启后能恢复状态。实现相对简单，但要注意在正确的时机调用 `persist()`。'
order: 3
source: 'mit-6.824'
sourceTitle: 'MIT 6.824 学习笔记'
section: 'labs'
sectionTitle: '实验'
subsection: 'lab2'
subsectionTitle: 'Lab 2 · Raft'
language: 'zh'
tags: ['docs', 'mit-6.824', 'labs', 'lab2']
---
## 需要持久化的三个字段

根据论文 Figure 2，必须持久化：
- `currentTerm`：如果不持久化，重启后任期归零，可能在同一任期投两次票
- `votedFor`：如果不持久化，重启后忘记投过票，可能在同一任期投两次票
- `log`：如果不持久化，重启后丢失已提交的日志

---

## 实现 persist()

```go
func (rf *Raft) persist() {
    // 注意：调用这个函数时必须持有锁
    w := new(bytes.Buffer)
    e := labgob.NewEncoder(w)
    e.Encode(rf.currentTerm)
    e.Encode(rf.votedFor)
    e.Encode(rf.log)
    data := w.Bytes()
    rf.persister.SaveRaftState(data)
}
```

---

## 实现 readPersist()

```go
func (rf *Raft) readPersist(data []byte) {
    if data == nil || len(data) < 1 {
        return  // 第一次启动，没有持久化数据
    }
    r := bytes.NewBuffer(data)
    d := labgob.NewDecoder(r)
    var currentTerm int
    var votedFor int
    var log []LogEntry
    if d.Decode(&currentTerm) != nil ||
       d.Decode(&votedFor) != nil ||
       d.Decode(&log) != nil {
        panic("readPersist: decode error")
    }
    rf.currentTerm = currentTerm
    rf.votedFor = votedFor
    rf.log = log
}
```

---

## 在哪里调用 persist()

每次修改需要持久化的字段后，立即调用 `persist()`：

```go
// 1. 更新 currentTerm 时
rf.currentTerm = newTerm
rf.votedFor = -1
rf.persist()

// 2. 投票时
rf.votedFor = args.CandidateId
rf.persist()

// 3. 追加日志时
rf.log = append(rf.log, entry)
rf.persist()

// 4. 删除冲突日志时
rf.log = rf.log[:index]
rf.log = append(rf.log, newEntries...)
rf.persist()
```

**原则**：只要修改了 `currentTerm`、`votedFor`、`log` 中的任何一个，就要调用 `persist()`。

---

## 需要的 import

```go
import (
    "bytes"
    "../labgob"
)
```

在 `raft.go` 里取消注释这两行：
```go
// import "bytes"
// import "../labgob"
```

---

## 2C 测试

```bash
cd labs/src/raft
go test -race -run 2C
```

2C 的测试会模拟节点崩溃和重启，验证重启后状态是否正确恢复。

---

## 常见错误

**错误 1：忘记在某个地方调用 persist()**

最常见的遗漏：
- 在 `RequestVote` 里投票后忘记 `persist()`
- 在 `AppendEntries` 里追加日志后忘记 `persist()`
- 在收到更大任期时更新 `currentTerm` 后忘记 `persist()`

**症状**：2C 测试偶发失败，重启后状态不一致。

**排查方法**：搜索所有修改 `currentTerm`、`votedFor`、`log` 的地方，确认每处都有 `persist()`。

**错误 2：在 readPersist 里没有处理空数据**

第一次启动时，`persister.ReadRaftState()` 返回空数据。`readPersist` 必须处理这种情况（直接返回，不报错）。

**错误 3：Encode 和 Decode 的顺序不一致**

`persist()` 里 Encode 的顺序必须和 `readPersist()` 里 Decode 的顺序完全一致。

