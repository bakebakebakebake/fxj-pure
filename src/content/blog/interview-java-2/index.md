---
title: Java并发
description: 大概包括JMM、锁、原子类、ThreadLocal、线程池等内容。
publishDate: 2025-05-16
tags:
  - 八股
  - Java
  - 并发
  - JMM
  - 线程池
  - CompletableFuture
language: 中文
heroImageSrc: ../../pic/jessica-lewis-thepaintedsquare-1tsaxPdyTLk-unsplash.jpg
heroImageColor: " #b56c36 "
---


## 并发锁相关知识

### 死锁

多个线程同时被阻塞，它们中的一个或者全部都在等待某个资源被释放。由于线程被无限期地阻塞，因此程序不可能正常终止。

例如：线程 A 持有资源 2，线程 B 持有资源 1，他们同时都想申请对方的资源，所以这两个线程就会互相等待而进入死锁状态。

![](./Pasted%20image%2020241219171502.png)

对于这种情况的代码：
```java
public class DeadLockDemo {
    private static Object resource1 = new Object();//资源 1
    private static Object resource2 = new Object();//资源 2

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
        }, "线程 1").start();

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
        }, "线程 2").start();
    }
}
```

OUT：
```java
Thread[线程 1,5,main]get resource1
Thread[线程 2,5,main]get resource2
Thread[线程 1,5,main]waiting get resource2
Thread[线程 2,5,main]waiting get resource1
```

>线程 A 通过 `synchronized (resource1)` 获得 `resource1` 的监视器锁，然后通过 `Thread.sleep(1000);`让线程 A 休眠 1s 为的是让线程 B 得到执行然后获取到 `resource2` 的监视器锁。线程 A 和线程 B 休眠结束了都开始企图请求获取对方的资源，然后这两个线程就会陷入互相等待的状态，这也就产生了死锁。

产生死锁的必要条件：
1. 互斥条件:该资源任意一个时刻只由一个线程占用。
2. 请求与保持条件:一个线程因请求资源而阻塞时，对已获得的资源保持。
3. 不剥夺条件:线程已获得的资源在未使用完之前不能被其他线程强行剥夺，只有自己使用完毕后才释放资源。
4. 循环等待条件:若干线程之间形成一种头尾相接的循环等待资源关系,

#### 死锁相关处理

如何检测死锁？
>使用 jmap、jstack 等命令查看 JVM 线程栈和堆内存的情况。
- 如果有死锁，`jstack` 的输出中通常会有 `Found one Java-level deadlock:` 的字样，后面会跟着死锁相关的线程信息。另外，实际项目中还可以搭配使用 `top`、`df`、`free` 等命令查看操作系统的基本情况，出现死锁可能会导致 CPU、内存等资源消耗过高。
- 采用 VisualVM、JConsole 等工具进行排查。

如何预防和避免线程死锁?

预防：(破坏必要条件即可)

1. 破坏请求与保持条件:一次性申请所有的资源。
2. 破坏不剥夺条件:占用部分资源的线程进一步申请其他资源时，如果申请不到，可以**主动释放它占有的资源**。
3. 破坏循环等待条件:靠按序申请资源来预防。按某一顺序申请资源，释放资源则**反序释放**。破坏循环等待条件。

避免：借助于算法（比如银行家算法）对资源分配进行计算评估，使其进入**安全状态**。
>**安全状态**指的是系统能够按照某种线程推进顺序（P1、P2、P3……Pn）来为每个线程分配所需资源，直到满足每个线程对资源的最大需求，使每个线程都可顺利完成。称 `P1、P2、P3.....Pn` 序列为安全序列。

修改线程二的代码:可以避免死锁
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
        }, "线程 2").start();
```

OUT：
```java
Thread[线程 1,5,main]get resource1
Thread[线程 1,5,main]waiting get resource2
Thread[线程 1,5,main]get resource2
Thread[线程 2,5,main]get resource1
Thread[线程 2,5,main]waiting get resource2
Thread[线程 2,5,main]get resource2

Process finished with exit code 0
```

>线程 1 首先获得到 resource1 的监视器锁,这时候线程 2 就获取不到了。然后线程 1 再去获取 resource2 的监视器锁，可以获取到。然后线程 1 释放了对 resource1、resource2 的监视器锁的占用，线程 2 获取到就可以执行了。这样就破坏了破坏循环等待条件，因此避免了死锁。

### volatile

在 Java 中，`volatile` 关键字可以保证变量的可见性，如果我们将变量声明为 `volatile` ，这就指示 JVM，这个变量是共享且不稳定的，每次使用它都到主存中进行读取。

![373](./Pasted%20image%2020241219175154.png) ![366](./Pasted%20image%2020241219175214.png)

>在 C 语言中：原始的意义就是禁用 CPU 缓存。指示编译器，这个变量是共享且不稳定的，每次使用它都到主存中进行读取。

`volatile` 关键字能保证**数据的可见性**，但不能保证数据的原子性。`synchronized` 关键字两者都能保证。

#### 实战案例: 可见性问题

**问题代码**:
```java
public class VisibilityProblem {
    private static boolean flag = false; // 没有volatile

