---
title: 'Raft 论文完全指南'
description: '**核心问题**：在分布式系统中，如何让一组服务器就某个值达成一致？'
order: 2
source: 'mit-6.824'
sourceTitle: 'MIT 6.824 学习笔记'
section: 'papers'
sectionTitle: '论文'
language: 'zh'
tags: ['docs', 'mit-6.824', 'papers']
---
这听起来简单，但在服务器可能崩溃、网络可能延迟或丢包的环境下，这个问题极其困难。

**复制状态机（Replicated State Machine）**：

共识算法最常见的应用场景是复制状态机。核心思想：

```
        客户端请求
            |
            v
+-------------------+     +-------------------+     +-------------------+
|     Server 1      |     |     Server 2      |     |     Server 3      |
|                   |     |                   |     |                   |
| +---------------+ |     | +---------------+ |     | +---------------+ |
| | 共识模块      | |<--->| | 共识模块      | |<--->| | 共识模块      | |
| +-------+-------+ |     | +-------+-------+ |     | +-------+-------+ |
|         |         |     |         |         |     |         |         |
| +-------v-------+ |     | +-------v-------+ |     | +-------v-------+ |
| | 复制日志      | |     | | 复制日志      | |     | | 复制日志      | |
| | x←3 y←1 x←5  | |     | | x←3 y←1 x←5  | |     | | x←3 y←1 x←5  | |
| +-------+-------+ |     | +-------+-------+ |     | +-------+-------+ |
|         |         |     |         |         |     |         |         |
| +-------v-------+ |     | +-------v-------+ |     | +-------v-------+ |
| | 状态机        | |     | | 状态机        | |     | | 状态机        | |
| | x=5, y=1     | |     | | x=5, y=1     | |     | | x=5, y=1     | |
| +---------------+ |     | +---------------+ |     | +---------------+ |
+-------------------+     +-------------------+     +-------------------+
```

**关键保证**：如果所有服务器的日志相同，那么它们的状态机状态也相同。

**实际应用场景**：
- **GFS / HDFS**：用共识选举 master，保证只有一个 master 在工作
- **ZooKeeper**：用 ZAB（类似 Paxos）实现配置管理和分布式锁
- **Chubby**：Google 的分布式锁服务，底层用 Paxos
- **etcd / Consul**：用 Raft 实现服务发现和配置存储

### 1.2 Paxos 的问题

在 Raft 之前，Paxos 几乎是共识算法的代名词。但 Paxos 有严重的实用问题：

1. **极难理解**
   - Lamport 的原始论文用希腊议会的比喻，晦涩难懂
   - 即使简化版的论文，大多数人也需要反复阅读才能理解
   - Raft 论文的用户调查显示：学生理解 Raft 的能力显著优于理解 Paxos

2. **缺乏实用的 multi-Paxos 规范**
   - 原始 Paxos 只解决单个值的共识（single-decree Paxos）
   - 实际系统需要对一系列值达成共识（multi-Paxos）
   - 但 Lamport 从未给出 multi-Paxos 的完整规范
   - 每个实现者都自己"发明"了一套 multi-Paxos

3. **实现与理论脱节**
   - Chubby 的作者说："Paxos 的描述和真实世界系统的需求之间有巨大的鸿沟"
   - 实际实现的 Paxos 和论文中的 Paxos 往往差别很大

### 1.3 Raft 的设计目标

Raft 的首要目标是**可理解性**（understandability），而不是性能或功能。

为了实现可理解性，Raft 采用两种核心策略：

1. **问题分解**（decomposition）
   - 把共识问题分成三个相对独立的子问题：
     - Leader 选举
     - 日志复制
     - 安全性
   - 每个子问题可以独立理解

2. **状态空间简化**（state space reduction）
   - 减少需要考虑的状态数量
   - 例如：日志不允许有空洞（与 Paxos 不同）
   - 例如：使用随机化（选举超时）而非复杂的排名系统

---

## 第二部分：Raft 基础概念

### 2.1 三种服务器状态

每个 Raft 服务器在任意时刻处于三种状态之一：

```
                         收到多数选票
                    +-------------------+
                    |                   |
                    |                   v
+----------+    超时开始选举    +------------+    选举成功    +----------+
| Follower |  ------------->  | Candidate  |  ---------->  |  Leader  |
+----------+                  +------------+               +----------+
     ^                             |                            |
     |     发现更高 term           |    发现更高 term            |
     |     或新 Leader             |    或新 Leader              |
     +-----------------------------+----------------------------+
```

**Follower**：
- 被动响应来自 Leader 和 Candidate 的 RPC
- 不主动发起请求
- 集群启动时，所有节点都是 Follower

**Candidate**：
- Follower 在选举超时后转变为 Candidate
- 向所有节点发起 RequestVote RPC 争取选票
- 是一种临时状态

**Leader**：
- 处理所有客户端请求
- 管理日志复制
- 定期发送心跳维持权威
- 任何时刻最多只有一个 Leader

### 2.2 任期（Term）

任期是 Raft 中最重要的概念之一，充当逻辑时钟的角色。

```
  Term 1       Term 2       Term 3       Term 4       Term 5
|---------|  |---------|  |---------|  |---------|  |---------|
| 选举 |  正常运行  | 选举 |  正常运行  | 选举 |选举| 选举 |  正常运行  |
| S1当选|  S1是Leader|  S3当选|  S3是Leader| 失败 |失败| S5当选|  S5是Leader|
|---------|  |---------|  |---------|  |---------|  |---------|
```

**关键性质**：
- 每个任期最多只有一个 Leader（可能没有，即选举失败）
- 任期号单调递增，从不回退
- 每个服务器维护自己看到的最大任期号 `currentTerm`
- 如果服务器发现自己的任期号过期（收到更高的 term），立即转为 Follower

**任期号的作用**：
- 检测过期信息：如果收到的 RPC 带有更小的 term，拒绝该 RPC
- 检测过期 Leader：如果 Leader 发现有更高的 term，立即退位为 Follower
- 防止旧 Leader 造成问题：网络分区恢复后，旧 Leader 会因为 term 过期而自动退位

### 2.3 两种核心 RPC

Raft 只用两种 RPC 完成所有基础功能（加上快照的 InstallSnapshot 共三种）：

| RPC | 发起者 | 目的 |
|-----|--------|------|
| **RequestVote** | Candidate | 请求其他节点投票 |
| **AppendEntries** | Leader | 复制日志条目 / 发送心跳 |

心跳就是不带任何日志条目的 AppendEntries RPC。

### 2.4 一个典型 5 节点集群的运行示例

假设集群有 S1-S5 五个节点，初始状态：

