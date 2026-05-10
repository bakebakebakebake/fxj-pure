---
title: 数论(I)
description: gcd、lcm、裴蜀定理、扩展欧几里得、快速幂、逆元与中国剩余定理。
publishDate: 2023-10-23
tags:
  - 算法
  - 数论
  - 入门
  - 欧几里得算法
  - 同余
language: 中文
heroImageSrc: ../../pic/bekky-bekks-VcQkZl4Wf1Y-unsplash.jpg
heroImageColor: " #4a7273 "
---

## gcd

辗转相除法：$\gcd(a, b) = \gcd(b, a \bmod b)$，递归直到 $b = 0$。

```cpp
int gcd(int a, int b) {
    return !b ? a : gcd(b, a % b);
}
```

C++17 起可用 `std::gcd(a, b)`，早期版本可用 `__gcd(a, b)`。

## lcm

$\gcd(a, b) \times \operatorname{lcm}(a, b) = a \times b$，先求 gcd 再 $O(1)$ 得 lcm。

多个数的 lcm：两两合并即可，不需要先求整体的 gcd。

```cpp
int lcm(int a, int b) {
    return a / gcd(a, b) * b;  // 先除后乘，防溢出
}
```

## 裴蜀定理

> 设 $a, b$ 是不全为零的整数，则存在整数 $x, y$ 使得 $ax + by = \gcd(a, b)$。

**证明**：设 $s = ax_0 + by_0$ 为 $ax + by$ 能取到的最小正整数。

- $\gcd(a, b) \mid a$ 且 $\gcd(a, b) \mid b \implies \gcd(a, b) \mid s$。
- 设 $a = qs + r\;(0 \le r < s)$，则 $r = a - qs = a - q(ax_0 + by_0) = a(1 - qx_0) + b(-qy_0)$。由于 $s$ 是最小正整数，$r = 0$，故 $s \mid a$。同理 $s \mid b$，所以 $s \mid \gcd(a, b)$。

因此 $s = \gcd(a, b)$。

**逆定理**：若存在 $x, y$ 使 $ax + by = d$，且 $d$ 是 $a, b$ 的正公因数，则 $d = \gcd(a, b)$。特别地，$ax + by = 1 \iff \gcd(a, b) = 1$。

**推论**：$a, b$ 互素时，$ab - a - b$ 是最大的不能用 $ax + by$（$x, y$ 为非负整数）表示的正整数。例如 P3951 直接输出 $ab - a - b$。

## 扩展欧几里得

用于求 $ax + by = \gcd(a, b)$ 的一组整数解。

设递归求解 $\gcd(b, a \bmod b)$ 时得到 $bx_2 + (a \bmod b)y_2 = \gcd$，代入 $a \bmod b = a - \lfloor a/b \rfloor \cdot b$：

$$
bx_2 + (a - \lfloor a/b \rfloor \cdot b)y_2 = ay_2 + b(x_2 - \lfloor a/b \rfloor y_2)
$$

对照 $ax_1 + by_1$，得 $x_1 = y_2,\; y_1 = x_2 - \lfloor a/b \rfloor y_2$。递归边界 $b = 0$ 时 $x = 1, y = 0$。

```cpp
int exgcd(int a, int b, int &x, int &y) {
    if (!b) { x = 1; y = 0; return a; }
    int d = exgcd(b, a % b, x, y);
    int t = x;
    x = y;
    y = t - (a / b) * y;
    return d;
}
```

通解：求出特解 $(x_0, y_0)$ 后，$x = x_0 + k \cdot \frac{b}{\gcd},\; y = y_0 - k \cdot \frac{a}{\gcd}$。

## 快速幂

计算 $x^y \bmod p$，$O(\log y)$。

```cpp
int qpow(int x, int y, int p) {
    int ans = 1;
    while (y) {
        if (y & 1) ans = 1ll * ans * x % p;
        x = 1ll * x * x % p;
        y >>= 1;
    }
    return ans;
}
```

注意 $x$ 和 $p$ 较大时中间乘法用 `long long`。

## 逆元

$a$ 在模 $b$ 下的逆元 $a^{-1}$ 满足 $a \cdot a^{-1} \equiv 1 \pmod b$，等价于解 $ax \equiv 1 \pmod b$。

### 费马小定理

$b$ 为质数时，$a^{-1} \equiv a^{b-2} \pmod b$。直接快速幂即可。

### 扩展欧几里得

对任意模数，解 $ax + by = 1$，所得 $x$ 即为逆元。适用于 $b$ 不一定是质数的情况。

### 线性递推

求 $1$ 到 $n$ 所有数模 $p$ 的逆元，$O(n)$：

```cpp
inv[1] = 1;
for (int i = 2; i <= n; ++i)
    inv[i] = 1ll * (p - p / i) * inv[p % i] % p;
```

推导：$p = \lfloor p/i \rfloor \cdot i + (p \bmod i)$，两边模 $p$ 整理即得。

### 任意 $n$ 个数的逆元

求 $a_1, \dots, a_n$ 各自的逆元。先算前缀积 $s_i$，快速幂求 $s_n^{-1}$，再倒推：

```cpp
s[0] = 1;
for (int i = 1; i <= n; ++i) s[i] = 1ll * s[i - 1] * a[i] % p;
sv[n] = qpow(s[n], p - 2, p);
for (int i = n; i >= 1; --i) {
    sv[i - 1] = 1ll * sv[i] * a[i] % p;
    inv[i] = 1ll * sv[i] * s[i - 1] % p;
}
```

$O(n + \log p)$ 求出全部逆元。

## 中国剩余定理

求解同余方程组：

$$
\begin{cases}
x \equiv r_1 \pmod{m_1} \\
x \equiv r_2 \pmod{m_2} \\
\cdots \\
x \equiv r_n \pmod{m_n}
\end{cases}
$$

其中 $m_i$ 两两互质。

令 $M = \prod m_i$，$c_i = M / m_i$，$d_i$ 为 $c_i$ 在模 $m_i$ 下的逆元。则：

$$
x \equiv \sum_{i=1}^n r_i \cdot c_i \cdot d_i \pmod M
$$

```cpp
long long crt(const vector<int>& r, const vector<int>& m) {
    long long M = 1, ans = 0;
    for (int mi : m) M *= mi;
    for (int i = 0; i < (int)r.size(); ++i) {
        long long ci = M / m[i];
        int x, y;
        exgcd(ci % m[i], m[i], x, y);
        long long di = (x % m[i] + m[i]) % m[i];
        ans = (ans + r[i] * ci % M * di) % M;
    }
    return ans;
}
```

模板题：[P1495 曹冲养猪](https://www.luogu.com.cn/problem/P1495)。
