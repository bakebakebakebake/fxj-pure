---
title: 数论(II)
description: 线性筛、埃氏筛、分块筛、欧拉函数、威尔逊定理及其相关结论。
publishDate: 2023-10-27
tags:
  - 算法
  - 数论
  - 筛法
  - 线性筛
  - 欧拉函数
  - 莫比乌斯函数
language: 中文
heroImageSrc: ../../pic/gayatri-malhotra-4wF66_KWJxA-unsplash.jpg
heroImageColor: " #d4b337 "
---

## 线性筛

线性筛（欧拉筛）的核心：每个合数只被它的**最小质因子**筛掉一次，复杂度 $O(n)$。

```cpp
vector<int> primes;
bool vis[N];

void sieve(int n) {
    for (int i = 2; i <= n; ++i) {
        if (!vis[i]) primes.push_back(i);
        for (int p : primes) {
            if (1ll * i * p > n) break;
            vis[i * p] = true;
            if (i % p == 0) break;  // p 是 i 的最小质因子，之后的质数不再需要
        }
    }
}
```

`if (i % p == 0) break` 是关键：此时 p 是 i 的最小质因子，那么对于更大的质数 p'，i * p' 的最小质因子仍然是 p（而非 p'），应该留给后面的轮次去筛。

线性筛不止能筛素数——只要函数是**积性函数**（$\gcd(a,b)=1 \implies f(ab)=f(a)f(b)$），就能在筛的过程中顺便求出。比如欧拉函数、莫比乌斯函数都可以在同一个框架下计算。

## 埃氏筛

从小到大遍历，每遇到一个素数，就把它的所有倍数标记为合数。复杂度 $O(n \log \log n)$。

只筛到 $\sqrt{n}$ 即可：

```cpp
vector<bool> is_prime(n + 1, true);
is_prime[0] = is_prime[1] = false;
for (int i = 2; i * i <= n; ++i) {
    if (is_prime[i]) {
        for (int j = i * i; j <= n; j += i)
            is_prime[j] = false;
    }
}
```

内层循环从 $i^2$ 开始的原因：比 $i^2$ 小的倍数一定含有比 $i$ 更小的质因子，之前已经被筛过了。如果再只筛奇数，常数可以减半。

## 分块筛

当 $n$ 很大（如 $10^{12}$）时，线性筛和埃氏筛内存都扛不住。分块筛将区间分成大小为 $S$ 的块，只用 $\sqrt{n}$ 以内的素数去筛每一块，内存降到 $O(\sqrt{n} + S)$。

```cpp
int count_primes(long long n) {
    const int S = 10000;
    int nsqrt = sqrt(n);
    vector<char> is_prime(nsqrt + 1, true);
    vector<int> primes;
    for (int i = 2; i <= nsqrt; ++i) {
        if (is_prime[i]) {
            primes.push_back(i);
            for (int j = i * i; j <= nsqrt; j += i) is_prime[j] = false;
        }
    }
    int result = 0;
    vector<char> block(S);
    for (long long k = 0; k * S <= n; ++k) {
        fill(block.begin(), block.end(), true);
        long long start = k * S;
        for (int p : primes) {
            long long start_idx = max((start + p - 1) / p, (long long)p);
            for (long long j = start_idx * p - start; j < S; j += p)
                block[j] = false;
        }
        if (k == 0) block[0] = block[1] = false;
        for (int i = 0; i < S && start + i <= n; ++i)
            if (block[i]) result++;
    }
    return result;
}
```

块大小 $S$ 一般取 $10^4 \sim 10^5$。

## 欧拉函数

$\varphi(n)$ 表示 $1$ 到 $n$ 中与 $n$ 互质的数的个数：

$$
\varphi(n) = \sum_{i=1}^n [\gcd(i, n) = 1]
$$

### 性质

- 积性：$\gcd(a, b) = 1 \implies \varphi(ab) = \varphi(a)\varphi(b)$
- $n = \sum_{d \mid n} \varphi(d)$
- 若 $n = p^k$（$p$ 为质数），则 $\varphi(n) = p^k - p^{k-1}$
- 由唯一分解 $n = \prod p_i^{k_i}$：$\varphi(n) = n \prod \left(1 - \frac{1}{p_i}\right)$

### 单点求值

$O(\sqrt{n})$：

```cpp
int phi(int n) {
    int ans = n;
    for (int i = 2; i * i <= n; ++i) {
        if (n % i == 0) {
            ans = ans / i * (i - 1);
            while (n % i == 0) n /= i;
        }
    }
    if (n > 1) ans = ans / n * (n - 1);
    return ans;
}
```