```
步骤 1：所有节点启动为 Follower，Term = 0
  S1[Follower] S2[Follower] S3[Follower] S4[Follower] S5[Follower]

步骤 2：S1 的选举超时先到期，转为 Candidate，Term = 1
  S1[Candidate, T=1] → 向 S2-S5 发送 RequestVote

步骤 3：S2, S3, S4 投票给 S1（加上 S1 自己的票 = 4 票，超过多数 3）
  S1 成为 Leader

步骤 4：S1 立即向所有节点发送心跳（空的 AppendEntries）
  S1[Leader] → 心跳 → S2, S3, S4, S5

步骤 5：客户端发送命令 "x←3" 给 S1
  S1 追加到本地日志 → 向 S2-S5 发送 AppendEntries

步骤 6：S2, S3, S4 成功追加（多数确认）
  S1 提交该日志 → 应用到状态机 → 回复客户端
```

---

## 第三部分：Leader 选举

### 3.1 心跳机制触发选举

Leader 定期向所有 Follower 发送心跳（空的 AppendEntries）。如果一个 Follower 在 **选举超时**（election timeout）时间内没有收到任何心跳或 RequestVote，它就认为 Leader 已经崩溃，开始选举。

```
时间线：
Leader S1:     ♥ ---- ♥ ---- ♥ ---- [崩溃]
Follower S3:   收到   收到   收到   等待......超时！→ 开始选举
               |                     |<--- election timeout --->|
```

### 3.2 选举流程 Step-by-Step

以 5 节点集群为例，假设 S1 是 Leader（Term=1），然后 S1 崩溃：

```
步骤 1：S3 的选举超时先到期
  S3: currentTerm = 1 → 2（自增）
  S3: votedFor = S3（投票给自己）
  S3: 状态 = Candidate
  S3: 重置选举超时
  S3: 向 S1, S2, S4, S5 发送 RequestVote(term=2, candidateId=S3, ...)

步骤 2：各节点收到 RequestVote
  S1: [已崩溃，无响应]
  S2: term=2 > currentTerm=1，更新 term=2
      votedFor=null，S3 的日志至少一样新 → 投票给 S3 ✓
  S4: term=2 > currentTerm=1，更新 term=2
      votedFor=null，S3 的日志至少一样新 → 投票给 S4 ✓
  S5: term=2 > currentTerm=1，更新 term=2
      votedFor=null，S3 的日志至少一样新 → 投票给 S3 ✓

步骤 3：S3 收到 S2, S4, S5 的投票（加上自己 = 4 票，多数 = 3）
  S3: 状态 = Leader
  S3: 初始化 nextIndex[] 和 matchIndex[]
  S3: 立即向所有节点发送心跳
```

### 3.3 三种选举结果

**结果 1：赢得选举**
- 候选人收到多数节点的投票（包括自己）
- 立即成为 Leader，发送心跳

**结果 2：发现新 Leader**
- 候选人在等待投票期间收到来自另一个 Leader 的 AppendEntries
- 如果该 Leader 的 term ≥ 自己的 term，承认其合法性，转回 Follower
- 如果 term < 自己的 term，拒绝，继续选举

**结果 3：选举超时（分裂投票）**
- 没有候选人获得多数票（例如两个候选人各得 2 票）
- 选举超时后，递增 term，开始新一轮选举

### 3.4 随机化选举超时

**问题**：如果所有 Follower 同时超时，同时发起选举，很可能持续出现分裂投票（split vote），系统永远选不出 Leader。

**解决方案**：每个节点的选举超时从一个固定区间（如 150ms-300ms）中随机选取。

```
S1 超时：237ms
S2 超时：189ms  ← 最先超时，率先发起选举
S3 超时：291ms
S4 超时：162ms  ← 第二个超时（但 S2 可能已经赢得选举）
S5 超时：253ms
```

**为什么有效**：
- 大多数情况下，只有一个节点最先超时
- 它在其他节点超时之前就赢得选举
- 即使偶尔发生分裂投票，下一轮的随机超时很快就能打破对称

**论文的实验数据**：使用 150ms-300ms 的随机超时，平均只需要约 1.5 轮选举即可选出 Leader。

### 3.5 选举限制

不是任何 Candidate 都能当选。Raft 要求候选人的日志必须**至少和投票者一样新**，否则投票者会拒绝投票。

**"至少一样新"的定义**：

比较两个日志的新旧，看最后一条日志条目：
1. 如果最后一条日志的 term 不同，term 更大的更新
2. 如果 term 相同，日志更长的更新

```
S1 的日志：[T1, T1, T2, T3]      最后条目：index=4, term=3
S2 的日志：[T1, T1, T2, T2, T2]  最后条目：index=5, term=2
S3 的日志：[T1, T1, T3]          最后条目：index=3, term=3

比较结果：
  S1 vs S2: S1 更新（term 3 > term 2）
  S1 vs S3: S1 更新（term 相同，index 4 > index 3）
  S3 vs S2: S3 更新（term 3 > term 2）
```

**为什么需要这个限制**：这是保证安全性的关键——确保新 Leader 包含所有已提交的日志。详见第五部分。

### 3.6 时序要求

Raft 的正确性不依赖时序，但可用性（liveness）需要满足：

```
broadcastTime  <<  electionTimeout  <<  MTBF

broadcastTime：  发一轮 RPC 的平均时间    （通常 0.5ms - 20ms）
electionTimeout：选举超时时间              （通常 150ms - 300ms）
MTBF：           服务器平均无故障间隔时间   （通常数月）
```

- `broadcastTime << electionTimeout`：Leader 能在选举超时前发出心跳，避免不必要的选举
- `electionTimeout << MTBF`：系统大部分时间有 Leader 在工作

---

## 第四部分：日志复制

### 4.1 日志结构

每条日志条目包含三个信息：

```
日志示例（5 节点集群，Leader 是 S1）：

index:   1      2      3      4      5      6      7
       +------+------+------+------+------+------+------+
S1:    | x←3  | y←1  | x←5  | y←9  | z←2  | x←1  | y←3  |  Leader
       | T=1  | T=1  | T=1  | T=2  | T=3  | T=3  | T=3  |
       +------+------+------+------+------+------+------+
S2:    | x←3  | y←1  | x←5  | y←9  | z←2  | x←1  |       |  Follower
       | T=1  | T=1  | T=1  | T=2  | T=3  | T=3  |       |
       +------+------+------+------+------+------+       +
S3:    | x←3  | y←1  | x←5  | y←9  | z←2  |              |  Follower
       | T=1  | T=1  | T=1  | T=2  | T=3  |              |
       +------+------+------+------+------+              +
S4:    | x←3  | y←1  | x←5  | y←9  | z←2  | x←1  | y←3  |  Follower
       | T=1  | T=1  | T=1  | T=2  | T=3  | T=3  | T=3  |
       +------+------+------+------+------+------+------+
S5:    | x←3  | y←1  | x←5  |                             |  Follower
       | T=1  | T=1  | T=1  |                             |
       +------+------+------+                             +

                              ^commitIndex = 5
                        （S1, S2, S3, S4 都有 index 5 = 多数）
```

