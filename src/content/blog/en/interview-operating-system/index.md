---
title: "How Operating Systems Hold Up Programs: Processes, Memory, Files, and I/O"
description: "A practical review of operating systems: processes, threads, virtual memory, page cache, system calls, file systems, and I/O."
publishDate: 2025-03-22
tags:
  - Interview Prep
  - Operating Systems
  - Processes
  - Threads
  - Memory Management
  - IO
language: English
heroImageSrc: ../../../pic/guillaume-coupy-11c7yNn30VA-unsplash.jpg
heroImageColor: "#dfb48f"
---

`Runtime Context` `Virtual Memory` `I/O Models`

The best way to start learning about operating systems is with a simple question: **Why can programs run at all?**

Because if you genuinely follow this question through, concepts like processes, threads, address spaces, page tables, file systems, system calls, page cache, `mmap`, and `epoll` — which initially seem scattered — suddenly become parts of the same chain.

Conversely, if you just memorize terms chapter by chapter from a textbook, OS is particularly easy to learn as "I've heard of each point, but together it's like I never learned it."

So this article doesn't want to follow the table of contents, but rather return to the runtime context of programs to see: **What foundational work is the operating system actually doing for applications?**

> [!tip] The most important thread to grasp in operating systems
> Who executes, who occupies resources, how addresses are mapped, how data is persisted, and how slow devices don't drag down fast ones. As long as these five questions aren't lost, processes, memory, file systems, and I/O will be hard to learn in a scattered way.

## First, look at the general process from program startup to execution

[timeline]

- Loading the program
  The OS prepares the executable file, code segment, data segment, stack, and other runtime necessities into the process context.

- Creating processes/threads
  Allocates address space, resource handles, and execution flows to the program, allowing the scheduler to manage its execution.

- Accessing memory
  Programs see virtual addresses; the OS is responsible for mapping them to real physical pages.

- Making system calls
  When encountering protected resources like files, networks, or process management, user mode must enter kernel mode to request services.

- Interacting with devices
  Slow devices like disks, network cards, and terminals are coordinated by the I/O subsystem, with page cache and multiplexing helping improve efficiency.

- Reclaiming resources
  After the program exits, the kernel releases address space, file descriptors, and other resources.

Once this timeline is established, the OS chapter basically has a skeleton.

## Processes and threads first solve "who's running and how they're isolated"

Many tutorials like to start with the conclusion: processes are the basic unit of resource allocation, threads are the basic unit of scheduling.

This statement is certainly important, but without runtime context, it easily becomes a slogan.

### Processes are more like resource containers

A process typically carries this context:

- Its own address space;
- Open file descriptors;
- Signal handling related state;
- Permissions and runtime environment;
- At least one execution flow.

So the value of a process isn't just "a program being executed," but more importantly **a well-isolated resource boundary**.

### Threads are more like execution flows within resource containers

Multiple threads within the same process:

- Share code segments, heap, open files, and other resources;
- But each has its own program counter, stack, and other execution context.

This is also why thread switching is usually lighter than process switching.

Because threads naturally share many resources, they don't need to redraw boundaries like processes do.

### Why threads being lighter doesn't mean thread switching has no cost

This is also a particularly good point to add in interviews.

No matter how light thread switching is, it still requires:

- Saving and restoring register context;
- Switching stacks and scheduling context;
- Potentially causing cache hit rate degradation;
- Amplifying scheduling overhead when lock contention is severe.

"Threads are lighter than processes" is relative.

::: tabs

@tab Processes

- Strong isolation.
- Clear resource boundaries.
- Communication costs are usually higher.

@tab Threads

- Share more resources.
- Creation and switching are relatively lighter.
- But sharing also means easier mutual interference.

@tab Key Points for Answering

- Don't just memorize "lightweight process."
- More importantly, say: threads are fast because of sharing, and risks also come from sharing.
- Isolation and communication costs are the core trade-offs between processes and threads.

:::

## The scheduler decides "who runs first, who runs later, who has to wait"

As long as there are many runnable tasks in the system simultaneously, scheduling is unavoidable.

Why some programs respond quickly while others seem frozen is actually related to scheduling policies, time slices, and waiting states.

### Don't just memorize thread state vocabulary

States like ready, running, blocked, and terminated are truly meaningful in that:

- Threads aren't "either running or broken";
- Many threads that don't appear to occupy CPU are actually waiting for locks, I/O, or events;
- High-concurrency systems slow down often not because the CPU can't compute, but because too many threads are blocked and switching too frequently.

This is also why Java concurrency and operating systems always reconnect here.

## The most important meaning of virtual memory isn't "making memory bigger"

Many people learning virtual memory for the first time focus on "when memory isn't enough, disk can fill in."

