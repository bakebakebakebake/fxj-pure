---
title: 'Lab 1 常见 Bug 和修复方法'
description: '这篇文档列出 Lab 1 里最常见的 bug，以及如何诊断和修复。'
order: 5
source: 'mit-6.824'
sourceTitle: 'MIT 6.824 学习笔记'
section: 'labs'
sectionTitle: '实验'
subsection: 'lab1'
subsectionTitle: 'Lab 1 · MapReduce'
language: 'zh'
tags: ['docs', 'mit-6.824', 'labs', 'lab1']
---
## Bug 1：wc 测试输出结果不对

**症状**：`diff` 显示输出和正确答案不同，某些单词的计数不对。

**可能原因**：

1. **ihash 分桶逻辑错误**
   ```go
   // 错误：用了错误的分桶方式
   bucket := len(kv.Key) % nReduce  // 不对！

   // 正确
   bucket := ihash(kv.Key) % nReduce
   ```

2. **Reduce 没有读取所有中间文件**
   ```go
   // 错误：只读了一个文件
   filename := fmt.Sprintf("mr-0-%d", reply.TaskID)

   // 正确：读取所有 Map 任务的输出
   for i := 0; i < reply.NMap; i++ {
       filename := fmt.Sprintf("mr-%d-%d", i, reply.TaskID)
       // ...
   }
   ```

3. **Reduce 没有排序**
   ```go
   // 错误：没有排序，相同 key 的条目可能不连续
   for _, kv := range kva {
       output := reducef(kv.Key, []string{kv.Value})
       // ...
   }

   // 正确：先排序，再按 key 分组
   sort.Slice(kva, func(i, j int) bool {
       return kva[i].Key < kva[j].Key
   })
   ```

---

## Bug 2：crash 测试失败

**症状**：crash 测试超时，或者输出结果不对。

**可能原因**：

1. **没有实现超时检测**

   Worker 崩溃后，任务状态还是 Running，永远不会被重新分配。

   修复：在 `MakeMaster` 里启动超时检测 goroutine，每秒检查一次。

2. **没有用原子写入**

   Worker 崩溃时正在写文件，留下了损坏的文件。其他 Worker 读到损坏的文件会出错。

   修复：先写临时文件，再 `os.Rename`。

3. **ReportTask 没有检查任务状态**

   超时后任务被重新分配，原来的 Worker 完成后来报告，导致 `mapDone` 计数错误，提前进入 Reduce 阶段。

   修复：在 `ReportTask` 里检查 `Status == Running`，只有 Running 状态的任务才更新计数。

---

## Bug 3：map parallelism 测试失败

**症状**：`map parallelism test: FAIL`

**原因**：Master 串行分配任务，没有同时给多个 Worker 分配任务。

**检查**：你的 `GetTask` 函数是否在分配一个任务后就等待它完成？

**修复**：`GetTask` 应该立即返回一个可用的任务，不需要等待之前的任务完成。Master 的状态机应该是：
- 有 Idle 的 Map 任务 → 分配给 Worker，立即返回
- 没有 Idle 的 Map 任务但 Map 没全完成 → 返回 "wait"
- Map 全完成，有 Idle 的 Reduce 任务 → 分配给 Worker，立即返回

---

## Bug 4：程序卡住不退出

**症状**：测试超时（180秒），程序没有退出。

**可能原因**：

1. **死锁**：两个 goroutine 互相等待锁。

   检查：是否在持有锁的情况下调用了 RPC？

   修复：发 RPC 前释放锁，收到回复后再加锁。

2. **Worker 没有处理 "exit" 消息**

   所有任务完成后，Master 会返回 "exit"，Worker 应该退出。

   检查：你的 Worker 主循环是否处理了 "exit" 情况？

3. **Master 的 Done() 函数逻辑错误**

   `mrmaster.go` 会调用 `Done()` 来判断是否退出。如果 `Done()` 永远返回 false，Master 不会退出。

---

## Bug 5：数据竞争（race condition）

**症状**：加了 `-race` 后报 `WARNING: DATA RACE`。

**常见位置**：
- 多个 Worker 同时调用 `GetTask`，Master 没有加锁
- 超时检测 goroutine 和 RPC 处理函数同时访问任务状态

**修复**：所有对 `m.mapTasks`、`m.reduceTasks`、`m.mapDone`、`m.reduceDone` 的访问都要在 `m.mu.Lock()` 保护下进行。

---

## 调试流程

1. 先跑 wc 测试，确保基本正确性
2. 加日志，观察任务分配和完成的顺序
3. 用 `-race` 检测数据竞争
4. 如果 crash 测试失败，检查超时检测和原子写入
5. 如果并行性测试失败，检查 Master 的任务分配逻辑