每个日志条目：
- **index**：在日志中的位置（从 1 开始）
- **term**：创建该条目时 Leader 的任期号
- **command**：要应用到状态机的命令

### 4.2 复制流程 Step-by-Step

假设客户端发送命令 `z←7` 到 Leader S1（Term=3）：

```
步骤 1：Leader 追加到本地日志
  S1 的日志末尾追加：{index=8, term=3, command="z←7"}

步骤 2：Leader 并行发送 AppendEntries 给所有 Follower
  S1 → S2: AppendEntries(prevLogIndex=7, prevLogTerm=3, entries=[{8,T3,"z←7"}])
  S1 → S3: AppendEntries(prevLogIndex=5, prevLogTerm=3, entries=[{6,T3,"x←1"},{7,T3,"y←3"},{8,T3,"z←7"}])
  S1 → S4: AppendEntries(prevLogIndex=7, prevLogTerm=3, entries=[{8,T3,"z←7"}])
  S1 → S5: AppendEntries(prevLogIndex=3, prevLogTerm=1, entries=[{4,T2,"y←9"},{5,T3,"z←2"},...,{8,T3,"z←7"}])

步骤 3：Follower 接收并追加
  S2: prevLogIndex=7 处没有条目（日志只到 6）→ 返回 false
      Leader 递减 nextIndex[S2]，下次重试
  S3: prevLogIndex=5 匹配 → 追加 entries → 返回 success
  S4: prevLogIndex=7 匹配 → 追加 entry → 返回 success
  S5: prevLogIndex=3 匹配 → 追加 entries → 返回 success

步骤 4：Leader 收到多数确认（S3, S4, S5 成功 + S1 自己 = 4/5）
  commitIndex 更新到 8
  （注意：还需要满足 log[8].term == currentTerm 的条件）

步骤 5：Leader 应用 log[6..8] 到状态机，回复客户端

步骤 6：下一次心跳或 AppendEntries 携带新的 leaderCommit
  Follower 更新自己的 commitIndex，应用到状态机
```

### 4.3 已提交（Committed）的精确定义

一条日志条目被认为**已提交**，当且仅当：
- Leader 已将该条目复制到**多数**节点
- 且满足提交规则（见第五部分 Figure 8）

**关键性质**：已提交的条目是持久的，最终会被所有可用的状态机执行。

### 4.4 Log Matching Property

Raft 维护以下两个保证，合称 **Log Matching Property**：

**保证 1**：如果两个日志中的条目有相同的 index 和 term，那么它们存储相同的命令。
- 原因：Leader 在给定 term 和 index 只会创建一条日志，且日志位置不会改变。

**保证 2**：如果两个日志中的条目有相同的 index 和 term，那么它们之前的所有条目都相同。
- 原因：AppendEntries 的一致性检查保证了这一点——发送时附带 prevLogIndex 和 prevLogTerm，Follower 只有在匹配时才接受。

**归纳证明直觉**：
- 基础情况：所有日志初始为空，满足条件
- 归纳步骤：AppendEntries 要求 prevLogIndex/prevLogTerm 匹配才接受新条目。如果在追加条目 N 时 prevLog 匹配（条目 N-1 相同），根据归纳假设 N-1 之前的也都相同。因此追加后，index 1 到 N 都相同。

### 4.5 日志不一致场景

正常运行时，日志保持一致。但崩溃可能导致各种不一致：

```
Leader 的日志（Term=8）：
index:   1    2    3    4    5    6    7    8    9    10   11   12
       +----+----+----+----+----+----+----+----+----+----+----+----+
Leader | T1 | T1 | T1 | T4 | T4 | T5 | T5 | T6 | T6 | T6 |    |    |
       +----+----+----+----+----+----+----+----+----+----+----+----+

可能的 Follower 状态：

(a)    | T1 | T1 | T1 | T4 | T4 | T5 | T5 | T6 | T6 |         缺少条目
       +----+----+----+----+----+----+----+----+----+

(b)    | T1 | T1 | T1 | T4 |                                    缺少更多条目
       +----+----+----+----+

(c)    | T1 | T1 | T1 | T4 | T4 | T5 | T5 | T6 | T6 | T6 | T6 | 多余条目
       +----+----+----+----+----+----+----+----+----+----+----+

(d)    | T1 | T1 | T1 | T2 | T2 | T2 | T3 | T3 | T3 | T3 | T3 | 不同的条目
       +----+----+----+----+----+----+----+----+----+----+----+

(e)    | T1 | T1 | T1 | T4 | T4 | T4 | T4 |                    缺少 + 不同
       +----+----+----+----+----+----+----+

(f)    | T1 | T1 | T1 | T2 | T2 | T2 | T3 | T3 | T3 | T3 | T3 | T3 | 更长且不同
       +----+----+----+----+----+----+----+----+----+----+----+----+
```

场景 (a)(b)：Follower 缺少条目（可能崩溃后恢复慢）
场景 (c)：Follower 有多余条目（可能曾是 Leader 但没复制完就崩溃了）
场景 (d)(e)(f)：Follower 有不同的条目（更复杂的崩溃场景）

### 4.6 一致性修复机制

Leader 通过 `nextIndex` 递减重试来找到与每个 Follower 的一致点：

```
Leader 日志：[T1, T1, T4, T4, T5, T5, T6, T6, T6]
Follower 日志：[T1, T1, T4, T4, T4]  （index 5 不一致）

修复过程：
  1. Leader 初始化 nextIndex[follower] = 10（Leader 最后日志 + 1）
  2. 发送 AppendEntries(prevLogIndex=9, ...)
     Follower 日志只到 5 → 失败
  3. nextIndex-- = 9，发送 AppendEntries(prevLogIndex=8, ...)
     失败
  ... 反复递减 ...
  4. nextIndex = 5，发送 AppendEntries(prevLogIndex=4, prevLogTerm=T4, ...)
     Follower 的 index 4 是 T4 → 匹配！
  5. Follower 删除 index 5 及之后的日志（T4 那条冲突的）
     追加 Leader 的 index 5 起的所有条目
  6. 修复完成，Follower 的日志与 Leader 一致
```

**关键原则**：Leader 从不删除或覆盖自己的日志。它只追加新条目。不一致的 Follower 日志会被 Leader 的日志覆盖。

### 4.7 快速回退优化

逐个递减 `nextIndex` 在日志很长时效率很低。论文提到一种优化：

**Follower 在拒绝 AppendEntries 时返回额外信息**：
- `conflictTerm`：冲突位置的 term 号
- `conflictIndex`：该 term 的第一条日志的 index

**Leader 的处理**：
- 如果 Leader 的日志中有 `conflictTerm`，跳到该 term 的最后一条之后
- 如果没有 `conflictTerm`，跳到 `conflictIndex`