This is certainly one phenomenon, but its core value is actually: **decoupling the addresses programs see from the real locations in physical memory**.

### After decoupling, the OS has a lot of room

- Different processes can have independent address spaces;
- Programs feel like they're facing contiguous memory;
- Pages can be loaded on demand, not necessarily all moved in at the start;
- Hot and cold pages can be managed separately;
- Mechanisms like shared libraries and copy-on-write become easier to establish.

So virtual memory isn't just "making memory look bigger," it's the prerequisite for isolation, flexibility, and on-demand loading.

### Why page tables, TLB, and page faults are always asked about

Because they precisely explain how virtual addresses become real accesses.

- Page tables record mapping relationships;
- TLB caches high-frequency address translations;
- Page faults indicate that the currently accessed page isn't in a directly usable location and requires kernel intervention.

Once these concepts are placed back in runtime context, they won't be so abstract.

For example:

- Why the first access to a certain memory block is a bit slower;
- Why randomly accessing huge amounts of data is more prone to jitter;
- Why the system noticeably lags when memory pressure is high.

### Multi-level page table structure (x86-64 example)

Modern operating systems use multi-level page tables to save memory space. The x86-64 architecture uses a four-level page table:

```
Virtual Address (48 bits)
┌─────────┬─────────┬─────────┬─────────┬──────────────┐
│  PML4   │  PDPT   │   PD    │   PT    │    Offset    │
│ (9 bits)│ (9 bits)│ (9 bits)│ (9 bits)│   (12 bits)  │
└─────────┴─────────┴─────────┴─────────┴──────────────┘

CR3 Register → PML4 Table → PDPT Table → PD Table → PT Table → Physical Page
```

**Address translation flow**:
1. CR3 register points to PML4 table base address
2. Use PML4 index (9 bits) from virtual address to find PDPT table
3. Use PDPT index to find PD table
4. Use PD index to find PT table
5. Use PT index to find physical page base address
6. Add page offset (12 bits) to get final physical address

**Why use multi-level page tables**:
- Save space: No need to allocate contiguous page tables for the entire address space
- On-demand allocation: Only create page tables for actually used memory regions
- Flexibility: Can easily implement huge pages (2MB, 1GB)

### Viewing process page table information

```bash
# View process memory mapping
cat /proc/<pid>/maps

# Example output:
# 00400000-00401000 r-xp 00000000 08:01 123456  /bin/program  ← Code segment
# 00600000-00601000 r--p 00000000 08:01 123456  /bin/program  ← Read-only data
# 00601000-00602000 rw-p 00001000 08:01 123456  /bin/program  ← Writable data
# 7ffff7a00000-7ffff7bc0000 r-xp 00000000 08:01 789012  /lib/libc.so.6  ← Shared library
# 7ffffffde000-7ffffffff000 rw-p 00000000 00:00 0  [stack]  ← Stack

# View detailed memory statistics
cat /proc/<pid>/smaps

# Output includes:
# Size:                  4 kB  ← Virtual memory size
# Rss:                   4 kB  ← Actual physical memory
# Pss:                   2 kB  ← Proportionally shared physical memory
# Shared_Clean:          0 kB  ← Shared clean pages
# Private_Dirty:         4 kB  ← Private dirty pages

# View page swap statistics
vmstat 1

# Example output:
# procs -----------memory---------- ---swap-- -----io---- -system-- ------cpu-----
#  r  b   swpd   free   buff  cache   si   so    bi    bo   in   cs us sy id wa st
#  1  0      0 123456  12345 234567    0    0     0     0  100  200  1  1 98  0  0
#                                      ↑    ↑
#                                      swap-in  swap-out (pages/sec)
```

### The importance of TLB caching

TLB (Translation Lookaside Buffer) is a hardware cache for page tables:

```
Virtual Address
    ↓
TLB Lookup ─hit→ Physical Address
    │
    miss
    ↓
Page table walk (4 memory accesses)
    ↓
Update TLB
    ↓
Physical Address
```

**Cost of TLB miss**:
- Requires 4 memory accesses (four-level page table)
- Each access takes about 100 CPU cycles
- Total about 400 cycles vs 1 cycle for TLB hit

**Viewing TLB statistics**:
```bash
# Use perf to view TLB miss rate
perf stat -e dTLB-loads,dTLB-load-misses ./program

# Example output:
# 1,234,567,890  dTLB-loads
#    12,345,678  dTLB-load-misses  # About 1% miss rate
```

### Why `mmap` is always asked about together with virtual memory

Because it's another mapping approach:

- Instead of reading file content into user-mode buffer first then copying;
- It maps the file into the process address space;
- Letting the program access file data like accessing memory.

This doesn't mean something as magical as "disk becomes memory," but rather the OS connects file pages with virtual address space.

