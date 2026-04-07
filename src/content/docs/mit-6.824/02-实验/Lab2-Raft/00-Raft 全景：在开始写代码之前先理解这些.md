---
title: 'Raft 全景：在开始写代码之前先理解这些'
description: '这篇文档帮你在开始写 Lab 2 之前，先建立对 Raft 的整体认知。'
order: 0
source: 'mit-6.824'
sourceTitle: 'MIT 6.824 学习笔记'
section: 'labs'
sectionTitle: '实验'
subsection: 'lab2'
subsectionTitle: 'Lab 2 · Raft'
language: 'zh'
tags: ['docs', 'mit-6.824', 'labs', 'lab2']
---
## Raft 解决什么问题

你有 3 台服务器，想让它们保持相同的状态（比如都存储相同的 KV 数据）。

问题：
- 任何一台服务器都可能随时崩溃
- 网络可能分区（服务器之间无法通信）
- 客户端的请求可能发到任何一台服务器

Raft 的解决方案：选出一个 Leader，所有写操作都通过 Leader，Leader 把操作复制给其他服务器（Follower）。

---

## 三个核心概念

**1. 任期（Term）**

Raft 把时间分成一个个任期。每次选举开始，任期号加一。

```
任期 1: 服务器 1 是 Leader
任期 2: 服务器 1 崩溃，选举，服务器 2 成为 Leader
任期 3: 网络分区，选举，服务器 3 成为 Leader
```

任期号的作用：帮助节点识别过时的信息。如果收到的消息里的任期号比自己的小，说明对方的信息是过时的，可以忽略。

**2. 日志（Log）**

每个节点维护一个日志，记录所有操作的顺序：

```
索引:  1        2        3
内容: Put(a,1) Put(b,2) Put(a,3)
任期:  1        1        2
```

Leader 把新操作追加到日志，然后复制给 Follower。当多数节点（超过半数）都有了这条日志，就认为它被"提交"了。

**3. 状态机**

每个节点按日志顺序执行操作，更新状态机（比如 KV 存储）。因为所有节点执行相同顺序的操作，状态机保持一致。

---

## 节点的三种状态

```
Follower → Candidate → Leader
    ↑                      |
    └──────────────────────┘
```

- **Follower**：被动接收 Leader 的心跳和日志复制。如果一段时间没收到 Leader 的消息，转变为 Candidate。
- **Candidate**：发起选举，向其他节点请求投票。如果获得多数票，成为 Leader。
- **Leader**：接收客户端请求，复制日志，发送心跳。

---

## Lab 2 的三个部分

**2A：Leader 选举**
- 实现选举超时（election timeout）
- 实现 `RequestVote` RPC
- 实现心跳（AppendEntries RPC，不带日志条目）

**2B：日志复制**
- 实现 `AppendEntries` RPC（带日志条目）
- 实现日志匹配和冲突解决
- 实现 `commitIndex` 和 `lastApplied` 的推进

**2C：持久化**
- 实现 `persist()` 和 `readPersist()`
- 在修改 `currentTerm`、`votedFor`、`log` 后调用 `persist()`

---

## Raft 结构体需要的字段

根据论文 Figure 2，你需要在 `Raft` 结构体里添加：

```go
type Raft struct {
    mu        sync.Mutex
    peers     []*labrpc.ClientEnd
    persister *Persister
    me        int
    dead      int32

    // 持久化状态（每次修改后要调用 persist()）
    currentTerm int        // 当前任期
    votedFor    int        // 本任期投票给了谁（-1 表示没投）
    log         []LogEntry // 日志条目

    // 易失状态（重启后重置）
    commitIndex int  // 已知已提交的最高日志索引
    lastApplied int  // 已应用到状态机的最高日志索引

    // Leader 的易失状态（选举后重置）
    nextIndex  []int  // 对每个 Follower，下一条要发送的日志索引
    matchIndex []int  // 对每个 Follower，已知已复制的最高日志索引

    // 其他
    state         string    // "follower", "candidate", "leader"
    lastHeartbeat time.Time // 上次收到心跳的时间
    applyCh       chan ApplyMsg
}

type LogEntry struct {
    Command interface{}
    Term    int
}
```

---

## 关键时序

**选举流程**：
```
1. Follower 超时（没收到心跳）
2. 转变为 Candidate，currentTerm++，votedFor = me
3. 并行向所有节点发 RequestVote RPC
4. 如果收到多数票 → 成为 Leader
5. 立即发心跳，阻止其他节点发起选举
```

**日志复制流程**：
```
1. 客户端发请求给 Leader
2. Leader 把操作追加到日志
3. 并行向所有 Follower 发 AppendEntries RPC
4. 当多数节点确认 → 更新 commitIndex
5. apply 线程把已提交的日志发给 applyCh
```

---

## 实现顺序建议

1. 先实现 `Make()`，初始化所有字段
2. 实现选举超时 goroutine
3. 实现 `RequestVote` RPC（处理函数和发送函数）
4. 实现心跳（空的 `AppendEntries`）
5. 跑 2A 测试
6. 实现完整的 `AppendEntries`（带日志复制）
7. 实现 apply 线程
8. 跑 2B 测试
9. 实现 `persist()` 和 `readPersist()`
10. 跑 2C 测试

