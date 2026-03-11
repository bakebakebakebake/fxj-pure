---
title: "Why Redis Fits Caching: Data Structures, Thread Model, and Persistence"
description: Based on original Redis notes and Apple Notes, covering cache positioning, data structures, thread model, and persistence fundamentals.
publishDate: 2025-05-08
tags:
  - Interview Prep
  - Redis
  - Cache
  - Data Structures
  - Persistence
language: English
draft: false
comment: true
heroImageSrc: ../../../pic/nenad-kaevik-eDNfp_tpdFo-unsplash.jpg
heroImageColor: "#979996"
---

> [!note] Note
> This article is based on the original `Redis Summary` and `Redis Common Interview Questions` from Apple Notes, covering the main topics: why Redis is used for caching, data structures, thread model, and persistence.

## Covered Content

- High-frequency questions from `Redis Summary`
- Notes on cache positioning, data structures, thread model, and persistence from `Redis Common Interview Questions`

## Redis Knowledge Overview

### Knowledge Points

**Summarized using mind maps**

Niuke Xiaoyue: High-frequency questions:

- What are Redis data types? Application scenarios?
- Do you understand the underlying data structures of Redis data types?
- Why does ZSet use SkipList? What is SkipList?
- How does Redis implement distributed locks?
- What problems exist with distributed locks implemented using SetNx?
- What data structure does Redisson distributed lock use?
- What are the benefits of Redisson distributed locks?
- Can you explain how to implement reentrancy?
- Do you understand the watchdog mechanism for timeout renewal?
- What are the problems with Redisson distributed locks? How to solve them?
- Introduce Redis persistence methods (RDB, AOF, hybrid persistence)? Pros and cons?
- What are Redis memory eviction strategies?
- What are cache penetration/breakdown/avalanche? How to solve each?
- What is the hot key problem? Impact? Solutions?
- What is the big key problem? Impact? Solutions?
- Do you understand Redis high availability? Master-slave? Sentinel? Redis cluster?
- Besides the official solutions, do you know other Redis high availability solutions?
- Do you understand the principle of master-slave data synchronization?
- Is Redis AP or CP?
- Does Redis support transactions?
- Does Redis support transaction rollback?

## Why Everyone Loves Putting Redis in Front of MySQL

The Apple Notes section is very direct: Redis is often used as a MySQL cache because it simultaneously provides **high performance** and **high concurrency**.

- MySQL's main storage is on disk. Even with Buffer Pool, the average cost of random reads and writes is significantly higher than memory.
- Redis puts hot data directly in memory, with short read paths and QPS far exceeding MySQL.
- So many read requests shouldn't go all the way to the database but should be blocked by Redis first.

Don't answer this interview question as "Redis is fast, so use Redis." A more solid answer is:

- Redis is suitable for handling **hot reads**, **temporary state**, **counters**, **leaderboards**, **short-term session information**;
- MySQL is responsible for true persistent primary storage;
- When the two work together, the database handles fallback and eventual consistency, no longer directly bearing all high-frequency reads.

### Differences Between Redis and Memcached

This is also a high-frequency point from Apple Notes:

Similarities:

- Both are memory-based databases;
- Both can be used for caching;
- Both support expiration;
- Both have high performance.

Differences:

- Memcached is basically pure `key-value`; Redis has much richer data structures.
- Memcached doesn't have Redis's relatively complete persistence mechanism.
- Memcached lacks Redis's native clustering, pub/sub, Lua, transactions, and other capabilities.
- Redis is more like an "in-memory data structure server" rather than just a cache box.

## Redis Data Types and Use Cases

> [!note]- Let's look at the most common data types and scenarios together
> 
> | Type | Common Scenarios |
> | --- | --- |
> | `String` | Cache objects, counters, distributed locks, shared sessions |
> | `Hash` | Cache objects, shopping carts, user info with field-level reads |
> | `List` | Simple message queues, timelines, deques |
> | `Set` | Deduplication, likes, mutual follows, lottery |
> | `ZSet` | Leaderboards, weighted sorting, delayed queues |
> | `Bitmap` | Check-ins, login status, binary state statistics |
> | `HyperLogLog` | UV, massive deduplication counting |
> | `GEO` | Geographic location retrieval |
> | `Stream` | More complete message queue semantics |

### What Are These Types Underneath

#### String

Both the original notes and Apple Notes mention `SDS`:

- Binary-safe, not just for text;
- Getting length is $O(1)$ because of the `len` field;
- Checks space before concatenation, avoiding buffer overflow like C strings.

#### List