This both reduces some data movement and is more suitable for certain random access scenarios.

### mmap practical examples

**Basic usage**:
```c
#include <sys/mman.h>
#include <fcntl.h>
#include <stdio.h>

int main() {
    int fd = open("data.txt", O_RDONLY);
    if (fd == -1) {
        perror("open");
        return 1;
    }

    // Get file size
    off_t size = lseek(fd, 0, SEEK_END);

    // Map file to memory
    char *data = mmap(NULL, size, PROT_READ, MAP_PRIVATE, fd, 0);
    if (data == MAP_FAILED) {
        perror("mmap");
        return 1;
    }

    // Access file like accessing memory
    printf("First byte: %c\n", data[0]);

    // Unmap
    munmap(data, size);
    close(fd);
    return 0;
}
```

**Performance comparison: mmap vs read**:
```c
// Traditional read approach
char buffer[4096];
while (read(fd, buffer, sizeof(buffer)) > 0) {
    // Process data
    // Involves: kernel read → kernel buffer → user buffer
}

// mmap approach
char *data = mmap(NULL, file_size, PROT_READ, MAP_PRIVATE, fd, 0);
// Direct access, only actually reads on page fault
// Involves: kernel read → page cache → directly mapped to user space
```

**Advantages of mmap**:
- Reduces data copying (a zero-copy implementation)
- Suitable for random access to large files
- Multiple processes can share the same mapping (MAP_SHARED)
- Lazy loading (demand paging)

**Disadvantages of mmap**:
- High overhead for small files (page alignment)
- Sequential reading is less efficient than read
- Limited address space (32-bit systems)

### Analyzing system calls with strace

```bash
# Trace all system calls of a program
strace ./program

# Example output:
# open("/etc/ld.so.cache", O_RDONLY|O_CLOEXEC) = 3
# read(3, "\177ELF\2\1\1\0\0\0\0\0\0\0\0\0"..., 832) = 832
# mmap(NULL, 8192, PROT_READ|PROT_WRITE, MAP_PRIVATE|MAP_ANONYMOUS, -1, 0) = 0x7f1234567000

# Count system call frequency and time
strace -c ./program

# Example output:
# % time     seconds  usecs/call     calls    errors syscall
# ------ ----------- ----------- --------- --------- ----------------
#  45.23    0.012345          12      1000           read
#  32.15    0.008765          87       100           write
#  12.34    0.003456          34       100           mmap
#  10.28    0.002800          28       100           munmap

# Trace only specific system calls
strace -e open,read,write ./program

# Trace a running process
strace -p <pid>
```

### Performance analysis with perf

```bash
# Analyze CPU cache hit rate
perf stat -e cache-references,cache-misses ./program

# Example output:
#  1,234,567,890  cache-references
#     12,345,678  cache-misses  # About 1% cache miss rate

# Analyze page faults
perf stat -e page-faults ./program

# Record performance data
perf record -g ./program

# View performance report
perf report

# Real-time system performance monitoring
perf top
```

### Cost of system calls

**User mode vs kernel mode switching**:
```
User mode program
    ↓ (system call)
Save user mode context
    ↓
Switch to kernel mode
    ↓
Execute kernel code
    ↓
Restore user mode context
    ↓
Return to user mode

Cost: about 100-300 CPU cycles
```

