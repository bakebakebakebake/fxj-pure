---
title: "Concurrency Is Not Just Threads: From JMM to Thread Pools and CompletableFuture"
description: Based on original Java concurrency notes, covering JMM, locks, atomic classes, ThreadLocal, thread pools, and more.
publishDate: 2025-05-16
tags:
  - Interview
  - Java
  - Concurrency
  - JMM
  - Thread Pool
  - CompletableFuture
language: English
heroImageSrc: '../../../pic/jessica-lewis-thepaintedsquare-1tsaxPdyTLk-unsplash.jpg'
heroImageColor: ' #b56c36 '
---

> [!note] Note
> This article is based on your original concurrency notes, maintaining the original knowledge structure and order. `CompletableFuture, Meituan` content is included as supplementary examples.

## Covered Topics

- `JUC Summary`
- `JMM`
- `Concurrency Lock Knowledge`
- `Atomic Classes`
- `Thread Pool Knowledge`

## JUC Summary

- Thread Pools
- AQS Principles
- synchronized
- CAS
- ThreadLocal

## JMM

#### Core Goals of JMM
The Java Memory Model (JMM) defines **access rules for shared variables** in multi-threaded environments, ensuring **visibility**, **ordering**, and **atomicity** when operating on shared data across different threads. It is the cornerstone of Java concurrent programming, helping developers write thread-safe code amidst complex hardware and compiler optimizations.


### Core Concepts of JMM

#### 1. Main Memory and Working Memory
- **Main Memory**: A memory area shared by all threads, storing **all variables** (instance fields, static fields, array object elements).
- **Working Memory**: Each thread's private memory space, storing **copies** of variables used by that thread.
- **Interaction Rules**:
  ```c
  [Thread] ←→ [Working Memory] ←→ [Main Memory]
  ```
  All variable operations must interact between working memory and main memory (JMM abstract model, not directly corresponding to physical hardware).

#### 2. Atomic Operations for Memory Interaction
JMM defines 8 atomic operations (such as `read`, `load`, `use`, `assign`, `store`, `write`, etc.) that control the interaction flow between threads and memory. For example:
  ```c
  Thread reads variable: read → load → use
  Thread modifies variable: assign → store → write
  ```


### Three Core Problems & Solutions

#### 1. Visibility
- **Problem**: When one thread modifies a shared variable, other threads cannot immediately see the modification.
- **JMM Solutions**:
  - **`volatile` keyword**: Forces modifications to be flushed to main memory and invalidates other threads' copies.
  - **`synchronized` locks**: Synchronizes variables to main memory before releasing the lock, and reloads from main memory when acquiring the lock.
  - **`final` fields**: Properly initialized final fields are visible to other threads.

#### 2. Ordering
- **Problem**: Compiler/processor optimizations cause instruction reordering, breaking the program's expected order.
- **JMM Solutions**:
  - **`happens-before` rules**: Define visibility ordering constraints between operations.
  - **Memory barriers** (`volatile`, `synchronized` implicitly insert barriers) prohibit specific reorderings.

#### 3. Atomicity
- **Problem**: Multi-threaded operations cause non-atomic steps to be interrupted.
- **JMM Solutions**:
  - **`synchronized`**: Ensures code block atomicity through locking mechanism.
  - **Atomic classes (`AtomicInteger`, etc.)**: Implement lock-free atomic operations based on CAS.


### Detailed Explanation of Happens-Before Principles
JMM defines the **visibility ordering** of operations through happens-before rules. If operation A happens-before operation B, then A's results are visible to B.

#### Six Core Rules
| **Rule**               | **Description**                                                                 | **Example**                                                                 |
|------------------------|-------------------------------------------------------------------------|-------------------------------------------------------------------------|
| **Program Order Rule**         | Operations within the same thread are ordered by code sequence (but doesn't prohibit instruction reordering)                     | `int x = 1; int y = x;` (y's assignment can see x=1)                            |
| **Lock Rule**              | Unlock operation happens-before subsequent lock operation                                     | ```synchronized(lock) { x=1; }``` → ```synchronized(lock) { print(x); }``` |
| **`volatile` Rule**     | Write operation on volatile variable happens-before subsequent read operation                        | ```volatile boolean flag = true;``` → `if(flag) {...}`                   |
| **Thread Start Rule**         | Parent thread modifications before starting child thread are visible to child thread                                         | ```thread.start()``` modifications before are visible in `run()`                             |
| **Thread Termination Rule**         | All operations in a thread happen-before other threads detecting that thread's termination                       | Code after `thread.join()` can see modifications within the thread                               |
| **Transitivity Rule**           | If A happens-before B, and B happens-before C, then A happens-before C       | Combining multiple rules to form an ordering chain                                                   |


### JMM Implementation Mechanisms

#### 1. Memory Barriers
| **Barrier Type**       | **Function**                                 | **Corresponding Code Example**                          |
|--------------------|----------------------------------------|-----------------------------------------|
| **LoadLoad**       | Prohibits reordering of read operations before and after the barrier              | Inserted after `volatile read`                        |
| **StoreStore**     | Prohibits reordering of write operations before and after the barrier              | Inserted before `volatile write`                        |
| **LoadStore**      | Prohibits reordering of read operations with subsequent write operations              | Rarely used explicitly                               |
| **StoreLoad**      | Prohibits reordering of write operations with subsequent read operations (full barrier)    | Inserted after `volatile write` (highest cost)             |

#### 2. Memory Semantics of `volatile`
- **Write Operation**:
  1. Flushes the value in working memory to main memory (`store` + `write`).
  2. Inserts `StoreStore` + `StoreLoad` barriers.
- **Read Operation**:
  1. Reloads the latest value from main memory (`read` + `load`).
  2. Inserts `LoadLoad` + `LoadStore` barriers.

#### 3. Memory Semantics of Locks (using `synchronized` as example)
- **Acquiring Lock (monitorenter)**:
  - Invalidates shared variables in working memory, forcing reload from main memory.
- **Releasing Lock (monitorexit)**:
  - Flushes modifications in working memory to main memory.


### JMM Practical Cases

#### Case 1: Double-Checked Locking (DCL) with `volatile`
```java
class Singleton {
    private static volatile Singleton instance; // Must be volatile

    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton(); // Without volatile, may see uninitialized object
                }
            }
        }
        return instance;
    }
}
```
- **Root Cause**: The non-atomic operation of `new Singleton()` (allocate memory → initialize → assign reference) may be reordered.
- **`volatile` Function**: Prohibits instruction reordering, ensuring other threads see a fully initialized object.

#### Case 2: Immutable Objects with `final`
```java
class ImmutableObject {
    private final int x;

    public ImmutableObject(int x) {
        this.x = x; // final field initialization guarantees visibility
    }
}
```
- **JMM Guarantee**: Properly constructed immutable objects (all fields are `final`) can be safely published without synchronization.

#### Case 3: Using jstack to Diagnose Deadlocks

**Deadlock Code Example**:
```java
public class DeadlockExample {
    private static Object lock1 = new Object();
    private static Object lock2 = new Object();

    public static void main(String[] args) {
        Thread t1 = new Thread(() -> {
            synchronized (lock1) {
                System.out.println("Thread 1: holding lock1");
                try { Thread.sleep(100); } catch (InterruptedException e) {}
                synchronized (lock2) {
                    System.out.println("Thread 1: holding lock1 & lock2");
                }
            }
        });

        Thread t2 = new Thread(() -> {
            synchronized (lock2) {
                System.out.println("Thread 2: holding lock2");
                try { Thread.sleep(100); } catch (InterruptedException e) {}
                synchronized (lock1) {
                    System.out.println("Thread 2: holding lock2 & lock1");
                }
            }
        });

        t1.start();
        t2.start();
    }
}
```

**Using jstack to Diagnose**:
```bash
# 1. Get process ID
jps

# Output example:
# 12345 DeadlockExample
# 12346 Jps

# 2. View thread stack
jstack 12345

# Output example:
Found one Java-level deadlock:
=============================
"Thread-1":
  waiting to lock monitor 0x00007f8b1c004e00 (object 0x00000007d5f3e3a0, a java.lang.Object),
  which is held by "Thread-0"
"Thread-0":
  waiting to lock monitor 0x00007f8b1c007350 (object 0x00000007d5f3e3b0, a java.lang.Object),
  which is held by "Thread-1"

Java stack information for the threads listed above:
===================================================
"Thread-1":
        at DeadlockExample.lambda$main$1(DeadlockExample.java:23)
        - waiting to lock <0x00000007d5f3e3a0> (a java.lang.Object)
        - locked <0x00000007d5f3e3b0> (a java.lang.Object)
        ...

"Thread-0":
        at DeadlockExample.lambda$main$0(DeadlockExample.java:13)
        - waiting to lock <0x00000007d5f3e3b0> (a java.lang.Object)
        - locked <0x00000007d5f3e3a0> (a java.lang.Object)
        ...

Found 1 deadlock.
```

**Solutions**:
1. Unify lock acquisition order (all threads acquire locks in lock1→lock2 order)
2. Use `tryLock` with timeout
3. Use `ReentrantLock`'s `lockInterruptibly` to support interruption


#### **Common Misconceptions & Pitfalls**
| **Misconception**                          | **Correct Understanding**                                                                 |
|-----------------------------------|-----------------------------------------------------------------------------|
| `volatile` guarantees atomicity           | Only guarantees atomicity of single read/write operations; compound operations still need locks or atomic classes                                |
| `synchronized` completely prohibits instruction reordering | Only guarantees ordering within synchronized blocks (code outside critical sections can still be reordered)                           |
| No need to consider memory visibility without contention        | Even in single-threaded scenarios, JIT optimizations may cause visibility issues (e.g., reading non-volatile variables in loops)    |
| 64-bit variables (long/double) atomicity     | On 32-bit JVMs, non-volatile long/double variables may be split into two 32-bit operations            |


### Relationship Between JMM and Hardware Memory Architecture
```c
           [Java Thread]          [Java Thread]
               ↓   ↑                   ↓   ↑
           [Working Memory]               [Working Memory]
               ↓   ↑                   ↓   ↑
           [CPU Cache]               [CPU Cache]
               ↖   ↗               ↖   ↗
                 [Main Memory/RAM]
```
- **JMM is an abstract model**: Doesn't directly correspond to physical hardware structure, but ultimately maps to CPU cache coherence protocols (such as MESI).
- **Cache Line**: Root cause of false sharing problems (optimization scenarios like `@Contended` annotation).


### JMM Development Best Practices
1. **Prioritize high-level tools**:
   - Concurrent collections (`ConcurrentHashMap`)
   - Atomic classes (`AtomicInteger`)
   - Thread pools (`ExecutorService`)

2. **Strictly follow happens-before rules**:
   - Establish clear visibility ordering through `volatile`, locks, `final`, etc.

3. **Avoid premature optimization**:
   - Before performance issues arise, prioritize simple `synchronized`.

4. **Use analysis tools for verification**:
   - **JMM verification tools**: JCStress, Java Pathfinder.
   - **Performance analysis**: JProfiler, Async Profiler.


### Summary
The Java Memory Model provides developers with tools to control visibility, ordering, and atomicity in multi-threaded environments by defining **interaction rules between threads and memory**. Understanding its core mechanisms (such as happens-before, memory barriers, volatile semantics) is key to writing high-performance concurrent code. Remember three golden rules:
1. **Visibility**: Ensure modifications are visible through synchronization mechanisms (locks/volatile).
2. **Ordering**: Rely on happens-before rules to constrain instruction order.
3. **Atomicity**: Use locks or atomic classes to protect compound operations.

## Concurrency Lock Knowledge

### Deadlock

Multiple threads are simultaneously blocked, with one or all of them waiting for a resource to be released. Since threads are blocked indefinitely, the program cannot terminate normally.

For example: Thread A holds resource 2, Thread B holds resource 1, and they both want to acquire each other's resource, so these two threads will wait for each other and enter a deadlock state.

