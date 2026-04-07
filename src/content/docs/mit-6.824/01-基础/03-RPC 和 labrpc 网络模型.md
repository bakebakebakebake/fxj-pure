---
title: 'RPC 和 labrpc 网络模型'
description: '这篇文档讲 RPC（远程过程调用）的基本概念，以及 Lab 里用的 `labrpc` 库是怎么工作的。'
order: 3
source: 'mit-6.824'
sourceTitle: 'MIT 6.824 学习笔记'
section: 'fundamentals'
sectionTitle: '基础'
language: 'zh'
tags: ['docs', 'mit-6.824', 'fundamentals']
---
## 1. 什么是 RPC

RPC 让你可以像调用本地函数一样调用另一台机器上的函数。

**本地调用**：
```go
result := add(1, 2)  // 直接调用，立即返回
```

**RPC 调用**：
```go
args := AddArgs{A: 1, B: 2}
reply := AddReply{}
ok := client.Call("Math.Add", &args, &reply)
// 实际上：把参数序列化 → 发网络包 → 对方执行 → 把结果序列化 → 发回来 → 反序列化
```

**关键区别**：RPC 可能失败。网络可能断，对方可能崩溃，包可能丢失。

---

## 2. labrpc 是什么

Lab 里用的不是真实的网络，而是 `labrpc`——一个**模拟网络**的库。

`labrpc` 会故意：
- 随机丢包（模拟网络不可靠）
- 随机延迟（模拟网络拥塞）
- 随机断开连接（模拟节点崩溃）

这样做是为了测试你的代码在各种网络故障下是否还能正确工作。

**labrpc 的 Call 函数签名**：
```go
func (e *ClientEnd) Call(svcMeth string, args interface{}, reply interface{}) bool
```

返回 `true` 表示 RPC 成功，返回 `false` 表示失败（可能是网络问题，也可能是对方崩溃）。

---

## 3. 如何定义 RPC

在 Lab 1 里，你需要在 `rpc.go` 里定义 RPC 的参数和返回值结构体：

```go
// 请求任务的参数（Worker 发给 Master）
type GetTaskArgs struct {
    WorkerID int
}

// 请求任务的返回值（Master 发给 Worker）
type GetTaskReply struct {
    TaskType  string  // "map", "reduce", "wait", "exit"
    TaskID    int
    NReduce   int
    InputFile string  // Map 任务的输入文件
}
```

**重要规则**：结构体的字段名必须大写开头（exported），否则 RPC 序列化时会忽略这些字段。

```go
// 错误：小写字段不会被序列化
type BadArgs struct {
    taskID int  // 小写，RPC 传不过去
}

// 正确：大写字段
type GoodArgs struct {
    TaskID int  // 大写，可以序列化
}
```

---

## 4. 如何注册和调用 RPC

**服务端（Master）注册 RPC 处理函数**：

```go
// master.go
func (m *Master) GetTask(args *GetTaskArgs, reply *GetTaskReply) error {
    m.mu.Lock()
    defer m.mu.Unlock()
    // 分配任务逻辑...
    return nil
}

// 注册 RPC 服务
func (m *Master) server() {
    rpc.Register(m)
    // ...
}
```

**客户端（Worker）调用 RPC**：

```go
// worker.go
func callGetTask() (*GetTaskReply, bool) {
    args := GetTaskArgs{}
    reply := GetTaskReply{}
    ok := call("Master.GetTask", &args, &reply)
    return &reply, ok
}
```

注意 `call` 的第一个参数是 `"Master.GetTask"`，格式是 `"结构体名.方法名"`。

---

## 5. 处理 RPC 失败

RPC 失败时，你不知道对方是否收到了请求，也不知道是否执行了。这是分布式系统里最难处理的问题之一。

**三种可能的失败情况**：
1. 请求没发出去（网络断了）
2. 请求发出去了，对方执行了，但回复丢了
3. 对方崩溃了，没有执行

对于情况 2，如果你重试，对方会执行两次。所以你的操作要设计成**幂等的**（执行多次和执行一次效果相同）。

**在 Lab 1 里的处理方式**：

```go
func Worker(mapf func(string, string) []KeyValue, reducef func(string, []string) string) {
    for {
        reply, ok := callGetTask()
        if !ok {
            // Master 可能崩溃了，退出
            return
        }
        switch reply.TaskType {
        case "map":
            doMap(mapf, reply)
        case "reduce":
            doReduce(reducef, reply)
        case "wait":
            time.Sleep(time.Second)
        case "exit":
            return
        }
    }
}
```

---

## 6. labrpc 的超时机制

`labrpc` 的 `Call` 有内置超时。如果对方在一定时间内没有回复，`Call` 返回 `false`。

这意味着：**你不需要自己实现 RPC 超时**。但你需要处理 `Call` 返回 `false` 的情况。

---

## 7. 常见错误

**错误 1：忘记传指针**

```go
// 错误：reply 没有传指针
ok := call("Master.GetTask", &args, reply)

// 正确：reply 要传指针
ok := call("Master.GetTask", &args, &reply)
```

**错误 2：在 RPC 处理函数里忘记加锁**

```go
// 错误：没有加锁，多个 Worker 同时调用会有数据竞争
func (m *Master) GetTask(args *GetTaskArgs, reply *GetTaskReply) error {
    // 直接访问 m.tasks，没有锁
    reply.TaskID = m.nextTask()
    return nil
}

// 正确
func (m *Master) GetTask(args *GetTaskArgs, reply *GetTaskReply) error {
    m.mu.Lock()
    defer m.mu.Unlock()
    reply.TaskID = m.nextTask()
    return nil
}
```

**错误 3：把 RPC 失败当成致命错误**

```go
// 错误：RPC 失败就 panic
ok := call("Master.GetTask", &args, &reply)
if !ok {
    panic("RPC failed!")  // 不应该 panic
}

// 正确：优雅处理
ok := call("Master.GetTask", &args, &reply)
if !ok {
    return  // 或者重试
}
```

---

## 快速检验

1. 为什么 RPC 结构体的字段名必须大写？
2. RPC 调用返回 `false` 时，你能确定对方没有执行这个操作吗？
3. 什么叫"幂等操作"？在 Lab 里举一个例子。

<details>
<summary>参考答案</summary>

**1.** Go 的 `encoding/gob`（labgob 基于它）只能序列化导出字段（首字母大写）。小写字段是包私有的，序列化时被忽略，导致 RPC 传输的数据不完整，对方收到的是零值。

**2.** 不能确定。`false` 表示没有收到回复，但对方可能已经执行了操作，只是回复在网络中丢失了。这就是为什么需要去重机制——客户端重试时，服务器要能识别并忽略重复请求。

**3.** 幂等操作：执行多次和执行一次结果相同。Lab 例子：Map 任务是幂等的（多次执行同一个 Map 任务，输出文件内容相同，最终 rename 覆盖）；Append 操作不是幂等的（多次 Append 会追加多次，结果不同）。

</details>

