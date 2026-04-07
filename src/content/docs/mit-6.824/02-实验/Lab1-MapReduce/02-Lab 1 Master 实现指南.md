---
title: 'Lab 1 Master 实现指南'
description: '这篇文档带你一步步实现 `master.go`。'
order: 2
source: 'mit-6.824'
sourceTitle: 'MIT 6.824 学习笔记'
section: 'labs'
sectionTitle: '实验'
subsection: 'lab1'
subsectionTitle: 'Lab 1 · MapReduce'
language: 'zh'
tags: ['docs', 'mit-6.824', 'labs', 'lab1']
---
## 第一步：定义数据结构

在 `master.go` 里，先定义 Master 的状态：

```go
package mr

import (
    "log"
    "net"
    "net/http"
    "net/rpc"
    "os"
    "sync"
    "time"
)

type TaskStatus int

const (
    Idle    TaskStatus = 0
    Running TaskStatus = 1
    Done    TaskStatus = 2
)

type MapTask struct {
    ID        int
    InputFile string
    Status    TaskStatus
    StartTime time.Time
}

type ReduceTask struct {
    ID        int
    Status    TaskStatus
    StartTime time.Time
}

type Master struct {
    mu          sync.Mutex
    mapTasks    []MapTask
    reduceTasks []ReduceTask
    nReduce     int
    mapDone     int  // 已完成的 Map 任务数
    reduceDone  int  // 已完成的 Reduce 任务数
}
```

---

## 第二步：实现 MakeMaster

`MakeMaster` 是 Master 的构造函数，在 `mrmaster.go` 里被调用：

```go
func MakeMaster(files []string, nReduce int) *Master {
    m := Master{}
    m.nReduce = nReduce

    // 为每个输入文件创建一个 Map 任务
    for i, file := range files {
        m.mapTasks = append(m.mapTasks, MapTask{
            ID:        i,
            InputFile: file,
            Status:    Idle,
        })
    }

    // 创建 Reduce 任务
    for i := 0; i < nReduce; i++ {
        m.reduceTasks = append(m.reduceTasks, ReduceTask{
            ID:     i,
            Status: Idle,
        })
    }

    // 启动 RPC 服务器
    m.server()

    // 启动超时检测 goroutine
    go m.timeoutChecker()

    return &m
}
```

---

## 第三步：实现任务分配 RPC

Worker 会调用这个 RPC 来请求任务：

```go
func (m *Master) GetTask(args *GetTaskArgs, reply *GetTaskReply) error {
    m.mu.Lock()
    defer m.mu.Unlock()

    // 先分配 Map 任务
    for i := range m.mapTasks {
        if m.mapTasks[i].Status == Idle {
            m.mapTasks[i].Status = Running
            m.mapTasks[i].StartTime = time.Now()
            reply.TaskType = "map"
            reply.TaskID = m.mapTasks[i].ID
            reply.InputFile = m.mapTasks[i].InputFile
            reply.NReduce = m.nReduce
            return nil
        }
    }

    // 如果 Map 还没全部完成，让 Worker 等待
    if m.mapDone < len(m.mapTasks) {
        reply.TaskType = "wait"
        return nil
    }

    // Map 全部完成，分配 Reduce 任务
    for i := range m.reduceTasks {
        if m.reduceTasks[i].Status == Idle {
            m.reduceTasks[i].Status = Running
            m.reduceTasks[i].StartTime = time.Now()
            reply.TaskType = "reduce"
            reply.TaskID = m.reduceTasks[i].ID
            reply.NMap = len(m.mapTasks)
            return nil
        }
    }

    // 如果 Reduce 还没全部完成，让 Worker 等待
    if m.reduceDone < len(m.reduceTasks) {
        reply.TaskType = "wait"
        return nil
    }

    // 全部完成，让 Worker 退出
    reply.TaskType = "exit"
    return nil
}
```

---

## 第四步：实现任务完成报告 RPC

Worker 完成任务后调用这个 RPC：

```go
func (m *Master) ReportTask(args *ReportTaskArgs, reply *ReportTaskReply) error {
    m.mu.Lock()
    defer m.mu.Unlock()

    if args.TaskType == "map" {
        if m.mapTasks[args.TaskID].Status == Running {
            m.mapTasks[args.TaskID].Status = Done
            m.mapDone++
        }
        // 如果状态不是 Running（比如已经超时被重置了），忽略这个报告
    } else if args.TaskType == "reduce" {
        if m.reduceTasks[args.TaskID].Status == Running {
            m.reduceTasks[args.TaskID].Status = Done
            m.reduceDone++
        }
    }

    return nil
}
```

**为什么要检查 `Status == Running`**：如果一个任务超时了，Master 会把它重置为 Idle 并重新分配。如果原来的 Worker 后来完成了任务并来报告，我们应该忽略这个报告（因为任务已经被另一个 Worker 重新执行了）。

---

## 第五步：实现超时检测

```go
func (m *Master) timeoutChecker() {
    for {
        time.Sleep(time.Second)
        m.mu.Lock()

        // 检查 Map 任务超时
        for i := range m.mapTasks {
            if m.mapTasks[i].Status == Running &&
                time.Since(m.mapTasks[i].StartTime) > 10*time.Second {
                log.Printf("Map 任务 %d 超时，重新分配", m.mapTasks[i].ID)
                m.mapTasks[i].Status = Idle
            }
        }

        // 检查 Reduce 任务超时
        for i := range m.reduceTasks {
            if m.reduceTasks[i].Status == Running &&
                time.Since(m.reduceTasks[i].StartTime) > 10*time.Second {
                log.Printf("Reduce 任务 %d 超时，重新分配", m.reduceTasks[i].ID)
                m.reduceTasks[i].Status = Idle
            }
        }

        m.mu.Unlock()
    }
}
```

---

## 第六步：实现 Done()

测试框架会调用 `Done()` 来判断 Master 是否可以退出：

```go
func (m *Master) Done() bool {
    m.mu.Lock()
    defer m.mu.Unlock()
    return m.reduceDone == len(m.reduceTasks)
}
```

---

## 完整的 server() 函数

这个函数已经在框架里了，你不需要改，但要理解它：

```go
func (m *Master) server() {
    rpc.Register(m)
    rpc.HandleHTTP()
    sockname := masterSock()
    os.Remove(sockname)
    l, e := net.Listen("unix", sockname)
    if e != nil {
        log.Fatal("listen error:", e)
    }
    go http.Serve(l, nil)
}
```

---

## 常见错误

**错误 1：忘记在 ReportTask 里检查任务状态**

如果不检查 `Status == Running`，一个超时后被重新分配的任务，原来的 Worker 完成后来报告，会导致 `mapDone` 计数错误。

**错误 2：在 GetTask 里忘记处理"Map 还没全部完成"的情况**

如果所有 Map 任务都在 Running 状态（没有 Idle 的），但还没全部完成，应该返回 "wait"，而不是直接分配 Reduce 任务。

**错误 3：忘记启动超时检测 goroutine**

没有超时检测，crash 测试会失败（Worker 崩溃后任务永远不会被重新分配）。