    public static void main(String[] args) throws InterruptedException {
        Thread writerThread = new Thread(() -> {
            try {
                Thread.sleep(1000);
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            flag = true; // 写线程修改flag
            System.out.println("Writer: flag设置为true");
        });

        Thread readerThread = new Thread(() -> {
            while (!flag) {
                // 可能永远循环,因为看不到flag的修改
            }
            System.out.println("Reader: 检测到flag为true");
        });

        readerThread.start();
        writerThread.start();
    }
}
```

**现象**: readerThread可能永远循环,因为:
1. JIT编译器可能将`while(!flag)`优化为`if(!flag) while(true)`
2. CPU缓存导致readerThread读取的是缓存中的旧值

**解决方案**:
```java
private static volatile boolean flag = false; // 添加volatile
```

**使用JMH验证可见性**:
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
            // 可能被优化
        }
    }

    @Benchmark
    @BenchmarkMode(Mode.AverageTime)
    public void testVolatileFlag() {
        volatileFlag = true;
        while (!volatileFlag) {
            // 保证可见性
        }
    }
}
```

#### 如何保证变量的可见性？
>具体如上

主内存与工作内存的直接交互：当一个变量被声明为 `volatile` 时，每当该变量被修改或读取时，线程会直接从主内存中读取或写入数据。**这使所有线程能够看到变量的最新值**。

#### 如何禁止指令重排序 ？
>如果我们将变量声明为 volatile ，在对这个变量进行读写操作的时候，会通过插入特定的内存屏障的方式来禁止指令重排序。

可以参考 [2.5.2 禁止进行指令重排序](https://swpu.feishu.cn/wiki/DQutwKIyKi84n3kX7bIcql2fnGh)

添加了一个内存屏障，通过插入内存屏障禁止在内存屏障前后的指令执行重排序优化

#### volatile 可以保证原子性么？
volatile 关键字能保证变量的可见性，但不能保证对变量的操作是原子性的。

不能

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
        // 等待1.5秒，保证上面程序执行完成
        Thread.sleep(1500);
        System.out.println(inc);
        threadPool.shutdown();
    }
}
```

对于这段代码：正常情况下输出的是 2500，而在这个地方结果是小于 2500 的。

问题在于 `inc++` 实际上是复合操作：
- 读取 `inc` 的值。
- 对 `inc` 加 1。
- 将 `inc` 的值写回内存。
而 `volatile` 无法保证这三个操作是具有原子性的，有可能导致下面这种情况出现：

- 线程 1 对 inc 进行读取操作之后，还未对其进行修改。
- 线程 2 又读取了 inc 的值并对其进行修改（+1），再将 inc 的值写回内存。
- 线程 2 操作完毕后，线程 1 对 inc 的值进行修改（+1），再将 inc 的值写回内存。
导致两个线程分别对 inc 进行了一次自增操作后，inc 实际上只增加了 1。

> [!success]- improve
> 利用 `synchronized`、`Lock` 或者 `AtomicInteger` 都可以让上面的代码变为正确输出结果。
> 
> 使用 `synchronized` 改进：
> ```java
> public synchronized void increase() {
>     inc++;
> }
> ```
> 使用 `AtomicInteger` 改进：
> ```java
> public AtomicInteger inc = new AtomicInteger();
> 
> public void increase() {
>     inc.getAndIncrement();
> }
> ```
> 使用 `ReentrantLock` 改进：
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

### 乐观锁和悲观锁
- **悲观锁**：共享资源每次只给一个线程使用，其它线程阻塞，用完后再把资源转让给其它线程。(例如：`synchronized` 和 `ReentrantLock`
	- 悲观锁在高并发的场景下，激烈的锁竞争会造成线程阻塞，大量阻塞线程会导致系统的上下文切换，**增加系统的性能开销**。并且，悲观锁还可能会存在**死锁问题**，影响代码的正常运行。
>悲观锁总是假设最坏的情况，认为共享资源每次被访问的时候就会出现问题(比如共享数据被修改)，所以每次在获取资源操作的时候都会上锁，这样其他线程想拿到这个资源就会阻塞直到锁被上一个持有者释放。
- **乐观锁**：线程可以不停地执行，无需加锁也无需等待，只是在提交修改的时候去**验证**对应的数据是否被其它线程修改了(例如：`AtomicInteger`、`LongAdder` 使用了乐观锁的 CAS 实现)
	- 乐观锁高并发的场景下，乐观锁相比悲观锁来说，不存在锁竞争造成线程阻塞，也不会有死锁的问题，在性能上往往会更胜一筹。如果冲突频繁发生（写占比非常多的情况），会频繁失败和重试，这样同样会非常影响性能，导致 CPU 飙升。

总结：
- **悲观锁**通常多用于写比较多的情况（**多写场景，竞争激烈**），这样可以避免频繁失败和重试影响性能，悲观锁的开销是固定的。如果乐观锁解决了频繁失败和重试这个问题的话（比如 LongAdder），也是可以考虑使用乐观锁的，要视实际情况而定。
- **乐观锁**通常多用于写比较少的情况（**多读场景，竞争较少**），这样可以避免频繁加锁影响性能。不过，乐观锁主要针对的对象是单个共享变量（参考 `java.util.concurrent.atomic` 包下面的原子变量类）。

#### 乐观锁的实现
乐观锁一般用版本号机制或 **CAS 算法**实现(CAS 算法更多)

##### 版本号机制
一般是在数据表中加上一个数据版本号 `version` 字段，表示数据被修改的次数。当数据被修改时，`version` 值会加一。当线程 A 要更新数据值时，在读取数据的同时也会读取 `version` 值，在提交更新时，若刚才读取到的 `version` 值为当前数据库中的 version **值相等时才更新**，否则重试更新操作，直到更新成功。

>e.g.如果有两个操作对象对数据库进行操作的时候，第一个对象对数据库操作完成后会将 `version` 变为 2，然后提交的是 `version` 和操作后的对象，而第二个操作对象操作完成的时候 `version` 仍然还是 1，**提交的时候会发现 `version` 不一致，所以提交会被驳回**！

##### CAS 算法
CAS 的全称是 `Compare And Swap`（比较与交换） ，用于**实现乐观锁**，被广泛应用于各大框架中。CAS 的思想很简单，就是用一个预期值和要更新的变量值进行比较，两值相等才会进行更新。

CAS 为一个**原子操作**，底层依赖于 CPU 的原子指令
>原子操作：操作一旦开始，就不能被打断，直到操作完成。

CAS 的三个操作数：
- V(var)：要更新的变量值
- E(Expected):期望值
- N(NEW)：写入的新值

当且仅当 `V===E` CAS 会用 N 来更新 V 的值即 `V<-N`，否则放弃更新(这个时候已经被更新过了)

>当多个线程同时使用 CAS 操作一个变量时，**只有一个会胜出**，并成功更新，其余均会失败，但失败的线程并不会被挂起，仅是被告知失败，并且允许再次尝试，当然也允许失败的线程放弃操作。

###### CAS 的实现

通过 C++与汇编实现，一个关键类为： Unsafe

提供的方法有：
>CAS 的具体实现与操作系统以及 CPU 密切相关。
```java
/**
  *  CAS
  * @param o         包含要修改field的对象
  * @param offset    对象中某field的偏移量
  * @param expected  期望值
  * @param update    更新值
  * @return          true | false
  */
public final native boolean compareAndSwapObject(Object o, long offset,  Object expected, Object update);

public final native boolean compareAndSwapInt(Object o, long offset, int expected,int update);

public final native boolean compareAndSwapLong(Object o, long offset, long expected, long update);
```

`java.util.concurrent.atomic` 包提供了一些用于**原子操作的类**。这些类利用底层的原子指令，确保在多线程环境下的操作是线程安全的。

原子类用于对某类型的变量进行原子操作，它利用 **Unsafe 类提供的低级别原子操作方法**实现无锁的线程安全性。

关于原子类的总结：[Atomic 原子类总结 | JavaGuide](https://javaguide.cn/java/concurrent/atomic-classes.html) Atomic 原子类

`AtomicInteger` 核心源码：
```java
// 获取 Unsafe 实例
private static final Unsafe unsafe = Unsafe.getUnsafe();
private static final long valueOffset;

static {
    try {
        // 获取“value”字段在AtomicInteger类中的内存偏移量
        valueOffset = unsafe.objectFieldOffset
            (AtomicInteger.class.getDeclaredField("value"));
    } catch (Exception ex) { throw new Error(ex); }
}
// 确保“value”字段的可见性
private volatile int value;

// 如果当前值等于预期值，则原子地将值设置为newValue
// 使用 Unsafe#compareAndSwapInt 方法进行CAS操作
public final boolean compareAndSet(int expect, int update) {
    return unsafe.compareAndSwapInt(this, valueOffset, expect, update);
}

// **原子地**将当前值加 delta 并返回旧值
public final int getAndAdd(int delta) {
    return unsafe.getAndAddInt(this, valueOffset, delta);
}

// **原子地**将当前值加 1 并返回加之前的值（旧值）
// 使用 Unsafe#getAndAddInt 方法进行CAS操作。
public final int getAndIncrement() {
    return unsafe.getAndAddInt(this, valueOffset, 1);
}

// **原子地**将当前值减 1 并返回减之前的值（旧值）
public final int getAndDecrement() {
    return unsafe.getAndAddInt(this, valueOffset, -1);
}
```

`Unsafe#getAndAddInt` 源码：
```java
// 原子地获取并增加整数值
public final int getAndAddInt(Object o, long offset, int delta) {
    int v;
    do {
        // 以 volatile 方式获取对象 o 在内存偏移量 offset 处的整数值
        v = getIntVolatile(o, offset);
    } while (!compareAndSwapInt(o, offset, v, v + delta));
    // 返回旧值
    return v;
}
```

在 `getAndAddInt` 方法中用 `do-while` 体现了操作失败时，会不断重试直到成功。
>即 `getAndAddInt` 方法会通过 `compareAndSwapInt` 方法来尝试更新 `value` 的值，如果更新失败，它会重新获取当前值并再次尝试更新，直到操作成功。

由于 CAS 操作可能会因为并发冲突而失败，因此通常会与 while 循环搭配使用，在失败后不断重试，直到操作成功。这就是**自旋锁机制**。

###### CAS 的问题
1. ABA 问题
>是 CAS 最常见的问题

如果一个变量 V 初次读取的时候是 A 值，并且在准备赋值的时候检查到它仍然是 A 值，那我们就能说明它的值没有被其他线程修改过了吗？很明显是不能的，因为**在这段时间它的值可能被改为其他值，然后又改回 A**，那 CAS 操作就会误认为它从来没有被修改过。这个问题被称为 CAS 操作的 **"ABA"问题**。

解决方式：追加上**版本号或者时间戳**
>JDK1.5 后 `AtomicStampedReference` 类用来解决 ABA 问题，其中的 `compareAndSet` 方法先检查当前引用是否等于预期引用，并且当前标志是否等于预期标志，如果全部相等，则以原子方式将该引用和该标志的值设置为给定的更新值。

2. 循环时间长开销大
CAS 经常会用到自旋操作来进行重试，也就是不成功就一直循环执行直到成功。如果长时间不成功，会给 CPU 带来非常大的执行开销。