### 线性筛求欧拉函数

在线性筛框架下递推：

```cpp
vector<int> primes, phi;

void sieve(int n) {
    vector<int> minp(n + 1);
    phi.assign(n + 1, 0);
    phi[1] = 1;
    for (int i = 2; i <= n; ++i) {
        if (!minp[i]) {
            minp[i] = i;
            primes.push_back(i);
            phi[i] = i - 1;
        }
        for (int p : primes) {
            if (i * p > n) break;
            minp[i * p] = p;
            if (p == minp[i]) {
                phi[i * p] = phi[i] * p;      // p 是 i 的最小质因子
                break;
            }
            phi[i * p] = phi[i] * phi[p];     // i 与 p 互质
        }
    }
}
```

### 欧拉定理与扩展

**欧拉定理**：$\gcd(a, m) = 1 \implies a^{\varphi(m)} \equiv 1 \pmod m$。

费马小定理是 $m$ 为质数时的特例：$a^{p-1} \equiv 1 \pmod p$。

**扩展欧拉定理**：用于处理幂次很大的情况：

$$
a^b \equiv
\begin{cases}
a^{b \bmod \varphi(m)} & \gcd(a, m) = 1 \\[4pt]
a^b & \gcd(a, m) \neq 1,\; b < \varphi(m) \\[4pt]
a^{(b \bmod \varphi(m)) + \varphi(m)} & \gcd(a, m) \neq 1,\; b \ge \varphi(m)
\end{cases}
\pmod m
$$

### 练习

**P2568 GCD**：求 $\sum_{i=1}^n \sum_{j=1}^n [\gcd(i,j) \text{ 为素数}]$。

枚举素数 $p$，$\gcd(i,j) = p \iff \gcd(i/p, j/p) = 1$，故：

$$
\sum_{p \le n} \left(2 \sum_{i=1}^{n/p} \varphi(i) - 1\right)
$$

```cpp
#define int long long
signed main() {
    int n; cin >> n;
    sieve(n);
    partial_sum(phi.begin(), phi.end(), phi.begin());
    int ans = 0;
    for (int p : primes) ans += 2 * phi[n / p] - 1;
    cout << ans << '\n';
}
```

**P2398 GCD SUM**：求 $\sum_{i=1}^n \sum_{j=1}^n \gcd(i,j)$。

枚举 $\gcd = k$，个数为 $2 \sum_{i=1}^{n/k} \varphi(i) - 1$：

```cpp
int ans = 0;
for (int k = 1; k <= n; ++k)
    ans += k * (2 * phi[n / k] - 1);
```

**P2158 仪仗队**：可见点 $(x,y)$ 满足 $\gcd(x-1, y-1) = 1$。答案为 $2 \sum_{i=1}^{n-1} \varphi(i) + 1$（$n=1$ 时特判为 $0$）。

## 威尔逊定理

**内容**：$p$ 为素数 $\iff (p-1)! \equiv -1 \pmod p$。

**推论**：$p > 4$ 且为合数时，$(p-1)! \equiv 0 \pmod p$。

### 计算 $n! \bmod p$

当 $n$ 很大时可用分段：$O(p + \log_p n)$ 预处理，单次 $O(\log_p n)$：

```cpp
int factmod(int n, int p) {
    vector<int> f(p);
    f[0] = 1;
    for (int i = 1; i < p; ++i) f[i] = 1ll * f[i - 1] * i % p;
    int res = 1;
    while (n > 1) {
        if ((n / p) % 2) res = p - res;
        res = 1ll * res * f[n % p] % p;
        n /= p;
    }
    return res;
}
```

### $n!$ 中素数 $p$ 的幂次（Legendre 公式）

$$
v_p(n!) = \sum_{i=1}^{\infty} \left\lfloor \frac{n}{p^i} \right\rfloor = \frac{n - S_p(n)}{p - 1}
$$

其中 $S_p(n)$ 为 $p$ 进制下 $n$ 各位之和。$O(\log n)$ 实现：

```cpp
int vp(int n, int p) {
    int cnt = 0;
    while (n) cnt += (n /= p);
    return cnt;
}
```

### Kummer 定理

$p$ 在组合数 $\binom{m}{n}$ 中的幂次等于 $p$ 进制下 $n$ 减 $m-n$ 的借位次数：

$$
v_p\!\left(\binom{m}{n}\right) = \frac{S_p(n) + S_p(m-n) - S_p(m)}{p - 1}
$$
