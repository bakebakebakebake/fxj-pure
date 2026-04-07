---
title: 'Go 从零到能做 Lab'
description: '这篇文档假设你完全没写过 Go，但有其他语言基础（Python/Java/C 都行）。目标是让你读完之后能看懂 Lab 代码，并且知道怎么改。'
order: 1
source: 'mit-6.824'
sourceTitle: 'MIT 6.824 学习笔记'
section: 'fundamentals'
sectionTitle: '基础'
language: 'zh'
tags: ['docs', 'mit-6.824', 'fundamentals']
---
## 1. 变量和值语义

Go 里有一个让新手最容易踩坑的地方：**结构体是按值传递的**。

```go
type Task struct {
    ID     int
    Status string
}

func markDone(t Task) {
    t.Status = "done"  // 这里改的是副本，原来的 t 没变！
}

func main() {
    task := Task{ID: 1, Status: "pending"}
    markDone(task)
    fmt.Println(task.Status)  // 还是 "pending"
}
```

如果你想让函数真正修改结构体，要传指针：

```go
func markDone(t *Task) {
    t.Status = "done"  // 这里改的是原始数据
}

markDone(&task)
fmt.Println(task.Status)  // 现在是 "done"
```

**在 Lab 里的实际影响**：Raft 的 `rf` 对象、Master 的 `m` 对象，都是用指针接收者的方法。如果你不小心用了值接收者，状态更新会悄悄丢失，而且不报错，非常难调试。

---

## 2. 切片（slice）的陷阱

切片看起来像数组，但它底层是一个指向数组的引用。

```go
a := []int{1, 2, 3}
b := a          // b 和 a 共享同一块内存！
b[0] = 99
fmt.Println(a)  // [99 2 3]，a 也变了
```

如果你想要一个独立的副本：

```go
b := make([]int, len(a))
copy(b, a)
b[0] = 99
fmt.Println(a)  // [1 2 3]，a 没变
```

**在 Lab 里的实际影响**：Raft 的日志（log entries）是切片。如果你把日志切片直接赋值给另一个变量，然后在 goroutine 里修改，会产生数据竞争（race condition）。正确做法是 `append` 到新切片，或者显式 `copy`。

---

## 3. map 的并发问题

Go 的 map **不是线程安全的**。多个 goroutine 同时读写同一个 map 会导致程序崩溃（panic）。

```go
// 错误示例：多个 goroutine 同时写 map
m := make(map[string]int)
go func() { m["a"] = 1 }()
go func() { m["b"] = 2 }()
// 可能 panic: concurrent map writes
```

正确做法是加锁：

```go
var mu sync.Mutex
m := make(map[string]int)

go func() {
    mu.Lock()
    m["a"] = 1
    mu.Unlock()
}()
```

**在 Lab 里的实际影响**：Master 里用 map 存任务状态，Worker 里用 map 存中间结果。所有对这些 map 的访问都要在锁保护下进行。

---

## 4. 错误处理

Go 没有异常（exception），错误是函数的返回值。

```go
file, err := os.Open("data.txt")
if err != nil {
    log.Fatal("打开文件失败:", err)
}
defer file.Close()
```

**分布式系统里的关键原则**：失败是正常路径，不是异常情况。

在 Lab 里，RPC 调用可能失败（网络断了、对方崩溃了），这时 `call()` 返回 `false`。你不应该 `panic`，而应该处理这个失败：

```go
ok := call("Master.GetTask", &args, &reply)
if !ok {
    // Master 可能崩溃了，或者网络断了
    // 正确做法：等一会儿再重试，或者直接退出
    time.Sleep(time.Second)
    continue
}
```

---

## 5. 方法接收者：指针 vs 值

```go
type Counter struct {
    count int
}

// 值接收者：操作的是副本
func (c Counter) GetCount() int {
    return c.count
}

// 指针接收者：操作的是原始对象
func (c *Counter) Increment() {
    c.count++
}
```

**规则**：如果方法需要修改结构体的字段，必须用指针接收者。如果结构体很大，也应该用指针接收者（避免复制开销）。

在 Lab 里，几乎所有方法都用指针接收者：
```go
func (rf *Raft) RequestVote(args *RequestVoteArgs, reply *RequestVoteReply) {
    // rf 是指针，可以修改 Raft 的状态
}
```

---

## 6. 包和模块结构

Lab 的代码结构：
```
labs/src/
├── mr/          # Lab 1：你要实现的代码
│   ├── master.go    # Master 实现
│   ├── worker.go    # Worker 实现
│   └── rpc.go       # RPC 消息定义
├── raft/        # Lab 2：你要实现的代码
│   └── raft.go
├── kvraft/      # Lab 3：你要实现的代码
└── labrpc/      # 框架提供的 RPC 库（不要改）
```

**重要**：`labrpc` 是模拟网络的 RPC 库，它会随机丢包、延迟，用来测试你的容错逻辑。不要用标准库的 `net/rpc` 替换它。

---

## 7. 日志习惯

在分布式系统里，你没法用断点调试（多个进程同时运行）。日志是你唯一的调试工具。

**好的日志格式**：

```go
log.Printf("[Master] 分配任务 %d 给 worker，当前状态: %s", taskID, task.Status)
log.Printf("[Worker] 收到任务 %d，类型: %s", task.ID, task.Type)
```

**关键原则**：
1. 每条日志要包含：是谁（Master/Worker）、在做什么、关键变量的值
2. 状态变化时一定要打日志
3. 错误路径一定要打日志

**调试技巧**：如果测试失败，先加日志，让失败可以重现，再去找根因。不要靠猜。

---

## 8. goroutine 基础

goroutine 是 Go 的轻量级线程。用 `go` 关键字启动：

```go
go func() {
    // 这段代码在新的 goroutine 里运行
    fmt.Println("我在另一个线程里")
}()
```

**注意**：goroutine 启动后，主程序不会等它结束。如果主程序退出了，所有 goroutine 也会被强制终止。

在 Lab 里，Master 会启动一个 goroutine 来监控超时任务：

```go
go func() {
    for {
        // 每秒检查一次是否有任务超时
        time.Sleep(time.Second)
        m.mu.Lock()
        // 检查超时逻辑...
        m.mu.Unlock()
    }
}()
```

---

## 快速检验

读完这篇文档，你应该能回答：

1. 为什么 `func markDone(t Task)` 不能修改原始任务，而 `func markDone(t *Task)` 可以？
2. 为什么多个 goroutine 同时写 map 会崩溃？
3. RPC 调用返回 `false` 时，应该怎么处理？

<details>
<summary>参考答案（先自己想，再展开）</summary>

**1.** Go 函数参数按值传递。`markDone(t Task)` 收到的是 `task` 的拷贝，修改拷贝不影响原始值。`markDone(t *Task)` 收到的是指针，通过指针修改的是原始结构体。

**2.** Go 的 map 不是线程安全的。多个 goroutine 同时写 map 会触发运行时的并发检测，直接 panic。解决方案：用 `sync.Mutex` 保护 map 的所有读写。

**3.** 不能假设对方没有执行。`false` 只表示"没收到回复"，可能是网络丢包、对方崩溃、或者对方执行了但回复丢了。如果操作是幂等的（如 Map 任务），可以直接重试；如果不是幂等的（如 Append），需要去重机制。

</details>

如果这三个问题都能答上来，你已经准备好看 Lab 代码了。