如果 JVM 能够支持处理器提供的 pause 指令，那么自旋操作的效率将有所提升。

pause 指令有两个重要作用：
- 延迟流水线执行指令：pause 指令可以延迟指令的执行，从而减少 CPU 的资源消耗。具体的延迟时间取决于处理器的实现版本，在某些处理器上，延迟时间可能为零。
- 避免内存顺序冲突：在退出循环时，pause 指令可以避免由于内存顺序冲突而导致的 CPU 流水线被清空，从而提高 CPU 的执行效率。

3. 只能保证一个共享变量的原子操作
CAS 操作仅能对单个共享变量有效。当需要操作多个共享变量时，CAS 就显得无能为力。不过，从 JDK 1.5 开始，Java 提供了 `AtomicReference` 类，这使得我们能够保证引用对象之间的原子性。通过将多个变量封装在一个对象中，我们可以使用 `AtomicReference` 来执行 CAS 操作。
>除了 AtomicReference 这种方式之外，还可以利用加锁来保证。

### synchronized*
>主要解决的是多个线程之间访问资源的同步性，可以保证被它修饰的方法或者代码块在任意时刻只能有一个线程执行。

JDK 6之前为**重量级锁**(效率低)
>因为监视器锁（monitor）是依赖于底层的**操作系统**的 `Mutex Lock` 来实现的，Java 的线程是映射到操作系统的**原生线程**之上的。如果要挂起或者唤醒一个线程，都需要操作系统帮忙完成，而**操作系统实现线程之间的切换**时需要从用户态转换到内核态，这个状态之间的转换需要相对比较长的时间，时间成本相对较高。

JDK6 之后：引入了大量的优化如自旋锁、适应性自旋锁、锁消除、锁粗化、*偏向锁*、轻量级锁等技术来减少锁操作的开销
>`synchronized` 可以在项目中使用
>	*偏向锁*：增加了 JVM 的复杂性，同时也并没有为所有应用都带来性能提升。
>	- 在 JDK15 中，偏向锁被默认关闭（仍然可以使用 -XX:+UseBiasedLocking 启用偏向锁）
>	- 在 JDK18 中，偏向锁已经被彻底废弃（无法通过命令行打开）

锁主要存在四种状态，依次是：无锁状态、偏向锁状态、轻量级锁状态、重量级锁状态，他们会随着竞争的激烈而逐渐升级。**注意锁可以升级不可降级**，这种策略是为了提高获得锁和释放锁的效率。

