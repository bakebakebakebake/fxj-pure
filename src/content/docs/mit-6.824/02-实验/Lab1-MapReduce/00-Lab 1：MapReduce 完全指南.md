---
title: 'Lab 1: MapReduce 完全指南'
description: 'MapReduce 是一个用于处理大规模数据的编程模型。想象你有一个巨大的文本文件（比如整个维基百科），你想统计每个单词出现的次数。如果文件太大，一台机器处理不了，怎么办？'
order: 0
source: 'mit-6.824'
sourceTitle: 'MIT 6.824 学习笔记'
section: 'labs'
sectionTitle: '实验'
subsection: 'lab1'
subsectionTitle: 'Lab 1 · MapReduce'
language: 'zh'
tags: ['docs', 'mit-6.824', 'labs', 'lab1']
---
MapReduce 的核心思想是**分而治之**：

1. **Map 阶段**：把大任务分成很多小任务
   - 把大文件切分成多个小块
   - 每个小块由一个 worker 处理
   - 每个 worker 读取文本，输出 (单词, 1) 这样的键值对

2. **Reduce 阶段**：把小任务的结果合并
   - 把相同单词的所有 (单词, 1) 收集到一起
   - 对每个单词，把所有的 1 加起来
   - 输出最终的 (单词, 总次数)

### 1.2 为什么需要 MapReduce？

**问题场景**：
- Google 需要处理整个互联网的网页（TB 级别数据）
- 单机处理需要几天甚至几周
- 需要利用成百上千台机器并行处理

**MapReduce 的价值**：
1. **自动并行化**：程序员只需要写 Map 和 Reduce 函数，框架自动处理并行
2. **容错性**：某台机器崩溃了？框架自动在另一台机器上重新执行任务
3. **简单性**：复杂的分布式问题被抽象成简单的 Map 和 Reduce 操作

### 1.3 一个具体例子：词频统计

假设我们要统计文件中每个单词的出现次数。

**输入文件**：
```
hello world
hello mapreduce
world peace
```

**Map 阶段**（3个 Map worker 并行处理）：
- Worker 1 处理 "hello world" → 输出: [("hello",1), ("world",1)]
- Worker 2 处理 "hello mapreduce" → 输出: [("hello",1), ("mapreduce",1)]
- Worker 3 处理 "world peace" → 输出: [("world",1), ("peace",1)]

**Shuffle 阶段**（框架自动完成）：
- 把相同 key 的数据发送到同一个 Reduce worker
- "hello" → [1, 1]
- "world" → [1, 1]
- "mapreduce" → [1]
- "peace" → [1]

**Reduce 阶段**（4个 Reduce worker 并行处理）：
- Reduce worker 1: "hello" + [1,1] → ("hello", 2)
- Reduce worker 2: "world" + [1,1] → ("world", 2)
- Reduce worker 3: "mapreduce" + [1] → ("mapreduce", 1)
- Reduce worker 4: "peace" + [1] → ("peace", 1)

**最终输出**：
```
hello 2
world 2
mapreduce 1
peace 1
```

## 第二部分：Lab 1 架构设计

### 2.1 系统角色

在 MIT 6.824 的 Lab 1 中，你需要实现一个简化版的 MapReduce 系统，包含三个核心角色：

**1. Master（协调者）**
- 负责任务分配：决定哪个 worker 执行哪个任务
- 负责状态跟踪：记录每个任务的状态（未开始/进行中/已完成）
- 负责容错处理：如果 worker 10秒内没完成任务，认为它崩溃了，把任务重新分配给其他 worker

**2. Worker（工作者）**
- 向 Master 请求任务
- 执行 Map 或 Reduce 任务
- 把结果写入文件
- 通知 Master 任务完成

**3. RPC（远程过程调用）**
- Worker 和 Master 之间通过 RPC 通信
- Worker 调用 Master 的方法来请求任务、报告完成

### 2.2 系统工作流程

```
[启动阶段]
1. Master 启动，读取输入文件列表和 nReduce 参数
2. Master 创建 M 个 Map 任务（每个输入文件一个任务）
3. Master 创建 R 个 Reduce 任务（R = nReduce）
4. 多个 Worker 启动，准备接收任务

[Map 阶段]
5. Worker 向 Master 请求任务（RPC 调用）
6. Master 分配一个 Map 任务给 Worker
7. Worker 读取输入文件，调用 Map 函数
8. Worker 把 Map 输出分成 R 份（根据 key 的 hash 值）
9. Worker 把 R 份数据写入 R 个中间文件
10. Worker 通知 Master 任务完成
11. 重复 5-10，直到所有 Map 任务完成

[Reduce 阶段]
12. Worker 向 Master 请求任务
13. Master 分配一个 Reduce 任务给 Worker
14. Worker 读取所有 Map 任务产生的对应中间文件
15. Worker 对中间数据按 key 排序
16. Worker 对每个 key 调用 Reduce 函数
17. Worker 把 Reduce 输出写入最终输出文件
18. Worker 通知 Master 任务完成
19. 重复 12-18，直到所有 Reduce 任务完成

[结束阶段]
20. Master 检测到所有任务完成
21. Master.Done() 返回 true
22. 系统关闭
```