```go
// Follower 拒绝时：
reply.ConflictTerm = rf.log[args.PrevLogIndex].Term
reply.ConflictIndex = // 找到 ConflictTerm 的第一条日志 index

// Leader 收到拒绝时：
if leader 的日志中找到 ConflictTerm {
    nextIndex[follower] = leader 中该 term 最后一条日志的 index + 1
} else {
    nextIndex[follower] = reply.ConflictIndex
}
```

这样每次冲突回退的粒度是一个 term 而不是一个条目，在大多数场景下大幅减少了 RPC 轮次。

---

## 第五部分：安全性

### 5.1 为什么仅有选举和日志复制不够？

仅有前面描述的选举和日志复制机制，**不能**保证安全性。考虑以下反例：

```
初始状态（5 节点，Leader S1 在 Term 2）：
  S1: [T1, T2]   Leader（已将 T2 复制到 S1, S2, S3 = 多数 → 已提交）
  S2: [T1, T2]
  S3: [T1, T2]
  S4: [T1]
  S5: [T1]

如果没有选举限制，假设 S1 崩溃后 S5 当选 Term 3 的 Leader：
  S5 的日志只有 [T1]
  S5 在 index 2 写入新的 T3 日志
  S5 把 T3 日志复制给 S4 和 S3
  结果：S3 的 index 2 从 T2 被覆盖为 T3

  问题：已提交的 T2 日志被覆盖了！违反安全性！
```

因此 Raft 需要**选举限制**：保证 S5 不可能当选（因为 S5 的日志不够新）。

### 5.2 选举限制（Election Restriction）

RequestVote RPC 中包含候选人最后一条日志的 term 和 index。投票者如果发现自己的日志比候选人更新，就拒绝投票。

在上面的例子中：
- S5 的最后一条日志：(index=1, term=1)
- S2 的最后一条日志：(index=2, term=2)
- S3 的最后一条日志：(index=2, term=2)
- S2 和 S3 都会拒绝给 S5 投票
- S5 最多只能得到 S4 和 S5 的票（2 票），无法获得多数

**结论**：任何包含所有已提交日志的候选人才可能获得多数投票。这就保证了新 Leader 一定包含所有已提交的日志。

### 5.3 Figure 8 详细走读

Figure 8 是 Raft 论文中最微妙也最容易出错的部分。它说明了**为什么 Leader 不能通过计数副本来提交旧任期的日志**。

5 个步骤，每步的集群状态：

```
步骤 (a)：S1 是 Term 2 的 Leader，在 index 2 写入 T2 日志
         只复制给了 S2（还没有多数确认）

  index:    1    2
  S1:      [T1] [T2]   ← Leader (Term 2)
  S2:      [T1] [T2]
  S3:      [T1]
  S4:      [T1]
  S5:      [T1]


步骤 (b)：S1 崩溃。S5 成为 Term 3 的 Leader
         （S5 得到 S3, S4, S5 的投票 — S3, S4 的日志不比 S5 新）
         S5 在 index 2 写入 T3 日志

  index:    1    2
  S1:      [T1] [T2]   ← 崩溃
  S2:      [T1] [T2]
  S3:      [T1]
  S4:      [T1]
  S5:      [T1] [T3]   ← Leader (Term 3)


步骤 (c)：S5 崩溃。S1 重启，成为 Term 4 的 Leader
         （S1 得到 S1, S2, S3 的投票 — S1 日志最新）
         S1 开始复制日志，把 index 2（T2）复制给了 S3
         现在 T2 在 index 2 出现在 S1, S2, S3 上 = 多数

  index:    1    2    3
  S1:      [T1] [T2] [T4]  ← Leader (Term 4)，index 3 是新的 T4 日志
  S2:      [T1] [T2]
  S3:      [T1] [T2]       ← 刚从 S1 复制了 T2
  S4:      [T1]
  S5:      [T1] [T3]       ← 崩溃


关键问题：此时 S1 能否提交 index 2 (T2) 的日志？

答案是 不能！原因见步骤 (d)。


步骤 (d)：如果 S1 提交了 index 2 然后崩溃，S5 可能重新当选
         S5 成为 Term 5 的 Leader
         （S5 得到 S3(?), S4, S5 的投票 — S5 的最后日志 T3 > S3 的 T2）
         S5 把自己的 index 2 (T3) 复制给所有节点

  index:    1    2
  S1:      [T1] [T3]   ← 被覆盖！
  S2:      [T1] [T3]   ← 被覆盖！
  S3:      [T1] [T3]   ← 被覆盖！
  S4:      [T1] [T3]
  S5:      [T1] [T3]   ← Leader (Term 5)

  灾难：已提交的 T2 日志被 T3 覆盖了！


步骤 (e)：正确的做法 — S1 不直接提交 T2，而是先提交 T4 的日志
         当 index 3 (T4) 被多数确认并提交时，index 2 (T2) 也被间接提交
         此后 S5 不可能当选（S5 的日志 T3 < 任何拥有 T4 的节点）

  index:    1    2    3
  S1:      [T1] [T2] [T4]  ← Leader (Term 4)
  S2:      [T1] [T2] [T4]
  S3:      [T1] [T2] [T4]  ← T4 已被多数确认
  S4:      [T1]
  S5:      [T1] [T3]

  现在 index 2 和 3 都是安全的：
  S5 不可能当选（S1/S2/S3 的日志都比 S5 新，T4 > T3）
```

### 5.4 提交规则

**规则**：Leader 只能通过提交**当前任期**的日志来间接提交旧任期的日志。

具体实现：

```go
// 在 Leader 更新 commitIndex 时：
for n := rf.commitIndex + 1; n <= lastLogIndex; n++ {
    if rf.log[n].Term != rf.currentTerm {
        continue  // 跳过：不能直接提交旧任期的日志
    }
    count := 1
    for i := range rf.peers {
        if i != rf.me && rf.matchIndex[i] >= n {
            count++
        }
    }
    if count > len(rf.peers)/2 {
        rf.commitIndex = n  // 提交当前任期日志，同时间接提交之前所有日志
    }
}
```

**为什么间接提交是安全的**：
- 如果 index N (Term=currentTerm) 被提交，说明多数节点有 index 1 到 N 的所有日志
- 由 Log Matching Property，这些节点的 index 1 到 N-1 也和 Leader 一致
- 因此之前的旧任期日志也被保护起来了

### 5.5 Leader Completeness Property 证明思路

**命题**：如果一条日志在某个 term 中被提交，那么所有更高 term 的 Leader 的日志中都包含这条日志。

**反证法（通俗解释）**：

假设日志条目 E 在 Term T 中被提交，但 Term U (U > T) 的 Leader 不包含 E。

