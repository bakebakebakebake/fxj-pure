---
title: 'Lab 1 Worker 实现指南'
description: '这篇文档带你一步步实现 `worker.go`。'
order: 3
source: 'mit-6.824'
sourceTitle: 'MIT 6.824 学习笔记'
section: 'labs'
sectionTitle: '实验'
subsection: 'lab1'
subsectionTitle: 'Lab 1 · MapReduce'
language: 'zh'
tags: ['docs', 'mit-6.824', 'labs', 'lab1']
---
## Worker 的主循环

Worker 的逻辑很简单：不断向 Master 请求任务，执行，报告完成，重复。

```go
func Worker(mapf func(string, string) []KeyValue,
    reducef func(string, []string) string) {

    for {
        reply, ok := callGetTask()
        if !ok {
            // Master 不可达，退出
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

## 实现 Map 任务

Map 任务的步骤：
1. 读取输入文件
2. 调用用户提供的 `mapf` 函数，得到键值对列表
3. 按 key 的哈希值分桶，写入中间文件
4. 报告完成

```go
func doMap(mapf func(string, string) []KeyValue, reply *GetTaskReply) {
    // 1. 读取输入文件
    file, err := os.Open(reply.InputFile)
    if err != nil {
        log.Fatalf("无法打开文件 %v", reply.InputFile)
    }
    content, err := ioutil.ReadAll(file)
    file.Close()
    if err != nil {
        log.Fatalf("无法读取文件 %v", reply.InputFile)
    }

    // 2. 调用 mapf，得到键值对
    kva := mapf(reply.InputFile, string(content))

    // 3. 按 key 分桶
    buckets := make([][]KeyValue, reply.NReduce)
    for _, kv := range kva {
        bucket := ihash(kv.Key) % reply.NReduce
        buckets[bucket] = append(buckets[bucket], kv)
    }

    // 4. 写入中间文件（原子写入）
    for i, bucket := range buckets {
        writeIntermediateFile(reply.TaskID, i, bucket)
    }

    // 5. 报告完成
    callReportTask("map", reply.TaskID)
}
```

**写中间文件的函数**：

```go
func writeIntermediateFile(mapID, reduceID int, kva []KeyValue) {
    filename := fmt.Sprintf("mr-%d-%d", mapID, reduceID)

    // 先写临时文件
    tmpFile, err := ioutil.TempFile("", "mr-tmp-*")
    if err != nil {
        log.Fatal("无法创建临时文件:", err)
    }

    // 用 JSON 格式写入
    enc := json.NewEncoder(tmpFile)
    for _, kv := range kva {
        enc.Encode(kv)
    }
    tmpFile.Close()

    // 原子重命名
    os.Rename(tmpFile.Name(), filename)
}
```

---

## 实现 Reduce 任务

Reduce 任务的步骤：
1. 读取所有对应的中间文件（mr-*-Y，Y 是 Reduce 任务号）
2. 按 key 排序
3. 对每个 key，调用用户提供的 `reducef` 函数
4. 写入输出文件
5. 报告完成

```go
func doReduce(reducef func(string, []string) string, reply *GetTaskReply) {
    // 1. 读取所有中间文件
    var kva []KeyValue
    for i := 0; i < reply.NMap; i++ {
        filename := fmt.Sprintf("mr-%d-%d", i, reply.TaskID)
        file, err := os.Open(filename)
        if err != nil {
            // 文件可能不存在（如果对应的 Map 任务没有输出这个分区）
            continue
        }
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
    sort.Slice(kva, func(i, j int) bool {
        return kva[i].Key < kva[j].Key
    })

    // 3. 写输出文件（原子写入）
    tmpFile, _ := ioutil.TempFile("", "mr-out-tmp-*")
    outFilename := fmt.Sprintf("mr-out-%d", reply.TaskID)

    // 4. 对每个 key 调用 reducef
    i := 0
    for i < len(kva) {
        j := i + 1
        // 找到所有相同 key 的条目
        for j < len(kva) && kva[j].Key == kva[i].Key {
            j++
        }
        // 收集这个 key 的所有 value
        var values []string
        for k := i; k < j; k++ {
            values = append(values, kva[k].Value)
        }
        // 调用 reducef
        output := reducef(kva[i].Key, values)
        fmt.Fprintf(tmpFile, "%v %v\n", kva[i].Key, output)
        i = j
    }

    tmpFile.Close()
    os.Rename(tmpFile.Name(), outFilename)

    // 5. 报告完成
    callReportTask("reduce", reply.TaskID)
}
```

---

## 实现 RPC 调用函数

```go
func callGetTask() (*GetTaskReply, bool) {
    args := GetTaskArgs{}
    reply := GetTaskReply{}
    ok := call("Master.GetTask", &args, &reply)
    return &reply, ok
}

func callReportTask(taskType string, taskID int) {
    args := ReportTaskArgs{
        TaskType: taskType,
        TaskID:   taskID,
    }
    reply := ReportTaskReply{}
    call("Master.ReportTask", &args, &reply)
    // 忽略返回值，即使报告失败也没关系（Master 会超时重新分配）
}
```

---

## 需要的 import

```go
import (
    "encoding/json"
    "fmt"
    "hash/fnv"
    "io/ioutil"
    "log"
    "net/rpc"
    "os"
    "sort"
    "time"
)
```

---

## 常见错误

**错误 1：不用原子写入**

如果直接写目标文件，Worker 崩溃时会留下损坏的文件。其他 Worker 读到损坏的文件会出错。

**错误 2：Reduce 任务读文件时，文件不存在就 Fatal**

某些 Map 任务可能没有输出某个分区的数据（比如没有 key 哈希到这个分区），对应的中间文件就不存在。这是正常情况，应该跳过，不应该 Fatal。

**错误 3：忘记排序**

Reduce 函数期望相同 key 的所有 value 一起传入。如果不排序，相同 key 的条目可能分散在不同位置，导致结果错误。