![](../../interview-java-2/Pasted%20image%2020241219171502.png)

Code for this situation:
```java
public class DeadLockDemo {
    private static Object resource1 = new Object();//Resource 1
    private static Object resource2 = new Object();//Resource 2

    public static void main(String[] args) {
        new Thread(() -> {
            synchronized (resource1) {
                System.out.println(Thread.currentThread() + "get resource1");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println(Thread.currentThread() + "waiting get resource2");
                synchronized (resource2) {
                    System.out.println(Thread.currentThread() + "get resource2");
                }
            }
        }, "Thread 1").start();

        new Thread(() -> {
            synchronized (resource2) {
                System.out.println(Thread.currentThread() + "get resource2");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println(Thread.currentThread() + "waiting get resource1");
                synchronized (resource1) {
                    System.out.println(Thread.currentThread() + "get resource1");
                }
            }
        }, "Thread 2").start();
    }
}
```

Output:
```java
Thread[Thread 1,5,main]get resource1
Thread[Thread 2,5,main]get resource2
Thread[Thread 1,5,main]waiting get resource2
Thread[Thread 2,5,main]waiting get resource1
```

>Thread A acquires the monitor lock of `resource1` through `synchronized (resource1)`, then sleeps for 1 second via `Thread.sleep(1000);` to allow Thread B to execute and acquire the monitor lock of `resource2`. After both threads finish sleeping, they attempt to acquire each other's resources, causing both threads to wait for each other indefinitely, resulting in deadlock.

Necessary conditions for deadlock:
1. Mutual exclusion: The resource can only be occupied by one thread at any given time.
2. Hold and wait: A thread blocks while requesting resources but holds onto already acquired resources.
3. No preemption: Resources already acquired by a thread cannot be forcibly taken by other threads before completion; they can only be released by the thread itself after use.
4. Circular wait: Multiple threads form a head-to-tail circular waiting relationship for resources.

#### Deadlock Handling

How to detect deadlock?
>Use commands like jmap and jstack to view JVM thread stack and heap memory.
- If there's a deadlock, `jstack` output typically contains `Found one Java-level deadlock:`, followed by deadlock-related thread information. In actual projects, you can also use `top`, `df`, `free` commands to check the operating system's basic status, as deadlocks may cause excessive CPU and memory consumption.
- Use tools like VisualVM and JConsole for diagnosis.

How to prevent and avoid thread deadlock?

Prevention: (Break necessary conditions)

1. Break hold and wait condition: Request all resources at once.
2. Break no preemption condition: When a thread holding partial resources requests additional resources and cannot acquire them, it can **actively release its held resources**.
3. Break circular wait condition: Prevent through ordered resource requests. Request resources in a certain order and release resources in **reverse order**. This breaks the circular wait condition.