1. E 在 Term T 被提交 → 多数节点有 E（称这些节点为集合 A）
2. Term U 的 Leader 赢得选举 → 多数节点投票给它（称这些节点为集合 B）
3. A 和 B 都是多数 → 它们必然有交集，设交集中的节点为 V
4. V 既有 E（因为 V ∈ A），又投票给了 Term U 的 Leader（因为 V ∈ B）
5. V 投票给了 Term U 的 Leader → Leader 的日志至少和 V 一样新
6. 但 V 有 E 而 Leader 没有 E → V 的日志比 Leader 新 → 矛盾！

更精确地说，第 5-6 步需要对 T 和 U 之间的每个 term 做归纳。关键点是：
- 投票时要求候选人日志 ≥ 投票者日志
- V 有 E，所以 V 的日志中 E 的 term（= T）出现在 V 的日志中
- 如果 Leader 的日志不包含 E，那么 Leader 的最后日志要么 term < T，要么 term 相同但更短
- 但 Leader 的日志至少和 V 一样新，矛盾

### 5.6 State Machine Safety Property

**命题**：如果一个服务器把 index N 的日志应用到了状态机，那么其他服务器在 index N 应用的一定是同一条日志。

**从 Leader Completeness 推导**：
1. 日志只有在被提交后才被应用到状态机
2. 被提交意味着它已被多数节点复制
3. 由 Leader Completeness，所有后续 Leader 都包含这条日志
4. 由 Log Matching Property，所有从 Leader 复制日志的 Follower 在该 index 也有相同的日志
5. 因此所有节点在同一 index 应用的是同一条命令

---

## 第六部分：Figure 2 完整规范速查

### 6.1 持久化状态（每次修改后必须写磁盘，再响应 RPC）

| 字段 | 类型 | 含义 | 为什么要持久化 |
|------|------|------|----------------|
| `currentTerm` | int | 该服务器见过的最大任期号 | 防止同一任期投两次票；确保 term 单调递增 |
| `votedFor` | int/null | 本任期投票给谁（null 表示未投票） | 防止同一任期给多个候选人投票 |
| `log[]` | []LogEntry | 日志条目数组 | 防止已提交的日志丢失 |

### 6.2 易失状态（所有服务器，重启后从 0 开始）

| 字段 | 类型 | 含义 | 为什么不需要持久化 |
|------|------|------|---------------------|
| `commitIndex` | int | 已知已提交的最高日志 index（初始 0） | 可以从 Leader 重新获取 |
| `lastApplied` | int | 已应用到状态机的最高日志 index（初始 0） | 重启后从日志重放即可恢复 |

### 6.3 Leader 的易失状态（选举后重新初始化）

| 字段 | 类型 | 含义 | 初始值 |
|------|------|------|--------|
| `nextIndex[]` | []int | 对每个 Follower，下一条要发送的日志 index | Leader 最后日志 index + 1 |
| `matchIndex[]` | []int | 对每个 Follower，已知已复制的最高日志 index | 0 |

**为什么 `nextIndex` 初始化为 Leader 最后日志 index + 1**：乐观假设 Follower 和 Leader 日志一致，如果不一致则通过递减回退修复。

**为什么 `matchIndex` 初始化为 0**：安全起见——直到收到 Follower 的确认才更新。

### 6.4 AppendEntries RPC

**参数**：

| 参数 | 含义 |
|------|------|
| `term` | Leader 的任期号 |
| `leaderId` | Leader 的 ID，方便 Follower 重定向客户端 |
| `prevLogIndex` | 紧接在新条目之前的日志 index |
| `prevLogTerm` | `prevLogIndex` 处日志的 term |
| `entries[]` | 要追加的日志条目（心跳时为空） |
| `leaderCommit` | Leader 的 commitIndex |

**返回值**：

| 返回值 | 含义 |
|--------|------|
| `term` | 接收者的 currentTerm，供 Leader 更新自己 |
| `success` | 如果 Follower 包含匹配 prevLogIndex 和 prevLogTerm 的日志则为 true |

**接收方实现**（5 步）：

```
1. 如果 term < currentTerm，返回 false
   → 拒绝过期 Leader 的请求

2. 如果日志中 prevLogIndex 处没有 term 为 prevLogTerm 的条目，返回 false
   → 一致性检查失败，需要 Leader 回退 nextIndex

3. 如果已有的日志条目和新条目冲突（相同 index 但不同 term），
   删除该条目及其之后的所有条目
   → 清除不一致的日志（注意：只在冲突时才删除！）

4. 追加日志中没有的新条目
   → 正常追加

5. 如果 leaderCommit > commitIndex，
   设 commitIndex = min(leaderCommit, 最后一条新条目的 index)
   → 更新提交进度
```

### 6.5 RequestVote RPC

**参数**：

| 参数 | 含义 |
|------|------|
| `term` | 候选人的任期号 |
| `candidateId` | 候选人的 ID |
| `lastLogIndex` | 候选人最后一条日志的 index |
| `lastLogTerm` | 候选人最后一条日志的 term |

**返回值**：

| 返回值 | 含义 |
|--------|------|
| `term` | 接收者的 currentTerm，供候选人更新自己 |
| `voteGranted` | true 表示投票给该候选人 |

**接收方实现**（2 步）：

```
1. 如果 term < currentTerm，返回 false
   → 拒绝过期候选人

2. 如果 votedFor 为 null 或 candidateId，
   且候选人的日志至少和自己一样新，
   则投票给该候选人
   → 每个任期只投一票，且只投给日志足够新的候选人
```

### 6.6 所有服务器的规则

**任何时候**：
```
- 如果 commitIndex > lastApplied：
    lastApplied++
    把 log[lastApplied] 应用到状态机
  → 确保已提交的日志最终被执行

- 如果收到的 RPC 请求或响应中 term > currentTerm：
    currentTerm = term
    转变为 Follower
  → 发现更高任期，立即退位（适用于所有角色）
```

### 6.7 Follower 规则

```
- 响应来自 Candidate 和 Leader 的 RPC
  → Follower 是纯被动的

- 如果选举超时期间没有收到 Leader 的 AppendEntries，
  也没有投票给任何 Candidate：
    转变为 Candidate
  → Leader 可能崩溃了，发起新选举
```

### 6.8 Candidate 规则

```
- 转变为 Candidate 时：
    currentTerm++
    votedFor = 自己
    重置选举超时计时器
    向所有其他节点发送 RequestVote
  → 开始竞选

- 如果收到多数节点的投票：
    成为 Leader
  → 选举成功

- 如果收到新 Leader 的 AppendEntries（term >= currentTerm）：
    转变为 Follower
  → 别人已经当选

- 如果选举超时：
    开始新一轮选举（重新递增 term）
  → 本轮选举失败（可能分裂投票），重试
```

### 6.9 Leader 规则