**锁升级原理**详解：[浅析synchronized锁升级的原理与实现 - 小新成长之路 - 博客园](https://www.cnblogs.com/star95/p/17542850.html)：
#### 修饰场景
- 修饰实例方法
>锁当前对象实例，进入要获得当前对象实例的锁 
```java
synchronized void method() {
    //业务代码
}
```

- 修饰静态方法
>锁当前对象实例，进入同步代码前要获得当前 class 的锁
```java
synchronized static void method() {
    //业务代码
}
```

> [!question]
> 静态 `synchronized` 和非静态的 `synchronized` 方法之间的调用互斥吗？
> 
> 不互斥，因为访问静态 `synchronized` 方法占用的锁是**当前类的锁**，而访问非静态 `synchronized` 方法占用的锁是**当前实例对象锁**。
> 

- 修饰代码块

>`synchronized(object)` 表示进入同步代码库前要获得给定对象的锁。
>`synchronized(类.class)` 表示进入同步代码前要获得给定 `Class` 的锁

```java
synchronized(this) {
    //业务代码
}
```

**尽量不要使用 `synchronized(String a)` 因为 JVM 中，字符串常量池具有缓存功能。**

- 对于构造方法
>虽然不能直接在方法上修饰，但**可以在方法内部使用**(方法本身线程安全，如果在构造方法中涉及到共享资源的操作，就需要采取适当的同步措施来保证整个构造过程的线程安全。)

#### 底层原理
使用 `javap -v xx.class` 的命令查看字节码文件，可以知道：

##### synchronized 同步语句块的情况
```java
public class SynchronizedDemo {
    public void method() {
        synchronized (this) {
            System.out.println("synchronized 代码块");
        }
    }
}
```

- `synchronized` 同步语句块的实现使用的是 `monitorenter` 和 `monitorexit` 指令，分别为起点和终点
- 有两个 `monitorexit` 命令的原因是保证锁在同步代码块代码**正常执行**(执行了 exit 后会跳过出现异常位置的 exit)以及**出现异常**(会在后面执行命令)的这两种情况下都能被正确释放
- 当执行 `monitorenter` 时，线程试图获取锁也就是获取对象监视器 `monitor` 的持有权
>  - `monitor` 基于 `c++` 实现，每个对象都会内置一个 `ObjectMonitor` 对象。
>  - `wait/notify` 等方法也依赖于 `monitor` 对象，这就是为什么只有在**同步的块或者方法中**才能调用 `wait/notify` 等方法，否则会抛出 `java.lang.IllegalMonitorStateException` 的异常的原因。
- 在执行 `monitorenter` 时，会尝试获取对象的锁，如果锁的 **计数器为 0** 则表示锁可以被获取(获取锁成功)，获取后将锁计数器设为 1 也就是加 1。如果计数器不为 0，则获取锁失败(当前线程需要**阻塞等待**，直到锁被另外一个线程释放为止。)
- `monitorexit` 指令执行后，将锁计数器设为 0，表明锁被释放，其他线程可以尝试获取锁。

##### synchronized 修饰方法的的情况
```java
public class SynchronizedDemo2 {
    public synchronized void method() {
        System.out.println("synchronized 方法");
    }
}
```

- `synchronized` 修饰的方法并没有 `monitorenter` 指令和 `monitorexit` 指令，而是 `ACC_SYNCHRONIZED` 标识，JVM 通过该 `ACC_SYNCHRONIZED` 访问标志来辨别一个方法**是否声明为同步方法**，从而执行相应的同步调用。
- 如果是实例方法，JVM 会尝试获取实例对象的锁。如果是静态方法，JVM 会尝试获取当前 `class` 的锁。

但两者的**本质都是对对象监视器 `monitor` 的获取**。

对 `monitor` 的详解：[Java锁与线程的那些事](https://tech.youzan.com/javasuo-yu-xian-cheng-de-na-xie-shi/)

#### 与 volatile 有什么区别？*

- `volatile` 是线程同步的**轻量级实现**，所以 `volatile` 性能比 `synchronized` 关键字要好。但是 `volatile` 关键字只能用于变量而 `synchronized` 关键字可以**修饰方法以及代码块**。
- `volatile` 能保证数据的可见性，但不能保证数据的原子性。`synchronized` 两者都能保证。
- `volatile` 关键字主要用于解决变量在多个线程之间的可见性，而 `synchronized` 关键字解决的是多个线程之间访问资源的同步性。

### ReentrantLock

`ReentrantLock` 实现了 `Lock` 接口，是一个可重入且独占式的锁，和 `synchronized` 关键字类似。不过，`ReentrantLock` 更灵活、更强大，增加了轮询、超时、中断、公平锁和非公平锁等高级功能。

```java
public class ReentrantLock implements Lock, java.io.Serializable {}
```

![](./Pasted%20image%2020241221150553.png)

`ReentrantLock` 里面有一个内部类 `Sync`，`Sync` 继承 **AQS**（`AbstractQueuedSynchronizer`），添加锁和释放锁的大部分操作实际上都是在 `Sync` 中实现的。`Sync` 有公平锁 `FairSync` 和非公平锁 `NonfairSync` 两个子类。

>可以指定使用公平锁与非公平锁
>- 公平锁 : 锁被释放之后，先申请的线程先得到锁。性能较差一些，因为公平锁为了**保证时间上的绝对顺序**，上下文切换更频繁。
>- 非公平锁：锁被释放之后，后申请的线程可能会先获取到锁，**是随机或者按照其他优先级排序**的。性能更好，但可能会导致某些线程永远无法获取到锁。
```java
// 传入一个 boolean 值，true 时为公平锁，false 时为非公平锁
public ReentrantLock(boolean fair) {
    sync = fair ? new FairSync() : new NonfairSync();
}
```

**`ReentrantLock` 的底层就是由 `AQS` 来实现的**。

#### 与 synchronized 的区别*
>都为**可重入锁**：也叫递归锁，指的是**线程可以再次获取自己的内部锁**。比如一个线程获得了某个对象的锁，此时这个对象锁还没有释放，当其再次想要获取这个对象的锁的时候还是可以获取的，如果是不可重入锁的话，就会造成**死锁**。

`Lock` 实现类与 `synchronized` 都是可重入的。

> [!example]
> - 由于 `synchronized` 锁是可重入的，同一个线程在调用 `method1() ` 时可以直接获得当前对象的锁，执行 `method2()` 的时候可以再次获取这个对象的锁，不会产生死锁问题。
> - 假如 `synchronized` 是不可重入锁的话，由于该对象的锁已被当前线程所持有且无法释放，这就导致线程在执行 `method2()`时获取锁失败，会出现死锁问题。
> ```java
> public class SynchronizedDemo {
>     public synchronized void method1() {
>         System.out.println("方法1");
>         method2();
>     }
> 
>     public synchronized void method2() {
>         System.out.println("方法2");
>     }
> }
> ```

区别体现在：
- `synchronized` 依赖于 JVM 而 `ReentrantLock` 依赖于 API。
	-  `synchronized` 是在虚拟机层面实现的，并没有直接暴露给我们，
	- `ReentrantLock` 则是 JDK 实现的，可以查看它的源代码，来看它是如何实现的。
- `ReentrantLock` 比 `synchronized` 增加了一些高级功能：
	- **等待可中断** : `ReentrantLock` 提供了一种能够中断等待锁的线程的机制，通过 `lock.lockInterruptibly()` 来实现这个机制。也就是说当前线程在等待获取锁的过程中，如果其他线程中断当前线程「 `interrupt()` 」，当前线程就会抛出 `InterruptedException` 异常，可以捕捉该异常进行相应处理。
	- **可实现公平锁** : `ReentrantLock` 可以指定是公平锁还是非公平锁。而 `synchronized` 只能是非公平锁。
	- **可实现选择性通知**（锁可以绑定多个条件）: `synchronized` 关键字与 `wait()` 和 `notify()/notifyAll()` 方法相结合可以实现等待/通知机制。`ReentrantLock` 类当然也可以实现，但是需要借助于 `Condition` 接口与 `newCondition()` 方法。
	- **支持超时** ：`ReentrantLock` 提供了 `tryLock(timeout)` 的方法，可以指定等待获取锁的最长等待时间，如果超过了等待时间，就会获取锁失败，不会一直等待。

补充：
- **等待可中断**：理解 `lockInterruptibly()` 可以响应中断
	- 基本功能： `lockInterruptibly()` 试图获取锁，就像 `lock()` 一样。如果锁可用，当前线程将获取锁并继续执行。如果锁已经被其他线程持有，那么当前线程会被阻塞，直到获取到锁为止。
	- 中断支持：如果在呼叫 `lockInterruptibly()` 并被阻塞时，当前线程调用 `interrupt()` 中断自己，那么 `lockInterruptibly()` 会立即抛出 `InterruptedException`。
	- 使用场景：`lockInterruptibly()` 通常在需要保证响应性和可中断性的情况下使用。例如，在某些情况中，如果一个线程等待获取锁时可能长时间阻塞，**可以选择通过中断来允许其他任务继续执行**。
- `Condition` 接口
	- `Condition` 是 JDK1.5 之后才有的，它具有很好的灵活性，比如可以实现多路通知功能也就是在一个 `Lock` 对象中可以创建多个 `Condition` 实例（即对象监视器），在调度线程上更加灵活。
	- 使用 `notify()/notifyAll()` 方法进行通知时，被通知的线程是由 JVM 选择的，用 `ReentrantLock` 类结合 `Condition` 实例可以实现“选择性通知” 
		- `synchronized` 关键字就相当于整个 Lock 对象中只有一个 `Condition` 实例，所有的线程都注册在它一个身上。如果执行 `notifyAll()` 方法的话就会通知所有处于等待状态的线程，这样会造成很大的效率问题。
		- `Condition` 实例的 `signalAll()`方法，只会唤醒注册在该 `Condition` 实例中的所有等待线程。
- **支持超时**：为什么需要 `tryLock(timeout)` 这个功能呢？
	- 防止死锁： 在复杂的锁场景中，可以通过允许线程在合理的时间内放弃并重试来帮助防止死锁。
	- 提高响应速度： 防止线程无限期阻塞。
	- 处理时间敏感的操作： 对于具有严格时间限制的操作，tryLock(timeout) 允许线程在无法及时获取锁时继续执行替代操作。
- **可中断锁**和不可中断锁有什么区别？
	- 可中断锁：获取锁的过程中可以被中断，不需要一直等到获取锁之后才能进行其他逻辑处理。`ReentrantLock` 就属于是可中断锁。
	- 不可中断锁：一旦线程申请了锁，就只能等到拿到锁以后才能进行其他的逻辑处理。 `synchronized` 就属于是不可中断锁。

### Misc
>了解即可。

#### ReentrantReadWriteLock
`ReentrantReadWriteLock` 实现了 `ReadWriteLock` ，是一个可重入的读写锁，既可以保证多个线程同时读的效率，同时又可以保证有写入操作时的线程安全。

- 一般锁进行并发控制的规则：读读互斥、读写互斥、写写互斥。
- 读写锁进行并发控制的规则：读读不互斥、读写互斥、写写互斥（只有读读不互斥）。
> `ReentrantReadWriteLock` 其实是两把锁，一把是 `WriteLock` (写锁)，一把是 `ReadLock`（读锁） 。读锁是共享锁(一把锁可以被多个线程同时获得)，写锁是独占锁(一把锁只能被一个线程获得)。读锁可以被同时读，可以同时被多个线程持有，而写锁最多只能同时被一个线程持有。

**`ReentrantReadWriteLock` 底层也是基于 AQS 实现的**。
ReentrantReadWriteLock 也支持公平锁和非公平锁，默认使用非公平锁，可以通过构造器来显示的指定。

使用场景：在**读多写少**的情况下，使用 `ReentrantReadWriteLock` 能够明显提升系统性能。

读锁为什么不能升级为写锁？(写锁可以降级为读锁，但是读锁却不能升级为写锁。)
- 这是因为读锁升级为写锁会引起线程的争夺，毕竟写锁属于是独占锁，这样的话，会影响性能。
- 可能会有死锁问题发生。举个例子：假设两个线程的读锁都想升级写锁，则需要对方都释放自己锁，而双方都不释放，就会产生死锁。

#### StampedLock
`StampedLock` 是 JDK 1.8 引入的性能更好的读写锁，不可重入且不支持条件变量 `Condition`。

不同于一般的 Lock 类，`StampedLock` 并不是直接实现 `Lock` 或 `ReadWriteLock` 接口，而是基于 **CLH 锁**独立实现的（AQS 也是基于这玩意）。

提供了三种模式的读写控制模式：读锁、写锁和乐观读。
- 写锁：独占锁，一把锁只能被一个线程获得。当一个线程获取写锁后，其他请求读锁和写锁的线程必须等待。类似于 `ReentrantReadWriteLock` 的写锁，不过这里的写锁是不可重入的。
- 读锁 （悲观读）：共享锁，没有线程获取写锁的情况下，多个线程可以同时持有读锁。如果己经有线程持有写锁，则其他线程请求获取该读锁会被阻塞。类似于 `ReentrantReadWriteLock` 的读锁，不过这里的读锁是不可重入的。
- 乐观读：允许多个线程获取乐观读以及读锁。同时允许一个写线程获取写锁。

StampedLock 的性能为什么更好？
相比于传统读写锁多出来的乐观读是 `StampedLock` 比 `ReadWriteLock` 性能更好的关键原因。`StampedLock` 的乐观读允许一个写线程获取写锁，所以不会导致所有写线程阻塞，也就是当读多写少的时候，写线程有机会获取写锁，减少了线程饥饿的问题，吞吐量大大提高。

使用场景：
和 ReentrantReadWriteLock 一样，StampedLock 同样适合读多写少的业务场景，可以作为 ReentrantReadWriteLock 的替代品，性能更好。

不过，需要注意的是 StampedLock 不可重入，不支持条件变量 Condition，对中断操作支持也不友好（使用不当容易导致 CPU 飙升）。如果你需要用到 ReentrantLock 的一些高级性能，就不太建议使用 StampedLock 了。

另外，StampedLock 性能虽好，但使用起来相对比较麻烦，一旦使用不当，就会出现生产问题。强烈建议你在使用 StampedLock 之前，看看 StampedLock 官方文档中的案例。

底层原理：
`StampedLock` 不是直接实现 `Lock` 或 `ReadWriteLock` 接口，而是基于 CLH 锁实现的（AQS 也是基于这玩意），CLH 锁是对自旋锁的一种改良，是一种隐式的链表队列。`StampedLock` 通过 CLH 队列进行线程的管理，通过同步状态值 state 来表示锁的状态和类型。




## JMM

JMM 定义了多线程环境下共享变量的访问规则，核心围绕三个问题：**可见性**、**有序性**、**原子性**。

JMM 把内存分为两部分：所有线程共享的**主内存**（存放实例字段、静态字段、数组元素），以及每个线程私有的**工作内存**（存放主内存变量的副本）。线程对变量的所有操作都要经过工作内存与主内存的交互——JMM 定义了 8 种原子操作（`read`、`load`、`use`、`assign`、`store`、`write`、`lock`、`unlock`）来约束这个过程。这是一个抽象模型，不直接对应物理 CPU 缓存，但最终会映射到缓存一致性协议上。

**可见性**：一个线程修改了共享变量，其他线程未必立刻看到。`volatile` 强制修改刷回主内存并使其他副本失效；`synchronized` 在释放锁前刷主内存、获取锁后重新加载；`final` 字段在构造函数正确完成后对其他线程可见。

**有序性**：编译器和处理器可能重排序指令。JMM 通过 happens-before 规则约束操作之间的可见性顺序，通过内存屏障禁止特定重排序。

**原子性**：复合操作（如 `i++`）可能被中断。`synchronized` 用锁保证代码块原子性；原子类通过 CAS 实现无锁原子操作。

### Happens-Before 规则

若操作 A happens-before 操作 B，则 A 的结果对 B 可见，且 A 在 B 之前执行（按此顺序）。

| 规则 | 说明 |
|---|---|
| 程序顺序规则 | 同一线程内，前面的操作 happens-before 后面的操作（不禁止重排序，但保证结果一致） |
| 锁规则 | 解锁 happens-before 后续对同一锁的加锁 |
| volatile 规则 | 对 volatile 变量的写 happens-before 后续对该变量的读 |
| 线程启动规则 | `thread.start()` 之前的操作 happens-before 子线程内的任何操作 |
| 线程终止规则 | 线程内所有操作 happens-before `thread.join()` 返回后的代码 |
| 传递性 | A happens-before B，B happens-before C → A happens-before C |

### 内存屏障

JMM 通过四种内存屏障来实现 happens-before 约束：

| 屏障类型 | 作用 |
|---|---|
| LoadLoad | 禁止前后的读操作重排序 |
| StoreStore | 禁止前后的写操作重排序 |
| LoadStore | 禁止读与后续写重排序 |
| StoreLoad | 禁止写与后续读重排序（开销最大，`volatile` 写后插入） |

`volatile` 写的语义：将工作内存的值刷新到主内存，前插 StoreStore、后插 StoreLoad 屏障。`volatile` 读的语义：从主内存重新加载最新值，后插 LoadLoad、LoadStore 屏障。

`synchronized` 的锁语义也依赖内存屏障：加锁（`monitorenter`）时令工作内存中的共享变量失效，强制从主内存重新加载；释放锁（`monitorexit`）时将工作内存修改刷新到主内存。

### 案例

双重检查锁定必须用 `volatile`：

```java
class Singleton {
    private static volatile Singleton instance; // 必须 volatile

    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                }
            }
        }
        return instance;
    }
}
```

`new Singleton()` 不是原子操作（分配内存 → 初始化 → 赋值引用），可能被重排序为分配内存 → 赋值引用 → 初始化。若无 `volatile`，其他线程可能在初始化完成前拿到非 null 但未初始化的对象。

不可变对象用 `final` 保证安全发布：

```java
class ImmutableObject {
    private final int x;
    public ImmutableObject(int x) { this.x = x; }
}
```

JMM 保证：所有字段为 `final` 且正确构造的对象，无需同步即可被多线程安全访问。

### 常见误区

| 误区 | 正确理解 |
|---|---|
| `volatile` 能保证原子性 | 只能保证单次读/写的原子性，复合操作仍需锁或原子类 |
| `synchronized` 完全禁止重排序 | 仅保证同步块内的有序性，临界区外的代码仍可能被重排序 |
| 无竞争时无需考虑可见性 | 即使单线程，JIT 优化可能导致可见性问题 |
| 64 位变量原子性有保障 | 32 位 JVM 上 long/double 的非 volatile 变量可能被分解为两次 32 位操作 |


## Atomic 原子类

原子类（`java.util.concurrent.atomic`）将前面讲的 CAS 封装成了可直接使用的线程安全工具。它们内部通过 `Unsafe` 类调用硬件级原子指令，用 `volatile` 保证变量可见性，在无锁的前提下实现原子操作。

家族成员覆盖了基本类型（`AtomicInteger`、`AtomicLong`、`AtomicBoolean`）、引用类型（`AtomicReference`、`AtomicStampedReference` 带版本号防 ABA）、数组类型（`AtomicIntegerArray` 等）、字段更新器（`AtomicIntegerFieldUpdater`，无需替换整个对象即可原子更新某个字段），以及 Java 8 引入的高性能计数器（`LongAdder`、`DoubleAdder`）。

`AtomicInteger` 的核心用法：

```java
AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet();                       // 原子自增
counter.updateAndGet(x -> x * 2);                // 原子函数式更新
boolean ok = counter.compareAndSet(2, 5);        // CAS
```

`LongAdder` 适合高并发写多读少的统计场景。它不像 `AtomicLong` 那样所有线程竞争同一个 CAS 变量，而是将热点分散到多个 `Cell`，写操作大概率只在自己的 Cell 上 CAS，读操作才汇总——用最终一致性换吞吐量。低竞争时 `AtomicInteger`/`AtomicLong` 更简单直接，高竞争时 `LongAdder` 优势明显。

原子类不能解决复合操作的竞态：`if (counter.get() < 10) counter.incrementAndGet()` 这两个调用之间仍可能被穿插。此时要么用 CAS 循环重试，要么退回到 `synchronized`。


## 线程池与 ThreadLocal

### ThreadLocal
>解决**让每个线程都有自己的专属本地变量**的问题，类似于并行处理课程中的 Pthread 的本地内存

`ThreadLocal` 类允许每个线程绑定自己的值，可以将其形象地比喻为一个“存放数据的盒子”。每个线程都有自己独立的盒子，用于存储私有数据，确保不同线程之间的数据互不干扰。

%% 我个人认为这个视频讲清楚了：
-  [ThreadLocal实现原理与内存泄漏问题\_哔哩哔哩\_bilibili](https://www.bilibili.com/video/BV1BsqHYdEun/?vd_source=cb670d82714ee9baee22c33ef083884d)
- 有一个人写了相关的笔记，在电脑的：`E:\Download_copy\IDM_Download\JavaNote-main` 文件夹中，可以参考
- 黑马的笔记：`E:\Download_copy\IDM_Download\并发编程笔记`

像是所谓的比较的完整的资料(作为看 javaguide 看不懂的备用资料即可，因为根本看不完的，时间为上)

看这个基本就能懂了。

可能会被问到的问题有：
- **ThreadLocal 的原理**
- **导致的内存泄露问题**
- 如何跨线程传递 ThreadLocal 的值？ %%

#### ThreadLocal 的原理
原理类似于：
![](./Pasted%20image%2020250113203923.png)

### ThreadLocal 的清理与扩容

ThreadLocalMap 通过 `replaceStaleEntry` 和 `expungeStaleEntry` 两个方法自动清理过期的 Entry（`Entry.key == null`），避免内存泄漏。

**`replaceStaleEntry`** 在 `set()` 方法中发现当前槽位的 Entry 已过期时触发。它向前扫描找到最前端的连续过期 Entry 起点，向后扫描查找匹配的 key 或新的过期 Entry，替换 value 并交换槽位，最后调用 `expungeStaleEntry` 做深度清理：

```java
private void replaceStaleEntry(ThreadLocal<?> key, Object value, int staleSlot) {
    Entry[] tab = table;
    int len = tab.length, slotToExpunge = staleSlot;
    for (int i = prevIndex(staleSlot, len); (e = tab[i]) \!= null; i = prevIndex(i, len))
        if (e.get() == null) slotToExpunge = i;
    for (int i = nextIndex(staleSlot, len); (e = tab[i]) \!= null; i = nextIndex(i, len)) {
        ThreadLocal<?> k = e.get();
        if (k == key) { e.value = value; tab[i] = tab[staleSlot]; tab[staleSlot] = e;
            if (slotToExpunge == staleSlot) slotToExpunge = i;
            cleanSomeSlots(expungeStaleEntry(slotToExpunge), len); return; }
        if (k == null && slotToExpunge == staleSlot) slotToExpunge = i;
    }
    tab[staleSlot].value = null; tab[staleSlot] = new Entry(key, value);
    if (slotToExpunge \!= staleSlot) cleanSomeSlots(expungeStaleEntry(slotToExpunge), len);
}
```

**`expungeStaleEntry`** 在 `get()` 或 `remove()` 中发现过期 Entry 时触发，清理指定槽位后继续向后扫描，遇到过期 Entry 就清理，遇到有效 Entry 就重新哈希定位：

```java
private int expungeStaleEntry(int staleSlot) {
    Entry[] tab = table; int len = tab.length;
    tab[staleSlot].value = null; tab[staleSlot] = null; size--;
    Entry e; int i;
    for (i = nextIndex(staleSlot, len); (e = tab[i]) \!= null; i = nextIndex(i, len)) {
        ThreadLocal<?> k = e.get();
        if (k == null) { e.value = null; tab[i] = null; size--; }
        else { int h = k.threadLocalHashCode & (len - 1);
            if (h \!= i) { tab[i] = null; while (tab[h] \!= null) h = nextIndex(h, len); tab[h] = e; } }
    }
    return i;
}
```

**扩容**采用先清理后扩容策略：初始容量 16，阈值 = 容量 × 2/3。当 size ≥ threshold 时，先全量清理过期 Entry，若清理后 size ≥ threshold × 3/4 才真正扩容，容量翻倍并重新哈希所有有效 Entry，用线性探测解决冲突。

| 机制 | 优点 | 代价 |
|---|---|---|
| 弱引用键 + 自动清理 | 减少内存泄漏风险 | 增加 set/get 的时间复杂度 |
| 惰性清理 | 避免全局扫描开销 | 可能残留部分过期 Entry |
| 先清理后扩容 | 扩容仅针对有效数据 | 扩容成本较高 |

自动清理能回收弱引用键已失效的 Entry，但 value 的强引用仍需依赖 `remove()` 显式清除——线程池场景下尤其重要。

#### 导致的内存泄露问题
内存泄漏问题调用 `remove` 方法即可，必要时，使用 `try... finally` 的方式防止内存泄漏

#### 跨线程传递 ThreadLocal 的值

使用代码来说明：

对于 `InheritableThreadLocal` :允许子线程继承父线程的 `ThreadLocal` 值。当创建子线程时，父线程的 `InheritableThreadLocal` 值会被复制到子线程中。

>- 每个线程内部维护一个 `ThreadLocalMap`，用于存储 `ThreadLocal` 的值。
>-  `InheritableThreadLocal` 会在创建子线程时，将父线程的 `InheritableThreadLocal` 值复制到子线程的 `ThreadLocalMap` 中。

```java
public class InheritableThreadLocalExample {
    private static InheritableThreadLocal<String> inheritableThreadLocal = new InheritableThreadLocal<>();

    public static void main(String[] args) {
        // 在主线程中设置 InheritableThreadLocal 的值
        inheritableThreadLocal.set("Hello from parent thread");

        // 创建子线程
        Thread childThread = new Thread(() -> {
            // 在子线程中获取 InheritableThreadLocal 的值
            String value = inheritableThreadLocal.get();
            System.out.println("Child thread value: " + value);
        });

        // 启动子线程
        childThread.start();

        // 等待子线程执行完毕
        try {
            childThread.join();
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
    }
}
```

对于 `TransmittableThreadLocal` (阿里巴巴通过装饰器模式增强了 `InheritableThreadLocal`，确保在**线程池**中也能正确传递 `ThreadLocal` 值。)

>这里的关键点其实只有一个：线程池会复用线程，普通 `InheritableThreadLocal` 只在线程创建时复制上下文，复用线程时拿不到新值；`TransmittableThreadLocal` 通过包装任务，把提交任务那一刻的上下文一并带过去。

```java
import com.alibaba.ttl.TransmittableThreadLocal;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class TransmittableThreadLocalExample {
    private static TransmittableThreadLocal<String> transmittableThreadLocal = new TransmittableThreadLocal<>();

    public static void main(String[] args) {
        // 在主线程中设置 TransmittableThreadLocal 的值
        transmittableThreadLocal.set("Hello from parent thread");

        // 创建线程池
        ExecutorService executorService = Executors.newFixedThreadPool(2);

        // 提交任务到线程池
        executorService.submit(() -> {
            // 在子线程中获取 TransmittableThreadLocal 的值
            String value = transmittableThreadLocal.get();
            System.out.println("Child thread value: " + value);
        });

        // 关闭线程池
        executorService.shutdown();
    }
}
```

### 线程池
>管理一系列线程的资源池。当有任务要处理时，直接从线程池中获取线程来处理，处理完之后线程并不会立即被销毁，而是等待下一个任务

- **降低资源消耗**。通过重复利用已创建的线程降低线程创建和销毁造成的消耗。
- **提高响应速度**。当任务到达时，任务可以不需要等到线程创建就能立即执行。
- **提高线程的可管理性**。线程是稀缺资源，如果无限制的创建，不仅会消耗系统资源，还会降低系统的稳定性，使用线程池可以进行统一的分配，调优和监控。如何创建线程池？

#### 创建线程池的方式 :

- 通过 `ThreadPoolExecutor` 构造函数来创建（**推荐**）
- 通过 `Executor` 框架的工具类 `Executors` 来创建。(可以创建不同类型的线程池)
	- `FixedThreadPool` ，线程数量确定，若有多余的任务且没空闲的线程，则会被暂存在任务队列中等到空闲时再处理其中的任务。
		- 有界阻塞队列是 `LinkedBlockingQueue`
	- `SingleThreadExecutor`：和上面的区别是这个线程池的线程数量只有一个，其他的一样
	- `CachedThreadPool`：线程数量不确定，但有可以复用的线程时优先使用可以复用的线程，若满了，则创建新的线程处理任务
		- 同步队列 `SynchronousQueue`
	- `ScheduledThreadPool`：给定的延迟后运行任务或者定期执行任务的线程池。
		- 无界的延迟阻塞队列 `DelayedWorkQueue`

#### 线程池常见参数有哪些 ？如何解释？
```java
public ThreadPoolExecutor(int corePoolSize,//线程池的核心线程数量
                              int maximumPoolSize,//线程池的最大线程数
                              long keepAliveTime,//当线程数大于核心线程数时，多余的空闲线程存活的最长时间
                              TimeUnit unit,//时间单位
                              BlockingQueue<Runnable> workQueue,//任务队列，用来储存等待执行任务的队列
                              ThreadFactory threadFactory,//线程工厂，用来创建线程，一般默认即可
                              RejectedExecutionHandler handler//拒绝策略，当提交的任务过多而不能及时处理时，我们可以定制策略来处理任务
```

>若使用了 `allowCoreThreadTimeOut(boolean value)`，将设置为 `true` 之后，**则就可以回收核心线程了**，时间间隔仍然由 `keepAliveTime` 决定
 
#### 对于拒绝策略而言 ：
>当前同时运行的线程数量达到最大线程数量并且队列也已经被放满了任务时
- `ThreadPoolExecutor.AbortPolicy`:抛出 `RejectedExecutionException` 来拒绝新任务的处理。
- `ThreadPoolExecutor.callerRunsPolicy`:调用执行者自己的线程运行任务，也就是**直接在调用 `execute` 方法的线程中运行( run )被拒绝的任务**，如果执行程序已关闭，则会丢弃该任务。因此这种策略会降低对于新任务提交速度，影响程序的整体性能。如果你的应用程序可以承受此延迟并且你要求任何一个任务请求都要被执行的话，你可以选择这个策略。
- `ThreadPoolExecutor.DiscardPolicy`:不处理新任务，直接丢弃掉。
- `ThreadPoo1Executor.DiscardoldestPolicy`:此策略将丢弃最早的未处理的任务请求,

对于 `callerRunsPolicy`，不会丢弃掉，可以让所有任务都得到执行。则这种拒绝策略有什么风险呢？如何解决呢？

风险：对于被放入主线程的运行任务，有可能会让主线程等待很久才能执行完，这会导致后面的线程无法及时执行。
解决方法：调整阻塞队列的大小和最大线程数的大小。

出现这个问题的本质就是我们不希望任何一个任务被丢弃，**如果服务器资源达到了极限**，则需要更换调度策略(**使得保证任务不被丢弃且在服务器有余力时及时处理**)，那么采用什么调度策略呢？

**任务持久化**：几种方式：
- 设计一张任务表将任务存储到 MySQL 数据库中。
- Redis 缓存任务。
- 将任务提交到消息队列中。

对于第一个方式：
- 实现 `RejectedExecutionHandler` 接口自定义拒绝策略，自定义拒绝策略负责将线程池暂时无法处理（此时阻塞队列已满）的任务入库（保存到 MySQL 中）
- 继承 `BlockingQueue` 实现一个混合式阻塞队列，该队列包含 JDK 自带的 ArrayBlockingQueue。另外，该混合式阻塞队列需要修改取任务处理的逻辑，也就是重写 `take()`方法，取任务时优先从数据库中读取最早的任务，数据库中无任务时再从 `ArrayBlockingQueue` 中去取任务。

对于 Netty 的处理方法：**直接创建一个线程池以外的线程处理这些任务**，为了保证任务的实时处理，这种做法可能需要良好的硬件设备且临时创建的线程无法做到准确的监控
对于 ActiveMQ 的处理方法：尝试在指定的时效内尽可能的争取将任务入队，以保证最大交付：

对于常用的阻塞队列：
- 容量为 Integer.MAX_VALUE 的 `LinkedBlockingQueue`(有界阻塞队列):`FixedThreadPool` `和singleThreadExecutor`。FixedThreadPoo1 最多只能创建核心线程数的线程(核心线程数和最大线程数相等)，`singleThreadExecutor` 只能创建一个线程(核心线程数和最大线程数都是 1)，二者的任务队列永远不会被放满。
- `synchronousqueue`(同步队列):`cachedThreadPool`。`synchronousqueue` 没有容量，不存储元素，目的是保证对于提交的任务，如果有空闲线程，则使用空闲线程来处理;否则新建一个线程来处理任务。也就是说，`cachedThreadPool` 的最大线程数是 Integer.MAX_VALUE，可以理解为线程数是可以无限扩展的，可能会创建大量线程，从而导致 OOM。
- `DelayedWorkQueue` (延队列): `scheduledThreadPool` 和 `singleThreadscheduledExecutor` `Delayedworkqueue` 的内部元素并不是按照放入的时间排序，而是会**按照延迟的时间长短对任务进行排序**，内部采用的是“堆”的数据结构，可以保证每次出队的任务都是当前队列中执行时间最靠前的。`Delayedworkqueue` 添加元素满了之后会自动扩容，增加原来容量的 50%，即永远不会阻塞，最大扩容可达 Integer.MAX_VALUE，所以最多只能创建核心线程数的线程。
- `ArrayBlockingqueue`(有界阻塞队列):底层由数组实现，容量一旦创建，就不能修改

#### 线程池处理任务的流程

![](./Pasted%20image%2020250117213541.png)

线程池在提交任务前，可以提前创建线程吗？
- `prestartCoreThread()`:启动一个线程，等待任务，如果已达到核心线程数，这个方法返回 false，否则返回 true；
- `prestartAllCoreThreads()`:启动所有的核心线程，并返回启动成功的核心线程数。

#### 线程池中线程异常后，销毁还是复用？
- 使用 `execute()`提交任务：当任务通过 `execute()`提交到线程池并在执行过程中抛出异常时，如果这个异常没有在任务内被捕获，那么该异常会导致当前线程终止，并且异常会被打印到控制台或日志文件中。线程池会检测到这种线程终止，并**创建一个新线程来替换它**，从而保持配置的线程数不变。
- 使用 `submit()`提交任务：对于通过 `submit()`提交的任务，如果在任务执行中发生异常，这个异常不会直接打印出来。相反，异常会被封装在由 `submit()`返回的 `Future` 对象中。当调用 `Future.get()`方法时，可以捕获到一个 `ExecutionException`。在这种情况下，线程不会因为异常而终止，它会**继续存在于线程池中**，准备执行后续的任务。

这种设计允许 `submit()`提供更灵活的错误处理机制，因为它允许调用者决定如何处理异常，而 `execute()`则适用于那些不需要关注执行结果的场景。
%% 
#### 如何给线程命名

- 利用 `guava` 的 `ThreadFactoryBuilder`
```java
ThreadFactory threadFactory = new ThreadFactoryBuilder()
                        .setNameFormat(threadNamePrefix + "-%d")
                        .setDaemon(true).build();
ExecutorService threadPool = new ThreadPoolExecutor(corePoolSize, maximumPoolSize, keepAliveTime, TimeUnit.MINUTES, workQueue, threadFactory);
```

- 自定义 `ThreadFactory`
```java
import java.util.concurrent.ThreadFactory;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 线程工厂，它设置线程名称，有利于我们定位问题。
 */
public final class NamingThreadFactory implements ThreadFactory {

    private final AtomicInteger threadNum = new AtomicInteger();
    private final String name;

    /**
     * 创建一个带名字的线程池生产工厂
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

#### 动态修改线程池参数

使用：
- `setCorePoolSize(int corePoolSize)`：设置核心线程数。
- `setMaximumPoolSize(int maximumPoolSize)`：设置最大线程数。
- `setKeepAliveTime(long time, TimeUnit unit)`：设置非核心线程的空闲存活时间。
- `allowCoreThreadTimeOut(boolean value)`：设置是否允许核心线程在空闲时被回收。

对于修改线程参数的示例：
```java
import java.util.concurrent.*;

public class DynamicThreadPoolExample {
    public static void main(String[] args) throws InterruptedException {
        // 初始参数
        int corePoolSize = 2;
        int maximumPoolSize = 4;
        long keepAliveTime = 10;
        TimeUnit unit = TimeUnit.SECONDS;
        BlockingQueue<Runnable> workQueue = new LinkedBlockingQueue<>(2);
        ThreadFactory threadFactory = Executors.defaultThreadFactory();
        RejectedExecutionHandler handler = new ThreadPoolExecutor.AbortPolicy();

        // 创建线程池
        ThreadPoolExecutor executor = new ThreadPoolExecutor(
                corePoolSize,
                maximumPoolSize,
                keepAliveTime,
                unit,
                workQueue,
                threadFactory,
                handler
        );

        // 提交初始任务
        for (int i = 1; i <= 6; i++) {
            final int taskId = i;
            try {
                executor.submit(() -> {
                    System.out.println("Task " + taskId + " is running on thread " + Thread.currentThread().getName());
                    try {
                        Thread.sleep(2000); // 模拟任务执行时间
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                });
            } catch (RejectedExecutionException e) {
                System.out.println("Task " + taskId + " was rejected");
            }
        }

        // 动态调整线程池参数
        Thread.sleep(3000); // 等待一段时间
        System.out.println("Adjusting thread pool parameters...");

        // 增加核心线程数和最大线程数
        executor.setCorePoolSize(4);
        executor.setMaximumPoolSize(6);

        // 提交更多任务
        for (int i = 7; i <= 12; i++) {
            final int taskId = i;
            try {
                executor.submit(() -> {
                    System.out.println("Task " + taskId + " is running on thread " + Thread.currentThread().getName());
                    try {
                        Thread.sleep(2000); // 模拟任务执行时间
                    } catch (InterruptedException e) {
                        e.printStackTrace();
                    }
                });
            } catch (RejectedExecutionException e) {
                System.out.println("Task " + taskId + " was rejected");
            }
        }

        // 关闭线程池
        executor.shutdown();
    }
}
```

修改后会将修改后的参数生效，进行后续的任务

#### 线程池监控实战

**1. 使用ThreadPoolExecutor提供的监控方法**:
```java
ThreadPoolExecutor executor = new ThreadPoolExecutor(...);

// 定期监控线程池状态
ScheduledExecutorService monitor = Executors.newScheduledThreadPool(1);
monitor.scheduleAtFixedRate(() -> {
    System.out.println("=== 线程池监控 ===");
    System.out.println("核心线程数: " + executor.getCorePoolSize());
    System.out.println("最大线程数: " + executor.getMaximumPoolSize());
    System.out.println("当前线程数: " + executor.getPoolSize());
    System.out.println("活跃线程数: " + executor.getActiveCount());
    System.out.println("队列大小: " + executor.getQueue().size());
    System.out.println("已完成任务数: " + executor.getCompletedTaskCount());
    System.out.println("总任务数: " + executor.getTaskCount());
    System.out.println("==================");
}, 0, 5, TimeUnit.SECONDS);
```

**2. 使用JMX监控线程池**:
```java
import java.lang.management.ManagementFactory;
import javax.management.*;

public class ThreadPoolMonitor implements ThreadPoolMonitorMBean {
    private final ThreadPoolExecutor executor;

    public ThreadPoolMonitor(ThreadPoolExecutor executor) {
        this.executor = executor;
        // 注册MBean
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

// 使用JConsole或VisualVM连接查看
```

**3. 使用Micrometer集成监控**:
```java
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.binder.jvm.ExecutorServiceMetrics;

ThreadPoolExecutor executor = new ThreadPoolExecutor(...);

// 绑定到Micrometer
ExecutorServiceMetrics.monitor(meterRegistry, executor, "my-thread-pool");

// 可以导出到Prometheus、Grafana等监控系统
```

#### 线程池调优实战

**问题1: 线程池拒绝任务**

**现象**:
```
Exception in thread "main" java.util.concurrent.RejectedExecutionException
    at java.util.concurrent.ThreadPoolExecutor$AbortPolicy.rejectedExecution
```

**排查步骤**:
```java
// 1. 检查线程池配置
System.out.println("核心线程数: " + executor.getCorePoolSize());
System.out.println("最大线程数: " + executor.getMaximumPoolSize());
System.out.println("队列容量: " + executor.getQueue().remainingCapacity());

// 2. 检查当前状态
System.out.println("当前线程数: " + executor.getPoolSize());
System.out.println("活跃线程数: " + executor.getActiveCount());
System.out.println("队列大小: " + executor.getQueue().size());
```

**解决方案**:
```java
// 方案1: 增加队列容量
BlockingQueue<Runnable> workQueue = new LinkedBlockingQueue<>(1000);

// 方案2: 增加最大线程数
executor.setMaximumPoolSize(20);

// 方案3: 使用CallerRunsPolicy(让调用者执行)
RejectedExecutionHandler handler = new ThreadPoolExecutor.CallerRunsPolicy();

// 方案4: 自定义拒绝策略(记录日志+告警)
RejectedExecutionHandler customHandler = (r, executor) -> {
    logger.error("Task rejected: {}", r.toString());
    // 发送告警
    alertService.sendAlert("线程池任务被拒绝");
    // 可以选择持久化任务
    taskRepository.save(r);
};
```

**问题2: 线程池线程数过多导致CPU飙高**

**排查步骤**:
```bash
# 1. 查看进程CPU使用率
top -p <pid>

# 2. 查看线程CPU使用率
top -H -p <pid>

# 3. 使用jstack查看线程栈
jstack <pid> > thread_dump.txt

# 4. 分析线程栈,找出CPU占用高的线程
# 将线程ID转换为16进制,在thread_dump.txt中搜索
printf "%x\n" <thread_id>
```

**解决方案**:
```java
// 1. 合理设置核心线程数
// CPU密集型: corePoolSize = CPU核心数 + 1
int corePoolSize = Runtime.getRuntime().availableProcessors() + 1;

// IO密集型: corePoolSize = CPU核心数 * 2
int corePoolSize = Runtime.getRuntime().availableProcessors() * 2;

// 2. 设置线程空闲回收时间
executor.setKeepAliveTime(60, TimeUnit.SECONDS);
executor.allowCoreThreadTimeOut(true);
```

**问题3: 任务执行缓慢**

**排查步骤**:
```java
// 1. 记录任务执行时间
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

// 2. 使用VisualVM或JProfiler分析
// 3. 检查是否有死锁
ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();
long[] deadlockedThreads = threadMXBean.findDeadlockedThreads();
if (deadlockedThreads != null) {
    logger.error("发现死锁线程: {}", Arrays.toString(deadlockedThreads));
}
```

**最佳实践总结**:
1. 根据任务类型选择合适的线程数(CPU密集型 vs IO密集型)
2. 使用有界队列,避免OOM
3. 自定义线程名称,方便排查问题
4. 实现监控和告警机制
5. 使用`submit()`而非`execute()`,便于异常处理
6. 优雅关闭线程池(`shutdown()`而非`shutdownNow()`)

#### 如何设计一个动态线程池？
**那么如何设计一个动态线程池呢？**

(面试中可能会被问到)
>deepseek 的代码：

代码：`ThreadPool/DynamicThreadPool`

需要自定义 `ResizableCapacityLinkedBlockingQueue`
```java
class ResizableCapacityLinkedBlockingQueue<E> extends LinkedBlockingQueue<E> {
    private final AtomicInteger capacity; // 使用 AtomicInteger 来支持动态调整容量

    public ResizableCapacityLinkedBlockingQueue(int capacity) {
        super(capacity); // 初始化队列容量
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
        // 检查当前队列大小是否超过容量
        if (size() >= capacity.get()) {
            return false; // 队列已满，拒绝添加
        }
        return super.offer(e);
    }

    @Override
    public boolean offer(E e, long timeout, TimeUnit unit) throws InterruptedException {
        // 检查当前队列大小是否超过容量
        if (size() >= capacity.get()) {
            return false; // 队列已满，拒绝添加
        }
        return super.offer(e, timeout, unit);
    }

    @Override
    public void put(E e) throws InterruptedException {
        // 检查当前队列大小是否超过容量
        while (size() >= capacity.get()) {
            Thread.yield(); // 等待队列有空闲空间
        }
        super.put(e);
    }
}
```

%%
#### 如何设计一个根据任务的优先级执行的线程池？
有两种方式：
- 提交到线程池的任务实现 `Comparable` 接口，并重写 `compareTo` 方法来指定任务之间的优先级比较规则。
- 创建 `PriorityBlockingQueue` 时传入一个 `Comparator` 对象来指定任务之间的排序规则(**推荐**)。

潜在的问题：
- `PriorityBlockingQueue` 是无界的，可能堆积大量的请求，从而导致 OOM。
- 可能会导致饥饿问题，即低优先级的任务长时间得不到执行。
- 由于需要对队列中的元素进行排序操作以及保证线程安全（并发控制采用的是可重入锁 `ReentrantLock`），因此会降低性能。

解决办法：(对应上面的问题)
- 继承 PriorityBlockingQueue 并重写一下 offer 方法(入队)的逻辑，当插入的元素数量超过指定值就返回 false 。
- 通过优化设计来解决（比较麻烦），比如等待时间过长的任务会被移除并重新添加到队列中，但是优先级会被提升。
- ()对于性能方面的影响，是没办法避免的，毕竟需要对任务进行排序操作。并且，对于大部分业务场景来说，这点性能影响是可以接受的。 

%% ### Future
>Future,AQS 的内容参考 java并发-概念，其他的主要参考 java相关 %%