### 2.3 文件命名规范

**Map 任务的中间文件**：
- 格式：`mr-X-Y`
- X = Map 任务编号（0 到 M-1）
- Y = Reduce 任务编号（0 到 R-1）
- 例如：`mr-0-0`, `mr-0-1`, `mr-1-0`, `mr-1-1`

**Reduce 任务的输出文件**：
- 格式：`mr-out-Y`
- Y = Reduce 任务编号（0 到 R-1）
- 例如：`mr-out-0`, `mr-out-1`, `mr-out-2`

### 2.4 关键数据结构

你需要在 Master 中维护以下状态：

```go
type Master struct {
    // 任务相关
    mapTasks    []Task      // 所有 Map 任务
    reduceTasks []Task      // 所有 Reduce 任务

    // 阶段控制
    phase       Phase       // 当前阶段：Map/Reduce/Done

    // 参数
    nReduce     int         // Reduce 任务数量
    nMap        int         // Map 任务数量

    // 并发控制
    mu          sync.Mutex  // 保护共享状态
}

type Task struct {
    id          int         // 任务 ID
    state       TaskState   // 任务状态：Idle/InProgress/Completed
    workerID    int         // 执行该任务的 worker ID
    startTime   time.Time   // 任务开始时间（用于超时检测）
}

type TaskState int
const (
    Idle        TaskState = 0  // 未开始
    InProgress  TaskState = 1  // 进行中
    Completed   TaskState = 2  // 已完成
)

type Phase int
const (
    MapPhase    Phase = 0  // Map 阶段
    ReducePhase Phase = 1  // Reduce 阶段
    DonePhase   Phase = 2  // 完成
)
```

## 第三部分：RPC 接口设计

### 3.1 为什么需要 RPC？

Worker 和 Master 运行在不同的进程中（甚至可能在不同的机器上），它们需要通信。RPC（Remote Procedure Call）让你可以像调用本地函数一样调用远程函数。

**不使用 RPC 的方式**（复杂）：
```go
// Worker 端
conn, _ := net.Dial("tcp", "master:1234")
conn.Write([]byte("REQUEST_TASK"))
data, _ := conn.Read()
// 手动解析数据...
```

**使用 RPC 的方式**（简单）：
```go
// Worker 端
args := RequestTaskArgs{}
reply := RequestTaskReply{}
call("Master.RequestTask", &args, &reply)
// reply 中已经包含了任务信息
```

### 3.2 需要定义的 RPC 接口

在 `rpc.go` 中定义：

**1. 请求任务**
```go
// Worker 调用这个 RPC 向 Master 请求任务
type RequestTaskArgs struct {
    WorkerID int  // Worker 的唯一标识
}

type RequestTaskReply struct {
    TaskType   string   // "map" 或 "reduce" 或 "wait" 或 "done"
    TaskID     int      // 任务编号
    Filename   string   // Map 任务：输入文件名
    NReduce    int      // Map 任务需要：Reduce 任务总数
    NMap       int      // Reduce 任务需要：Map 任务总数
}
```

**2. 报告任务完成**
```go
// Worker 调用这个 RPC 通知 Master 任务已完成
type ReportTaskArgs struct {
    WorkerID int     // Worker 的唯一标识
    TaskType string  // "map" 或 "reduce"
    TaskID   int     // 任务编号
}

type ReportTaskReply struct {
    Success bool  // Master 是否接受这个报告
}
```

## 第四部分：Master 实现详解

### 4.1 MakeMaster 函数 - 初始化

这是 Master 的构造函数，在系统启动时被调用。

```go
func MakeMaster(files []string, nReduce int) *Master {
    m := Master{}

    // 1. 保存参数
    m.nReduce = nReduce
    m.nMap = len(files)

    // 2. 初始化 Map 任务
    m.mapTasks = make([]Task, m.nMap)
    for i := 0; i < m.nMap; i++ {
        m.mapTasks[i] = Task{
            id:       i,
            state:    Idle,
            filename: files[i],  // 每个 Map 任务对应一个输入文件
        }
    }

    // 3. 初始化 Reduce 任务
    m.reduceTasks = make([]Task, m.nReduce)
    for i := 0; i < m.nReduce; i++ {
        m.reduceTasks[i] = Task{
            id:    i,
            state: Idle,
        }
    }

    // 4. 设置初始阶段为 Map
    m.phase = MapPhase

    // 5. 启动 RPC 服务器
    m.server()

    // 6. 启动后台线程检查超时
    go m.checkTimeout()

    return &m
}
```

