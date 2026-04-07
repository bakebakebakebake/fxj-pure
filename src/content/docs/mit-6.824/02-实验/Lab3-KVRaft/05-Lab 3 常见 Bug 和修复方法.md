---
title: 'Lab 3 常见 Bug 和修复方法'
description: '---'
order: 5
source: 'mit-6.824'
sourceTitle: 'MIT 6.824 学习笔记'
section: 'labs'
sectionTitle: '实验'
subsection: 'lab3'
subsectionTitle: 'Lab 3 · KVRaft'
language: 'zh'
tags: ['docs', 'mit-6.824', 'labs', 'lab3']
---
## Bug 1：线性一致性检测失败

**症状**：`history is not linearizable` 或 `linearizability check timed out`

**最常见原因**：Get 操作直接读本地状态，没有通过 Raft 提交。

```go
// 错误：直接读本地状态
func (kv *KVServer) Get(args *GetArgs, reply *GetReply) {
    kv.mu.Lock()
    defer kv.mu.Unlock()
    reply.Value = kv.data[args.Key]  // 可能读到过时的数据！
    reply.Err = OK
}

// 正确：通过 Raft 提交 Get 操作
func (kv *KVServer) Get(args *GetArgs, reply *GetReply) {
    op := Op{Type: "Get", Key: args.Key, ...}
    index, _, isLeader := kv.rf.Start(op)
    if !isLeader {
        reply.Err = ErrWrongLeader
        return
    }
    // 等待 apply...
}
```

---

## Bug 2：重复请求被执行多次

**症状**：`TestUnreliableOneKey3A` 失败，Append 的结果包含重复的值。

**原因**：去重逻辑有 bug，或者根本没有去重。

**检查**：
1. `common.go` 里的 RPC 结构体是否有 `ClientID` 和 `SeqNum` 字段？
2. `applyLoop` 里是否检查了 `op.SeqNum <= lastSeq[op.ClientID]`？
3. 客户端是否在重试时使用了相同的 `SeqNum`（不能每次重试都递增）？

```go
// 错误：每次重试都递增 SeqNum
func (ck *Clerk) PutAppend(key, value, op string) {
    for {
        ck.seqNum++  // 错误！重试时不应该递增
        args := PutAppendArgs{SeqNum: ck.seqNum, ...}
        // ...
    }
}

// 正确：只在开始新请求时递增
func (ck *Clerk) PutAppend(key, value, op string) {
    ck.seqNum++  // 只递增一次
    args := PutAppendArgs{SeqNum: ck.seqNum, ...}
    for {
        // 重试时使用相同的 args
        ok := ck.servers[ck.leader].Call("KVServer.PutAppend", &args, &reply)
        // ...
    }
}
```

---

## Bug 3：死锁（程序卡住）

**症状**：测试超时，程序没有退出。

**最常见原因**：在持有锁的情况下等待 channel。

```go
// 错误：持有锁时等待 channel
func (kv *KVServer) Get(args *GetArgs, reply *GetReply) {
    kv.mu.Lock()
    // ...
    ch := kv.waitCh[index]
    result := <-ch  // 死锁！apply 线程需要锁才能发送
    kv.mu.Unlock()
}

// 正确：等待 channel 前释放锁
func (kv *KVServer) Get(args *GetArgs, reply *GetReply) {
    // ...
    kv.mu.Lock()
    kv.waitCh[index] = ch
    kv.mu.Unlock()  // 先释放锁

    select {
    case result := <-ch:  // 现在可以等待了
        // ...
    }
}
```

---

## Bug 4：Leader 变更后 RPC 永远不返回

**症状**：某些 RPC 调用永远不返回，测试超时。

**原因**：Leader 变更后，之前提交的操作可能不会出现在 `applyCh` 里（或者出现在不同的 index）。如果没有超时机制，等待 channel 的 RPC 处理函数会永远阻塞。

**修复**：用 `time.After` 设置超时：

```go
select {
case result := <-ch:
    reply.Err = result.Err
case <-time.After(500 * time.Millisecond):
    reply.Err = ErrWrongLeader  // 超时，让客户端重试
}
```

---

## Bug 5：快照后日志索引越界

**症状**：3B 测试 panic，`index out of range`。

**原因**：引入快照后，日志索引的计算方式变了，但某些地方没有更新。

**检查**：所有访问 `rf.log[i]` 的地方，是否都改成了 `rf.log[i - rf.lastIncludedIndex]`？

**建议**：封装一个辅助函数：

```go
func (rf *Raft) logAt(index int) LogEntry {
    return rf.log[index-rf.lastIncludedIndex]
}

func (rf *Raft) logLen() int {
    return rf.lastIncludedIndex + len(rf.log)
}
```

---

## Bug 6：快照里没有包含去重状态

**症状**：节点重启后，重复请求被重新执行。

**原因**：快照只保存了 `data`，没有保存 `lastSeq` 和 `lastResult`。

**修复**：快照必须包含所有需要持久化的状态：

```go
func (kv *KVServer) takeSnapshot(index int) {
    w := new(bytes.Buffer)
    e := labgob.NewEncoder(w)
    e.Encode(kv.data)
    e.Encode(kv.lastSeq)      // 必须包含！
    e.Encode(kv.lastResult)   // 必须包含！
    // ...
}
```

