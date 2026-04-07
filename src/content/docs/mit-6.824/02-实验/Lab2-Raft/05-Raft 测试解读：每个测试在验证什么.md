---
title: 'Raft 测试解读：每个测试在验证什么'
description: '---'
order: 5
source: 'mit-6.824'
sourceTitle: 'MIT 6.824 学习笔记'
section: 'labs'
sectionTitle: '实验'
subsection: 'lab2'
subsectionTitle: 'Lab 2 · Raft'
language: 'zh'
tags: ['docs', 'mit-6.824', 'labs', 'lab2']
---
## 运行测试

```bash
cd labs/src/raft

# 运行所有测试
go test -race

# 只运行 2A
go test -race -run 2A

# 只运行 2B
go test -race -run 2B

# 只运行 2C
go test -race -run 2C

# 压力测试（运行 100 次）
for i in $(seq 1 100); do go test -race -run 2B; done
```

---

## 2A 测试

**TestInitialElection2A**

验证：启动 3 个节点后，能选出一个 Leader，且只有一个 Leader。

失败原因：
- 选举超时时间设置不对（太短或太长）
- RequestVote 处理逻辑有 bug（比如没有检查日志完整性）
- 没有正确统计票数

**TestReElection2A**

验证：
1. Leader 崩溃后，剩余节点能选出新 Leader
2. 网络分区后，多数节点一侧能选出 Leader
3. 分区恢复后，旧 Leader 退回 Follower

失败原因：
- 收到更大任期时没有退回 Follower
- 选举超时时间太长，导致重新选举太慢

---

## 2B 测试

**TestBasicAgree2B**

验证：Leader 能把一条日志复制给所有节点并提交。

失败原因：
- AppendEntries 处理逻辑有 bug
- commitIndex 没有正确更新
- apply 线程没有正确发送 ApplyMsg

**TestRPCBytes2B**

验证：RPC 传输的数据量不超过合理范围（防止每次都发全量日志）。

失败原因：
- 每次 AppendEntries 都发送全量日志，而不是只发 nextIndex 之后的部分

**TestFailAgree2B**

验证：少数节点崩溃时，多数节点仍然能提交日志。

**TestFailNoAgree2B**

验证：多数节点崩溃时，不能提交新日志（安全性）。

**TestConcurrentStarts2B**

验证：多个客户端同时提交命令时，所有命令都能被提交，且顺序一致。

**TestRejoin2B**

验证：崩溃的节点重新加入后，能正确同步日志。

失败原因：
- nextIndex 回退逻辑有 bug，导致日志同步失败

**TestBackup2B**

验证：在复杂的网络分区场景下，日志能正确同步。这是 2B 里最难的测试。

**具体场景**：
```
Step 1: 5 个节点，S1 是 Leader，提交了一些日志
Step 2: 把 S1 和多数节点隔离，只剩 S2/S3 能通信
        S2/S3 选出新 Leader，但无法提交（只有 2 个节点，不够多数）
Step 3: 在 S2/S3 上提交大量日志（这些日志永远不会被提交）
Step 4: 恢复网络，S1 重新加入
        S1 需要把 S2/S3 的冲突日志覆盖掉
        如果 nextIndex 回退太慢，这一步会花很长时间
Step 5: 测试超时（默认 120s）
```

**失败原因**：
- nextIndex 回退太慢（每次只退一步，需要几百轮 RPC）
- 日志冲突处理有 bug

**修复**：实现快速回退（ConflictTerm/ConflictIndex），见 `02_2b_replication_line_by_line.md`。

---

## 读懂测试输出

### 通过时的输出

```
$ go test -race -run 2B
Test (2B): basic agreement ...
  ... Passed --   0.9  3   16    4394    3
Test (2B): RPC byte count ...
  ... Passed --   1.7  3   48  114536   11
Test (2B): agreement despite follower disconnection ...
  ... Passed --   6.3  3  176   47260   7
Test (2B): no agreement if too many followers disconnect ...
  ... Passed --   3.7  3   80   20260    3
Test (2B): concurrent Start()s ...
  ... Passed --   0.9  3   12    3748    6
Test (2B): rejoin of partitioned leader ...
  ... Passed --   4.5  3  152   38396    4
Test (2B): leader backs up quickly over incorrect follower logs ...
  ... Passed --  28.6  3 2220  906027  102
PASS
ok      raft    46.6s
```