**Optimizations to reduce system calls**:
- Batch operations (like writev instead of multiple writes)
- Use buffering (like stdio's buffer)
- Use mmap to reduce read/write
- Use sendfile for zero-copy

> [!note]- Don't answer mmap and zero-copy as magic
> What they really reduce is some unnecessary data copying and back-and-forth between user mode and kernel mode, not that the CPU does no work at all, and certainly not that disk I/O itself doesn't exist. The more restrained the answer, the more it seems like you truly understand the boundaries.

## System calls are the door between user mode and kernel mode

Applications can't just touch hardware.

Your business code usually runs in user mode, while core resources like disks, network cards, schedulers, memory mapping, and file systems are all managed by kernel mode.

So once an application needs to:

- Read a file;
- Send a network packet;
- Create a process;
- Request specific memory;
- Wait for I/O events;

It must enter the kernel through system calls.

### Why system calls have cost

Because they're not ordinary function calls.

They mean:

- Permission level switching;
- Kernel takes over checking and execution;
- Possibly accompanied by data copying, queue waiting, interrupts, and wake-ups.

This is also why many performance optimizations ultimately come down to one sentence: **minimize unnecessary system calls and context switches**.

### Why file descriptors are important

In Unix-style systems, many resources are ultimately abstracted as "file descriptors."

So:

- Reading files uses them;
- Sockets also use them;
- Pipes also use them;
- `epoll` monitors them too.

This abstraction is particularly valuable because it allows a large number of I/O resources to go through similar interface paths.

## File systems organize "persistent data" into something humans can use

Programs see files, directories, paths, and permissions.

What they really face underneath is:

- Block devices;
- Data block layout;
- Metadata;
- Journals;
- Caches;
- Consistency recovery.

The value of file systems is hiding these complex details, so applications don't need to directly manage sectors and blocks themselves.

### Why page cache is so critical

This part easily compares with middleware like databases and Redis.

When the OS does file I/O, it often doesn't go straight to disk every time, but first goes through page cache.

This means:

- When reading hot files, many requests actually hit memory directly;
- When writing, it may also first land in cache pages, then flush to disk at an opportune time;
- The performance difference between sequential and random read/write is further amplified.

So page cache is almost one of the foundations of file performance experience in modern systems.

### Why applications still do their own caching

Because OS page cache solves "general file page reuse," while applications often also care about:

- Business object-level caching;
- Query result caching;
- More specific eviction policies;
- Data semantics across requests and instances.

This is also why databases still have Buffer Pools, why Redis is still placed in front of applications. They're doing more business-semantic caching at a higher level.

## I/O models really answer: when waiting for data, what should threads do

This is where operating systems and network programming most easily converge.

Because devices are slow, CPUs are fast, and if threads just wait stupidly, system resources will be wasted terribly.

### Blocking I/O is easiest to understand, and also easiest to waste waiting time

The advantage of the blocking model is straightforward code:

- Call read;
- Wait if there's no data;
- Return when there is.

The problem is threads will be idle during the waiting period.

If there are few connections and the model is simple, this is fine; once high concurrency hits, with many threads standing around waiting for I/O, resources get tied up.

### Core differences between non-blocking, multiplexing, and asynchronous I/O

::: tabs

@tab Blocking/Non-blocking

- Focuses on whether a single system call blocks the thread.
- Non-blocking doesn't equal efficient; it might just make you poll constantly.

@tab select/poll/epoll

- Focuses on how to wait for multiple I/O events together.
- Essentially reducing the waste of "one connection one thread."
- `epoll` is more suitable for high-concurrency connection scenarios.

@tab Asynchronous I/O

- Focuses on "kernel notifies me after finishing the work."
- Not all languages and frameworks go all the way down this path.
- In interviews, you often need to first distinguish it from "multiplexing."

:::

### Why `epoll` is often tied to high-concurrency services

Because it's particularly suitable for scenarios where "there are many connections, but not every connection is always busy."

You don't need to assign a separate thread to each connection to wait stupidly, but let the kernel tell you: which fds actually have events, then go handle them.

This is one of the common foundations of event-driven network libraries.

## Why zero-copy is a high-frequency OS question

Because it particularly demonstrates "system performance bottlenecks aren't just in computing power, but also in moving data."

In traditional paths, data might go through:

- Device;
- Kernel buffer;
- User-mode buffer;
- Back to kernel socket buffer;
- Finally sent out.

Every extra copy, every extra context switch in between, the cost is real.

The significance of zero-copy related mechanisms is to minimize these unnecessary movements.

So its value belongs to the same performance topic as `mmap`, `sendfile`, and page cache.

> [!note]- The most solid way to answer zero-copy
> Don't promise "absolutely no copying at all," more accurately say: it reduces multiple data movements between user mode and kernel mode in traditional paths, as well as some context switching costs, so it's especially valuable in scenarios like large file transfers and network sending.

## If the interviewer asks you to "talk about the main thread of operating systems"

You can actually not answer according to the book's table of contents.

<!--steps-->

1. First talk about processes and threads, explaining who executes and how resources are isolated.
2. Then talk about virtual memory, explaining why programs can see independent contiguous address spaces.
3. Next talk about system calls, explaining how user mode enters kernel mode to request services.
4. Then talk about file systems and page cache, explaining how data is persisted and why file I/O can be accelerated.
5. Finally talk about I/O models, `epoll`, `mmap`, and zero-copy, bringing in the performance perspective.

Answering this way, the operating system is no longer a bunch of scattered concepts, but like describing how a machine steadily supports programs.

## Finally, condense the OS chapter into one sentence

What the operating system really does can be condensed into these sentences:

- Use processes and threads to organize execution and isolation;
- Use virtual memory to decouple address space from physical resources;
- Use system calls to guard the boundary between user mode and kernel mode;
- Use file systems and page cache to organize persistent data;
- Use I/O models to coordinate the huge speed differences between CPU, memory, and peripherals.

Like a real-world foundation mechanism: **The reason applications can run stably on complex hardware is because the operating system has been managing boundaries, coordinating resources, and hiding complexity behind the scenes.**