**代码解析**：
- **第 1 层（做什么）**：初始化 Master 的所有状态，创建任务列表，启动服务
- **第 2 层（为什么这样做）**：
  - 每个输入文件对应一个 Map 任务，所以 Map 任务数 = 文件数
  - Reduce 任务数由参数指定，用于控制并行度
  - 需要后台线程定期检查任务是否超时（worker 可能崩溃）
- **第 3 层（核心概念）**：
  - **任务状态机**：Idle → InProgress → Completed
  - **阶段转换**：MapPhase → ReducePhase → DonePhase
  - **容错机制**：通过超时检测实现 worker 故障恢复

### 4.2 RequestTask RPC 处理器 - 分配任务

Worker 调用这个 RPC 来请求任务。

```go
func (m *Master) RequestTask(args *RequestTaskArgs, reply *RequestTaskReply) error {
    m.mu.Lock()
    defer m.mu.Unlock()

    // 1. 根据当前阶段分配任务
    if m.phase == MapPhase {
        // 尝试分配一个 Map 任务
        for i := 0; i < m.nMap; i++ {
            if m.mapTasks[i].state == Idle {
                // 找到一个空闲的 Map 任务
                m.mapTasks[i].state = InProgress
                m.mapTasks[i].workerID = args.WorkerID
                m.mapTasks[i].startTime = time.Now()

                // 填充 reply
                reply.TaskType = "map"
                reply.TaskID = i
                reply.Filename = m.mapTasks[i].filename
                reply.NReduce = m.nReduce
                return nil
            }
        }
        // 所有 Map 任务都在进行中或已完成，让 Worker 等待
        reply.TaskType = "wait"
        return nil

    } else if m.phase == ReducePhase {
        // 尝试分配一个 Reduce 任务
        for i := 0; i < m.nReduce; i++ {
            if m.reduceTasks[i].state == Idle {
                m.reduceTasks[i].state = InProgress
                m.reduceTasks[i].workerID = args.WorkerID
                m.reduceTasks[i].startTime = time.Now()

                reply.TaskType = "reduce"
                reply.TaskID = i
                reply.NMap = m.nMap
                reply.NReduce = m.nReduce
                return nil
            }
        }
        reply.TaskType = "wait"
        return nil

    } else {
        // 所有任务都完成了
        reply.TaskType = "done"
        return nil
    }
}
```

**代码解析**：
- **第 1 层（做什么）**：根据当前阶段，找一个空闲任务分配给 Worker
- **第 2 层（为什么这样做）**：
  - 必须先完成所有 Map 任务，才能开始 Reduce（因为 Reduce 需要读取所有 Map 的输出）
  - 如果没有空闲任务，返回 "wait"，让 Worker 稍后再请求
  - 记录 startTime 用于超时检测
- **第 3 层（核心概念）**：
  - **阶段依赖**：Map 阶段必须完全完成后才能进入 Reduce 阶段
  - **并发控制**：使用 mutex 保护共享状态，防止多个 Worker 同时修改
  - **任务状态转换**：Idle → InProgress（分配时）

### 4.3 ReportTask RPC 处理器 - 接收完成报告

Worker 完成任务后调用这个 RPC。

```go
func (m *Master) ReportTask(args *ReportTaskArgs, reply *ReportTaskReply) error {
    m.mu.Lock()
    defer m.mu.Unlock()

    // 1. 根据任务类型更新状态
    if args.TaskType == "map" {
        // 检查任务是否还是由这个 Worker 负责
        if m.mapTasks[args.TaskID].workerID == args.WorkerID &&
           m.mapTasks[args.TaskID].state == InProgress {
            // 标记任务完成
            m.mapTasks[args.TaskID].state = Completed
            reply.Success = true

            // 检查是否所有 Map 任务都完成了
            if m.allMapTasksCompleted() {
                m.phase = ReducePhase
            }
        } else {
            // 这个任务已经被重新分配给其他 Worker 了（超时）
            reply.Success = false
        }

    } else if args.TaskType == "reduce" {
        if m.reduceTasks[args.TaskID].workerID == args.WorkerID &&
           m.reduceTasks[args.TaskID].state == InProgress {
            m.reduceTasks[args.TaskID].state = Completed
            reply.Success = true

            // 检查是否所有 Reduce 任务都完成了
            if m.allReduceTasksCompleted() {
                m.phase = DonePhase
            }
        } else {
            reply.Success = false
        }
    }

    return nil
}

func (m *Master) allMapTasksCompleted() bool {
    for i := 0; i < m.nMap; i++ {
        if m.mapTasks[i].state != Completed {
            return false
        }
    }
    return true
}

func (m *Master) allReduceTasksCompleted() bool {
    for i := 0; i < m.nReduce; i++ {
        if m.reduceTasks[i].state != Completed {
            return false
        }
    }
    return true
}
```

