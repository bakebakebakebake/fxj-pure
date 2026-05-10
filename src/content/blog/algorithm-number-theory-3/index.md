---
title: 数论(III)
description: 狄利克雷卷积、莫比乌斯函数、莫比乌斯反演及其常见套路。
publishDate: 2024-09-13
tags:
  - 算法
  - 数论
  - 莫比乌斯反演
  - 狄利克雷卷积
  - 积性函数
language: 中文
heroImageSrc: ../../pic/franco-debartolo-v3E6teZ_KUM-unsplash.jpg
heroImageColor: "#8d6540"
---

数论题里经常出现一种结构：真正想求的是 $g(n)$，但题目给的或者容易算的是"把 $g$ 在所有因子上累加后的结果"：

$$
f(n) = \sum_{d \mid n} g(d)
$$

怎么从 $f$ 倒推回 $g$？莫比乌斯反演就是干这件事的。

## 狄利克雷卷积

定义：

$$
(f * g)(n) = \sum_{d \mid n} f(d) \, g\!\left(\frac{n}{d}\right)
$$

满足交换律、结合律、分配律。

三个基础函数：

- 元函数：$\epsilon(n) = [n = 1]$
- 常数函数：$1(n) = 1$
- 恒等函数：$\operatorname{id}(n) = n$

$\epsilon$ 是卷积单位元：$f * \epsilon = f$。

积性函数（$\gcd(a,b)=1 \implies f(ab) = f(a)f(b)$）在此框架下很重要。欧拉函数和莫比乌斯函数都是积性函数。

三个核心卷积关系，记住它们就能认出大部分题目：

- $\mu * 1 = \epsilon$，即 $\sum_{d \mid n} \mu(d) = [n = 1]$
- $\varphi * 1 = \operatorname{id}$，即 $\sum_{d \mid n} \varphi(d) = n$
- $\mu * \operatorname{id} = \varphi$，即 $\sum_{d \mid n} \mu(d) \frac{n}{d} = \varphi(n)$

第三个可由前两个推出：$\mu * \operatorname{id} = \mu * (\varphi * 1) = (\mu * 1) * \varphi = \epsilon * \varphi = \varphi$。

狄利克雷卷积与普通卷积（多项式乘法）本质是同一思路：普通卷积按"下标和"拆分，狄利克雷卷积按"因子"拆分。

## 莫比乌斯函数

$$
\mu(n) =
\begin{cases}
1 & n = 1 \\
0 & n \text{ 含平方因子} \\
(-1)^k & n = p_1 p_2 \cdots p_k \text{（} k \text{ 个不同质数）}
\end{cases}
$$

$\mu$ 之所以是反演的核心，是因为它满足：

$$
\sum_{d \mid n} \mu(d) = [n = 1]
$$

翻成卷积：$\mu * 1 = \epsilon$。也就是说，在卷积意义下，$\mu$ 是 $1$ 的逆元。

## 莫比乌斯反演

反演公式：

$$
f(n) = \sum_{d \mid n} g(d)
\;\Longleftrightarrow\;
g(n) = \sum_{d \mid n} \mu(d) \, f\!\left(\frac{n}{d}\right)
$$

写成卷积就一目了然：$f = g * 1$，两边同卷 $\mu$：

$$
\mu * f = \mu * g * 1 = g * (\mu * 1) = g * \epsilon = g
$$

展开求和即得反演公式。

另一种等价形式（按倍数求和）：

$$
f(n) = \sum_{n \mid d} g(d)
\;\Longleftrightarrow\;
g(n) = \sum_{n \mid d} \mu\!\left(\frac{d}{n}\right) f(d)
$$

做题时，看到 $\sum_{d \mid n}$ 或 $\sum_{d \mid \gcd(i,j)}$ 这类按因子/倍数展开的结构，通常可以用 $\mu * 1 = \epsilon$ 把求和拆开。反演本身往往不是终点，拆开后还要配合线性筛、积性函数前缀和、整除分块一起做。

## 练习

- [P2522 Problem b](https://www.luogu.com.cn/problem/P2522)：求 $\sum_{i=x}^n \sum_{j=y}^m [\gcd(i,j) = k]$，经典反演 + 整除分块。
- [P1829 Crash 的数字表格](https://www.luogu.com.cn/problem/P1829)：求 $\sum_{i=1}^n \sum_{j=1}^m \operatorname{lcm}(i,j)$，反演 + 前缀和优化。
- [LCMSUM](https://vjudge.net/problem/SPOJ-LCMSUM)：求 $\sum_{i=1}^n \operatorname{lcm}(i, n)$，利用 $\varphi * 1 = \operatorname{id}$ 化简。
- [LibreOJ 2185](https://loj.ac/problem/2185)：求 $\sum_{i=1}^n \sum_{j=1}^m d(ij)$，用到约数函数与反演的结合。