```
- 选举后立即向所有节点发送空的 AppendEntries（心跳），之后定期发送
  → 建立权威，防止其他节点发起选举

- 如果收到客户端命令：
    追加到本地日志
    在日志被提交后响应客户端
  → 处理客户端请求

- 如果 lastLogIndex >= nextIndex[i]：
    向 Follower i 发送 AppendEntries（从 nextIndex[i] 开始的日志）
  → 推进 Follower 的日志

- 如果 AppendEntries 成功：
    更新 nextIndex[i] = 发送的最后一条日志 index + 1
    更新 matchIndex[i] = nextIndex[i] - 1
  → 记录 Follower 的复制进度

- 如果 AppendEntries 因为日志不一致而失败：
    递减 nextIndex[i]，重试
  → 回退找到一致点

- 如果存在 N 使得：
    N > commitIndex
    且多数 matchIndex[i] >= N
    且 log[N].term == currentTerm
  则 commitIndex = N
  → 提交新日志（注意 term 检查！这就是 Figure 8 的规则）
```

---

## 第七部分：集群成员变更

### 7.1 直接切换的危险

如果所有节点同时从旧配置切换到新配置，由于各节点切换的时刻不同，可能出现**两个不相交的多数**分别选出两个 Leader：

```
假设集群从 3 节点 {S1,S2,S3} 扩展到 5 节点 {S1,S2,S3,S4,S5}

某个时刻，部分节点已切换到新配置，部分还在旧配置：

  旧配置 {S1,S2,S3}：          新配置 {S1,S2,S3,S4,S5}：
  多数 = 2                     多数 = 3

  S1: 旧配置  ←┐               S3: 新配置  ←┐
  S2: 旧配置  ←┘ S1+S2=多数    S4: 新配置  ←┤ S3+S4+S5=多数
               → S1 当选       S5: 新配置  ←┘
                                → S3 当选

  结果：S1 和 S3 同时是 Leader！违反安全性！
```

### 7.2 Joint Consensus 两阶段方法

Raft 使用**联合共识**（Joint Consensus）分两步切换：

```
时间线：
         C_old              C_old,new            C_new
         旧配置              联合配置              新配置
  --------|---------------------|---------------------|--------
          Leader 提交          Leader 提交
          C_old,new 日志       C_new 日志
```

**阶段 1：C_old → C_old,new**
- Leader 收到配置变更请求
- 创建 C_old,new 配置的日志条目
- 在 C_old,new 阶段，所有决策都需要**同时获得旧配置的多数和新配置的多数**
- 一旦 C_old,new 被提交，C_old 单独做决策已不可能

**阶段 2：C_old,new → C_new**
- Leader 创建 C_new 配置的日志条目
- C_new 被提交后，旧配置中不在新配置的节点可以关闭

**安全性保证**：在任何时刻都不存在两个不重叠的多数能独立做决策。

### 7.3 三个额外问题

**问题 1：新节点追赶**
- 新加入的节点没有任何日志，需要花时间追赶
- 在追赶完成之前，它参与投票可能导致系统不可用
- 解决方案：新节点先以非投票成员身份加入，只接收日志不参与投票，追赶到差不多时再正式加入

**问题 2：离任 Leader**
- 如果 Leader 不在新配置 C_new 中怎么办？
- Leader 在提交 C_new 后自动退位为 Follower
- 在 C_old,new 阶段，Leader 继续管理集群（即使自己不在新配置中）

**问题 3：被移除的节点干扰**
- 被移除的节点不会收到心跳，会超时发起选举
- 它们的 RequestVote 可能扰乱当前 Leader
- 解决方案：**Pre-Vote 机制**或**Leader 租约**——节点在最近收到过 Leader 心跳时，忽略 RequestVote（除非 RequestVote 的 term 更高）

---

## 第八部分：日志压缩（快照）

### 8.1 为什么需要日志压缩

日志会无限增长。如果不压缩：
- 磁盘空间耗尽
- 重启后重放所有日志耗时太长
- 新节点加入时同步全部日志代价太大

### 8.2 快照内容

```
+----------------------------------------------------------+
|                        快照                                |
|                                                          |
|  lastIncludedIndex = 5    （快照覆盖到的最后日志 index）    |
|  lastIncludedTerm  = 3    （该 index 对应的 term）         |
|                                                          |
|  状态机状态：                                              |
|    x = 5                                                 |
|    y = 1                                                 |
|    z = 9                                                 |
|                                                          |
|  集群配置（最新的）                                        |
+----------------------------------------------------------+

快照之后保留的日志：
index:   6      7      8      9
       +------+------+------+------+
       | T=3  | T=3  | T=4  | T=4  |
       +------+------+------+------+

丢弃的日志（已被快照覆盖）：
index:   1      2      3      4      5
       [不再保留]
```

### 8.3 InstallSnapshot RPC

当 Leader 发现某个 Follower 需要的日志已经被快照覆盖时（`nextIndex[i] <= lastIncludedIndex`），Leader 用 InstallSnapshot RPC 发送快照。

**参数**：

| 参数 | 含义 |
|------|------|
| `term` | Leader 的任期号 |
| `leaderId` | Leader 的 ID |
| `lastIncludedIndex` | 快照中最后一条日志的 index |
| `lastIncludedTerm` | 快照中最后一条日志的 term |
| `offset` | 快照数据块在快照文件中的字节偏移 |
| `data[]` | 从 offset 开始的快照数据块 |
| `done` | 如果是最后一个数据块则为 true |

**接收方实现**：
1. 如果 `term < currentTerm`，立即返回
2. 如果是第一个数据块（offset 为 0），创建新的快照文件
3. 在指定 offset 写入数据
4. 如果 done 为 false，继续等待更多数据块
5. 保存快照文件，丢弃任何 index 更小的已有快照
6. 如果现有日志包含 lastIncludedIndex 处且 term 匹配的条目，保留其后的日志，返回
7. 丢弃整个日志，用快照内容重置状态机

### 8.4 快照的设计决策

**每个节点独立快照**：
- 每个节点独立决定何时创建快照
- 不需要 Leader 协调，避免增加网络负担
- 大部分快照在本地创建，只有落后太多的 Follower 才需要 Leader 发送快照

**触发时机**：
- 当日志达到一定大小时创建快照（如超过一个固定阈值）
- 不能太频繁（浪费资源），也不能太少（日志太长）

**Copy-on-write**：
- 创建快照时状态机可能很大，不能阻塞正常操作
- 可以使用操作系统的 fork() 实现 copy-on-write
- 子进程继承父进程的内存快照，在子进程中写入磁盘

---

## 第九部分：客户端交互

### 9.1 Leader 发现机制

客户端如何找到 Leader？

```
客户端                        集群
  |
  |--- 请求 ---> S3 (Follower)
  |<-- 拒绝+Leader地址 ---    S3 告诉客户端 "Leader 是 S1"
  |
  |--- 请求 ---> S1 (Leader)
  |<-- 响应 ---               正常处理
  |
  |--- 请求 ---> S1 (已崩溃)
  |    (超时)
  |--- 随机选一个节点重试 ---> S4 (Follower)
  |<-- 拒绝+Leader地址 ---    S4 告诉客户端 "Leader 是 S2"（新Leader）
  |--- 请求 ---> S2 (Leader)
  |<-- 响应 ---
```