**代码解析**：
- **第 1 层（做什么）**：接收 Worker 的完成报告，更新任务状态，检查是否需要切换阶段
- **第 2 层（为什么这样做）**：
  - 必须验证 workerID，因为任务可能已经超时并重新分配给其他 Worker
  - 只有当所有 Map 任务完成时，才能进入 Reduce 阶段
  - 只有当所有 Reduce 任务完成时，才能进入 Done 阶段
- **第 3 层（核心概念）**：
  - **幂等性**：即使 Worker 重复报告，也不会出错
  - **任务状态转换**：InProgress → Completed（完成时）
  - **阶段转换**：检测到所有任务完成时自动切换阶段

### 4.4 checkTimeout 函数 - 容错机制

后台线程定期检查任务是否超时。

```go
func (m *Master) checkTimeout() {
    for {
        time.Sleep(1 * time.Second)  // 每秒检查一次

        m.mu.Lock()

        // 检查 Map 任务
        if m.phase == MapPhase {
            for i := 0; i < m.nMap; i++ {
                if m.mapTasks[i].state == InProgress {
                    // 如果任务运行超过 10 秒，认为 Worker 崩溃了
                    if time.Since(m.mapTasks[i].startTime) > 10*time.Second {
                        // 重置任务状态，让其他 Worker 可以领取
                        m.mapTasks[i].state = Idle
                    }
                }
            }
        }

        // 检查 Reduce 任务
        if m.phase == ReducePhase {
            for i := 0; i < m.nReduce; i++ {
                if m.reduceTasks[i].state == InProgress {
                    if time.Since(m.reduceTasks[i].startTime) > 10*time.Second {
                        m.reduceTasks[i].state = Idle
                    }
                }
            }
        }

        m.mu.Unlock()

        // 如果所有任务都完成了，退出循环
        if m.Done() {
            break
        }
    }
}
```

**代码解析**：
- **第 1 层（做什么）**：每秒检查一次，如果任务运行超过 10 秒，重置为 Idle 状态
- **第 2 层（为什么这样做）**：
  - Worker 可能崩溃、网络可能断开，必须有容错机制
  - 10 秒是一个合理的超时时间（Lab 要求）
  - 重置为 Idle 后，其他 Worker 可以重新领取这个任务
- **第 3 层（核心概念）**：
  - **容错性**：通过超时重试实现故障恢复
  - **任务状态转换**：InProgress → Idle（超时时）
  - **最终一致性**：即使 Worker 崩溃，任务最终也会被完成

### 4.5 Done 函数 - 检查是否完成

```go
func (m *Master) Done() bool {
    m.mu.Lock()
    defer m.mu.Unlock()

    return m.phase == DonePhase
}
```

**代码解析**：
- **第 1 层（做什么）**：返回系统是否完成
- **第 2 层（为什么这样做）**：main 函数会定期调用这个函数，当返回 true 时关闭系统
- **第 3 层（核心概念）**：**终止条件**：所有任务完成后，系统可以安全退出

## 第五部分：Worker 实现详解

### 5.1 Worker 主循环

Worker 的核心是一个无限循环：请求任务 → 执行任务 → 报告完成。

```go
func Worker(mapf func(string, string) []KeyValue,
    reducef func(string, []string) string) {

    // 生成唯一的 Worker ID
    workerID := os.Getpid()

    for {
        // 1. 向 Master 请求任务
        args := RequestTaskArgs{WorkerID: workerID}
        reply := RequestTaskReply{}
        ok := call("Master.RequestTask", &args, &reply)

        if !ok {
            // Master 可能已经退出
            break
        }

        // 2. 根据任务类型执行
        if reply.TaskType == "map" {
            doMapTask(workerID, reply.TaskID, reply.Filename, reply.NReduce, mapf)
            reportTask(workerID, "map", reply.TaskID)

        } else if reply.TaskType == "reduce" {
            doReduceTask(workerID, reply.TaskID, reply.NMap, reducef)
            reportTask(workerID, "reduce", reply.TaskID)

        } else if reply.TaskType == "wait" {
            // 没有可用任务，等待一会儿再请求
            time.Sleep(1 * time.Second)

        } else if reply.TaskType == "done" {
            // 所有任务都完成了，退出
            break
        }
    }
}
```

