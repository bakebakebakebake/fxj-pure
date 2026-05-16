---
title: Redis 中的概率数据结构：HyperLogLog
description: 深入推导 HyperLogLog 的数学原理与 Redis 实现
publishDate: 2025-06-08
tags:
  - 八股
  - Redis
  - HyperLogLog
  - 布隆过滤器
  - 概率数据结构
language: 中文
heroImageSrc: ../../pic/sean-pollock-PhYq704ffdA-unsplash.jpg
heroImageColor: " #3e4f64 "
---



### 抛硬币

HyperLogLog 的核心思想来自一个巧妙的类比：连续抛硬币，直到出现正面为止，记录抛掷次数。如果多轮实验下来，最多的一次抛了 $k_{\text{max}}$ 次才出正面，那么大概可以反推出总共做了大约 $2^{k_{\text{max}}}$ 轮实验。把这个思路搬到数据统计上：先把存入的 value 通过 hash 函数转为比特串（Redis 使用 64 位 hash，能表示的范围为 $2^{64}-1$），0 代表硬币的反面，1 代表正面。那么只需要记录所有数据中"第一次出现 1 的最大位置 $k_{\text{max}}$"，就能估算出存入了多少条数据。参考：[juejin](https://juejin.cn/?url=https%3A%2F%2Fjuejin.cn%2Fpost%2F6844903785744056333)。

### Redis 中的 HyperLogLog 

在 Redis 中，HyperLogLog 的参数设置为：$m=16834$（桶数），$p=6$，$L=16834 \times 6$。总占用内存为 $16834 \times 6 \div 8 \div 1024 = 12\text{K}$。

存入数据时，value 会被 **hash 成 64 位**的比特串。**前 14 位（$14 = \log_{2}m$）用来定位桶**，将其转为十进制就是桶标号。完整的比特串是 64 位，去掉前 14 位后剩余 50 位。最极端的情况下，第一个 1 出现在第 50 位，此时 $index = 50$，转为二进制是 110010，可以被存入桶中。

不同的 value 可能被分到同一个桶（前 14 位相同），但后续比特串中第一个 1 出现的位置可能不同。此时会比较新旧 $index$：**新的 $index$ 更大就替换，否则保持不变**。就这样，一个 key 对应的 16384 个桶都被设入了各个 value，每个桶保留一个 $k_{\text{max}}$。当调用 `pfcount` 时，根据前面所说的估算方式，就可以计算出这个 key 大概被设置了多少次 value。HyperLogLog 用仅仅 12K 的存储空间就能统计多达 $2^{64}$ 个不同的值。

### 基数估计

那么具体如何从多个桶的 $k_{\text{max}}$ 估计出总基数？直觉上可以对所有桶的 $k_{\text{max}}$ 取平均，即普通平均数：$\displaystyle \frac{\sum_{i=1}^m k_{max_i}}{m}$。但平均数容易受极端值影响，HyperLogLog 实际使用的是**调和平均数**。令 $m$ 为桶数，$R$ 为调和平均数 $\displaystyle H_{n} = \frac{n}{\sum_{i=1}^n \frac{1}{x_{i}}}$，初步拟定的估计公式为：

$$\displaystyle DV_{LL} = \text{constant} \times m \times 2^{\hat{R}}$$

最终的统计公式中还引入了常数修正因子，以修正小基数和大基数下的偏差。

%% 参考：[Gemini](https://aistudio.google.com/prompts/1zZzdy1KzCbVN52p0KZEbsLSQzwtaKCrX)。 %%

![](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/3/2/1693c649359ce382~tplv-t2oaga2asx-jj-mark:3024:0:0:0:q75.awebp)

### $n = 2^{k_{\text{max}}}$ 的推导

以下推导详细说明了前面" $n \approx 2^{k_{\text{max}}}$ "这个估计是怎么来的。

%% 参考：[deepseek](https://chat.deepseek.com/a/chat/s/c17fec01-533f-4fa4-9b85-c62e6f6f5c2c)。 %%

#### 一、伯努利试验的定义及概率 $P(k)$ 的含义

**伯努利试验**被定义为"连续抛硬币，直到出现正面为止，记录所需的抛掷次数"。这里的"伯努利试验"实际上属于**几何分布**的范畴。具体来说：

- **单次试验的成功概率**：每次抛硬币出现正面的概率为 $p = \frac{1}{2}$，出现反面为 $1-p = \frac{1}{2}$。
- **抛掷次数 $k$ 的概率**：若第一次出现正面是在第 $k$ 次抛掷，则前 $k-1$ 次均为反面，第 $k$ 次为正面。因此：

  $$
  P(k) = \underbrace{\left(\frac{1}{2}\right)^{k-1}}_{\text{前 }k-1\text{ 次反面}} \cdot \underbrace{\frac{1}{2}}_{\text{第 }k\text{ 次正面}} = \frac{1}{2^k}, \quad k = 1, 2, \dots
  $$

  这就是几何分布的概率质量函数。

#### 二、极大似然估计的推导过程

##### 1. 问题建模

- **目标**：通过观察 $n$ 次试验的最大抛掷次数 $k_{\text{max}} = m$，估计 $n$ 的值。
- **关键概率公式**：观察到最大抛掷次数为 $m$ 的概率是：

  $$
  P(k_{\text{max}} = m \mid n) = \left[\underbrace{1 - \frac{1}{2^m}}_{\text{所有试验次数} \leq m}\right]^n - \left[\underbrace{1 - \frac{1}{2^{m-1}}}_{\text{所有试验次数} \leq m-1}\right]^n
  $$

  解释：
  - 第一项 $\left[1 - \frac{1}{2^m}\right]^n$：所有 $n$ 次试验的抛掷次数均不超过 $m$。
  - 第二项 $\left[1 - \frac{1}{2^{m-1}}\right]^n$：所有 $n$ 次试验的抛掷次数均不超过 $m-1$。
  - 两者相减后，得到"所有试验次数均不超过 $m$，且至少有一次等于 $m$"的概率。

##### 2. 对数似然函数

为了简化计算，对概率取自然对数：

$$
\mathcal{L}(n) = \ln\left(\left[1 - \frac{1}{2^m}\right]^n - \left[1 - \frac{1}{2^{m-1}}\right]^n\right)
$$

##### 3. 泰勒展开近似

当 $m$ 较大时，$\frac{1}{2^m}$ 非常小，可以利用近似 $1 - x \approx e^{-x}$（泰勒展开的一阶近似）：

$$
1 - \frac{1}{2^m} \approx e^{-\frac{1}{2^m}}, \quad 1 - \frac{1}{2^{m-1}} \approx e^{-\frac{2}{2^m}}
$$

代入后，概率简化为：

$$
P(k_{\text{max}} = m \mid n) \approx e^{-\frac{n}{2^m}} - e^{-\frac{2n}{2^m}}
$$

##### 4. 最大化似然函数

令 $x = \frac{n}{2^m}$，则概率表达式变为：

$$
P \approx e^{-x} - e^{-2x}
$$

对 $x$ 求导并令导数为零：

$$
\frac{d}{dx} \left(e^{-x} - e^{-2x}\right) = -e^{-x} + 2e^{-2x} = 0
$$

解得：

$$
e^{-x} = 2e^{-2x} \quad \Rightarrow \quad e^{x} = 2 \quad \Rightarrow \quad x = \ln 2
$$

因此：

$$
\frac{n}{2^m} = \ln 2 \quad \Rightarrow \quad n = \ln 2 \cdot 2^m \approx 0.693 \cdot 2^m
$$

##### 5. 工程近似

在题目中，常数因子 $\ln 2 \approx 0.693$ 被忽略，简化为：

$$
n \approx 2^{k_{\text{max}}}
$$

这是因为：

- **数量级匹配**：当 $m$ 较大时，$0.693 \cdot 2^m$ 与 $2^m$ 处于同一数量级。
- **整数估计**：实际应用中 $n$ 需为整数，取 $2^m$ 更简洁。

#### 三、直观验证

##### 示例：当 $k_{\text{max}} = 3$ 时

- **理论估计**：$n \approx 2^3 = 8$。
- **实际概率计算**：

  $$
  P(k_{\text{max}} = 3 \mid n = 8) = \left(1 - \frac{1}{8}\right)^8 - \left(1 - \frac{1}{4}\right)^8 \approx 0.3436 - 0.1001 = 0.2435
  $$

  对比 $n = 7$ 和 $n = 9$ 的概率，发现 $n = 8$ 时概率最大，验证了估计的合理性。

#### 四、总结

1. **伯努利试验的概率**：单次试验抛掷 $k$ 次的概率为 $P(k) = \frac{1}{2^k}$。
2. **极大似然估计**：通过最大化观察到 $k_{\text{max}} = m$ 的概率，推导出 $n \approx 2^m$。
3. **工程简化**：忽略常数因子 $\ln 2$，得到直观的整数关系 $n = 2^{k_{\text{max}}}$。
