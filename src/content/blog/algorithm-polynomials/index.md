---
title: 多项式
description: 从卷积、点值表示、FFT/NTT 到形式幂级数，整理多项式这套工具到底在解决什么。
publishDate: 2024-09-15
tags:
  - 算法
  - 多项式
  - FFT
  - NTT
  - 形式幂级数
language: 中文
heroImageSrc: ../../pic/claudio-luiz-castro-_R95VMWyn7A-unsplash.jpg
heroImageColor: " #005fb8 "
---

## 多项式是什么

把序列 $a_0, a_1, \dots, a_{n-1}$ 装进多项式：

$$
A(x) = a_0 + a_1 x + a_2 x^2 + \cdots + a_{n-1} x^{n-1}
$$

这个写法仅仅是序列的另一种表示。但一旦装进去，很多操作会变得统一。

多项式上最基础的三件事：

- 加法：逐项相加，$O(n)$；
- 数乘：逐项乘常数，$O(n)$；
- 乘法：卷积，朴素 $O(n^2)$。

其中乘法最关键：

$$
A(x) B(x) = \sum_{k \ge 0} \left( \sum_{i=0}^k a_i b_{k-i} \right) x^k
$$

$x^k$ 的系数恰好是序列卷积 $c_k = \sum_{i=0}^k a_i b_{k-i}$。

这里就有了一个问题，$O(n^2)$ 显然不够快...

**卷积能不能更快？** 答案是可以，但需要换一种表示。

## 卷积场景

卷积不是多项式专属概念。它反复出现：

- 两个集合的元素和分布统计；
- 计数问题中若干独立选择的合并；
- 字符串匹配中的相关性计算（FFT 做通配符匹配）；
- DP 中"前一段状态批量转移到后一段"；
- 生成函数乘法；
- 形式幂级数运算的底层。

所有这些场景，本质都是 $c_k = \sum_i a_i b_{k-i}$。朴素 $O(n^2)$ 在小规模下够用，长度到 $10^5$ 级别就必须换做法。

## 系数表示与点值表示

这是多项式里最关键的一次视角切换。

系数表示就是平时写的样子：$A(x) = a_0 + a_1 x + \cdots + a_{n-1} x^{n-1}$。建模方便，加法自然，但乘法是 $O(n^2)$。

点值表示：如果知道多项式在 $n$ 个不同点上的取值 $(x_0, A(x_0)), (x_1, A(x_1)), \dots, (x_{n-1}, A(x_{n-1}))$，就唯一确定了这个次数小于 $n$ 的多项式。

在点值表示下，乘法变成逐点相乘：$C(x_i) = A(x_i) \cdot B(x_i)$，复杂度 $O(n)$。

于是整套 FFT / NTT 的思路就是三步：

1. 系数表示 → 点值表示（求值）；
2. 逐点相乘；
3. 点值表示 → 系数表示（插值）。

关键在第 1 步和第 3 步——如果随便选 $n$ 个点，求值和插值都是 $O(n^2)$，换表示就失去了意义。FFT 的贡献就是找到了一组特殊的点（单位根），让求值和插值都降到 $O(n \log n)$。

## FFT

FFT（Fast Fourier Transform）是快速计算 DFT 的算法。

### 为什么选单位根

$n$ 次单位根 $\omega_n = e^{2\pi i / n}$ 有两个关键性质：

- $\omega_n^n = 1$，$\omega_n^{k+n/2} = -\omega_n^k$（对称性）；
- $\omega_n^2 = \omega_{n/2}$（折半性）。

这些性质让分治成为可能。

### 分治结构

把多项式按奇偶项拆开：

$$
A(x) = A_{\text{even}}(x^2) + x \cdot A_{\text{odd}}(x^2)
$$

在单位根上求值时，由于 $(\omega_n^k)^2 = \omega_{n/2}^k$，问题规模减半：原本要在 $n$ 个点上求 $A(x)$，变成在 $n/2$ 个点上求 $A_{\text{even}}(x)$ 和 $A_{\text{odd}}(x)$。

递归下去，每一层把规模减半、做线性的蝴蝶操作，共 $\log n$ 层，总复杂度 $O(n \log n)$。

FFT 在复数域上做，主要问题是精度误差和系数过大时的稳定性。所以在模意义下通常换 NTT。

## NTT

NTT（Number Theoretic Transform）把 FFT 的复数单位根换成模意义下的原根。

设模数 $P$ 有原根 $g$，则 $g^{(P-1)/n}$ 在模 $P$ 下具有和 $\omega_n$ 一样的对称性和折半性，条件是 $n \mid (P-1)$。

模数 $998244353 = 119 \times 2^{23} + 1$ 的原根是 $3$，支持长度 $2^k$（$k \le 23$）的变换，是竞赛里最常用的 NTT 模数。

```cpp title="NTT 卷积骨架（998244353）"
#include <bits/stdc++.h>
using namespace std;

constexpr int MOD = 998244353;
constexpr int G = 3;

long long qpow(long long a, long long b) {
    long long res = 1;
    while (b) {
        if (b & 1) res = res * a % MOD;
        a = a * a % MOD;
        b >>= 1;
    }
    return res;
}

void ntt(vector<int>& a, bool invert) {
    int n = (int)a.size();
    for (int i = 1, j = 0; i < n; ++i) {
        int bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) swap(a[i], a[j]);
    }

    for (int len = 2; len <= n; len <<= 1) {
        long long wn = qpow(G, (MOD - 1) / len);
        if (invert) wn = qpow(wn, MOD - 2);
        for (int i = 0; i < n; i += len) {
            long long w = 1;
            for (int j = 0; j < len / 2; ++j) {
                int u = a[i + j];
                int v = (int)(w * a[i + j + len / 2] % MOD);
                a[i + j] = u + v < MOD ? u + v : u + v - MOD;
                a[i + j + len / 2] = u - v >= 0 ? u - v : u - v + MOD;
                w = w * wn % MOD;
            }
        }
    }

    if (invert) {
        long long inv_n = qpow(n, MOD - 2);
        for (int& x : a) x = (int)(x * inv_n % MOD);
    }
}

vector<int> convolution(vector<int> a, vector<int> b) {
    int need = (int)a.size() + (int)b.size() - 1;
    int n = 1;
    while (n < need) n <<= 1;
    a.resize(n);
    b.resize(n);

    ntt(a, false);
    ntt(b, false);
    for (int i = 0; i < n; ++i) a[i] = (long long)a[i] * b[i] % MOD;
    ntt(a, true);

    a.resize(need);
    return a;
}
```