**代码解析**：
- **第 1 层（做什么）**：循环请求任务，根据任务类型执行 Map 或 Reduce
- **第 2 层（为什么这样做）**：
  - 使用进程 ID 作为 Worker ID，保证唯一性
  - 收到 "wait" 时睡眠 1 秒，避免频繁请求浪费资源
  - 收到 "done" 时退出，表示所有工作完成
- **第 3 层（核心概念）**：
  - **拉取模型**：Worker 主动请求任务，而不是 Master 推送任务
  - **无状态 Worker**：Worker 不保存任何状态，每次都是独立的任务
  - **容错性**：Worker 可以随时崩溃，不影响系统正确性

### 5.2 Map 任务执行

```go
func doMapTask(workerID int, taskID int, filename string, nReduce int,
    mapf func(string, string) []KeyValue) {

    // 1. 读取输入文件
    file, err := os.Open(filename)
    if err != nil {
        log.Fatalf("cannot open %v", filename)
    }
    content, err := ioutil.ReadAll(file)
    file.Close()
    if err != nil {
        log.Fatalf("cannot read %v", filename)
    }

    // 2. 调用用户提供的 Map 函数
    kva := mapf(filename, string(content))

    // 3. 创建 nReduce 个中间文件的缓冲区
    intermediate := make([][]KeyValue, nReduce)

    // 4. 根据 key 的 hash 值分配到不同的 Reduce 任务
    for _, kv := range kva {
        reduceID := ihash(kv.Key) % nReduce
        intermediate[reduceID] = append(intermediate[reduceID], kv)
    }

    // 5. 写入中间文件（使用临时文件 + 原子重命名）
    for reduceID := 0; reduceID < nReduce; reduceID++ {
        // 创建临时文件
        tempFile, err := ioutil.TempFile("", "mr-tmp-*")
        if err != nil {
            log.Fatalf("cannot create temp file")
        }

        // 写入 JSON 格式的数据
        enc := json.NewEncoder(tempFile)
        for _, kv := range intermediate[reduceID] {
            err := enc.Encode(&kv)
            if err != nil {
                log.Fatalf("cannot encode json")
            }
        }

        // 关闭临时文件
        tempFile.Close()

        // 原子重命名为最终文件名
        finalName := fmt.Sprintf("mr-%d-%d", taskID, reduceID)
        os.Rename(tempFile.Name(), finalName)
    }
}
```

**代码解析**：
- **第 1 层（做什么）**：读取输入文件，调用 Map 函数，把输出分成 nReduce 份，写入中间文件
- **第 2 层（为什么这样做）**：
  - 使用 hash 函数分配 key，保证相同的 key 总是分配到同一个 Reduce 任务
  - 使用临时文件 + 原子重命名，防止 Worker 崩溃时产生不完整的文件
  - 使用 JSON 编码，方便 Reduce 任务读取
- **第 3 层（核心概念）**：
  - **分区（Partitioning）**：根据 key 的 hash 值分配到不同的 Reduce 任务
  - **原子性**：使用 rename 保证文件要么完整存在，要么不存在
  - **容错性**：即使 Worker 在写文件时崩溃，也不会产生损坏的数据

**为什么要用临时文件 + 重命名？**

假设不用临时文件，直接写：
```go
// 错误的做法
file, _ := os.Create("mr-0-0")
// 写入一半时 Worker 崩溃了
// 文件 mr-0-0 只有一半数据，损坏了
```

使用临时文件 + 重命名：
```go
// 正确的做法
tempFile, _ := ioutil.TempFile("", "mr-tmp-*")  // 创建 /tmp/mr-tmp-12345
// 写入数据
tempFile.Close()
os.Rename("/tmp/mr-tmp-12345", "mr-0-0")  // 原子操作
// 如果 Worker 在 rename 之前崩溃，mr-0-0 不存在（没有损坏的数据）
// 如果 Worker 在 rename 之后崩溃，mr-0-0 完整存在
```

### 5.3 Reduce 任务执行

