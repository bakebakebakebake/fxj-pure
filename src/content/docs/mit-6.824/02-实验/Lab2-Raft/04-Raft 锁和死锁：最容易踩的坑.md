---
title: 'Raft 锁和死锁：最容易踩的坑'
description: '这篇文档专门讲 Raft 实现里最常见的并发 bug。'
order: 4
source: 'mit-6.824'
sourceTitle: 'MIT 6.824 学习笔记'
section: 'labs'
sectionTitle: '实验'
subsection: 'lab2'
subsectionTitle: 'Lab 2 · Raft'
language: 'zh'
tags: ['docs', 'mit-6.824', 'labs', 'lab2']
---
## 锁的基本原则

**原则 1：所有共享状态的访问都要加锁**

Raft 结构体里的所有字段都是共享状态（多个 goroutine 会访问）。读和写都要在 `rf.mu.Lock()` 保护下进行。

**原则 2：发 RPC 时不能持有锁**

这是最重要的原则。违反这条会导致死锁。

```go
// 错误：持有锁时发 RPC
rf.mu.Lock()
args := rf.buildArgs()
rf.peers[server].Call("Raft.AppendEntries", &args, &reply)  // 死锁！
rf.mu.Unlock()

// 正确：发 RPC 前释放锁
rf.mu.Lock()
args := rf.buildArgs()
rf.mu.Unlock()  // 先释放锁

ok := rf.peers[server].Call("Raft.AppendEntries", &args, &reply)

rf.mu.Lock()
// 处理回复
rf.mu.Unlock()
```

**为什么会死锁**：`AppendEntries` 的处理函数也需要 `rf.mu`。如果发送方持有锁，处理函数就无法获取锁，而发送方在等待处理函数返回，形成死锁。

---

## 收到 RPC 回复后要重新检查状态

发 RPC 是异步的，等待回复期间，节点的状态可能已经改变。收到回复后，必须重新检查：

```go
ok := rf.peers[server].Call("Raft.AppendEntries", &args, &reply)
if !ok {
    return
}

rf.mu.Lock()
defer rf.mu.Unlock()

// 检查 1：任期是否还是发送时的任期？
if rf.currentTerm != args.Term {
    return  // 任期变了，这个回复已经过时
}

// 检查 2：还是 Leader 吗？
if rf.state != "leader" {
    return  // 已经不是 Leader 了
}

// 现在才处理回复
```

**为什么要检查**：假设你发出 AppendEntries 时是任期 2 的 Leader，等待回复期间发生了选举，你变成了任期 3 的 Follower。这时收到的回复是针对任期 2 的，不应该用来更新任期 3 的状态。

---

## 常见死锁场景

**场景 1：apply 时持有锁**

```go
// 错误
rf.mu.Lock()
rf.applyCh <- msg  // 如果上层没有及时读取，这里会阻塞，死锁！
rf.mu.Unlock()

// 正确：在 goroutine 里发送，或者先收集要发送的消息，解锁后再发送
go func() {
    rf.applyCh <- msg
}()
```

**场景 2：在 goroutine 里忘记加锁**

```go
// 错误：goroutine 里访问共享状态没有加锁
go func() {
    if rf.state == "leader" {  // 没有锁！
        // ...
    }
}()

// 正确
go func() {
    rf.mu.Lock()
    isLeader := rf.state == "leader"
    rf.mu.Unlock()
    if isLeader {
        // ...
    }
}()
```

---

## 常见数据竞争场景

**场景 1：切片共享**

```go
// 错误：把日志切片直接传给 goroutine
entries := rf.log[rf.nextIndex[server]:]
go func() {
    // 这里用 entries，但 rf.log 可能已经被修改
}()

// 正确：复制一份
entries := make([]LogEntry, len(rf.log[rf.nextIndex[server]:]))
copy(entries, rf.log[rf.nextIndex[server]:])
go func() {
    // 用 entries 的副本，安全
}()
```

**场景 2：在 goroutine 里捕获循环变量**

```go
// 错误：所有 goroutine 共享同一个 i
for i := range rf.peers {
    go func() {
        rf.sendAppendEntries(i)  // i 的值可能已经变了！
    }()
}

// 正确：把 i 作为参数传入
for i := range rf.peers {
    go func(server int) {
        rf.sendAppendEntries(server)
    }(i)
}
```

---

## 调试技巧

**用 -race 检测数据竞争**：

```bash
go test -race -run 2B
```

**程序卡住时，打印 goroutine 堆栈**：

```bash
# 在另一个终端
kill -SIGQUIT <pid>
```

或者在代码里加：

```go
import "runtime/debug"

// 在某个地方
debug.PrintStack()
```

**加日志追踪锁的获取和释放**：

```go
func (rf *Raft) lock(caller string) {
    rf.mu.Lock()
    log.Printf("[%d] 获取锁 from %s", rf.me, caller)
}

func (rf *Raft) unlock(caller string) {
    log.Printf("[%d] 释放锁 from %s", rf.me, caller)
    rf.mu.Unlock()
}
```

