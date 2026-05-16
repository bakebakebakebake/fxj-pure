---
title: "Probabilistic Data Structures in Redis: HyperLogLog and Bloom Filters"
description: A deep dive into the mathematical principles behind HyperLogLog and its Redis implementation
publishDate: 2025-06-08
tags:
  - Interview Prep
  - Redis
  - HyperLogLog
  - Bloom Filter
  - Probabilistic Data Structures
language: English
heroImageSrc: ../../../pic/sean-pollock-PhYq704ffdA-unsplash.jpg
heroImageColor: " #3e4f64 "
---

> This article dives deep into the mathematical principles of HyperLogLog and its Redis implementation. For Redis core concepts (data structures, threading model, persistence, clustering, etc.), see [Redis Related Concepts](/blog/en/interview-redis-3).

### Bloom Filter

- What is the principle of Bloom filters? Use cases?
	- A Bloom filter implementation:
> [!NOTE]- Bloom Filter Implementation
> ```java
> import java.util.BitSet;
>
> public class MyBloomFilter {
>
>     /**
>      * Size of the bit array
>      */
>     private static final int DEFAULT_SIZE = 2 << 24;
>     /**
>      * Through this array, 6 different hash functions can be created
>      */
>     private static final int[] SEEDS = new int[]{3, 13, 46, 71, 91, 134};
>
>     /**
>      * Bit array. Elements in the array can only be 0 or 1
>      */
>     private BitSet bits = new BitSet(DEFAULT_SIZE);
>
>     /**
>      * Array storing classes containing hash functions
>      */
>     private SimpleHash[] func = new SimpleHash[SEEDS.length];
>
>     /**
>      * Initialize array of classes containing hash functions, each class has a different hash function
>      */
>     public MyBloomFilter() {
>         // Initialize multiple different Hash functions
>         for (int i = 0; i < SEEDS.length; i++) {
>             func[i] = new SimpleHash(DEFAULT_SIZE, SEEDS[i]);
>         }
>     }
>
>     /**
>      * Add element to bit array
>      */
>     public void add(Object value) {
>         for (SimpleHash f : func) {
>             bits.set(f.hash(value), true);
>         }
>     }
>
>     /**
>      * Check if specified element exists in bit array
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
>      * Static inner class for hash operations
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
>          * Calculate hash value
>          */
>         public int hash(Object value) {
>             int h;
>             return (value == null) ? 0 : Math.abs((cap - 1) & seed * ((h = value.hashCode()) ^ (h >>> 16)));
>         }
>
>     }
> }
> ```

### HyperLogLog