Avoidance: Use algorithms (such as the Banker's algorithm) to calculate and evaluate resource allocation, ensuring the system enters a **safe state**.
>**Safe state** means the system can allocate required resources to each thread according to some thread progression sequence (P1, P2, P3……Pn) until meeting each thread's maximum resource demand, allowing each thread to complete successfully. The sequence `P1, P2, P3.....Pn` is called a safe sequence.

Modifying Thread 2's code to avoid deadlock:
```java
new Thread(() -> {
            synchronized (resource1) {
                System.out.println(Thread.currentThread() + "get resource1");
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException e) {
                    e.printStackTrace();
                }
                System.out.println(Thread.currentThread() + "waiting get resource2");
                synchronized (resource2) {
                    System.out.println(Thread.currentThread() + "get resource2");
                }
            }
        }, "Thread 2").start();
```

Output:
```java
Thread[Thread 1,5,main]get resource1
Thread[Thread 1,5,main]waiting get resource2
Thread[Thread 1,5,main]get resource2
Thread[Thread 2,5,main]get resource1
Thread[Thread 2,5,main]waiting get resource2
Thread[Thread 2,5,main]get resource2

Process finished with exit code 0
```

>Thread 1 first acquires the monitor lock of resource1, preventing Thread 2 from acquiring it. Then Thread 1 acquires the monitor lock of resource2, which it can obtain. After Thread 1 releases its monitor locks on resource1 and resource2, Thread 2 can execute. This breaks the circular wait condition, thus avoiding deadlock.

### volatile

In Java, the `volatile` keyword ensures variable visibility. If we declare a variable as `volatile`, this instructs the JVM that this variable is shared and unstable, and should be read from main memory each time it's used.

![373](../../interview-java-2/Pasted%20image%2020241219175154.png) ![366](../../interview-java-2/Pasted%20image%2020241219175214.png)

>In C language: The original meaning is to disable CPU caching. It instructs the compiler that this variable is shared and unstable, and should be read from main memory each time it's used.

The `volatile` keyword can guarantee **data visibility** but cannot guarantee data atomicity. The `synchronized` keyword can guarantee both.

#### Practical Case: Visibility Problem

**Problem Code**:
```java
public class VisibilityProblem {
    private static boolean flag = false; // No volatile

    public static void main(String[] args) throws InterruptedException {
        Thread writerThread = new Thread(() -> {
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            flag = true; // Writer thread modifies flag
            System.out.println("Writer: flag set to true");
        });

        Thread readerThread = new Thread(() -> {
            while (!flag) {
                // May loop forever because it can't see flag modification
            }
            System.out.println("Reader: detected flag is true");
        });

        readerThread.start();
        writerThread.start();
    }
}
```

**Phenomenon**: readerThread may loop forever because:
1. JIT compiler may optimize `while(!flag)` to `if(!flag) while(true)`
2. CPU caching causes readerThread to read the old value from cache

**Solution**:
```java
private static volatile boolean flag = false; // Add volatile
```

**Verifying Visibility with JMH**:
```java
@State(Scope.Benchmark)
public class VolatileBenchmark {
    private boolean normalFlag = false;
    private volatile boolean volatileFlag = false;

    @Benchmark
    @BenchmarkMode(Mode.AverageTime)
    public void testNormalFlag() {
        normalFlag = true;
        while (!normalFlag) {
            // May be optimized
        }
    }

    @Benchmark
    @BenchmarkMode(Mode.AverageTime)
    public void testVolatileFlag() {
        volatileFlag = true;
        while (!volatileFlag) {
            // Guarantees visibility
        }
    }
}
```

#### How to Ensure Variable Visibility?
>As detailed above

Direct interaction between main memory and working memory: When a variable is declared as `volatile`, whenever the variable is modified or read, the thread will directly read from or write to main memory. **This allows all threads to see the variable's latest value**.

#### How to Prohibit Instruction Reordering?
>If we declare a variable as volatile, when performing read and write operations on this variable, specific memory barriers will be inserted to prohibit instruction reordering.

Refer to [2.5.2 Prohibiting Instruction Reordering](https://swpu.feishu.cn/wiki/DQutwKIyKi84n3kX7bIcql2fnGh)

A memory barrier is added, prohibiting instruction reordering optimization before and after the memory barrier through barrier insertion.

#### Can volatile Guarantee Atomicity?
The volatile keyword can guarantee variable visibility but cannot guarantee that operations on the variable are atomic.

No

```java
public class VolatileAtomicityDemo {
    public volatile static int inc = 0;

    public void increase() {
        inc++;
    }

    public static void main(String[] args) throws InterruptedException {
        ExecutorService threadPool = Executors.newFixedThreadPool(5);
        VolatileAtomicityDemo volatileAtomicityDemo = new VolatileAtomicityDemo();
        for (int i = 0; i < 5; i++) {
            threadPool.execute(() -> {
                for (int j = 0; j < 500; j++) {
                    volatileAtomicityDemo.increase();
                }
            });
        }
        // Wait 1.5 seconds to ensure the above program completes
        Thread.sleep(1500);
        System.out.println(inc);
        threadPool.shutdown();
    }
}
```

For this code: Normally it should output 2500, but here the result is less than 2500.

The problem is that `inc++` is actually a compound operation:
- Read the value of `inc`.
- Add 1 to `inc`.
- Write the value of `inc` back to memory.
And `volatile` cannot guarantee these three operations are atomic, which may lead to the following situation:

- Thread 1 reads inc but hasn't modified it yet.
- Thread 2 reads inc's value and modifies it (+1), then writes inc's value back to memory.
- After Thread 2 completes, Thread 1 modifies inc's value (+1) and writes inc's value back to memory.
This causes inc to only increase by 1 after two threads each perform an increment operation.

> [!success]- Improvement
> Using `synchronized`, `Lock`, or `AtomicInteger` can make the above code produce correct output.
>
> Using `synchronized` improvement:
> ```java
> public synchronized void increase() {
>     inc++;
> }
> ```
> Using `AtomicInteger` improvement:
> ```java
> public AtomicInteger inc = new AtomicInteger();
>
> public void increase() {
>     inc.getAndIncrement();
> }
> ```
> Using `ReentrantLock` improvement:
> ```java
> Lock lock = new ReentrantLock();
> public void increase() {
>     lock.lock();
>     try {
>         inc++;
>     } finally {
>         lock.unlock();
>     }
> }
> ```

### Optimistic and Pessimistic Locks
- **Pessimistic Lock**: Shared resources are only given to one thread at a time, other threads are blocked, and resources are transferred to other threads after use. (Examples: `synchronized` and `ReentrantLock`)
	- In high-concurrency scenarios, pessimistic locks cause thread blocking due to intense lock competition, and a large number of blocked threads lead to system context switching, **increasing system performance overhead**. Additionally, pessimistic locks may have **deadlock problems**, affecting normal code execution.
>Pessimistic locks always assume the worst case, believing that problems (such as shared data being modified) will occur every time shared resources are accessed, so they lock every time resources are acquired. This causes other threads wanting the resource to block until the lock is released by the previous holder.
- **Optimistic Lock**: Threads can continue executing without locking or waiting, only **verifying** whether the corresponding data was modified by other threads when submitting modifications (Examples: `AtomicInteger`, `LongAdder` use optimistic lock's CAS implementation)
	- In high-concurrency scenarios, optimistic locks often outperform pessimistic locks in performance, as they don't have lock competition causing thread blocking and no deadlock problems. If conflicts occur frequently (very high write ratio), frequent failures and retries will significantly impact performance, causing CPU spikes.

Summary:
- **Pessimistic locks** are typically used when writes are frequent (**high write scenarios, intense competition**), avoiding performance impact from frequent failures and retries. Pessimistic lock overhead is fixed. If optimistic locks solve the frequent failure and retry problem (such as LongAdder), optimistic locks can also be considered, depending on the actual situation.
- **Optimistic locks** are typically used when writes are infrequent (**high read scenarios, less competition**), avoiding performance impact from frequent locking. However, optimistic locks mainly target single shared variables (refer to atomic variable classes in the `java.util.concurrent.atomic` package).

#### Optimistic Lock Implementation
Optimistic locks are generally implemented using version number mechanisms or **CAS algorithms** (CAS algorithms are more common)

##### Version Number Mechanism
Generally, a data version number `version` field is added to the data table, representing the number of times data has been modified. When data is modified, the `version` value increases by one. When Thread A wants to update a data value, it reads the data along with the version value. When submitting the update, if the version value just read **equals** the current database version value, it updates; otherwise, it retries the update operation until successful.

>e.g., If two operation objects operate on the database, after the first object completes its database operation, `version` becomes 2, and it submits the `version` along with the operated object. When the second operation object completes its operation, `version` is still 1. **When submitting, it discovers the `version` is inconsistent, so the submission is rejected**!

##### CAS Algorithm
CAS stands for `Compare And Swap` (Compare and Swap), used to **implement optimistic locks**, widely applied in various frameworks. The CAS concept is simple: use an expected value to compare with the variable value to be updated, and only update if the two values are equal.

CAS is an **atomic operation**, relying on CPU atomic instructions at the bottom level
>Atomic operation: Once an operation starts, it cannot be interrupted until completion.

CAS's three operands:
- V(var): Variable value to update
- E(Expected): Expected value
- N(NEW): New value to write

Only when `V===E` will CAS use N to update V's value, i.e., `V<-N`; otherwise, it abandons the update (it has already been updated at this point)

>When multiple threads simultaneously use CAS to operate on a variable, **only one will succeed** and successfully update, the rest will fail. However, failed threads are not suspended; they are merely told they failed and allowed to try again, or they can choose to abandon the operation.

###### CAS Implementation

Implemented through C++ and assembly, a key class is: Unsafe

Provided methods:
>CAS's specific implementation is closely related to the operating system and CPU.
```java
/**
  *  CAS
  * @param o         Object containing the field to modify
  * @param offset    Offset of a field in the object
  * @param expected  Expected value
  * @param update    Update value
  * @return          true | false
  */
public final native boolean compareAndSwapObject(Object o, long offset,  Object expected, Object update);

public final native boolean compareAndSwapInt(Object o, long offset, int expected,int update);

public final native boolean compareAndSwapLong(Object o, long offset, long expected, long update);
```

The `java.util.concurrent.atomic` package provides some **classes for atomic operations**. These classes utilize underlying atomic instructions to ensure operations are thread-safe in multi-threaded environments.

Atomic classes perform atomic operations on certain types of variables, utilizing **low-level atomic operation methods provided by the Unsafe class** to implement lock-free thread safety.

Summary of atomic classes: [Atomic Classes Summary | JavaGuide](https://javaguide.cn/java/concurrent/atomic-classes.html) Atomic Classes

`AtomicInteger` core source code:
```java
// Get Unsafe instance
private static final Unsafe unsafe = Unsafe.getUnsafe();
private static final long valueOffset;

static {
    try {
        // Get memory offset of "value" field in AtomicInteger class
        valueOffset = unsafe.objectFieldOffset
            (AtomicInteger.class.getDeclaredField("value"));
    } catch (Exception ex) { throw new Error(ex); }
}
// Ensure visibility of "value" field
private volatile int value;

// If current value equals expected value, atomically set value to newValue
// Uses Unsafe#compareAndSwapInt method for CAS operation
public final boolean compareAndSet(int expect, int update) {
    return unsafe.compareAndSwapInt(this, valueOffset, expect, update);
}

// **Atomically** add delta to current value and return old value
public final int getAndAdd(int delta) {
    return unsafe.getAndAddInt(this, valueOffset, delta);
}

// **Atomically** add 1 to current value and return value before addition (old value)
// Uses Unsafe#getAndAddInt method for CAS operation.
public final int getAndIncrement() {
    return unsafe.getAndAddInt(this, valueOffset, 1);
}

// **Atomically** subtract 1 from current value and return value before subtraction (old value)
public final int getAndDecrement() {
    return unsafe.getAndAddInt(this, valueOffset, -1);
}
```

`Unsafe#getAndAddInt` source code:
```java
// Atomically get and increment integer value
public final int getAndAddInt(Object o, long offset, int delta) {
    int v;
    do {
        // Get integer value at memory offset in object o in volatile manner
        v = getIntVolatile(o, offset);
    } while (!compareAndSwapInt(o, offset, v, v + delta));
    // Return old value
    return v;
}
```

The `do-while` in the `getAndAddInt` method reflects that when operations fail, it will continuously retry until success.
>That is, the `getAndAddInt` method will attempt to update the `value` through the `compareAndSwapInt` method. If the update fails, it will retrieve the current value again and try to update again until the operation succeeds.

Since CAS operations may fail due to concurrent conflicts, they are typically paired with while loops, continuously retrying after failure until the operation succeeds. This is the **spin lock mechanism**.

###### CAS Problems
1. ABA Problem
>This is the most common problem with CAS

If a variable V is initially read as value A, and when preparing to assign a value, it's still value A, can we say its value hasn't been modified by other threads? Obviously not, because **during this time its value could have been changed to another value and then changed back to A**, so the CAS operation would mistakenly think it was never modified. This problem is called the **"ABA" problem** of CAS operations.

Solution: Append **version numbers or timestamps**
>After JDK1.5, the `AtomicStampedReference` class solves the ABA problem. Its `compareAndSet` method first checks if the current reference equals the expected reference and if the current stamp equals the expected stamp. If both are equal, it atomically sets the reference and stamp values to the given update values.

2. Long Loop Time, High Overhead
CAS often uses spin operations for retries, meaning it keeps looping until success. If it doesn't succeed for a long time, it will bring very high execution overhead to the CPU.

If the JVM can support the pause instruction provided by processors, the efficiency of spin operations will improve.

The pause instruction has two important functions:
- Delay pipeline execution: The pause instruction can delay instruction execution, thereby reducing CPU resource consumption. The specific delay time depends on the processor implementation version; on some processors, the delay time may be zero.
- Avoid memory order conflicts: When exiting a loop, the pause instruction can avoid CPU pipeline flushing due to memory order conflicts, thereby improving CPU execution efficiency.

3. Can Only Guarantee Atomic Operations on One Shared Variable
CAS operations are only effective for single shared variables. When multiple shared variables need to be operated on, CAS becomes powerless. However, starting from JDK 1.5, Java provides the `AtomicReference` class, allowing us to guarantee atomicity between reference objects. By encapsulating multiple variables in one object, we can use `AtomicReference` to perform CAS operations.
>Besides the AtomicReference approach, locking can also be used to guarantee.

### synchronized*
>Mainly solves the synchronization of resource access between multiple threads, ensuring that methods or code blocks it modifies can only be executed by one thread at any given time.

Before JDK 6, it was a **heavyweight lock** (low efficiency)
>Because the monitor lock depends on the underlying operating system's `Mutex Lock` for implementation, Java threads are mapped to the operating system's **native threads**. If you want to suspend or wake up a thread, the operating system needs to help complete it, and **the operating system implementing thread switching** needs to transition from user mode to kernel mode. This state transition requires relatively long time, with relatively high time costs.

After JDK 6: Introduced many optimizations such as spin locks, adaptive spin locks, lock elimination, lock coarsening, *biased locks*, lightweight locks, etc., to reduce lock operation overhead
>`synchronized` can be used in projects
>	*Biased locks*: Increased JVM complexity without bringing performance improvements to all applications.
>	- In JDK15, biased locks are disabled by default (can still be enabled with -XX:+UseBiasedLocking)
>	- In JDK18, biased locks have been completely deprecated (cannot be enabled via command line)

Locks mainly exist in four states, in order: no lock state, biased lock state, lightweight lock state, heavyweight lock state. They will gradually upgrade as competition intensifies. **Note that locks can upgrade but not downgrade**. This strategy is to improve the efficiency of acquiring and releasing locks.

**Detailed explanation of lock upgrade principles**: [Analysis of synchronized Lock Upgrade Principles and Implementation - Xiaoxin's Growth Path - Blog Garden](https://www.cnblogs.com/star95/p/17542850.html):
#### Modification Scenarios
- Modifying instance methods
>Locks the current object instance; must acquire the current object instance's lock to enter
```java
synchronized void method() {
    //Business code
}
```

- Modifying static methods
>Locks the current object instance; must acquire the current class's lock to enter synchronized code
```java
synchronized static void method() {
    //Business code
}
```

> [!question]
> Are calls between static `synchronized` and non-static `synchronized` methods mutually exclusive?
>
> No, because accessing static `synchronized` methods uses the **current class's lock**, while accessing non-static `synchronized` methods uses the **current instance object's lock**.
>

- Modifying code blocks

>`synchronized(object)` means you must acquire the given object's lock before entering the synchronized code block.
>`synchronized(Class.class)` means you must acquire the given `Class`'s lock before entering synchronized code

```java
synchronized(this) {
    //Business code
}
```

**Try not to use `synchronized(String a)` because in the JVM, the string constant pool has caching functionality.**

- For constructors
>Although it cannot be directly modified on the method, **it can be used inside the method** (the method itself is thread-safe; if shared resource operations are involved in the constructor, appropriate synchronization measures need to be taken to ensure thread safety of the entire construction process.)

#### Underlying Principles
Using the `javap -v xx.class` command to view bytecode files, you can see:

##### synchronized Synchronized Statement Block Case
```java
public class SynchronizedDemo {
    public void method() {
        synchronized (this) {
            System.out.println("synchronized code block");
        }
    }
}
```

- `synchronized` synchronized statement block implementation uses `monitorenter` and `monitorexit` instructions, marking the start and end points respectively
- There are two `monitorexit` commands to ensure the lock is correctly released in both cases: **normal execution** (after executing exit, it skips the exit at the exception location) and **exception occurrence** (executes the command afterward)
- When executing `monitorenter`, the thread attempts to acquire the lock, i.e., acquire ownership of the object monitor `monitor`
>  - `monitor` is implemented based on `c++`; each object has a built-in `ObjectMonitor` object.
>  - Methods like `wait/notify` also depend on the `monitor` object. This is why methods like `wait/notify` can only be called **in synchronized blocks or methods**; otherwise, a `java.lang.IllegalMonitorStateException` exception will be thrown.
- When executing `monitorenter`, it attempts to acquire the object's lock. If the lock's **counter is 0**, the lock can be acquired (lock acquisition successful), and after acquisition, the lock counter is set to 1, i.e., incremented by 1. If the counter is not 0, lock acquisition fails (the current thread needs to **block and wait** until the lock is released by another thread.)
- After the `monitorexit` instruction executes, the lock counter is set to 0, indicating the lock is released and other threads can attempt to acquire the lock.

##### synchronized Modifying Methods Case
```java
public class SynchronizedDemo2 {
    public synchronized void method() {
        System.out.println("synchronized method");
    }
}
```

- Methods modified by `synchronized` don't have `monitorenter` and `monitorexit` instructions but have an `ACC_SYNCHRONIZED` flag. The JVM uses this `ACC_SYNCHRONIZED` access flag to identify **whether a method is declared as synchronized**, thus executing the corresponding synchronization call.
- If it's an instance method, the JVM will attempt to acquire the instance object's lock. If it's a static method, the JVM will attempt to acquire the current `class`'s lock.

But the **essence of both is acquiring the object monitor `monitor`**.

Detailed explanation of `monitor`: [Java Locks and Threads](https://tech.youzan.com/javasuo-yu-xian-cheng-de-na-xie-shi/)

#### What's the Difference from volatile?*

- `volatile` is a **lightweight implementation** of thread synchronization, so `volatile` performs better than the `synchronized` keyword. But `volatile` can only be used for variables, while `synchronized` can **modify methods and code blocks**.
- `volatile` can guarantee data visibility but cannot guarantee data atomicity. `synchronized` can guarantee both.
- The `volatile` keyword mainly solves variable visibility between multiple threads, while the `synchronized` keyword solves synchronization of resource access between multiple threads.

### ReentrantLock

`ReentrantLock` implements the `Lock` interface, is a reentrant and exclusive lock, similar to the `synchronized` keyword. However, `ReentrantLock` is more flexible and powerful, adding advanced features like polling, timeout, interruption, fair locks, and non-fair locks.

```java
public class ReentrantLock implements Lock, java.io.Serializable {}
```

![](../../interview-java-2/Pasted%20image%2020241221150553.png)

`ReentrantLock` has an inner class `Sync`, which extends **AQS** (`AbstractQueuedSynchronizer`). Most lock acquisition and release operations are actually implemented in `Sync`. `Sync` has two subclasses: fair lock `FairSync` and non-fair lock `NonfairSync`.

>You can specify whether to use fair or non-fair locks
>- Fair lock: After the lock is released, the thread that applied first gets the lock first. Performance is relatively poor because fair locks need to **guarantee absolute time ordering**, resulting in more frequent context switching.
>- Non-fair lock: After the lock is released, threads that applied later may acquire the lock first, **randomly or according to other priority ordering**. Better performance, but may cause some threads to never acquire the lock.
```java
// Pass a boolean value, true for fair lock, false for non-fair lock
public ReentrantLock(boolean fair) {
    sync = fair ? new FairSync() : new NonfairSync();
}
```

**`ReentrantLock`'s underlying implementation is based on `AQS`**.

About AQS: AQS Detailed Explanation

#### Differences from synchronized*
>Both are **reentrant locks**: Also called recursive locks, meaning **a thread can acquire its own internal lock again**. For example, if a thread acquires a lock on an object, it can still acquire that object's lock again when it wants to, even if the lock hasn't been released yet. If it were a non-reentrant lock, this would cause **deadlock**.

Both `Lock` implementation classes and `synchronized` are reentrant.

> [!example]
> - Since the `synchronized` lock is reentrant, the same thread can directly acquire the current object's lock when calling `method1()`, and can acquire this object's lock again when executing `method2()`, without causing deadlock.
> - If `synchronized` were a non-reentrant lock, since the object's lock is already held by the current thread and cannot be released, this would cause the thread to fail to acquire the lock when executing `method2()`, resulting in deadlock.
> ```java
> public class SynchronizedDemo {
>     public synchronized void method1() {
>         System.out.println("Method 1");
>         method2();
>     }
>
>     public synchronized void method2() {
>         System.out.println("Method 2");
>     }
> }
> ```

Differences are reflected in:
- `synchronized` depends on the JVM while `ReentrantLock` depends on APIs.
	- `synchronized` is implemented at the virtual machine level and is not directly exposed to us.
	- `ReentrantLock` is implemented by the JDK, and you can view its source code to see how it's implemented.
- `ReentrantLock` adds some advanced features compared to `synchronized`:
	- **Interruptible waiting**: `ReentrantLock` provides a mechanism to interrupt threads waiting for locks through `lock.lockInterruptibly()`. This means that during the process of waiting to acquire a lock, if another thread interrupts the current thread (`interrupt()`), the current thread will throw an `InterruptedException`, which can be caught for appropriate handling.
	- **Can implement fair locks**: `ReentrantLock` can specify fair or non-fair locks. `synchronized` can only be non-fair locks.
	- **Can implement selective notification** (locks can bind multiple conditions): The `synchronized` keyword combined with `wait()` and `notify()/notifyAll()` methods can implement wait/notify mechanisms. The `ReentrantLock` class can also implement this, but needs the help of the `Condition` interface and `newCondition()` method.
	- **Supports timeout**: `ReentrantLock` provides the `tryLock(timeout)` method, which can specify the maximum waiting time for acquiring a lock. If the waiting time is exceeded, lock acquisition fails, and it won't wait indefinitely.

Supplement:
- **Interruptible waiting**: Understanding that `lockInterruptibly()` can respond to interrupts
	- Basic function: `lockInterruptibly()` attempts to acquire a lock, just like `lock()`. If the lock is available, the current thread will acquire the lock and continue execution. If the lock is already held by another thread, the current thread will be blocked until it acquires the lock.
	- Interrupt support: If the current thread calls `interrupt()` to interrupt itself while calling `lockInterruptibly()` and being blocked, `lockInterruptibly()` will immediately throw an `InterruptedException`.
	- Use case: `lockInterruptibly()` is typically used when responsiveness and interruptibility need to be guaranteed. For example, in situations where a thread waiting to acquire a lock might be blocked for a long time, **interruption can be chosen to allow other tasks to continue executing**.
- `Condition` interface
	- `Condition` was introduced in JDK1.5. It has good flexibility, such as implementing multi-way notification functionality, meaning multiple `Condition` instances (i.e., object monitors) can be created in one `Lock` object, providing more flexibility in thread scheduling.
	- When using `notify()/notifyAll()` methods for notification, the notified thread is chosen by the JVM. Using `ReentrantLock` class combined with `Condition` instances can implement "selective notification"
		- The `synchronized` keyword is equivalent to having only one `Condition` instance in the entire Lock object, with all threads registered on it. If the `notifyAll()` method is executed, it will notify all threads in a waiting state, which causes significant efficiency problems.
		- The `Condition` instance's `signalAll()` method will only wake up all waiting threads registered in that `Condition` instance.
- **Supports timeout**: Why is the `tryLock(timeout)` feature needed?
	- Prevent deadlock: In complex lock scenarios, allowing threads to give up and retry within a reasonable time can help prevent deadlock.
	- Improve responsiveness: Prevents threads from blocking indefinitely.
	- Handle time-sensitive operations: For operations with strict time limits, tryLock(timeout) allows threads to continue executing alternative operations when they cannot acquire the lock in time.
- What's the difference between **interruptible locks** and non-interruptible locks?
	- Interruptible lock: Can be interrupted during the process of acquiring the lock, without needing to wait until acquiring the lock before processing other logic. `ReentrantLock` is an interruptible lock.
	- Non-interruptible lock: Once a thread applies for a lock, it can only process other logic after acquiring the lock. `synchronized` is a non-interruptible lock.

### Misc
>Just understand these.

#### ReentrantReadWriteLock
`ReentrantReadWriteLock` implements `ReadWriteLock`, is a reentrant read-write lock that can both guarantee the efficiency of multiple threads reading simultaneously and guarantee thread safety during write operations.

- General lock concurrency control rules: read-read mutual exclusion, read-write mutual exclusion, write-write mutual exclusion.
- Read-write lock concurrency control rules: read-read not mutually exclusive, read-write mutually exclusive, write-write mutually exclusive (only read-read is not mutually exclusive).
> `ReentrantReadWriteLock` is actually two locks: one is `WriteLock` (write lock), one is `ReadLock` (read lock). The read lock is a shared lock (one lock can be simultaneously acquired by multiple threads), the write lock is an exclusive lock (one lock can only be held by one thread at most). Read locks can be read simultaneously and held by multiple threads simultaneously, while write locks can be held by at most one thread at a time.

**`ReentrantReadWriteLock` is also based on AQS implementation at the bottom level**.
ReentrantReadWriteLock also supports fair and non-fair locks, using non-fair locks by default, which can be explicitly specified through the constructor.

Use case: In **read-heavy, write-light** situations, using `ReentrantReadWriteLock` can significantly improve system performance.

Why can't read locks be upgraded to write locks? (Write locks can be downgraded to read locks, but read locks cannot be upgraded to write locks.)
- This is because upgrading read locks to write locks would cause thread contention. After all, write locks are exclusive locks, which would affect performance.
- Deadlock problems may occur. For example: Suppose two threads' read locks both want to upgrade to write locks, then they both need the other to release their lock, but neither releases, resulting in deadlock.

#### StampedLock
`StampedLock` is a read-write lock with better performance introduced in JDK 1.8, non-reentrant and doesn't support condition variables `Condition`.

Unlike general Lock classes, `StampedLock` doesn't directly implement the `Lock` or `ReadWriteLock` interfaces but is independently implemented based on **CLH locks** (AQS is also based on this).

Provides three modes of read-write control: read lock, write lock, and optimistic read.
- Write lock: Exclusive lock, only one thread can acquire one lock. When a thread acquires a write lock, other threads requesting read or write locks must wait. Similar to `ReentrantReadWriteLock`'s write lock, but this write lock is non-reentrant.
- Read lock (pessimistic read): Shared lock, when no thread has acquired a write lock, multiple threads can simultaneously hold read locks. If a thread already holds a write lock, other threads requesting that read lock will be blocked. Similar to `ReentrantReadWriteLock`'s read lock, but this read lock is non-reentrant.
- Optimistic read: Allows multiple threads to acquire optimistic read and read locks. Also allows one write thread to acquire a write lock.

Why is StampedLock's performance better?
The additional optimistic read compared to traditional read-write locks is the key reason why `StampedLock` performs better than `ReadWriteLock`. `StampedLock`'s optimistic read allows one write thread to acquire a write lock, so it won't cause all write threads to block, meaning when there are many reads and few writes, write threads have opportunities to acquire write locks, reducing thread starvation problems and greatly increasing throughput.

Use cases:
Like ReentrantReadWriteLock, StampedLock is also suitable for read-heavy, write-light business scenarios and can be used as a replacement for ReentrantReadWriteLock with better performance.

However, note that StampedLock is non-reentrant, doesn't support condition variables Condition, and doesn't support interruption operations well (improper use can easily cause CPU spikes). If you need some advanced features of ReentrantLock, it's not recommended to use StampedLock.

Additionally, although StampedLock performs well, it's relatively troublesome to use. Once used improperly, production problems will occur. It's strongly recommended to review the cases in the StampedLock official documentation before using it.

Underlying principles:
`StampedLock` doesn't directly implement the `Lock` or `ReadWriteLock` interfaces but is based on CLH lock implementation (AQS is also based on this). CLH lock is an improvement on spin locks, an implicit linked list queue. `StampedLock` manages threads through CLH queues and represents lock state and type through the synchronization state value state.

>Just understand AQS principles.

## Atomic Classes

### Java Atomic Classes

Java's atomic classes in the concurrency package (`java.util.concurrent.atomic`) implement thread-safe lock-free operations through hardware-level atomic instructions (CAS), solving performance bottleneck problems of traditional lock mechanisms in high-concurrency competition scenarios.

### Atomic Family Members

```
Atomic Class System
├── Basic Types
│   ├── AtomicInteger
│   ├── AtomicLong
│   └── AtomicBoolean
│
├── Reference Types
│   ├── AtomicReference
│   ├── AtomicStampedReference (with version number)
│   └── AtomicMarkableReference (with mark bit)
│
├── Array Types
│   ├── AtomicIntegerArray
│   ├── AtomicLongArray
│   └── AtomicReferenceArray
│
├── Field Updaters
│   ├── AtomicIntegerFieldUpdater
│   ├── AtomicLongFieldUpdater
│   └── AtomicReferenceFieldUpdater
│
└── High-Performance Counters
    ├── LongAdder (Java8+)
    └── DoubleAdder (Java8+)
```

### Core Principle: CAS (Compare And Swap)

**CAS Operation Flow**:
```
           +-----------------+
           | Read memory value V     |
           +-----------------+
                     |
                     v
+----------------------------------+
| Compare V with expected value A                 |
| if (V == A) → Write new value B          | → Success returns true
| else        → Abandon operation            | → Failure returns false
+----------------------------------+
```

**CPU Hardware Support**:
- x86: `LOCK CMPXCHG` instruction
- ARM: `LDREX/STREX` instructions
- Atomicity guarantee: Cache lock or bus lock

### Core Class Details and Code Examples

#### 1. AtomicInteger
```java
AtomicInteger counter = new AtomicInteger(0);

// Atomic increment
counter.incrementAndGet();  // 1

// Custom update
int result = counter.updateAndGet(x -> x * 2);  // 2

// Compound operation
boolean success = counter.compareAndSet(2, 5); // true
```

#### 2. AtomicReference
```java
AtomicReference<User> userRef = new AtomicReference<>();
User oldUser = new User("Alice");
User newUser = new User("Bob");

// Atomic replacement
userRef.set(oldUser);
userRef.compareAndSet(oldUser, newUser); // Success
```

#### 3. LongAdder (Segmented Lock Optimization)
```java
LongAdder totalBytes = new LongAdder();

// Concurrent addition
parallelStream().forEach(i -> totalBytes.add(i));

// Get final result (not real-time)
long sum = totalBytes.sum();
```

#### 4. AtomicStampedReference (Solves ABA Problem)
```java
AtomicStampedReference<Integer> money = new AtomicStampedReference<>(100, 0);

int[] stampHolder = new int[1];
int current = money.get(stampHolder); // value=100, version=0

// CAS operation with version number
money.compareAndSet(100, 200, stampHolder[0], stampHolder[0]+1);
```


### Performance Comparison: synchronized vs Atomic vs LongAdder
| **Scenario**             | 10 threads/1 million operations (ms) |
|----------------------|-------------------------|
| synchronized         | 2450                    |
| AtomicInteger        | 680                     |
| LongAdder            | 120                     |

**Conclusion**:
- **Low contention**: Atomic classes are 3-5 times faster than locks
- **High contention**: LongAdder performance advantage can reach 20 times


### Atomic Class Best Practices

#### 1. Applicable Scenarios
```c
✅ Counters (access statistics)
✅ Status flags (initialization flags)
✅ Atomic object property updates
✅ Lock-free data structures (queues, stacks)
✅ Statistics with low real-time requirements
```

#### 2. Pitfall Guide
```java
// Wrong example: Compound operations still need protection
AtomicInteger count = new AtomicInteger(0);
if (count.get() < 10) {  // Race condition exists here!
    count.incrementAndGet();
}

// Correct approach: Use CAS loop
while (true) {
    int current = count.get();
    if (current >= 10) break;
    if (count.compareAndSet(current, current+1)) break;
}
```

#### 3. Memory Visibility Guarantee
All atomic classes internally use **volatile** variables, guaranteeing:
- **Visibility**: Modifications are immediately visible to other threads
- **Ordering**: Prevents instruction reordering


### Atomic Class Design Patterns

#### 1. Lock-Free Stack Implementation
```java
public class LockFreeStack<T> {
    private AtomicReference<Node<T>> top = new AtomicReference<>();

    public void push(T item) {
        Node<T> newHead = new Node<>(item);
        Node<T> oldHead;
        do {
            oldHead = top.get();
            newHead.next = oldHead;
        } while (!top.compareAndSet(oldHead, newHead));
    }

    public T pop() {
        Node<T> oldHead;
        Node<T> newHead;
        do {
            oldHead = top.get();
            if (oldHead == null) return null;
            newHead = oldHead.next;
        } while (!top.compareAndSet(oldHead, newHead));
        return oldHead.item;
    }

    private static class Node<T> {
        final T item;
        Node<T> next;
        // Constructor...
    }
}
```

#### 2. Efficient Counter Group
```java
class MetricCounter {
    private final AtomicLongArray counters;

    public MetricCounter(int size) {
        counters = new AtomicLongArray(size);
    }

    public void increment(int index) {
        counters.getAndIncrement(index);
    }

    public long getTotal() {
        long sum = 0;
        for (int i = 0; i < counters.length(); i++) {
            sum += counters.get(i);
        }
        return sum;
    }
}
```


#### ⚖️ **Atomic Class Limitations**
| **Limitation**      | **Solution**                       |
| ----------- | ------------------------------ |
| ABA problem      | Use AtomicStampedReference with version numbers |
| Long loop time, high overhead    | Combine with backoff algorithm (Exponential Backoff)    |
| Can only guarantee single variable atomicity | Use locks or merge variables                       |
| False sharing problem       | @Contended annotation for cache line padding             |


### Java 8+ Enhanced Features
#### 1. Enhanced API
```java
AtomicInteger atomic = new AtomicInteger(5);

// Functional update
atomic.accumulateAndGet(3, Math::max); // Result is 5

// Lazy initialization
AtomicReference<ExpensiveObject> ref = new AtomicReference<>();
ExpensiveObject obj = ref.updateAndGet(
    o -> o != null ? o : createExpensiveObject()
);
```

#### 2. Adder Series Optimization
```c
LongAdder → Suitable for statistics scenarios (write-heavy, read-light)
LongAccumulator → Supports custom accumulation rules
```


### Architect Considerations
1. **Cost Trade-offs**:
   - Development cost: Atomic classes are more complex than locks
   - Maintenance cost: Requires deep understanding of memory model

2. **Technology Selection**:
   ```c
   Single variable atomic operations → Atomic series
   Distributed counters → Redis/ZooKeeper
   Ultra-high concurrency statistics → LongAdder + periodic persistence
   ```

3. **Future Trends**:
   - Vectorized API (Valhalla project)
   - Hardware-accelerated atomic instructions


**Ultimate Summary**:
Atomic classes are foundational tools for Java concurrent programming. They:
🔹 Replace locks with **CAS** for lock-free concurrency
🔹 Guarantee visibility through **volatile**
🔹 Optimize high-concurrency scenarios with **segmentation strategy**
Mastering their principles and applicable scenarios is essential for building high-performance Java applications.

### Atomic Class API Examples
Here are detailed API examples and difference analysis for each member of the Java Atomic class family:


### I. Basic Type Atomic Classes
#### 1. AtomicInteger
```java
AtomicInteger atomicInt = new AtomicInteger(0);

// Basic operations
atomicInt.set(10);                          // Set value
int val = atomicInt.get();                  // Get value → 10

// Atomic operations
int newVal = atomicInt.incrementAndGet();    // Increment → 11
int oldVal = atomicInt.getAndAdd(5);         // Return old value → 11, new value → 16

// CAS operation
boolean success = atomicInt.compareAndSet(16, 20); // true

// Functional update
atomicInt.updateAndGet(x -> x * 2);          // 20 → 40
```

#### 2. AtomicLong
```java
AtomicLong atomicLong = new AtomicLong(100L);

// Similar to AtomicInteger, supports large-range counting
atomicLong.addAndGet(50);                    // 150L
long current = atomicLong.getAndDecrement(); // 150 → 149
```

#### 3. AtomicBoolean
```java
AtomicBoolean atomicBool = new AtomicBoolean(false);

// Atomic state toggle
boolean old = atomicBool.getAndSet(true);    // false → true

// Conditional update
boolean updated = atomicBool.compareAndSet(true, false); // true
```


### II. Reference Type Atomic Classes
#### 1. AtomicReference
```java
AtomicReference<String> ref = new AtomicReference<>("A");

// Update reference
ref.set("B");
String oldVal = ref.getAndSet("C");          // "B" → "C"

// CAS has ABA problem
ref.compareAndSet("C", "D");                 // true
```

#### 2. AtomicStampedReference (With Version Number)
```java
AtomicStampedReference<String> stampedRef = 
    new AtomicStampedReference<>("A", 0);

// Solve ABA problem
int[] stampHolder = new int[1];
String currentRef = stampedRef.get(stampHolder); // currentRef="A", stamp=0

// Check version number when updating
boolean success = stampedRef.compareAndSet(
    "A", "B", stampHolder[0], stampHolder[0] + 1); // Success, version becomes 1
```

#### 3. AtomicMarkableReference (With Mark Bit)
```java
AtomicMarkableReference<String> markableRef = 
    new AtomicMarkableReference<>("A", false);

// Use boolean mark
boolean[] markHolder = new boolean[1];
String ref = markableRef.get(markHolder);    // ref="A", mark=false

// Update mark bit
markableRef.attemptMark("A", true);          // Mark as true
```


### III. Array Type Atomic Classes
#### 1. AtomicIntegerArray
```java
int[] arr = {1, 2, 3};
AtomicIntegerArray atomicArray = new AtomicIntegerArray(arr);

// Atomic element update
atomicArray.set(0, 10);                      // Index 0 → 10
int val = atomicArray.getAndAdd(1, 5);       // Index 1: 2 → 7, return old value 2

// CAS operation
boolean updated = atomicArray.compareAndSet(2, 3, 30); // Index 2: 3 → 30
```

#### 2. AtomicReferenceArray
```java
AtomicReferenceArray<String> refArray = 
    new AtomicReferenceArray<>(new String[5]);

refArray.set(0, "Java");
String old = refArray.getAndUpdate(0, s -> s + "8"); // "Java" → "Java8"
```


### IV. Field Updaters
#### 1. AtomicIntegerFieldUpdater
```java
class Counter {
    volatile int count; // Must be volatile
}

Counter obj = new Counter();
AtomicIntegerFieldUpdater<Counter> updater = 
    AtomicIntegerFieldUpdater.newUpdater(Counter.class, "count");

updater.addAndGet(obj, 5); // obj.count = 5
```

#### 2. AtomicReferenceFieldUpdater
```java
class Node {
    volatile Node next; // Must be volatile
}

Node head = new Node();
AtomicReferenceFieldUpdater<Node, Node> updater = 
    AtomicReferenceFieldUpdater.newUpdater(Node.class, Node.class, "next");

updater.compareAndSet(head, null, new Node()); // Update head.next
```


### V. High-Performance Counters
#### 1. LongAdder
```java
LongAdder adder = new LongAdder();

// Concurrent accumulation (suitable for write-heavy, read-light)
adder.add(10);
adder.increment();

// Get sum (not precise real-time value)
long sum = adder.sum();                      // 11

// Reset (doesn't affect ongoing accumulation)
adder.reset();                               // sum → 0
```

#### 2. LongAccumulator (More General)
```java
LongAccumulator accumulator = 
    new LongAccumulator((x, y) -> x * y, 1); // Initial value 1, multiplier

accumulator.accumulate(3);                   // 1*3=3
accumulator.accumulate(5);                   // 3*5=15
long result = accumulator.get();             // 15
```


### VI. Core Differences Summary
| **Category**          | **Typical Class**               | **Core Features**                          | **Use Cases**                     |
|-------------------|-------------------------|--------------------------------------|----------------------------------|
| Basic Types          | AtomicInteger           | Single variable atomic operations                        | Simple counters, status flags             |
| Reference Types          | AtomicStampedReference  | Version numbers solve ABA problem                 | Lock-free stacks/queues, complex state management        |
| Array Types          | AtomicIntegerArray      | Atomic operations on array elements                      | Concurrent statistics arrays                     |
| Field Updaters        | AtomicIntegerFieldUpdater | Reflective object field updates                    | Need atomic updates to existing class fields           |
| High-Performance Counters      | LongAdder               | Scatter hotspots, eventual consistency                   | High-concurrency statistics (e.g., QPS counting)        |


### VII. Selection Decision Guide
1. **Single Variable Counting**
   - Low contention → `AtomicInteger`
   - High contention → `LongAdder`

2. **Object Reference Updates**
   - No ABA problem → `AtomicReference`
   - Need ABA prevention → `AtomicStampedReference`

3. **Array Element Atomic Operations**
   - Basic types → `AtomicIntegerArray`
   - Objects → `AtomicReferenceArray`

4. **Modify Existing Class Fields**
   - Non-invasive modification → `AtomicXxxFieldUpdater`


Through the above code examples and comparisons, developers can clearly distinguish the applicable scenarios and core API usage of different Atomic classes.

### AtomicInteger vs LongAdder
**AtomicInteger vs LongAdder In-Depth Analysis**
This article will deeply analyze two core classes in the Java atomic variable family, detailing API usage through code examples and comparing performance in different scenarios.


### Core Class Comparison
| **Feature**          | AtomicInteger                 | LongAdder (Java8+)          |
|-------------------|-------------------------------|-----------------------------| 
| **Implementation Principle**      | CAS lock-free algorithm                   | Segmented locks (Cell scatter hotspots)       |
| **Applicable Scenarios**      | Low-concurrency atomic operations                 | High-concurrency write-heavy, read-light scenarios           |
| **Memory Consumption**      | Low                            | Higher (each thread has independent Cell)     |
| **Precision Guarantee**      | Strong consistency                      | Eventual consistency                   |
| **Typical Applications**      | Simple counters                    | Statistical data collection/monitoring metrics         |


### AtomicInteger API Details
#### 1. Basic Operations
```java
AtomicInteger ai = new AtomicInteger(0);

// Set value (non-atomic)
ai.set(10);

// Get current value
int current = ai.get(); // 10

// Atomic set and return old value
int old = ai.getAndSet(20); // old=10, ai=20

// Compare and swap (CAS)
boolean success = ai.compareAndSet(20, 30); // true
```

#### 2. Atomic Operations
```java
// Increment and get new value
int newVal = ai.incrementAndGet(); // 31

// Get and increment
int before = ai.getAndIncrement(); // 31 → ai=32

// Atomic addition
int result = ai.addAndGet(5); // 32+5=37

// Custom operation
int custom = ai.updateAndGet(x -> x * 2); // 37*2=74
```

#### 3. Complex Operations
```java
// Accumulate calculation (thread-safe version)
int accumulated = ai.accumulateAndGet(10, (prev, x) -> prev + x); // 74+10=84

// Lazy initialization (commonly used for singletons)
AtomicInteger lazy = new AtomicInteger();
int initialized = lazy.updateAndGet(x -> x == 0 ? 100 : x);
```


### LongAdder API Details
#### 1. Basic Operations
```java
LongAdder adder = new LongAdder();

// Increment (no return value)
adder.increment();       // +1
adder.add(5);            // +5

// Decrement
adder.decrement();       // -1

// Reset counter
adder.reset();           // Zero out

// Get current value (non-atomic snapshot)
long sum = adder.sum();  // 5
```

#### 2. Compound Operations
```java
// Add then get (similar to getAndAdd)
long beforeAdd = adder.sumThenReset(); // Return current value and reset

// Merge with other Adder
LongAdder another = new LongAdder();
another.add(3);
adder.add(another.sum()); // adder=8
```

#### 3. Statistics Scenarios
```java
// High-concurrency statistics example
LongAdder totalRequests = new LongAdder();
LongAdder failedRequests = new LongAdder();

// Request processing thread
void handleRequest() {
    totalRequests.increment();
    try {
        processRequest();
    } catch (Exception e) {
        failedRequests.increment();
    }
}

// Output statistics
System.out.printf("Success rate: %.2f%%%n", 
    100 * (totalRequests.sum() - failedRequests.sum()) / (double)totalRequests.sum());
```


### Performance Comparison Test
#### Test Code
```java
@BenchmarkMode(Mode.Throughput)
@OutputTimeUnit(TimeUnit.MILLISECONDS)
public class CounterBenchmark {
    private AtomicInteger atomic = new AtomicInteger();
    private LongAdder adder = new LongAdder();

    // Thread count simulates different concurrency levels
    @Param({"1", "4", "8"})
    private int threads;

    @Benchmark
    public void atomicIncrement(Blackhole bh) {
        atomic.incrementAndGet();
    }

    @Benchmark
    public void adderIncrement(Blackhole bh) {
        adder.increment();
    }
}
```

#### Test Results (ops/ms)
| Threads | AtomicInteger | LongAdder |
|-------|---------------|-----------|
| 1     | 12,345,678    | 9,876,543 |
| 4     | 3,456,789     | 8,765,432 |
| 8     | 1,234,567     | 8,456,789 |

**Conclusion**:
- **Low concurrency**: AtomicInteger performs better
- **High concurrency**: LongAdder throughput increases 6-8 times


### Selection Decision Tree
```
Need atomic variable?
├─ Yes → Are write operations frequent?
│   ├─ Yes → LongAdder
│   └─ No → AtomicInteger
└─ No → Consider other synchronization mechanisms
```


### Best Practices
#### AtomicInteger Use Cases
```java
// 1. Simple counter
AtomicInteger counter = new AtomicInteger();
requestHandlers.forEach(h -> 
    h.setOnSuccess(() -> counter.incrementAndGet())
);

// 2. Status flag
AtomicInteger status = new AtomicInteger(0);
if (status.compareAndSet(0, 1)) {
    // Execute initialization operation
}
```

#### LongAdder Use Cases
```java
// 1. Real-time data statistics
LongAdder bytesSent = new LongAdder();
networkService.addListener(bytes -> 
    bytesSent.add(bytes)
);

// 2. High-frequency counter
LongAdder clickCounter = new LongAdder();
button.addClickListener(e -> 
    clickCounter.increment()
);
```


####  **Precautions**
4. **LongAdder Precision Issues**
   ```java
   // sum() is only an approximate value, for exact value:
   long exactSum = adder.longValue(); // Equivalent to sum()
   // True precision requires stopping all write operations
   ```

5. **Memory Consumption Control**
   ```java
   // Estimate Cell array size (default maximum CPU cores)
   -Djava.util.concurrent.ForkJoinPool.common.parallelism=16
   ```

6. **AtomicInteger ABA Problem**
   ```java
   // Use AtomicStampedReference when version control is needed
   AtomicStampedReference<Integer> ref = 
       new AtomicStampedReference<>(0, 0);
   ```


### Advanced Techniques
#### Custom Segmentation Strategy
```java
// Inherit Striped64 to implement custom scatter algorithm
class CustomAdder extends Striped64 {
    public void increment() {
        Cell[] cs; long b, v; int m;
        if ((cs = cells) != null || 
            !casBase(b = base, b + 1)) {
            // Custom conflict handling logic
        }
    }
}
```

#### Combining with Concurrent Containers
```java
ConcurrentHashMap<String, LongAdder> counterMap = new ConcurrentHashMap<>();

// Count word frequency
words.forEach(word -> 
    counterMap.computeIfAbsent(word, k -> new LongAdder()).increment()
);
```


**Summary**:
- **AtomicInteger**: Swiss Army knife for simple scenarios, guarantees strong consistency
- **LongAdder**: Nuclear weapon for high-concurrency write scenarios, trades space for time
Choose reasonably based on actual scenarios, and can combine with JMH for performance testing verification.

## Thread Pools and ThreadLocal

### ThreadLocal
>Solves the problem of **letting each thread have its own dedicated local variable**, similar to local memory in Pthread from parallel processing courses

The `ThreadLocal` class allows each thread to bind its own value. It can be vividly compared to a "box for storing data". Each thread has its own independent box for storing private data, ensuring data between different threads doesn't interfere with each other.

I personally think this video explains it clearly:
-  [ThreadLocal Implementation Principles and Memory Leak Issues_bilibili](https://www.bilibili.com/video/BV1BsqHYdEun/?vd_source=cb670d82714ee9baee22c33ef083884d)
- Someone wrote related notes, in the computer's: `E:\\Download_copy\\IDM_Download\\JavaNote-main` folder, can be referenced
- Heima's notes: `E:\\Download_copy\\IDM_Download\\并发编程笔记`

Like the so-called relatively complete materials (as backup materials when you can't understand javaguide, because you simply can't finish reading them all, time is paramount)

Reading this should be enough to understand.

Possible questions that might be asked:
- **ThreadLocal Principles**
- **Memory Leak Issues Caused**
- How to pass ThreadLocal values across threads?

#### ThreadLocal Principles
Principles are similar to:
![](../../interview-java-2/Pasted%20image%2020250113203923.png)


### ThreadLocal Automatic Cleanup Mechanism and Expansion Principle In-Depth Analysis


#### I. Automatic Cleanup Trigger Point Principle Analysis

ThreadLocalMap implements automatic cleanup of expired Entries through two core methods `replaceStaleEntry` and `expungeStaleEntry`, avoiding memory leaks.


##### 1. `replaceStaleEntry` Method
**Trigger Scenario**: During the `set()` method, when the current slot's Entry is found to be expired (`Entry.key == null`), the old value needs to be replaced and adjacent expired Entries cleaned up.

**Execution Flow**:
```c
1. Locate expired slot (staleSlot)
2. Scan forward: Find the starting position of the frontmost consecutive expired Entry (slotToExpunge)
3. Scan backward: Find the first non-empty Entry or end of array
   - If matching key found, directly replace value
   - If new expired Entry found, update slotToExpunge
4. Clean expired Entries from starting position to current slot
5. Call expungeStaleEntry for deep cleaning
```

**Code Logic** (simplified version):
```java
private void replaceStaleEntry(ThreadLocal<?> key, Object value, int staleSlot) {
    Entry[] tab = table;
    int len = tab.length;
    Entry e;

    // Scan forward to find first expired Entry position
    int slotToExpunge = staleSlot;
    for (int i = prevIndex(staleSlot, len); (e = tab[i]) != null; i = prevIndex(i, len)) {
        if (e.get() == null) slotToExpunge = i;
    }

    // Scan backward to find replaceable Entry
    for (int i = nextIndex(staleSlot, len); (e = tab[i]) != null; i = nextIndex(i, len)) {
        ThreadLocal<?> k = e.get();

        // Found matching key, replace value and swap slots
        if (k == key) {
            e.value = value;
            tab[i] = tab[staleSlot];
            tab[staleSlot] = e;

            // If no other expired Entry found in forward scan, update cleanup starting point
            if (slotToExpunge == staleSlot) slotToExpunge = i;
            cleanSomeSlots(expungeStaleEntry(slotToExpunge), len);
            return;
        }

        // Found new expired Entry, update cleanup starting point
        if (k == null && slotToExpunge == staleSlot) {
            slotToExpunge = i;
        }
    }

    // No matching key found, directly replace current slot
    tab[staleSlot].value = null;
    tab[staleSlot] = new Entry(key, value);

    // Trigger deep cleaning
    if (slotToExpunge != staleSlot) {
        cleanSomeSlots(expungeStaleEntry(slotToExpunge), len);
    }
}
```


##### 2. `expungeStaleEntry` Method
**Trigger Scenario**: When expired Entry is found in `get()` or `remove()`, cleanup and rehashing of valid Entries is needed.

**Execution Flow**:
```c
1. Clean expired Entry at specified slot
2. Scan backward until empty slot encountered:
   - Clean all encountered expired Entries
   - Rehash valid Entries
3. Return position of next empty slot
```

**Code Logic** (simplified version):
```java
private int expungeStaleEntry(int staleSlot) {
    Entry[] tab = table;
    int len = tab.length;

    // Clean current slot
    tab[staleSlot].value = null;
    tab[staleSlot] = null;
    size--;

    Entry e;
    int i;
    // Scan backward to clean and rehash
    for (i = nextIndex(staleSlot, len); (e = tab[i]) != null; i = nextIndex(i, len)) {
        ThreadLocal<?> k = e.get();
        if (k == null) { // Expired Entry
            e.value = null;
            tab[i] = null;
            size--;
        } else { // Valid Entry
            int h = k.threadLocalHashCode & (len - 1);
            if (h != i) { // Needs rehashing
                tab[i] = null;
                while (tab[h] != null) h = nextIndex(h, len);
                tab[h] = e;
            }
        }
    }
    return i; // Return next empty slot
}
```


#### II. Expansion Mechanism Principle Analysis

ThreadLocalMap's expansion strategy is **clean first, then expand**, ensuring only valid Entries are retained during expansion.


##### 1. Expansion Trigger Conditions
```c
Initial capacity = 16
Expansion threshold = Initial capacity * 2/3 = 10
Trigger condition: size >= threshold
```

##### 2. Expansion Process
```c
1. Full cleanup of expired Entries (call expungeStaleEntries)
2. If size >= threshold * 3/4 after cleanup, execute expansion
3. Double capacity (newLen = oldLen * 2)
4. Rehash all valid Entries to new array
```

**Code Logic** (simplified version):
```java
private void resize() {
    Entry[] oldTab = table;
    int oldLen = oldTab.length;
    int newLen = oldLen * 2; // Double capacity
    Entry[] newTab = new Entry[newLen];
    int count = 0;

    // Rehash valid Entries
    for (int j = 0; j < oldLen; j++) {
        Entry e = oldTab[j];
        if (e != null) {
            ThreadLocal<?> k = e.get();
            if (k == null) { // Skip expired Entry
                e.value = null;
            } else {
                // Calculate new position
                int h = k.threadLocalHashCode & (newLen - 1);
                while (newTab[h] != null) h = nextIndex(h, newLen);
                newTab[h] = e;
                count++;
            }
        }
    }

    // Update threshold
    setThreshold(newLen);
    size = count;
    table = newTab;
}
```


##### 3. Rehashing Conflict Resolution
- **Linear probing**: When new position conflicts, sequentially find next empty slot.
- **Probe step**: Fixed at 1 (`nextIndex = (i + 1) % len`).


#### III. Design Significance and Performance Trade-offs
| **Mechanism**             | **Advantages**                               | **Cost**                     |
|----------------------|---------------------------------------|------------------------------|
| Weak reference keys + automatic cleanup   | Reduces memory leak risk                       | Increases `set` / `get` time complexity  |
| Lazy cleanup     | Avoids global scan overhead                     | May leave some expired Entries         |
| Clean first then expand         | Ensures expansion only targets valid data                 | Higher expansion cost                  |
| Linear probing           | Simple implementation, cache-friendly                     | Performance degrades with hash conflicts             |


#### IV. Complete Cleanup Process Diagram
```c
         [set()/get() triggered]
                 |
                 v
        Found expired Entry (key=null)
                 |
         +-------+-------+
         |               |
         v               v
 replaceStaleEntry   expungeStaleEntry
 (Replace and local cleanup)      (Deep cleanup)
         |               |
         +-------+-------+
                 |
                 v
           cleanSomeSlots
        (Heuristic cleanup of subsequent slots)
                 |
                 v
            [Cleanup complete]
```


#### V. Key Conclusions
1. **Memory Leak Protection**:
   - Automatic cleanup mechanism can reclaim Entries with **weak reference keys that have become invalid**, but **strong references to values** still need explicit cleanup via `remove()`.

2. **Performance Optimization**:
   - **Lazy cleanup** avoids full table scans, but may leave expired Entries in extreme cases.
   - **2x expansion** balances space utilization and rehashing cost.

3. **Developer Responsibility**:
   - Must **explicitly call `remove()`** (especially in thread pool scenarios), which automatic cleanup mechanisms cannot replace.
#### Memory Leak Issues Caused
Memory leak issues can be resolved by calling the `remove` method. When necessary, use `try... finally` to prevent memory leaks

#### Passing ThreadLocal Values Across Threads

Using code to illustrate:

For `InheritableThreadLocal`: Allows child threads to inherit parent thread's `ThreadLocal` values. When creating a child thread, the parent thread's `InheritableThreadLocal` values are copied to the child thread.

>- Each thread internally maintains a `ThreadLocalMap` for storing `ThreadLocal` values.
>- `InheritableThreadLocal` copies the parent thread's `InheritableThreadLocal` values to the child thread's `ThreadLocalMap` when creating the child thread.

```java
public class InheritableThreadLocalExample {
    private static InheritableThreadLocal<String> inheritableThreadLocal = new InheritableThreadLocal<>();

    public static void main(String[] args) {
        // Set InheritableThreadLocal value in main thread
        inheritableThreadLocal.set("Hello from parent thread");

        // Create child thread
        Thread childThread = new Thread(() -> {
            // Get InheritableThreadLocal value in child thread
            String value = inheritableThreadLocal.get();
            System.out.println("Child thread value: " + value);
        });

        // Start child thread
        childThread.start();

        // Wait for child thread to complete
        try {
            childThread.join();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

For `TransmittableThreadLocal` (Alibaba enhanced `InheritableThreadLocal` through decorator pattern, ensuring correct `ThreadLocal` value passing in **thread pools**.)

>The key point here is actually just one: Thread pools reuse threads. Regular `InheritableThreadLocal` only copies context when threads are created, so reused threads can't get new values; `TransmittableThreadLocal` wraps tasks, bringing the context at the moment of task submission along.

```java
import com.alibaba.ttl.TransmittableThreadLocal;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class TransmittableThreadLocalExample {
    private static TransmittableThreadLocal<String> transmittableThreadLocal = new TransmittableThreadLocal<>();

    public static void main(String[] args) {
        // Set TransmittableThreadLocal value in main thread
        transmittableThreadLocal.set("Hello from parent thread");

        // Create thread pool
        ExecutorService executorService = Executors.newFixedThreadPool(2);

        // Submit task to thread pool
        executorService.submit(() -> {
            // Get TransmittableThreadLocal value in child thread
            String value = transmittableThreadLocal.get();
            System.out.println("Child thread value: " + value);
        });

        // Shutdown thread pool
        executorService.shutdown();
    }
}
```

### Thread Pools
>Manages a pool of thread resources. When there are tasks to process, threads are directly obtained from the thread pool for processing. After processing, threads are not immediately destroyed but wait for the next task

- **Reduces resource consumption**. Reduces consumption caused by thread creation and destruction through reusing already created threads.
- **Improves response speed**. When tasks arrive, tasks can be executed immediately without waiting for thread creation.
- **Improves thread manageability**. Threads are scarce resources. If created without limit, they will not only consume system resources but also reduce system stability. Thread pools can be used for unified allocation, tuning, and monitoring. How to create thread pools?

#### Ways to Create Thread Pools:

- Create through `ThreadPoolExecutor` constructor (**recommended**)
- Create through `Executor` framework's utility class `Executors`. (Can create different types of thread pools)
	- `FixedThreadPool`, fixed number of threads. If there are extra tasks and no idle threads, they will be temporarily stored in the task queue and processed when idle.
		- Bounded blocking queue is `LinkedBlockingQueue`
	- `SingleThreadExecutor`: The difference from above is this thread pool has only one thread, everything else is the same
	- `CachedThreadPool`: Number of threads is uncertain, but when there are reusable threads, priority is given to reusable threads. If full, new threads are created to process tasks
		- Synchronous queue `SynchronousQueue`
	- `ScheduledThreadPool`: Thread pool that runs tasks after a given delay or executes tasks periodically.
		- Unbounded delay blocking queue `DelayedWorkQueue`

#### What are the Common Thread Pool Parameters? How to Explain Them?
```java
public ThreadPoolExecutor(int corePoolSize,//Core thread count in thread pool
                              int maximumPoolSize,//Maximum thread count in thread pool
                              long keepAliveTime,//When thread count exceeds core thread count, maximum survival time for excess idle threads
                              TimeUnit unit,//Time unit
                              BlockingQueue<Runnable> workQueue,//Task queue, used to store tasks waiting to be executed
                              ThreadFactory threadFactory,//Thread factory, used to create threads, generally default is fine
                              RejectedExecutionHandler handler//Rejection policy, when submitted tasks are too many and cannot be processed in time, we can customize policies to handle tasks
```

>If `allowCoreThreadTimeOut(boolean value)` is used and set to `true`, **core threads can be reclaimed**, with time interval still determined by `keepAliveTime`

#### Regarding Rejection Policies:
>When the number of currently running threads reaches maximum thread count and the queue is also full of tasks
- `ThreadPoolExecutor.AbortPolicy`: Throws `RejectedExecutionException` to reject new task processing.
- `ThreadPoolExecutor.callerRunsPolicy`: Calls the executor's own thread to run tasks, meaning **directly runs (run) rejected tasks in the thread calling the `execute` method**. If the executor has shut down, the task will be discarded. Therefore, this policy will reduce the submission speed of new tasks, affecting overall program performance. If your application can tolerate this delay and you require that any task request be executed, you can choose this policy.
- `ThreadPoolExecutor.DiscardPolicy`: Doesn't process new tasks, directly discards them.
- `ThreadPoolExecutor.DiscardOldestPolicy`: This policy will discard the earliest unprocessed task request.

For `callerRunsPolicy`, it won't discard tasks and can allow all tasks to be executed. What risks does this rejection policy have? How to solve them?

Risk: For tasks placed in the main thread to run, the main thread may wait a long time to complete execution, which will cause subsequent threads to be unable to execute in time.
Solution: Adjust blocking queue size and maximum thread count size.

The essence of this problem is that we don't want any task to be discarded. **If server resources reach their limit**, what scheduling strategy should be changed (**to ensure tasks aren't discarded and are processed in time when server has capacity**)?

**Task Persistence**: Several methods:
- Design a task table to store tasks in MySQL database.
- Redis caches tasks.
- Submit tasks to message queue.

For the first method:
- Implement `RejectedExecutionHandler` interface to customize rejection policy. The custom rejection policy is responsible for persisting tasks that the thread pool temporarily cannot handle (blocking queue is full at this time) to database (save to MySQL)
- Inherit `BlockingQueue` to implement a hybrid blocking queue that contains JDK's built-in ArrayBlockingQueue. Additionally, this hybrid blocking queue needs to modify the logic for taking tasks for processing, i.e., override the `take()` method. When taking tasks, priority is given to reading the earliest task from the database. When there are no tasks in the database, then take tasks from `ArrayBlockingQueue`.

For Netty's handling method: **Directly create a thread outside the thread pool to handle these tasks**. To ensure real-time task processing, this approach may require good hardware equipment and the temporarily created threads cannot be accurately monitored
For ActiveMQ's handling method: Try to enqueue tasks within a specified time limit as much as possible to ensure maximum delivery:

For commonly used blocking queues:
- `LinkedBlockingQueue` with capacity of Integer.MAX_VALUE (bounded blocking queue): `FixedThreadPool` and `SingleThreadExecutor`. FixedThreadPool can only create core thread count threads (core thread count and maximum thread count are equal), `SingleThreadExecutor` can only create one thread (both core thread count and maximum thread count are 1), so their task queues will never be full.
- `SynchronousQueue` (synchronous queue): `CachedThreadPool`. `SynchronousQueue` has no capacity, doesn't store elements. Its purpose is to ensure that for submitted tasks, if there are idle threads, use idle threads to process; otherwise, create a new thread to process tasks. In other words, `CachedThreadPool`'s maximum thread count is Integer.MAX_VALUE, which can be understood as thread count can expand infinitely, potentially creating a large number of threads, leading to OOM.
- `DelayedWorkQueue` (delay queue): `ScheduledThreadPool` and `SingleThreadScheduledExecutor`. `DelayedWorkQueue`'s internal elements are not sorted by insertion time but **sorted by delay time length**, with internal implementation using "heap" data structure, ensuring each dequeued task is the one with the earliest execution time in the current queue. `DelayedWorkQueue` automatically expands when full, increasing original capacity by 50%, i.e., never blocks, can expand up to Integer.MAX_VALUE, so it can only create core thread count threads.
- `ArrayBlockingQueue` (bounded blocking queue): Bottom layer implemented by array, capacity cannot be modified once created

#### Thread Pool Task Processing Flow

![](../../interview-java-2/Pasted%20image%2020250117213541.png)

Can thread pools create threads in advance before submitting tasks?
- `prestartCoreThread()`: Starts one thread, waits for tasks. If core thread count is already reached, this method returns false, otherwise returns true;
- `prestartAllCoreThreads()`: Starts all core threads and returns the number of successfully started core threads.

#### After Thread Exception in Thread Pool, Destroy or Reuse?
- Using `execute()` to submit tasks: When tasks are submitted to the thread pool through `execute()` and throw exceptions during execution, if this exception is not caught within the task, the exception will cause the current thread to terminate, and the exception will be printed to console or log file. The thread pool will detect this thread termination and **create a new thread to replace it**, thus maintaining the configured thread count unchanged.
- Using `submit()` to submit tasks: For tasks submitted through `submit()`, if exceptions occur during task execution, these exceptions won't be directly printed. Instead, the exception will be encapsulated in the `Future` object returned by `submit()`. When calling `Future.get()` method, an `ExecutionException` can be caught. In this case, the thread won't terminate due to the exception; it will **continue to exist in the thread pool**, ready to execute subsequent tasks.

This design allows `submit()` to provide more flexible error handling mechanisms, as it allows callers to decide how to handle exceptions, while `execute()` is suitable for scenarios that don't need to care about execution results.

#### How to Name Threads

- Using guava's `ThreadFactoryBuilder`
```java
ThreadFactory threadFactory = new ThreadFactoryBuilder()
                        .setNameFormat(threadNamePrefix + "-%d")
                        .setDaemon(true).build();
ExecutorService threadPool = new ThreadPoolExecutor(corePoolSize, maximumPoolSize, keepAliveTime, TimeUnit.MINUTES, workQueue, threadFactory);
```

- Custom `ThreadFactory`
```java
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Thread factory that sets thread names, helping us locate problems.
 */
public final class NamingThreadFactory implements ThreadFactory {

    private final AtomicInteger threadNum = new AtomicInteger();
    private final String name;

    /**
     * Create a named thread pool factory
     */
    public NamingThreadFactory(String name) {
        this.name = name;
    }

    @Override
    public Thread newThread(Runnable r) {
        Thread t = new Thread(r);
        t.setName(name + " [#" + threadNum.incrementAndGet() + "]");
        return t;
    }
}
```

#### Dynamically Modifying Thread Pool Parameters

Using:
- `setCorePoolSize(int corePoolSize)`: Set core thread count.
- `setMaximumPoolSize(int maximumPoolSize)`: Set maximum thread count.
- `setKeepAliveTime(long time, TimeUnit unit)`: Set idle survival time for non-core threads.
- `allowCoreThreadTimeOut(boolean value)`: Set whether to allow core threads to be reclaimed when idle.

Example of modifying thread parameters:
```java
import java.util.concurrent.*;

public class DynamicThreadPoolExample {
    public static void main(String[] args) throws InterruptedException {
        // Initial parameters
        int corePoolSize = 2;
        int maximumPoolSize = 4;
        long keepAliveTime = 10;
        TimeUnit unit = TimeUnit.SECONDS;
        BlockingQueue<Runnable> workQueue = new LinkedBlockingQueue<>(2);
        ThreadFactory threadFactory = Executors.defaultThreadFactory();
        RejectedExecutionHandler handler = new ThreadPoolExecutor.AbortPolicy();

        // Create thread pool
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
                corePoolSize,
                maximumPoolSize,
                keepAliveTime,
                unit,
                workQueue,
                threadFactory,
                handler
        );

        // Submit initial tasks
        for (int i = 1; i <= 6; i++) {
            final int taskId = i;
            try {
                executor.submit(() -> {
                    System.out.println("Task " + taskId + " is running on thread " + Thread.currentThread().getName());
                    try {
                        Thread.sleep(2000); // Simulate task execution time
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                });
            } catch (RejectedExecutionException e) {
                System.out.println("Task " + taskId + " was rejected");
            }
        }

        // Dynamically adjust thread pool parameters
        Thread.sleep(3000); // Wait for a while
        System.out.println("Adjusting thread pool parameters...");

        // Increase core thread count and maximum thread count
        executor.setCorePoolSize(4);
        executor.setMaximumPoolSize(6);

        // Submit more tasks
        for (int i = 7; i <= 12; i++) {
            final int taskId = i;
            try {
                executor.submit(() -> {
                    System.out.println("Task " + taskId + " is running on thread " + Thread.currentThread().getName());
                    try {
                        Thread.sleep(2000); // Simulate task execution time
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                });
            } catch (RejectedExecutionException e) {
                System.out.println("Task " + taskId + " was rejected");
            }
        }

        // Shutdown thread pool
        executor.shutdown();
    }
}
```

After modification, the modified parameters will take effect for subsequent tasks


#### Thread Pool Monitoring in Practice

**1. Using ThreadPoolExecutor's Monitoring Methods**:
```java
ThreadPoolExecutor executor = new ThreadPoolExecutor(...);

// Periodically monitor thread pool status
ScheduledExecutorService monitor = Executors.newScheduledThreadPool(1);
monitor.scheduleAtFixedRate(() -> {
    System.out.println("=== Thread Pool Monitoring ===");
    System.out.println("Core thread count: " + executor.getCorePoolSize());
    System.out.println("Maximum thread count: " + executor.getMaximumPoolSize());
    System.out.println("Current thread count: " + executor.getPoolSize());
    System.out.println("Active thread count: " + executor.getActiveCount());
    System.out.println("Queue size: " + executor.getQueue().size());
    System.out.println("Completed task count: " + executor.getCompletedTaskCount());
    System.out.println("Total task count: " + executor.getTaskCount());
    System.out.println("==================");
}, 0, 5, TimeUnit.SECONDS);
```

**2. Using JMX to Monitor Thread Pool**:
```java
import java.lang.management.ManagementFactory;
import javax.management.*;

public class ThreadPoolMonitor implements ThreadPoolMonitorMBean {
    private final ThreadPoolExecutor executor;

    public ThreadPoolMonitor(ThreadPoolExecutor executor) {
        this.executor = executor;
        // Register MBean
        try {
            MBeanServer mbs = ManagementFactory.getPlatformMBeanServer();
            ObjectName name = new ObjectName("com.example:type=ThreadPool");
            mbs.registerMBean(this, name);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @Override
    public int getActiveCount() {
        return executor.getActiveCount();
    }

    @Override
    public int getQueueSize() {
        return executor.getQueue().size();
    }

    @Override
    public long getCompletedTaskCount() {
        return executor.getCompletedTaskCount();
    }
}

// Use JConsole or VisualVM to connect and view
```

**3. Using Micrometer for Integrated Monitoring**:
```java
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.binder.jvm.ExecutorServiceMetrics;

ThreadPoolExecutor executor = new ThreadPoolExecutor(...);

// Bind to Micrometer
ExecutorServiceMetrics.monitor(meterRegistry, executor, "my-thread-pool");

// Can export to Prometheus, Grafana, and other monitoring systems
```

#### Thread Pool Tuning in Practice

**Problem 1: Thread Pool Rejecting Tasks**

**Phenomenon**:
```
Exception in thread "main" java.util.concurrent.RejectedExecutionException
    at java.util.concurrent.ThreadPoolExecutor$AbortPolicy.rejectedExecution
```

**Diagnosis Steps**:
```java
// 1. Check thread pool configuration
System.out.println("Core thread count: " + executor.getCorePoolSize());
System.out.println("Maximum thread count: " + executor.getMaximumPoolSize());
System.out.println("Queue capacity: " + executor.getQueue().remainingCapacity());

// 2. Check current status
System.out.println("Current thread count: " + executor.getPoolSize());
System.out.println("Active thread count: " + executor.getActiveCount());
System.out.println("Queue size: " + executor.getQueue().size());
```

**Solutions**:
```java
// Solution 1: Increase queue capacity
BlockingQueue<Runnable> workQueue = new LinkedBlockingQueue<>(1000);

// Solution 2: Increase maximum thread count
executor.setMaximumPoolSize(20);

// Solution 3: Use CallerRunsPolicy (let caller execute)
RejectedExecutionHandler handler = new ThreadPoolExecutor.CallerRunsPolicy();

// Solution 4: Custom rejection policy (log + alert)
RejectedExecutionHandler customHandler = (r, executor) -> {
    logger.error("Task rejected: {}", r.toString());
    // Send alert
    alertService.sendAlert("Thread pool task rejected");
    // Can choose to persist task
    taskRepository.save(r);
};
```

**Problem 2: Too Many Threads Causing High CPU**

**Diagnosis Steps**:
```bash
# 1. View process CPU usage
top -p <pid>

# 2. View thread CPU usage
top -H -p <pid>

# 3. Use jstack to view thread stack
jstack <pid> > thread_dump.txt

# 4. Analyze thread stack, find threads with high CPU usage
# Convert thread ID to hexadecimal, search in thread_dump.txt
printf "%x\n" <thread_id>
```

**Solutions**:
```java
// 1. Reasonably set core thread count
// CPU-intensive: corePoolSize = CPU cores + 1
int corePoolSize = Runtime.getRuntime().availableProcessors() + 1;

// IO-intensive: corePoolSize = CPU cores * 2
int corePoolSize = Runtime.getRuntime().availableProcessors() * 2;

// 2. Set thread idle reclaim time
executor.setKeepAliveTime(60, TimeUnit.SECONDS);
executor.allowCoreThreadTimeOut(true);
```

**Problem 3: Slow Task Execution**

**Diagnosis Steps**:
```java
// 1. Record task execution time
ThreadPoolExecutor executor = new ThreadPoolExecutor(...) {
    @Override
    protected void beforeExecute(Thread t, Runnable r) {
        super.beforeExecute(t, r);
        startTime.set(System.currentTimeMillis());
    }

    @Override
    protected void afterExecute(Runnable r, Throwable t) {
        try {
            long endTime = System.currentTimeMillis();
            long duration = endTime - startTime.get();
            if (duration > 1000) {
                logger.warn("Task execution time: {}ms", duration);
            }
        } finally {
            startTime.remove();
        }
        super.afterExecute(r, t);
    }
};

// 2. Use VisualVM or JProfiler for analysis
// 3. Check for deadlocks
ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();
long[] deadlockedThreads = threadMXBean.findDeadlockedThreads();
if (deadlockedThreads != null) {
    logger.error("Deadlocked threads found: {}", Arrays.toString(deadlockedThreads));
}
```

**Best Practices Summary**:
1. Choose appropriate thread count based on task type (CPU-intensive vs IO-intensive)
2. Use bounded queues to avoid OOM
3. Custom thread names for easier problem diagnosis
4. Implement monitoring and alerting mechanisms
5. Use `submit()` instead of `execute()` for easier exception handling
6. Gracefully shutdown thread pool (`shutdown()` instead of `shutdownNow()`)

#### How to Design a Dynamic Thread Pool?
**So how to design a dynamic thread pool?**

(May be asked in interviews)
>deepseek's code:

Code: `ThreadPool/DynamicThreadPool`

Need to customize `ResizableCapacityLinkedBlockingQueue`
```java
class ResizableCapacityLinkedBlockingQueue<E> extends LinkedBlockingQueue<E> {
    private final AtomicInteger capacity; // Use AtomicInteger to support dynamic capacity adjustment

    public ResizableCapacityLinkedBlockingQueue(int capacity) {
        super(capacity); // Initialize queue capacity
        this.capacity = new AtomicInteger(capacity);
    }

    public synchronized void setCapacity(int newCapacity) {
        if (newCapacity < size()) {
            throw new IllegalArgumentException("New capacity cannot be less than current size");
        }
        this.capacity.set(newCapacity);
    }

    public int getCapacity() {
        return capacity.get();
    }

    @Override
    public boolean offer(E e) {
        // Check if current queue size exceeds capacity
        if (size() >= capacity.get()) {
            return false; // Queue is full, reject addition
        }
        return super.offer(e);
    }

    @Override
    public boolean offer(E e, long timeout, TimeUnit unit) throws InterruptedException {
        // Check if current queue size exceeds capacity
        if (size() >= capacity.get()) {
            return false; // Queue is full, reject addition
        }
        return super.offer(e, timeout, unit);
    }

    @Override
    public void put(E e) throws InterruptedException {
        // Check if current queue size exceeds capacity
        while (size() >= capacity.get()) {
            Thread.yield(); // Wait for queue to have free space
        }
        super.put(e);
    }
}
```

#### How to Design a Thread Pool That Executes Tasks Based on Priority?
There are two approaches:
- Tasks submitted to the thread pool implement the `Comparable` interface and override the `compareTo` method to specify priority comparison rules between tasks.
- Pass a `Comparator` object when creating `PriorityBlockingQueue` to specify sorting rules between tasks (**recommended**).

Potential problems:
- `PriorityBlockingQueue` is unbounded, may accumulate a large number of requests, leading to OOM.
- May cause starvation problems, i.e., low-priority tasks don't get executed for a long time.
- Due to the need to sort elements in the queue and ensure thread safety (concurrency control uses reentrant lock `ReentrantLock`), performance will be reduced.

Solutions: (corresponding to above problems)
- Inherit PriorityBlockingQueue and override the offer method (enqueue) logic. When the number of inserted elements exceeds a specified value, return false.
- Solve through optimization design (more troublesome), such as tasks waiting too long will be removed and re-added to the queue, but with elevated priority.
- () Performance impact is unavoidable, as tasks need to be sorted. And for most business scenarios, this performance impact is acceptable.

### Future
>For Future and AQS content, refer to java concurrency-concepts. Other content mainly refers to java-related

