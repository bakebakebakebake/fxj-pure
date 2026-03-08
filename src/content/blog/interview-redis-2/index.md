---
title: Redis 不只是缓存：锁、消息队列与 HyperLogLog
description: 以原始 Redis 笔记为主，保留分布式锁、消息队列、HyperLogLog 与高可用相关整理。
publishDate: 2025-06-08
tags:
  - 八股
  - Redis
  - 分布式锁
  - HyperLogLog
  - 消息队列
  - 高可用
language: 中文
heroImageSrc: /Users/xjf/Downloads/sean-pollock-PhYq704ffdA-unsplash.jpg
heroImageColor: " #3e4f64 "
---

> [!note] 说明
> 这篇改回以你原来的 Redis 问题笔记为主体，重点保留锁、消息队列、HyperLogLog 和高可用部分。

## 收录内容

- `Redis Q`

## Redis 高频问题与场景笔记

### Q
>先将 javaguide 的内容看了，作为大概过一遍，然后看**小林 coding** 的部分(这个部分应该是比较全的，然后在这个文章中进行总结)，然后后面可能还是需要回头看 javaguide 和面经的部分进行回顾。

问题：
- redis 和 zookeeper 分别是如何实现分布式锁的？[分布式锁常见实现方案总结 | JavaGuide](https://javaguide.cn/distributed-system/distributed-lock-implementations.html#%E5%A6%82%E4%BD%95%E5%AE%9E%E7%8E%B0%E5%8F%AF%E9%87%8D%E5%85%A5%E9%94%81-1)
- redis 如何被用作消息队列的 [微信公众平台](https://mp.weixin.qq.com/?url=https%3A%2F%2Fmp.weixin.qq.com%2Fs%2FgCUT5TcCQRAxYkTJfTRjJw)
- redis 常见的数据结构和特殊的数据结构，以及**对于各个数据结构的使用场景**？ [Redis 5 种基本数据类型详解 | JavaGuide](https://javaguide.cn/database/redis/redis-data-structures-01.html#%E5%B8%B8%E7%94%A8%E5%91%BD%E4%BB%A4-2)
- 布隆过滤器的原理？使用场景？
	- 一个布隆过滤器的实现：
> [!NOTE]- 布隆过滤器的实现
> ```java
> import java.util.BitSet;
> 
> public class MyBloomFilter {
> 
>     /**
>      * 位数组的大小
>      */
>     private static final int DEFAULT_SIZE = 2 << 24;
>     /**
>      * 通过这个数组可以创建 6 个不同的哈希函数
>      */
>     private static final int[] SEEDS = new int[]{3, 13, 46, 71, 91, 134};
> 
>     /**
>      * 位数组。数组中的元素只能是 0 或者 1
>      */
>     private BitSet bits = new BitSet(DEFAULT_SIZE);
> 
>     /**
>      * 存放包含 hash 函数的类的数组
>      */
>     private SimpleHash[] func = new SimpleHash[SEEDS.length];
> 
>     /**
>      * 初始化多个包含 hash 函数的类的数组，每个类中的 hash 函数都不一样
>      */
>     public MyBloomFilter() {
>         // 初始化多个不同的 Hash 函数
>         for (int i = 0; i < SEEDS.length; i++) {
>             func[i] = new SimpleHash(DEFAULT_SIZE, SEEDS[i]);
>         }
>     }
> 
>     /**
>      * 添加元素到位数组
>      */
>     public void add(Object value) {
>         for (SimpleHash f : func) {
>             bits.set(f.hash(value), true);
>         }
>     }
> 
>     /**
>      * 判断指定元素是否存在于位数组
>      */
>     public boolean contains(Object value) {
>         boolean ret = true;
>         for (SimpleHash f : func) {
>             ret = ret && bits.get(f.hash(value));
>         }
>         return ret;
>     }
> 
>     /**
>      * 静态内部类。用于 hash 操作！
>      */
>     public static class SimpleHash {
> 
>         private int cap;
>         private int seed;
> 
>         public SimpleHash(int cap, int seed) {
>             this.cap = cap;
>             this.seed = seed;
>         }
> 
>         /**
>          * 计算 hash 值
>          */
>         public int hash(Object value) {
>             int h;
>             return (value == null) ? 0 : Math.abs((cap - 1) & seed * ((h = value.hashCode()) ^ (h >>> 16)));
>         }
> 
>     }
> }
> ```

- 对于三种特殊数据结构中的 GEO 和 bitmap 的原理？

### HyperLogLog

- 对于 **HyperLogLog** 的原理的理解  [juejin](https://juejin.cn/?url=https%3A%2F%2Fjuejin.cn%2Fpost%2F6844903785744056333)
	- 先通过 hash 函数将数据转换为比特串(redis 为 64 位，所以能表示的范围为 $2^{64}-1$)，为 0 代表硬币的反面，反之则为正面。可以通过**多次抛硬币实验的最大抛到正面的次数来预估总共进行了多少次实验，同样也就可以根据存入数据中，转化后的出现了 1 的最大的位置 k_max 来估算存入了多少数据。**
	- 在 Redis 中，HyperLogLog 设置为：m(桶)=16834，p=6，L=16834 * 6。占用内存为=16834 * 6 / 8 / 1024 = 12K
		- 在存入时，value 会被 **hash 成 64 位**，即 64 bit 的比特字符串，**前 14(14= $\log_{2}m$) 位用来分桶**，前 14 位的二进制转为 10 进制就是桶标号。因为完整的 value 比特字符串是 64 位形式，减去 14 后，剩下 50 位，那么极端情况，出现 1 的位置，是在第 50 位，即位置是 50。此时 index = 50。此时先将 index 转为 2 进制，它是：110010(能存得下)
		- 根据上面的做法，不同的 value，会被设置到不同桶中去，如果出现了在同一个桶的，即前 14 位值是一样的，但是后面出现 1 的位置不一样。那么**比较原来的 index 是否比新 index 大**。是，则替换。否，则不变。
		- 最终地，一个 key 所对应的 16384 个桶都设置了很多的 value 了，每个桶有一个 k_max。此时调用 pfcount 时，按照前面介绍的估算方式，便可以计算出 key 的设置了多少次 value，也就是统计值。
		- value 被转为 64 位的比特串，最终被按照上面的做法记录到每个桶中去。64 位转为十进制就是：2^64，HyperLogLog 仅用了：16384 * 6 /8 / 1024 K 存储空间就能统计多达 2^64 个数。
	- 对于如何估计值的？公式？[Gemini](https://aistudio.google.com/prompts/1zZzdy1KzCbVN52p0KZEbsLSQzwtaKCrX)
		- 对于多轮的实验：初步拟定公式（m 为实验轮数，R 为调和平均数：$\displaystyle H_{n}=\frac{n}{\sum\limits_{i=1}^n \frac{1}{x_{i}}}$)：$\displaystyle DV_{LL}=\text{constant}\times m\times2^{\hat{R}}$
		- 普通的平均数则为：(k_max_1 + ... + k_max_m)/m= $\displaystyle \frac{\sum\limits_{i=1}^mk_{max_{i}}}{m}$
		- 对于最终的统计公式：![](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/3/2/1693c649359ce382~tplv-t2oaga2asx-jj-mark:3024:0:0:0:q75.awebp)

> [!NOTE]- 关于对于 HyperLogLog 的 $n=2^{k_{max}}$ 的推导：[deepseek](https://chat.deepseek.com/a/chat/s/c17fec01-533f-4fa4-9b85-c62e6f6f5c2c)
> ### **一、伯努利试验的定义及概率 $P(k)$ 的含义**
> 
> **伯努利试验**被定义为“连续抛硬币，直到出现正面为止，记录所需的抛掷次数”。这里的“伯努利试验”实际上属于**几何分布**的范畴。具体来说：
> 
> - **单次试验的成功概率**：每次抛硬币出现正面的概率为 $p = \frac{1}{2}$，出现反面为 $1-p = \frac{1}{2}$。
> - **抛掷次数 $k$ 的概率**：若第一次出现正面是在第 $k$ 次抛掷，则前 $k-1$ 次均为反面，第 $k$ 次为正面。因此：
>   $$
>   P(k) = \underbrace{\left(\frac{1}{2}\right)^{k-1}}_{\text{前 }k-1\text{ 次反面}} \cdot \underbrace{\frac{1}{2}}_{\text{第 }k\text{ 次正面}} = \frac{1}{2^k}, \quad k = 1, 2, \dots
>   $$
>   这就是几何分布的概率质量函数。
> 
> ---
> 
> ### **二、极大似然估计的推导过程**
> 
> #### **1. 问题建模**
> - **目标**：通过观察 $n$ 次试验的最大抛掷次数 $k_{\text{max}} = m$，估计 $n$ 的值。
> - **关键概率公式**：观察到最大抛掷次数为 $m$ 的概率是：
>   $$
>   P(k_{\text{max}} = m \mid n) = \left[\underbrace{1 - \frac{1}{2^m}}_{\text{所有试验次数} \leq m}\right]^n - \left[\underbrace{1 - \frac{1}{2^{m-1}}}_{\text{所有试验次数} \leq m-1}\right]^n
>   $$
>   解释：
>   - 第一项 $\left[1 - \frac{1}{2^m}\right]^n$：所有 $n$ 次试验的抛掷次数均不超过 $m$。
>   - 第二项 $\left[1 - \frac{1}{2^{m-1}}\right]^n$：所有 $n$ 次试验的抛掷次数均不超过 $m-1$。
>   - 两者相减后，得到“所有试验次数均不超过 $m$，且至少有一次等于 $m$”的概率。
> 
> #### **2. 对数似然函数**
> 为了简化计算，对概率取自然对数：
> $$
> \mathcal{L}(n) = \ln\left(\left[1 - \frac{1}{2^m}\right]^n - \left[1 - \frac{1}{2^{m-1}}\right]^n\right)
> $$
> 
> #### **3. 泰勒展开近似**
> 当 $m$ 较大时，$\frac{1}{2^m}$ 非常小，可以利用近似 $1 - x \approx e^{-x}$（泰勒展开的一阶近似）：
> $$
> 1 - \frac{1}{2^m} \approx e^{-\frac{1}{2^m}}, \quad 1 - \frac{1}{2^{m-1}} \approx e^{-\frac{2}{2^m}}
> $$
> 代入后，概率简化为：
> $$
> P(k_{\text{max}} = m \mid n) \approx e^{-\frac{n}{2^m}} - e^{-\frac{2n}{2^m}}
> $$
> 
> #### **4. 最大化似然函数**
> 令 $x = \frac{n}{2^m}$，则概率表达式变为：
> $$
> P \approx e^{-x} - e^{-2x}
> $$
> 对 $x$ 求导并令导数为零：
> $$
> \frac{d}{dx} \left(e^{-x} - e^{-2x}\right) = -e^{-x} + 2e^{-2x} = 0
> $$
> 解得：
> $$
> e^{-x} = 2e^{-2x} \quad \Rightarrow \quad e^{x} = 2 \quad \Rightarrow \quad x = \ln 2
> $$
> 因此：
> $$
> \frac{n}{2^m} = \ln 2 \quad \Rightarrow \quad n = \ln 2 \cdot 2^m \approx 0.693 \cdot 2^m
> $$
> 
> #### **5. 工程近似**
> 在题目中，常数因子 $\ln 2 \approx 0.693$ 被忽略，简化为：
> $$
> n \approx 2^{k_{\text{max}}}
> $$
> 这是因为：
> - **数量级匹配**：当 $m$ 较大时，$0.693 \cdot 2^m$ 与 $2^m$ 处于同一数量级。
> - **整数估计**：实际应用中 $n$ 需为整数，取 $2^m$ 更简洁。
> 
> ---
> 
> ### **三、直观验证**
> 
> #### **示例：当 $k_{\text{max}} = 3$ 时**
> - **理论估计**：$n \approx 2^3 = 8$。
> - **实际概率计算**：
>   $$
>   P(k_{\text{max}} = 3 \mid n = 8) = \left(1 - \frac{1}{8}\right)^8 - \left(1 - \frac{1}{4}\right)^8 \approx 0.3436 - 0.1001 = 0.2435
>   $$
>   对比 $n = 7$ 和 $n = 9$ 的概率，发现 $n = 8$ 时概率最大，验证了估计的合理性。
> 
> ---
> 
> ### **四、总结**
> 1. **伯努利试验的概率**：单次试验抛掷 $k$ 次的概率为 $P(k) = \frac{1}{2^k}$。
> 2. **极大似然估计**：通过最大化观察到 $k_{\text{max}} = m$ 的概率，推导出 $n \approx 2^m$。
> 3. **工程简化**：忽略常数因子 $\ln 2$，得到直观的整数关系 $n = 2^{k_{\text{max}}}$。
> 
> 

### Sorted Set、排行榜与跳表

- **如何使用 Sorted Set 来设计制作一个排行榜**？
- Redis 的有序集合底层为什么要用跳表，而不用平衡树、红黑树或者 B+ 树？他们分别是怎样的？**为什么使用跳表？**
- 需要能描述对于调表的各种操作的流程！
- 需要稍微了解**红黑树**的原理

### 持久化与 AOF 重写

- 对于 **redis 的持久化**(**重点**)
	- **快照**（snapshotting，RDB）
	- **只追加文件**（append-only file, AOF）
		- appendfsync always：主线程调用 write 执行写操作后，后台线程（ aof_fsync 线程）立即会调用 fsync 函数同步 AOF 文件（刷盘），fsync 完成后线程返回，这样会严重降低 Redis 的性能（write + fsync）。
		- appendfsync everysec：主线程调用 write 执行写操作后立即返回，由后台线程（ aof_fsync 线程）每秒钟调用 fsync 函数（系统调用）同步一次 AOF 文件（write+fsync，fsync 间隔为 1 秒）
		- appendfsync no：主线程调用 write 执行写操作后立即返回，让操作系统决定何时进行同步，Linux 下一般为 30 秒一次（write 但不 fsync，fsync 的时机由操作系统决定）。
	- **RDB 和 AOF 的混合持久化**(Redis 4.0 新增)
- AOF 为什么是在**执行完命令之后记录日志**？而关系型数据库（如 MySQL）通常都是执行命令之前记录日志呢？
	- 避免额外的检查开销，AOF 记录日志不会对命令进行语法检查；
	- 在命令执行完之后再记录，不会阻塞当前的命令执行。
	- 这样也带来了风险（我在前面介绍 AOF 持久化的时候也提到过）：
		- 如果刚执行完命令 Redis 就宕机会导致对应的修改丢失；
		- 可能会阻塞后续其他命令的执行（AOF 记录日志是在 Redis 主线程中进行的）。
- AOF 的重写是怎样进行的？
- 新的 AOF 文件(重写后)和原有的 AOF 文件所保存的数据库状态一样，但体积更小。体积更小但是数据状态一样是怎样做到的？
	- 问题： AOF 文件会随着写命令不断追加而持续增大，不仅占用硬盘空间，恢复时重放大量命令也会很慢。例如，你对一个计数器执行了 100 次 INCR，AOF 文件里就有 100 条 INCR 命令，但其实只需要一条 SET count 100 命令就能达到同样的效果。
	- 解决方案： AOF 重写就是为了解决这个问题。它会创建一个新的、更小的 AOF 文件，这个新文件包含能达到当前数据状态的最少命令集。

### 线程模型补记

- **redis 的线程模型**
	- 什么是 reactor 模式(在 nio 的内容)？
	- redis 的后台线程？[juejin.cn/post/7102780434739626014](https://juejin.cn/post/7102780434739626014)
		- bio_close_file (文件关闭线程)
		- aof_fsync (AOF 文件同步线程)
		- lazy_free (惰性/延迟释放线程)
	- 后台如何工作？