```go
func doReduceTask(workerID int, taskID int, nMap int,
    reducef func(string, []string) string) {

    // 1. 读取所有 Map 任务产生的中间文件
    var kva []KeyValue
    for mapID := 0; mapID < nMap; mapID++ {
        filename := fmt.Sprintf("mr-%d-%d", mapID, taskID)
        file, err := os.Open(filename)
        if err != nil {
            log.Fatalf("cannot open %v", filename)
        }

        // 读取 JSON 数据
        dec := json.NewDecoder(file)
        for {
            var kv KeyValue
            if err := dec.Decode(&kv); err != nil {
                break
            }
            kva = append(kva, kv)
        }
        file.Close()
    }

    // 2. 按 key 排序
    sort.Sort(ByKey(kva))

    // 3. 创建临时输出文件
    tempFile, err := ioutil.TempFile("", "mr-out-tmp-*")
    if err != nil {
        log.Fatalf("cannot create temp file")
    }

    // 4. 对每个 key 调用 Reduce 函数
    i := 0
    for i < len(kva) {
        j := i + 1
        // 找到所有相同 key 的值
        for j < len(kva) && kva[j].Key == kva[i].Key {
            j++
        }

        // 收集所有值
        values := []string{}
        for k := i; k < j; k++ {
            values = append(values, kva[k].Value)
        }

        // 调用 Reduce 函数
        output := reducef(kva[i].Key, values)

        // 写入输出文件
        fmt.Fprintf(tempFile, "%v %v\n", kva[i].Key, output)

        i = j
    }

    // 5. 原子重命名
    tempFile.Close()
    finalName := fmt.Sprintf("mr-out-%d", taskID)
    os.Rename(tempFile.Name(), finalName)
}

// 用于排序的辅助类型
type ByKey []KeyValue

func (a ByKey) Len() int           { return len(a) }
func (a ByKey) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a ByKey) Less(i, j int) bool { return a[i].Key < a[j].Key }
```

**代码解析**：
- **第 1 层（做什么）**：读取所有中间文件，排序，对每个 key 调用 Reduce 函数，写入输出文件
- **第 2 层（为什么这样做）**：
  - 必须读取所有 Map 任务的输出（nMap 个文件），因为同一个 key 可能出现在多个 Map 输出中
  - 排序后，相同的 key 会相邻，方便收集所有值
  - 同样使用临时文件 + 原子重命名保证原子性
- **第 3 层（核心概念）**：
  - **聚合（Aggregation）**：把相同 key 的所有值收集到一起
  - **排序**：MapReduce 保证 Reduce 函数按 key 的顺序处理
  - **原子性**：保证输出文件要么完整，要么不存在

**为什么要排序？**

排序后，相同的 key 会相邻：
```
排序前：[("a",1), ("b",1), ("a",1), ("c",1), ("b",1)]
排序后：[("a",1), ("a",1), ("b",1), ("b",1), ("c",1)]
```

这样可以用一个简单的循环收集相同 key 的所有值：
```go
i := 0
for i < len(kva) {
    j := i + 1
    // 找到所有相同 key 的值
    for j < len(kva) && kva[j].Key == kva[i].Key {
        j++
    }
    // 现在 kva[i:j] 都是相同的 key
    // ...
    i = j
}
```

### 5.4 报告任务完成

```go
func reportTask(workerID int, taskType string, taskID int) {
    args := ReportTaskArgs{
        WorkerID: workerID,
        TaskType: taskType,
        TaskID:   taskID,
    }
    reply := ReportTaskReply{}
    call("Master.ReportTask", &args, &reply)

    // 注意：即使 reply.Success == false 也没关系
    // 这意味着任务已经超时，被其他 Worker 完成了
    // 我们的工作没有白费，只是 Master 不需要了
}
```

**代码解析**：
- **第 1 层（做什么）**：通知 Master 任务已完成
- **第 2 层（为什么这样做）**：Master 需要知道任务完成，才能切换阶段或分配新任务
- **第 3 层（核心概念）**：
  - **幂等性**：即使报告失败，也不影响正确性（Master 会通过超时检测到）
  - **容错性**：即使这个 Worker 的工作被丢弃，其他 Worker 会重新完成任务

## 第六部分：常见错误和调试技巧

### 6.1 竞态条件（Race Condition）

**错误现象**：运行 `go test -race` 时报错

**常见原因**：
1. 忘记加锁就访问共享变量
2. 在持有锁的情况下调用 RPC（可能死锁）

**错误示例**：
```go
// 错误：没有加锁
func (m *Master) RequestTask(args *RequestTaskArgs, reply *RequestTaskReply) error {
    // 直接访问 m.mapTasks，多个 Worker 同时调用会出错
    if m.mapTasks[0].state == Idle {
        m.mapTasks[0].state = InProgress  // 竞态条件！
    }
    return nil
}
```

**正确示例**：
```go
// 正确：加锁保护
func (m *Master) RequestTask(args *RequestTaskArgs, reply *RequestTaskReply) error {
    m.mu.Lock()
    defer m.mu.Unlock()

    if m.mapTasks[0].state == Idle {
        m.mapTasks[0].state = InProgress  // 安全
    }
    return nil
}
```

