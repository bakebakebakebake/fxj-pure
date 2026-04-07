---
title: 'Lab 3 架构：KV 服务建在 Raft 之上'
description: '这篇文档帮你理解 Lab 3 的整体架构，以及数据是如何在各层之间流动的。'
order: 0
source: 'mit-6.824'
sourceTitle: 'MIT 6.824 学习笔记'
section: 'labs'
sectionTitle: '实验'
subsection: 'lab3'
subsectionTitle: 'Lab 3 · KVRaft'
language: 'zh'
tags: ['docs', 'mit-6.824', 'labs', 'lab3']
---
## 系统架构

```
客户端 (Clerk)
    ↓ RPC (Get/PutAppend)
KV 服务器 (KVServer)  ← 你要实现的
    ↓ rf.Start(op)
Raft 层 (Raft)        ← Lab 2 实现的
    ↓ applyCh
KV 服务器 (KVServer)  ← 从 applyCh 读取已提交的操作，应用到 KV 存储
```

---

## 一个 Put 请求的完整流程

1. 客户端调用 `ck.Put("x", "hello")`
2. Clerk 向某个服务器发 `PutAppend` RPC
3. 如果那个服务器不是 Leader，返回 `ErrWrongLeader`，Clerk 换一个服务器重试
4. Leader 的 `PutAppend` 处理函数调用 `kv.rf.Start(op)`，把操作提交给 Raft
5. Raft 把操作复制给多数节点
6. Raft 通过 `applyCh` 通知 KVServer：这个操作已经被提交了
7. KVServer 从 `applyCh` 读取操作，执行 `kv.data["x"] = "hello"`
8. KVServer 通知等待的 `PutAppend` 处理函数：操作完成了
9. `PutAppend` 返回 `OK` 给客户端

---

## 关键挑战

**挑战 1：如何知道操作完成了？**

`rf.Start()` 是异步的，它只是把操作提交给 Raft，不等待操作被提交。你需要等待 `applyCh` 里出现对应的操作，才能返回给客户端。

**解决方案**：为每个操作创建一个 channel，当 `applyCh` 里出现这个操作时，通过 channel 通知等待的处理函数。

**挑战 2：如何处理重复请求？**

客户端可能因为超时而重试，导致同一个操作被提交多次。

**解决方案**：每个请求带一个唯一 ID（ClientID + SeqNum），服务器记录已执行的请求，对重复请求直接返回之前的结果。

**挑战 3：Leader 变更怎么办？**

如果 Leader 在操作提交之前崩溃，`rf.Start()` 返回的 index 可能被另一个操作占用。

**解决方案**：等待 `applyCh` 时，检查 index 对应的操作是否是自己提交的操作。如果不是，说明 Leader 变更了，返回错误，让客户端重试。

---

## 需要实现的内容

**Lab 3A（不带快照）**：
- `client.go`：实现 `Get`、`PutAppend`，包括重试和 Leader 发现
- `server.go`：实现 `Get`、`PutAppend` RPC 处理函数，以及 apply 线程

**Lab 3B（带快照）**：
- 在 `server.go` 里添加快照逻辑：当 Raft 日志太大时，触发快照
- 实现快照的保存和恢复

---

## 数据结构设计

```go
type KVServer struct {
    mu      sync.Mutex
    me      int
    rf      *raft.Raft
    applyCh chan raft.ApplyMsg
    dead    int32

    maxraftstate int

    // KV 存储
    data map[string]string

    // 去重：记录每个客户端最后处理的请求序号和结果
    lastSeq    map[int64]int    // clientID -> 最后处理的 seqNum
    lastResult map[int64]string // clientID -> 最后操作的结果（用于 Get）

    // 等待通知：index -> channel
    waitCh map[int]chan OpResult
}

type Op struct {
    Type     string  // "Get", "Put", "Append"
    Key      string
    Value    string
    ClientID int64
    SeqNum   int
}

type OpResult struct {
    Value string
    Err   Err
}
```

---

## 实现顺序

1. 先实现 `common.go` 里的 RPC 消息（添加 ClientID 和 SeqNum 字段）
2. 实现 `client.go`（Clerk）
3. 实现 `server.go` 的 apply 线程
4. 实现 `server.go` 的 RPC 处理函数
5. 跑 3A 测试
6. 实现快照（3B）
7. 跑 3B 测试