### 9.2 线性一致性语义和去重

**问题**：客户端发送请求给 Leader，Leader 提交了日志但在回复客户端之前崩溃。客户端超时重试，新 Leader 会再次执行同一命令——导致命令被执行两次。

**解决方案**：客户端为每个命令分配一个**唯一序列号**。

```go
type Command struct {
    ClientId  int64  // 客户端唯一标识
    SeqNum    int64  // 单调递增的序列号
    Op        string // 操作内容
}

// 服务器端去重表
type DedupTable map[int64]DedupEntry  // key: ClientId

type DedupEntry struct {
    SeqNum int64       // 该客户端最后处理的序列号
    Result interface{} // 该命令的执行结果
}

// 应用日志到状态机时：
func (sm *StateMachine) Apply(cmd Command) interface{} {
    entry := sm.dedupTable[cmd.ClientId]
    if cmd.SeqNum <= entry.SeqNum {
        return entry.Result  // 重复命令，直接返回缓存结果
    }
    result := sm.execute(cmd.Op)
    sm.dedupTable[cmd.ClientId] = DedupEntry{cmd.SeqNum, result}
    return result
}
```

### 9.3 只读请求的处理

只读请求不需要修改状态机，但如果不小心处理，可能返回过期数据（stale read），违反线性一致性。

**问题场景**：
- Leader A 被网络分区隔离，但它不知道
- 集群已经选出新 Leader B
- 如果客户端直接从 Leader A 读取，会读到旧数据

**解决方案（两步）**：

1. **Leader 在任期开始时提交一个 no-op 日志**
   - 确保 Leader 知道哪些日志已经被提交
   - 新 Leader 可能不知道之前哪些日志已提交，no-op 解决了这个问题

2. **处理只读请求前，Leader 发一轮心跳确认自己仍是 Leader**
   - 向多数节点发送心跳
   - 如果多数节点确认，说明自己仍是合法 Leader
   - 此时读取本地状态机并返回结果

```
客户端 → Leader: 读取 x 的值

Leader 的处理：
  1. 记录当前 commitIndex
  2. 向多数节点发送心跳
  3. 等待多数节点回复
  4. 如果自己仍是 Leader 且 commitIndex 处的日志已应用到状态机
     → 读取状态机中 x 的值，返回给客户端
  5. 如果发现更高的 term → 退位，告诉客户端重试
```

---

## 第十部分：Follower/Candidate 崩溃与 RPC 幂等性

### 10.1 简单的重试机制

Follower 和 Candidate 崩溃的处理比 Leader 崩溃简单得多：

- 如果 Follower 或 Candidate 崩溃，发给它的 RPC 会失败
- 发送方无限重试，直到成功
- 节点重启后，会重新处理收到的 RPC

### 10.2 为什么 Raft RPC 天然幂等

**RequestVote 的幂等性**：
- 每个节点每个 term 只投一票，投票信息持久化
- 重复收到同一个 RequestVote，如果已经投过票（votedFor == candidateId），再次返回同样的结果
- 不会因为重复请求而多投票

**AppendEntries 的幂等性**：
- 步骤 3 检查冲突：只有在冲突时才删除
- 步骤 4 追加新条目：只追加日志中没有的条目
- 如果同一个 AppendEntries 被重复执行，第二次执行时日志已经存在，不会有任何变化
- 步骤 5 更新 commitIndex：min 操作保证幂等

**InstallSnapshot 的幂等性**：
- 快照安装是全量替换，重复执行结果相同

---

## 第十一部分：Raft 的五大安全性质

| 性质 | 含义 | 保证机制 |
|------|------|----------|
| **Election Safety** | 每个任期最多选出一个 Leader | 每个节点每个任期只投一票，赢得选举需要多数票 |
| **Leader Append-Only** | Leader 从不覆盖或删除自己的日志，只追加 | Leader 的 AppendEntries 只发送新条目，不修改已有日志 |
| **Log Matching** | 如果两个日志在某个 index 有相同 term 的条目，则该 index 之前的所有日志都相同 | AppendEntries 的 prevLogIndex/prevLogTerm 一致性检查 |
| **Leader Completeness** | 如果一条日志在某个 term 被提交，它会出现在所有更高 term 的 Leader 日志中 | 选举限制（候选人日志必须足够新）+ Figure 8 提交规则 |
| **State Machine Safety** | 如果一个服务器把某 index 的日志应用到状态机，其他服务器在该 index 应用的是相同的日志 | 由 Leader Completeness + Log Matching 推导得出 |

这五个性质形成一个层级关系：

```
Election Safety + Leader Append-Only + Log Matching
            ↓
    Leader Completeness
            ↓
    State Machine Safety
```

- Election Safety 保证每个 term 只有一个 Leader
- Leader Append-Only 保证 Leader 的日志只增不减
- Log Matching 保证日志复制的一致性
- 以上三者共同保证 Leader Completeness
- Leader Completeness 保证新 Leader 包含所有已提交日志
- 最终推导出 State Machine Safety：所有节点的状态机执行相同的命令序列

---

## 第十二部分：与 Lab 2/3 的联系

### Lab 2A：Leader 选举

**对应论文**：5.2 节

**需要实现的核心功能**：
- 选举超时检测和 Candidate 状态转换
- RequestVote RPC 的发送和处理
- 随机化选举超时
- 心跳发送

**关键参数选择**：
```go
// 推荐值
const (
    HeartbeatInterval  = 100 * time.Millisecond   // 心跳间隔（课程要求 ≤ 150ms）
    ElectionTimeoutMin = 300 * time.Millisecond    // 选举超时下限
    ElectionTimeoutMax = 500 * time.Millisecond    // 选举超时上限
)
```

**常见陷阱**：
- 收到 AppendEntries 或投票给 Candidate 后要重置选举超时（不是收到任何 RPC 就重置）
- 转换为 Candidate 前要递增 term 并投票给自己
- 发现更高 term 要立即转为 Follower（无论当前是什么角色）

### Lab 2B：日志复制

**对应论文**：5.3-5.4 节

**需要实现的核心功能**：
- AppendEntries RPC 的发送和处理（5 个步骤）
- nextIndex 和 matchIndex 的管理
- commitIndex 的更新（含 Figure 8 的 term 检查）
- 日志应用到状态机

**关键实现细节**：
```go
// Figure 8 规则 —— 只能提交当前任期的日志
if rf.log[N].Term == rf.currentTerm && count > len(rf.peers)/2 {
    rf.commitIndex = N
}
```