**调试技巧**：
- 始终使用 `go test -race` 运行测试
- 所有访问共享变量的地方都要加锁
- 使用 `defer m.mu.Unlock()` 确保锁一定会被释放

### 6.2 文件损坏问题

**错误现象**：测试失败，输出文件内容不完整或损坏

**常见原因**：Worker 在写文件时崩溃，产生了不完整的文件

**错误示例**：
```go
// 错误：直接写文件
file, _ := os.Create("mr-0-0")
enc := json.NewEncoder(file)
for _, kv := range data {
    enc.Encode(&kv)
    // 如果这里崩溃，文件只写了一半
}
file.Close()
```

**正确示例**：
```go
// 正确：使用临时文件 + 原子重命名
tempFile, _ := ioutil.TempFile("", "mr-tmp-*")
enc := json.NewEncoder(tempFile)
for _, kv := range data {
    enc.Encode(&kv)
}
tempFile.Close()
os.Rename(tempFile.Name(), "mr-0-0")  // 原子操作
```

### 6.3 阶段转换错误

**错误现象**：Reduce 任务开始执行时，Map 任务还没全部完成

**常见原因**：没有正确检查所有 Map 任务是否完成

**错误示例**：
```go
// 错误：只检查了一个任务
func (m *Master) ReportTask(args *ReportTaskArgs, reply *ReportTaskReply) error {
    m.mu.Lock()
    defer m.mu.Unlock()

    if args.TaskType == "map" {
        m.mapTasks[args.TaskID].state = Completed
        // 错误：没有检查所有任务
        m.phase = ReducePhase
    }
    return nil
}
```

**正确示例**：
```go
// 正确：检查所有任务
func (m *Master) ReportTask(args *ReportTaskArgs, reply *ReportTaskReply) error {
    m.mu.Lock()
    defer m.mu.Unlock()

    if args.TaskType == "map" {
        m.mapTasks[args.TaskID].state = Completed

        // 检查是否所有 Map 任务都完成了
        allDone := true
        for i := 0; i < m.nMap; i++ {
            if m.mapTasks[i].state != Completed {
                allDone = false
                break
            }
        }

        if allDone {
            m.phase = ReducePhase
        }
    }
    return nil
}
```

### 6.4 超时检测不工作

**错误现象**：Worker 崩溃后，任务永远不会被重新分配

**常见原因**：
1. 没有启动 checkTimeout 后台线程
2. 没有记录任务开始时间
3. 超时时间设置错误

**正确实现**：
```go
// 在 MakeMaster 中启动后台线程
func MakeMaster(files []string, nReduce int) *Master {
    m := Master{}
    // ... 初始化 ...
    go m.checkTimeout()  // 必须启动
    return &m
}

// 分配任务时记录开始时间
func (m *Master) RequestTask(args *RequestTaskArgs, reply *RequestTaskReply) error {
    m.mu.Lock()
    defer m.mu.Unlock()

    for i := 0; i < m.nMap; i++ {
        if m.mapTasks[i].state == Idle {
            m.mapTasks[i].state = InProgress
            m.mapTasks[i].startTime = time.Now()  // 必须记录
            // ...
        }
    }
    return nil
}
```

### 6.5 Worker ID 冲突

**错误现象**：多个 Worker 使用了相同的 ID，导致任务被错误地拒绝

**常见原因**：使用了不唯一的 ID（比如固定值）

**错误示例**：
```go
// 错误：所有 Worker 都使用 ID = 1
func Worker(mapf, reducef) {
    workerID := 1  // 错误！
    // ...
}
```

**正确示例**：
```go
// 正确：使用进程 ID
func Worker(mapf, reducef) {
    workerID := os.Getpid()  // 每个进程的 PID 都不同
    // ...
}
```

### 6.6 中间文件命名错误

**错误现象**：Reduce 任务找不到中间文件

**常见原因**：Map 和 Reduce 使用了不同的文件命名规则

**正确实现**：
```go
// Map 任务写文件
finalName := fmt.Sprintf("mr-%d-%d", mapTaskID, reduceID)

// Reduce 任务读文件
for mapID := 0; mapID < nMap; mapID++ {
    filename := fmt.Sprintf("mr-%d-%d", mapID, reduceTaskID)
    // 必须匹配！
}
```

## 第七部分：测试和验证

### 7.1 运行测试

```bash
cd labs/src/main

# 基本测试
bash test-mr.sh

# 带竞态检测的测试（推荐）
bash test-mr.sh -race

# 压力测试（运行多次）
for i in {1..10}; do
    bash test-mr.sh
done
```

