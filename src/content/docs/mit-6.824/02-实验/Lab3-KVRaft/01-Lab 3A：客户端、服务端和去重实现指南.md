---
title: 'Lab 3A：客户端、服务端和去重实现指南'
description: '---'
order: 1
source: 'mit-6.824'
sourceTitle: 'MIT 6.824 学习笔记'
section: 'labs'
sectionTitle: '实验'
subsection: 'lab3'
subsectionTitle: 'Lab 3 · KVRaft'
language: 'zh'
tags: ['docs', 'mit-6.824', 'labs', 'lab3']
---
## 第一步：修改 common.go，添加去重字段

```go
// Put or Append
type PutAppendArgs struct {
    Key      string
    Value    string
    Op       string  // "Put" or "Append"
    ClientID int64   // 客户端唯一 ID
    SeqNum   int     // 请求序号（单调递增）
}

type GetArgs struct {
    Key      string
    ClientID int64
    SeqNum   int
}
```

---

## 第二步：实现 client.go（Clerk）

```go
type Clerk struct {
    servers  []*labrpc.ClientEnd
    leader   int    // 上次成功的 Leader 索引（缓存，避免每次都从头找）
    clientID int64  // 唯一客户端 ID
    seqNum   int    // 递增的请求序号
}

func MakeClerk(servers []*labrpc.ClientEnd) *Clerk {
    ck := new(Clerk)
    ck.servers = servers
    ck.leader = 0
    ck.clientID = nrand()  // 随机生成唯一 ID
    ck.seqNum = 0
    return ck
}

func (ck *Clerk) Get(key string) string {
    ck.seqNum++
    args := GetArgs{
        Key:      key,
        ClientID: ck.clientID,
        SeqNum:   ck.seqNum,
    }

    for {
        reply := GetReply{}
        ok := ck.servers[ck.leader].Call("KVServer.Get", &args, &reply)
        if ok && reply.Err != ErrWrongLeader {
            if reply.Err == ErrNoKey {
                return ""
            }
            return reply.Value
        }
        // 换一个服务器重试
        ck.leader = (ck.leader + 1) % len(ck.servers)
    }
}

func (ck *Clerk) PutAppend(key string, value string, op string) {
    ck.seqNum++
    args := PutAppendArgs{
        Key:      key,
        Value:    value,
        Op:       op,
        ClientID: ck.clientID,
        SeqNum:   ck.seqNum,
    }

    for {
        reply := PutAppendReply{}
        ok := ck.servers[ck.leader].Call("KVServer.PutAppend", &args, &reply)
        if ok && reply.Err != ErrWrongLeader {
            return
        }
        ck.leader = (ck.leader + 1) % len(ck.servers)
    }
}
```

---

## 第三步：实现 server.go 的数据结构

```go
type Op struct {
    Type     string  // "Get", "Put", "Append"
    Key      string
    Value    string
    ClientID int64
    SeqNum   int
}

type OpResult struct {
    Value string
    Err   Err
}

type KVServer struct {
    mu      sync.Mutex
    me      int
    rf      *raft.Raft
    applyCh chan raft.ApplyMsg
    dead    int32

    maxraftstate int

    data       map[string]string    // KV 存储
    lastSeq    map[int64]int        // clientID -> 最后处理的 seqNum
    lastResult map[int64]OpResult   // clientID -> 最后操作的结果
    waitCh     map[int]chan OpResult // index -> 等待通知的 channel
}
```

---

## 第四步：实现 apply 线程