- Understanding the principle of **HyperLogLog** [juejin](https://juejin.cn/?url=https%3A%2F%2Fjuejin.cn%2Fpost%2F6844903785744056333)
	- First, data is converted to a bit string through a hash function (Redis uses 64 bits, so it can represent a range of $2^{64}-1$). 0 represents the reverse side of a coin, otherwise it's heads. **You can estimate how many experiments were conducted in total based on the maximum number of times heads appeared in multiple coin flip experiments. Similarly, you can estimate how much data was stored based on the maximum position k_max where 1 appeared in the stored data after conversion.**
	- In Redis, HyperLogLog is set to: m(buckets)=16834, p=6, L=16834 * 6. Memory usage = 16834 * 6 / 8 / 1024 = 12K
		- When storing, value is **hashed to 64 bits**, i.e., a 64-bit bit string. **The first 14 bits (14= $\log_{2}m$) are used for bucketing**. Converting the first 14 bits from binary to decimal gives the bucket number. Since the complete value bit string is 64 bits, after subtracting 14, 50 bits remain. In extreme cases, the position where 1 appears is at position 50, i.e., position is 50. At this point index = 50. Then convert index to binary, which is: 110010 (can be stored)
		- Following the above approach, different values will be set to different buckets. If they end up in the same bucket, i.e., the first 14 bits are the same but the position where 1 appears later is different, then **compare whether the original index is larger than the new index**. If yes, replace. If no, keep unchanged.
		- Finally, all 16384 buckets corresponding to a key have been set with many values, and each bucket has a k_max. When calling pfcount, according to the estimation method introduced earlier, you can calculate how many times the key has been set with values, which is the statistical value.
		- Value is converted to a 64-bit bit string and finally recorded in each bucket according to the above approach. 64 bits converted to decimal is: 2^64. HyperLogLog only uses: 16384 * 6 /8 / 1024 K of storage space to count up to 2^64 numbers.
	- How to estimate the value? Formula? [Gemini](https://aistudio.google.com/prompts/1zZzdy1KzCbVN52p0KZEbsLSQzwtaKCrX)
		- For multiple rounds of experiments: Initial formula (m is the number of experiment rounds, R is the harmonic mean: $\displaystyle H_{n}=\frac{n}{\sum\limits_{i=1}^n \frac{1}{x_{i}}}$): $\displaystyle DV_{LL}=\text{constant}\times m\times2^{\hat{R}}$
		- The ordinary average is: (k_max_1 + ... + k_max_m)/m= $\displaystyle \frac{\sum\limits_{i=1}^mk_{max_{i}}}{m}$
		- For the final statistical formula: ![](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/3/2/1693c649359ce382~tplv-t2oaga2asx-jj-mark:3024:0:0:0:q75.awebp)

> [!NOTE]- About the derivation of $n=2^{k_{max}}$ for HyperLogLog: [deepseek](https://chat.deepseek.com/a/chat/s/c17fec01-533f-4fa4-9b85-c62e6f6f5c2c)
> 
> ### **I. Definition of Bernoulli Trial and Meaning of Probability $P(k)$**
>
> **Bernoulli trial** is defined as "continuously flipping a coin until heads appears, recording the number of flips required". This "Bernoulli trial" actually belongs to the category of **geometric distribution**. Specifically:
>
> - **Success probability of a single trial**: The probability of getting heads on each coin flip is $p = \frac{1}{2}$, and tails is $1-p = \frac{1}{2}$.
> - **Probability of number of flips $k$**: If the first heads appears on the $k$-th flip, then the first $k-1$ flips are all tails, and the $k$-th flip is heads. Therefore:
>   $$
>   P(k) = \underbrace{\left(\frac{1}{2}\right)^{k-1}}_{\text{first }k-1\text{ flips tails}} \cdot \underbrace{\frac{1}{2}}_{\text{k-th flip heads}} = \frac{1}{2^k}, \quad k = 1, 2, \dots
>   $$
>   This is the probability mass function of the geometric distribution.
>
> ---
>
> ### **II. Maximum Likelihood Estimation Derivation Process**
>
> #### **1. Problem Modeling**
> - **Goal**: Estimate the value of $n$ by observing the maximum number of flips $k_{\text{max}} = m$ in $n$ trials.
> - **Key probability formula**: The probability of observing a maximum number of flips of $m$ is:
>   $$
>   P(k_{\text{max}} = m \mid n) = \left[\underbrace{1 - \frac{1}{2^m}}_{\text{all trial counts} \leq m}\right]^n - \left[\underbrace{1 - \frac{1}{2^{m-1}}}_{\text{all trial counts} \leq m-1}\right]^n
>   $$
>   Explanation:
>   - First term $\left[1 - \frac{1}{2^m}\right]^n$: All $n$ trials have flip counts not exceeding $m$.
>   - Second term $\left[1 - \frac{1}{2^{m-1}}\right]^n$: All $n$ trials have flip counts not exceeding $m-1$.
>   - Subtracting the two gives "all trial counts do not exceed $m$, and at least one equals $m$" probability.
>
> #### **2. Log-Likelihood Function**
> To simplify calculation, take the natural logarithm of the probability:
> $$
> \mathcal{L}(n) = \ln\left(\left[1 - \frac{1}{2^m}\right]^n - \left[1 - \frac{1}{2^{m-1}}\right]^n\right)
> $$
>
> #### **3. Taylor Expansion Approximation**
> When $m$ is large, $\frac{1}{2^m}$ is very small, and we can use the approximation $1 - x \approx e^{-x}$ (first-order Taylor expansion):
> $$
> 1 - \frac{1}{2^m} \approx e^{-\frac{1}{2^m}}, \quad 1 - \frac{1}{2^{m-1}} \approx e^{-\frac{2}{2^m}}
> $$
> Substituting, the probability simplifies to:
> $$
> P(k_{\text{max}} = m \mid n) \approx e^{-\frac{n}{2^m}} - e^{-\frac{2n}{2^m}}
> $$
>
> #### **4. Maximizing the Likelihood Function**
> Let $x = \frac{n}{2^m}$, then the probability expression becomes:
> $$
> P \approx e^{-x} - e^{-2x}
> $$
> Take the derivative with respect to $x$ and set it to zero:
> $$
> \frac{d}{dx} \left(e^{-x} - e^{-2x}\right) = -e^{-x} + 2e^{-2x} = 0
> $$
> Solving:
> $$
> e^{-x} = 2e^{-2x} \quad \Rightarrow \quad e^{x} = 2 \quad \Rightarrow \quad x = \ln 2
> $$
> Therefore:
> $$
> \frac{n}{2^m} = \ln 2 \quad \Rightarrow \quad n = \ln 2 \cdot 2^m \approx 0.693 \cdot 2^m
> $$
>
> #### **5. Engineering Approximation**
> In the problem, the constant factor $\ln 2 \approx 0.693$ is ignored, simplified to:
> $$
> n \approx 2^{k_{\text{max}}}
> $$
> This is because:
> - **Order of magnitude matching**: When $m$ is large, $0.693 \cdot 2^m$ and $2^m$ are of the same order of magnitude.
> - **Integer estimation**: In practice, $n$ needs to be an integer, taking $2^m$ is more concise.
>
> ---
>
> ### **III. Intuitive Verification**
>
> #### **Example: When $k_{\text{max}} = 3$**
> - **Theoretical estimate**: $n \approx 2^3 = 8$.
> - **Actual probability calculation**:
>   $$
>   P(k_{\text{max}} = 3 \mid n = 8) = \left(1 - \frac{1}{8}\right)^8 - \left(1 - \frac{1}{4}\right)^8 \approx 0.3436 - 0.1001 = 0.2435
>   $$
>   Comparing probabilities for $n = 7$ and $n = 9$, we find that the probability is highest when $n = 8$, verifying the reasonableness of the estimate.
>
> ---
>
> ### **IV. Summary**
> 1. **Bernoulli trial probability**: The probability of flipping $k$ times in a single trial is $P(k) = \frac{1}{2^k}$.
> 2. **Maximum likelihood estimation**: By maximizing the probability of observing $k_{\text{max}} = m$, we derive $n \approx 2^m$.
> 3. **Engineering simplification**: Ignoring the constant factor $\ln 2$, we get the intuitive integer relationship $n = 2^{k_{\text{max}}}$.
>
>