**常见陷阱**：
- AppendEntries 步骤 3：只在冲突时删除，不要无条件截断
- matchIndex 初始化为 0，不是 nextIndex - 1
- 更新 commitIndex 后要及时通知 applier 协程
- Leader 不能提交旧任期的日志（Figure 8）

### Lab 2C：持久化

**对应论文**：Figure 2 持久化状态

**需要持久化的三个字段**：
- `currentTerm`
- `votedFor`
- `log[]`

**实现要点**：
```go
func (rf *Raft) persist() {
    w := new(bytes.Buffer)
    e := labgob.NewEncoder(w)
    e.Encode(rf.currentTerm)
    e.Encode(rf.votedFor)
    e.Encode(rf.log)
    rf.persister.SaveRaftState(w.Bytes())
}
```

**常见陷阱**：
- 每次修改这三个字段后都要调用 persist()
- 不要忘记在 readPersist() 中恢复这三个字段
- persist() 和 readPersist() 中编码和解码的顺序要一致

### Lab 2D / Lab 3B：快照

**对应论文**：第 7 节

**需要实现的核心功能**：
- Snapshot：上层服务调用，创建快照并截断日志
- InstallSnapshot RPC：Leader 向落后的 Follower 发送快照
- CondInstallSnapshot：Follower 决定是否安装快照（可选，取决于课程版本）

**常见陷阱**：
- 快照后日志的 index 要做偏移（log[0] 不再是 index 0）
- 要正确维护 lastIncludedIndex 和 lastIncludedTerm
- 持久化时要同时保存快照和 Raft 状态（使用 SaveStateAndSnapshot）
- 安装快照后要重置状态机

### Lab 3A：KV 服务

**对应论文**：第 8 节（客户端交互）

**需要实现的核心功能**：
- 客户端命令去重（唯一序列号）
- Leader 重定向
- 线性一致性保证

**常见陷阱**：
- 去重表要包含在快照中（否则恢复后会重复执行命令）
- 客户端要检测 Leader 变更（同一个 index 可能被不同 Leader 的不同命令占据）
- Get 请求也要走 Raft 日志（保证线性一致性）

### 常见陷阱总结

| 陷阱 | 说明 | 对应论文 |
|------|------|----------|
| 选举超时重置时机错误 | 只在收到合法 Leader 心跳或投票后重置 | 5.2 |
| 无条件截断日志 | AppendEntries 步骤 3 只在冲突时截断 | 5.3 |
| 提交旧任期日志 | 必须检查 `log[N].term == currentTerm` | 5.4, Figure 8 |
| 忘记持久化 | 修改 currentTerm/votedFor/log 后必须 persist | Figure 2 |
| 日志 index 偏移 | 快照后日志起始 index 不再是 0 | 7 |
| 去重表不在快照中 | 恢复后会重复执行已处理的命令 | 8 |
| 锁竞争 | 发送 RPC 时不要持锁，收到回复后重新检查状态 | 实现细节 |
| apply 顺序 | commitIndex 到 lastApplied 之间的日志必须顺序 apply | Figure 2 |

---

## 第十三部分：关键设计决策 FAQ

### 为什么用强 Leader 模型？

Raft 选择让所有写请求都通过 Leader 路由，而不是像 multi-Paxos 那样允许多个节点提议。

**原因**：简化了日志复制——日志只从 Leader 流向 Follower，数据流是单向的。这使得日志不会有空洞，冲突解决也变得简单（Leader 总是对的）。

**代价**：Leader 是单点瓶颈。如果 Leader 过载，整个集群的吞吐量受限。

### 为什么随机超时而非排名系统？

论文考虑过给每个节点分配一个排名（rank），让排名最高的节点优先成为 Leader。

**选择随机超时的原因**：
- 排名系统需要额外的机制来处理排名最高的节点崩溃的情况
- 随机超时实现简单，只需要一个随机数生成器
- 实验证明随机超时在实践中表现良好，平均约 1.5 轮选举

### 为什么日志条目保留原始 term 号？

每条日志条目的 term 号是创建它的 Leader 的 term，即使该条目后来被新 Leader 复制，term 号也不变。

**原因**：
- 用于检测日志冲突（相同 index 但不同 term = 冲突）
- Figure 8 的提交规则需要检查 term
- 用于比较日志的新旧（选举限制）
- 如果修改 term 号，上述所有机制都会失效

### 为什么不能提交旧任期日志？

如 Figure 8 所示，即使旧任期的日志已被多数节点复制，也不能直接提交。

**根本原因**：旧任期日志被多数节点复制，不能保证未来的 Leader 也有这条日志。因为选举限制只比较最后一条日志的 term 和 index，不检查中间的条目。

**解决方案**：通过提交当前任期的日志间接提交旧任期日志。当前任期的日志被提交后，该日志之前的所有日志（包括旧任期的）都变得安全了。

### 为什么每个节点独立快照？

另一种方案是 Leader 创建快照然后发送给所有 Follower。Raft 选择让每个节点独立决定何时创建快照。

**原因**：
- 避免浪费网络带宽（大部分 Follower 自己就能创建快照）
- 避免 Leader 负担过重
- 只有极度落后的 Follower 才需要 Leader 发送快照（通过 InstallSnapshot）

### 为什么只读请求需要特殊处理？

只读请求不修改状态，看起来不需要走 Raft 日志。但如果直接读取 Leader 本地状态：

**风险**：Leader 可能已经被网络分区隔离，不再是合法 Leader，但它自己不知道。此时它的状态可能是过期的。

**解决方案**：Leader 在处理只读请求前发一轮心跳确认自己仍是 Leader。这增加了延迟，但保证了线性一致性。如果应用场景允许读到稍旧的数据（最终一致性），可以跳过这个检查以提升性能。

---

## 总结

### 核心贡献

Raft 的核心贡献是将**可理解性**作为首要设计目标。通过问题分解（选举、日志复制、安全性）和状态空间简化（强 Leader、随机超时、no-op 日志等），Raft 在保持和 Paxos 同等正确性和性能的同时，大幅降低了理解和实现的难度。

这一贡献已被工业界广泛验证——etcd、Consul、CockroachDB、TiKV 等系统都选择了 Raft 而非 Paxos。

### 学习路径建议

1. **第一遍**：读论文第 1-5 节，理解选举、日志复制、安全性三大组件
2. **实现 Lab 2A**：对照 Figure 2 实现选举，调试通过后继续
3. **精读 Figure 2**：逐条理解每条规则的"为什么"
4. **实现 Lab 2B**：日志复制，重点理解 Figure 8
5. **实现 Lab 2C**：持久化，理解哪些状态必须持久化
6. **读论文第 7 节**：日志压缩
7. **实现 Lab 2D**：快照
8. **读论文第 8 节**：客户端交互
9. **实现 Lab 3A/3B**：KV 服务 + 快照
10. **回顾**：重读整篇论文，此时你对每个细节的理解会深刻得多