```go
func (kv *KVServer) applyLoop() {
    for !kv.killed() {
        msg := <-kv.applyCh

        if !msg.CommandValid {
            // 快照消息（3B 里处理）
            continue
        }

        op := msg.Command.(Op)

        kv.mu.Lock()

        var result OpResult

        // 检查是否是重复请求
        if lastSeq, ok := kv.lastSeq[op.ClientID]; ok && op.SeqNum <= lastSeq {
            // 重复请求，返回之前的结果
            result = kv.lastResult[op.ClientID]
        } else {
            // 执行操作
            switch op.Type {
            case "Get":
                if val, ok := kv.data[op.Key]; ok {
                    result = OpResult{Value: val, Err: OK}
                } else {
                    result = OpResult{Value: "", Err: ErrNoKey}
                }
            case "Put":
                kv.data[op.Key] = op.Value
                result = OpResult{Err: OK}
            case "Append":
                kv.data[op.Key] += op.Value
                result = OpResult{Err: OK}
            }
            // 记录结果，用于去重
            kv.lastSeq[op.ClientID] = op.SeqNum
            kv.lastResult[op.ClientID] = result
        }

        // 通知等待的 RPC 处理函数
        if ch, ok := kv.waitCh[msg.CommandIndex]; ok {
            ch <- result
        }

        kv.mu.Unlock()
    }
}
```

---

## 第五步：实现 RPC 处理函数

```go
func (kv *KVServer) Get(args *GetArgs, reply *GetReply) {
    op := Op{
        Type:     "Get",
        Key:      args.Key,
        ClientID: args.ClientID,
        SeqNum:   args.SeqNum,
    }

    index, _, isLeader := kv.rf.Start(op)
    if !isLeader {
        reply.Err = ErrWrongLeader
        return
    }

    // 创建等待 channel
    ch := make(chan OpResult, 1)
    kv.mu.Lock()
    kv.waitCh[index] = ch
    kv.mu.Unlock()

    // 等待操作完成（超时 500ms）
    select {
    case result := <-ch:
        reply.Err = result.Err
        reply.Value = result.Value
    case <-time.After(500 * time.Millisecond):
        reply.Err = ErrWrongLeader  // 超时，让客户端重试
    }

    // 清理 channel
    kv.mu.Lock()
    delete(kv.waitCh, index)
    kv.mu.Unlock()
}

func (kv *KVServer) PutAppend(args *PutAppendArgs, reply *PutAppendReply) {
    op := Op{
        Type:     args.Op,
        Key:      args.Key,
        Value:    args.Value,
        ClientID: args.ClientID,
        SeqNum:   args.SeqNum,
    }

    index, _, isLeader := kv.rf.Start(op)
    if !isLeader {
        reply.Err = ErrWrongLeader
        return
    }

    ch := make(chan OpResult, 1)
    kv.mu.Lock()
    kv.waitCh[index] = ch
    kv.mu.Unlock()

    select {
    case result := <-ch:
        reply.Err = result.Err
    case <-time.After(500 * time.Millisecond):
        reply.Err = ErrWrongLeader
    }

    kv.mu.Lock()
    delete(kv.waitCh, index)
    kv.mu.Unlock()
}
```

---

## 第六步：初始化

```go
func StartKVServer(servers []*labrpc.ClientEnd, me int, persister *raft.Persister, maxraftstate int) *KVServer {
    labgob.Register(Op{})

    kv := new(KVServer)
    kv.me = me
    kv.maxraftstate = maxraftstate
    kv.data = make(map[string]string)
    kv.lastSeq = make(map[int64]int)
    kv.lastResult = make(map[int64]OpResult)
    kv.waitCh = make(map[int]chan OpResult)

    kv.applyCh = make(chan raft.ApplyMsg)
    kv.rf = raft.Make(servers, me, persister, kv.applyCh)

    go kv.applyLoop()

    return kv
}
```

---

## 常见错误

**错误 1：等待 channel 时持有锁**

`select` 等待 channel 时不能持有锁，否则 apply 线程无法获取锁，死锁。

**错误 2：channel 没有缓冲**

如果 channel 没有缓冲（`make(chan OpResult)`），apply 线程发送时可能阻塞（如果 RPC 处理函数已经超时退出了）。用带缓冲的 channel（`make(chan OpResult, 1)`）。

**错误 3：Leader 变更后没有通知等待的 RPC**

如果 Leader 变更，之前提交的操作可能不会出现在 `applyCh` 里（或者出现在不同的 index）。超时机制可以处理这种情况。