### 7.2 测试内容

Lab 1 的测试包括：

1. **wc 测试**：词频统计
   - 测试基本的 Map 和 Reduce 功能
   - 验证输出文件格式正确

2. **indexer 测试**：倒排索引
   - 测试更复杂的 Map 和 Reduce 逻辑
   - 验证排序是否正确

3. **crash 测试**：容错性
   - 模拟 Worker 崩溃
   - 验证任务是否被重新分配
   - 验证最终结果是否正确

4. **并行测试**：性能
   - 验证多个 Worker 可以并行工作
   - 验证没有不必要的等待

### 7.3 调试技巧

**1. 添加日志**
```go
// 在关键位置添加日志
log.Printf("[Master] Assigned map task %d to worker %d\n", taskID, workerID)
log.Printf("[Worker %d] Completed map task %d\n", workerID, taskID)
```

**2. 检查中间文件**
```bash
# 查看生成的中间文件
ls -la mr-*

# 查看中间文件内容
cat mr-0-0
```

**3. 使用 race detector**
```bash
# 始终使用 -race 标志
go test -race
```

**4. 单独测试某个功能**
```bash
# 只运行 wc 测试
go test -run TestBasicMapReduce
```

### 7.4 性能优化（可选）

如果你的实现通过了所有测试，可以考虑以下优化：

1. **减少锁的持有时间**
```go
// 不好：在锁内做耗时操作
m.mu.Lock()
// 做很多计算...
m.mu.Unlock()

// 好：只在必要时持有锁
m.mu.Lock()
task := m.getNextTask()
m.mu.Unlock()
// 在锁外做计算
```

2. **批量处理**
```go
// 可以一次读取多个中间文件，减少系统调用
```

3. **使用缓冲 I/O**
```go
// 使用 bufio 提高文件读写性能
writer := bufio.NewWriter(file)
```

但是注意：**不要过早优化**。先确保正确性，再考虑性能。

## 第八部分：实现步骤建议

### 8.1 第一步：定义 RPC 接口（rpc.go）

```go
// 1. 定义请求任务的 RPC
type RequestTaskArgs struct {
    WorkerID int
}

type RequestTaskReply struct {
    TaskType string  // "map", "reduce", "wait", "done"
    TaskID   int
    Filename string  // for map task
    NReduce  int     // for map task
    NMap     int     // for reduce task
}

// 2. 定义报告任务完成的 RPC
type ReportTaskArgs struct {
    WorkerID int
    TaskType string
    TaskID   int
}

type ReportTaskReply struct {
    Success bool
}
```

### 8.2 第二步：实现 Master 数据结构（master.go）

```go
type Master struct {
    mu          sync.Mutex
    mapTasks    []Task
    reduceTasks []Task
    phase       Phase
    nReduce     int
    nMap        int
}

type Task struct {
    id        int
    state     TaskState
    filename  string     // for map task
    workerID  int
    startTime time.Time
}

type TaskState int
const (
    Idle       TaskState = 0
    InProgress TaskState = 1
    Completed  TaskState = 2
)

type Phase int
const (
    MapPhase    Phase = 0
    ReducePhase Phase = 1
    DonePhase   Phase = 2
)
```

### 8.3 第三步：实现 MakeMaster

初始化所有状态，启动 RPC 服务器和超时检测线程。

### 8.4 第四步：实现 RequestTask RPC 处理器

根据当前阶段分配任务，更新任务状态。

### 8.5 第五步：实现 ReportTask RPC 处理器

接收完成报告，检查是否需要切换阶段。

### 8.6 第六步：实现 checkTimeout

后台线程定期检查超时任务。

### 8.7 第七步：实现 Worker 主循环

请求任务 → 执行任务 → 报告完成。

### 8.8 第八步：实现 doMapTask

读取文件 → 调用 Map 函数 → 分区 → 写入中间文件。

### 8.9 第九步：实现 doReduceTask

读取中间文件 → 排序 → 调用 Reduce 函数 → 写入输出文件。

### 8.10 第十步：测试和调试

运行测试，修复 bug，直到所有测试通过。

## 总结

Lab 1 的核心是理解 MapReduce 的工作原理，并实现一个简化版的系统。关键点包括：

1. **分而治之**：把大任务分成小任务，并行处理
2. **容错性**：通过超时重试处理 Worker 崩溃
3. **原子性**：使用临时文件 + 重命名保证文件完整性
4. **并发控制**：使用锁保护共享状态
5. **阶段依赖**：Map 阶段必须完全完成后才能开始 Reduce

完成这个 Lab 后，你将深刻理解分布式系统的基本概念，为后续的 Raft 和 KVRaft 打下坚实基础。