NTT 常见坑点：
- 长度要补到 2 的幂；
- 正变换和逆变换的根不同；
- 逆变换最后乘上 $n^{-1}$；
- `need = a.size() + b.size() - 1` 这一步容易算少。

## 形式幂级数

把多项式从"有限项"推广到"只关心前若干项的无穷级数"，就是形式幂级数（FPS）：

$$
A(x) = a_0 + a_1 x + a_2 x^2 + \cdots
$$

在模 $x^n$ 意义下，可以定义导数、积分、逆元、对数、指数、开根等运算。

听起来很"代数"，但场景相对具体：

- **求逆**：$A(x) B(x) \equiv 1 \pmod{x^n}$，牛顿迭代 $O(n \log n)$；
- **对数**：$\ln A(x) = \int A'(x) A^{-1}(x) \,dx$，依赖求逆和求导；
- **指数**：$B(x) = e^{A(x)}$，牛顿迭代，依赖对数；
- **开根**：$\sqrt{A(x)}$，牛顿迭代。

它们的实现最终都落在若干次多项式乘法上。所以真正的底座始终是卷积。FFT / NTT 这一步不稳，后面的 FPS 操作都立不住。

## 例：大数乘法

两个 $n$ 位数相乘，把每一位看作多项式系数。例如 $123 = 1 \cdot x^2 + 2 \cdot x + 3$，两个数相乘就是两个多项式做卷积，最后处理进位。

朴素竖式乘法 $O(n^2)$；FFT 做卷积 $O(n \log n)$。

```cpp
#include <bits/stdc++.h>
using namespace std;

const double PI = acos(-1.0);

struct Complex {
    double r, i;
    Complex(double r = 0, double i = 0) : r(r), i(i) {}
    Complex operator+(const Complex& b) const { return Complex(r + b.r, i + b.i); }
    Complex operator-(const Complex& b) const { return Complex(r - b.r, i - b.i); }
    Complex operator*(const Complex& b) const {
        return Complex(r * b.r - i * b.i, r * b.i + i * b.r);
    }
};

void fft(vector<Complex>& a, int n, int inv) {
    if (n == 1) return;
    for (int i = 0, j = 0; i < n; i++) {
        if (i > j) swap(a[i], a[j]);
        for (int k = n >> 1; (j ^= k) < k; k >>= 1);
    }
    for (int len = 2; len <= n; len <<= 1) {
        Complex wn(cos(2 * PI / len), inv * sin(2 * PI / len));
        for (int i = 0; i < n; i += len) {
            Complex w(1, 0);
            for (int j = 0; j < len / 2; j++) {
                Complex u = a[i + j], v = w * a[i + j + len / 2];
                a[i + j] = u + v;
                a[i + j + len / 2] = u - v;
                w = w * wn;
            }
        }
    }
    if (inv == -1)
        for (int i = 0; i < n; i++) a[i].r /= n;
}

string multiply(string num1, string num2) {
    int n1 = num1.size(), n2 = num2.size();
    int n = 1;
    while (n < n1 + n2) n <<= 1;
    vector<Complex> a(n), b(n);
    for (int i = 0; i < n1; i++) a[i].r = num1[n1 - 1 - i] - '0';
    for (int i = 0; i < n2; i++) b[i].r = num2[n2 - 1 - i] - '0';
    fft(a, n, 1); fft(b, n, 1);
    for (int i = 0; i < n; i++) a[i] = a[i] * b[i];
    fft(a, n, -1);
    vector<int> res(n);
    for (int i = 0; i < n; i++) res[i] = (int)(a[i].r + 0.5);
    for (int i = 0; i < n - 1; i++) {
        res[i + 1] += res[i] / 10;
        res[i] %= 10;
    }
    int pos = n - 1;
    while (pos > 0 && res[pos] == 0) pos--;
    string ans;
    for (int i = pos; i >= 0; i--) ans += char(res[i] + '0');
    return ans;
}
```

## 多项式场景

> 看一个问题能不能被归约到卷积。

判断路径：

1. 问题能否写成 $c_k = \sum_i a_i b_{k-i}$ 的形式？能 → 卷积。
2. 如果能写出生成函数，且瓶颈在"把若干多项式乘起来"→ 多项式乘法。
3. 如果要求对 $n$ 个物品做批量合并，每个合并是"按和 / 按偏移量统计"→ 大概率是卷积。
4. 如果朴素卷积 $O(n^2)$ 过不了，且不关心每个多项式具体长什么样，只关心结果 → FFT / NTT。

核心都大致相同：多项式算法的入口永远是卷积。FFT / NTT / FPS 都是卷积之上的加速层。

## 参考

- [OI-Wiki：多项式](https://oi-wiki.org/math/poly/)
- [OI-Wiki：多项式入门](https://oi-wiki.org/math/poly/intro/)
- [蒋炎岩：多项式](https://www.bilibili.com/video/BV1PK4y1x7V4/)