每行 `Passed` 后面的数字含义：
- `0.9` — 测试耗时（秒）
- `3` — 节点数量
- `16` — RPC 调用次数
- `4394` — RPC 传输的字节数
- `3` — 提交的日志条数

---

### 常见失败输出解读

**失败 1：apply error（日志不一致）**

```
Test (2B): basic agreement ...
--- FAIL: TestBasicAgree2B (5.03s)
    config.go:461: apply error: commit index=1 server=0 1 != 2
FAIL
```

**含义**：
- `commit index=1`：日志索引 1 的位置
- `server=0`：节点 0 apply 了命令 `1`
- `1 != 2`：但测试期望的是命令 `2`

**根因**：不同节点在同一个 index 提交了不同的命令，说明日志出现了不一致。

**排查**：检查 AppendEntries 的冲突处理逻辑，确保 Follower 在发现冲突时正确删除冲突日志。

---

**失败 2：测试超时**

```
Test (2B): leader backs up quickly over incorrect follower logs ...
--- FAIL: TestBackup2B (120.07s)
    test_test.go:421: one(100) failed to reach agreement
FAIL
```

**含义**：120 秒内没有完成日志同步。

**根因**：nextIndex 回退太慢，或者有死锁导致 RPC 无法发出。

**排查**：
```bash
# 加 -v 看详细输出
go test -race -v -run TestBackup2B

# 超时时打印 goroutine 堆栈（找死锁）
go test -race -run TestBackup2B -timeout 30s
```

---

**失败 3：数据竞争**

```
Test (2B): basic agreement ...
==================
WARNING: DATA RACE
Write at 0x00c0001a2340 by goroutine 18:
  main.(*Raft).AppendEntries(...)
      /path/raft.go:234
Read at 0x00c0001a2340 by goroutine 7:
  main.(*Raft).ticker(...)
      /path/raft.go:89
==================
--- FAIL: TestBasicAgree2B (0.52s)
```

**含义**：两个 goroutine 在没有锁保护的情况下并发访问同一个变量。

**排查**：看 `Write at` 和 `Read at` 指向的代码行，确认这两处访问是否都在锁保护下。

---

**失败 4：Figure 8 违反**

```
Test (2C): Figure 8 ...
--- FAIL: TestFigure8 (10.23s)
    config.go:461: apply error: commit index=3 server=1 5 != 3
```

**含义**：节点 1 在 index 3 提交了命令 5，但其他节点提交了命令 3。

**根因**：`updateCommitIndex` 里没有检查 `rf.log[n].Term != rf.currentTerm`，提交了旧 term 的日志，后来被覆盖。

**修复**：确认 `updateCommitIndex` 里有这个检查：
```go
if rf.log[n].Term != rf.currentTerm {
    continue  // 不提交旧 term 的日志
}
```

---

## 2C 测试

**TestPersist1/2/3**

验证：节点崩溃重启后，能从持久化存储恢复状态，继续正常工作。

失败原因：
- 某个地方修改了 currentTerm/votedFor/log 但忘记调用 persist()
- readPersist 里没有正确恢复状态

**TestFigure8**

验证：论文 Figure 8 描述的场景——Leader 不能提交旧任期的日志。

失败原因：
- updateCommitIndex 里没有检查 `rf.log[n].Term != rf.currentTerm`

**TestUnreliableAgree2C**

验证：在不可靠网络（随机丢包）下，日志仍然能被提交。

**TestFigure8Unreliable2C**

验证：在不可靠网络下，Figure 8 的场景仍然正确。

---

## 测试失败时的排查步骤

1. **先确认是偶发还是必现**：运行 10 次，看失败率
2. **加日志**：在关键状态变化处加 `log.Printf`
3. **缩小范围**：只运行失败的那个测试
4. **检查 -race 输出**：数据竞争会导致各种奇怪的失败
5. **对照论文 Figure 2**：每个规则都实现了吗？

```bash
# 运行 10 次，统计失败率
for i in $(seq 1 10); do
    if ! go test -race -run TestBackup2B; then
        echo "第 $i 次失败"
    fi
done
```