- Old materials often mention doubly linked lists / compressed lists;
- Now it's better to remember the `quicklist + listpack` approach.

You don't need to memorize version details for interviews, but you should know: Redis switches between different implementations for "small and compact" vs "large and frequently changing" scenarios, not using hash tables for everything.

#### Hash

- Small objects are stored compactly;
- Larger ones switch to actual hash table structures.

So it's well-suited for caching objects, especially scenarios where "only a few fields of an object are updated."

#### Set

- When all elements are integers and the scale is small, it uses integer sets;
- Otherwise, it uses hash tables.

#### ZSet

This part is often questioned: why is "skip list" often mentioned for the underlying implementation?

Because ZSet's core requirement is two things happening simultaneously:

- Fast lookup by member;
- Ordered traversal and range queries by `score`.

So typically:

- Hash table is used for member-to-score mapping;
- Skip list is used for sorting by score and range operations.

### Which Structures Most Commonly Appear in Business

- `String`: Cache detail pages, verification codes, counters.
- `Hash`: User profiles, shopping carts.
- `Set`: Deduplication relationships.
- `ZSet`: Leaderboards, delayed tasks.
- `Bitmap`: Check-in statistics.
- `HyperLogLog`: UV.

## Why Is Redis So Fast with Single Threading

This question is easy to answer incorrectly. Apple Notes specifically emphasizes:

> Redis's "single-threaded" mainly refers to the main command path from receiving requests to executing commands and returning results being single-threaded.

It doesn't mean the entire process has only one thread.

### Redis's Actual Thread Model

- Main thread: event loop, network I/O, command execution.
- Background threads (BIO): handle time-consuming tasks like closing files, AOF flushing, lazy memory freeing.
- After Redis 6: Can also enable I/O threads to share network send/receive pressure, but **command execution is still single-threaded**.

> [!tip] The most solid way to answer this question
> 
> Don't directly say "Redis is single-threaded." A more accurate statement is: The command execution model is primarily single-threaded, avoiding lock contention; but background tasks and network I/O after Redis 6 are not completely single-threaded.

### Why It's Fast

Following the order in the notes makes this smooth:

- Most operations complete in memory;
- Data structures specifically designed for high-frequency reads/writes;
- Single-threaded command execution saves massive lock contention and thread switching;
- Uses `epoll` I/O multiplexing, allowing one thread to monitor many connections.

So Redis's bottleneck is often not CPU, but:

- Memory;
- Network bandwidth;
- Big keys / hot keys;
- Slow commands and unreasonable data structures.

### Why Did Redis 6 Introduce I/O Threads

Not because "single-threading doesn't work anymore," but because network I/O can sometimes become the bottleneck first.

So what Redis 6 does is:

- Let multiple I/O threads share network read/write;
- Actual command execution still goes to the main thread.

In other words, it optimizes "packet send/receive," not changing the command execution model to multi-threaded concurrent execution.

## Persistence: Redis Isn't Just a Cache That Loses Data on Power Loss

### RDB

RDB is snapshots:

- At a certain point in time, dump all data in memory into a snapshot file;
- Fast recovery;
- Files are usually more compact;
- But if it crashes between two snapshots, data in that window is lost.

### AOF

AOF appends write commands to a log.

Apple Notes emphasizes: Redis's AOF **records logs after executing commands**.

Advantages:

- Saves an extra step of command validity checking;
- Current command execution path is more direct.

Cost:

- If the command executes but AOF hasn't been flushed to disk before a crash, data is still lost;
- If AOF recording itself is on the main thread path, it may also affect subsequent commands.

### Three Common Fsync Strategies

- `appendfsync always`: Flush to disk every write, most stable but slowest;
- `appendfsync everysec`: Flush once per second, commonly used in practice;
- `appendfsync no`: Let the OS decide when to flush.

### Hybrid Persistence

Starting from Redis 4.0, hybrid persistence is supported, which can be understood as:

- First use RDB to load a large base state;
- Then append incremental AOF.

This avoids pure AOF replay being too slow while losing less data than pure RDB.

## How to Best Answer This Article

If an interviewer asks in one sentence "Why is Redis suitable for caching," I would follow this line:

1. In-memory storage, very fast for hot reads/writes;
2. Rich data structures, not just string lookups;
3. Simple command execution model, single-threading avoids lock contention;
4. Can do persistence, not just temporary caching;
5. Can extend to high availability, distributed locks, message queues, and other capabilities.

The next article will connect these more engineering-focused questions:

- Distributed locks;
- Message queues;
- HyperLogLog;
- Master-slave / Sentinel / Cluster;
- Cache consistency.
