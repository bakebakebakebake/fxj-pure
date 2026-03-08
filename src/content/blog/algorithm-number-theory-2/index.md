---
title: 筛法不只是筛素数：线性筛的统一视角
description: 以原始数论笔记为主，保留素数筛法、欧拉函数与威尔逊定理相关内容。
publishDate: 2023-10-27
tags:
  - 算法
  - 数论
  - 筛法
  - 线性筛
  - 欧拉函数
  - 莫比乌斯函数
language: 中文
---

> [!note] 说明
> 这篇改回以原来的筛法 / 欧拉函数笔记为主，再把威尔逊定理并进来，尽量不动原本的推导与模板。

## 收录内容

- `素数筛法`
- `欧拉函数`
- `威尔逊定理`

## 素数筛法

## 线性筛法
**线性筛法**(也称为 $Euler$ 筛法（欧拉筛法）)
最常用！

```cpp
void init(int n) {
  for (int i = 2; i <= n; ++i) {
    if (!vis[i]) {
      pri[cnt++] = i;
    }
    for (int j = 0; j < cnt; ++j) {
      if (1ll * i * pri[j] > n) break;
      vis[i * pri[j]] = 1;
      if (i % pri[j] == 0) {
        // i % pri[j] == 0
        // 换言之，i 之前被 pri[j] 筛过了
        // 由于 pri 里面质数是从小到大的，所以 i乘上其他的质数的结果一定会被
        // pri[j]的倍数筛掉，就不需要在这里先筛一次，所以这里直接 break
        // 掉就好了
        break;
      }
    }
  }
}

```

## $Eratosthenes$ 筛法
$Eratosthenes$ 筛法即埃拉托斯特尼筛法, 简称**埃氏筛法**。时间复杂度是 $O(n\log\log n)$。

```cpp
bool is_prime[N];

int Eratosthenes(int n) {
  int p = 0;
  for (int i = 0; i <= n; ++i) is_prime[i] = 1;
  is_prime[0] = is_prime[1] = 0;
  for (int i = 2; i <= n; ++i) {
    if (is_prime[i]) {
      prime[p++] = i;  // prime[p]是i,后置自增运算代表当前素数数量
      if ((long long)i * i <= n)
        for (int j = i * i; j <= n; j += i)
          // 因为从 2 到 i - 1 的倍数我们之前筛过了，这里直接从 i
          // 的倍数开始，提高了运行速度
          is_prime[j] = 0;  // 是i的倍数的均不是素数
    }
  }
  return p;
}
```

**筛至平方根**到 $O(n \ln \ln \sqrt n + o(n))$

```cpp
bool is_prime[N];

int Eratosthenes(int n) {
  int p = 0;
  for (int i = 0; i <= n; ++i) is_prime[i] = 1;
  is_prime[0] = is_prime[1] = 0;
  // i * i <= n 说明 i <= sqrt(n)
  for (int i = 2; i * i <= n; ++i) {
    if (is_prime[i]) {
      prime[p++] = i;
      for (int j = i * i; j <= n; j += i) is_prime[j] = 0;
    }
  }
  return p;
}

```
### 1 优化版
**只筛奇数**
(因为除 2 以外的偶数都是合数，所以我们可以直接跳过它们，只用关心奇数就好。

首先，这样做能让我们内存需求减半；其次，所需的操作大约也减半。)

```cpp
#include<iostream>
#include<vector>
using namespace std;
vector<int> sieve(int n)
{
	vector<bool> a(n + 1, 1);
	vector<int> b;
	b.push_back(2);
	for (int i = 3; i <= (int)sqrt(n); i += 2)
		for (int j = i * i; j <= n; j += i)
			a[j] = false;
	for (int i = 2; i <= n; i++)
		if (i % 2 != 0 && a[i]) 
			b.push_back(i);
	return b;
}
```

## 分块筛选

**占用内存及其少**!!!
以下实现使用块筛选来计算小于等于 n 的质数数量。
```cpp
int count_primes(int n) {
  const int S = 10000;
  vector<int> primes;
  int nsqrt = sqrt(n);
  vector<char> is_prime(nsqrt + 1, true);
  for (int i = 2; i <= nsqrt; i++) {
    if (is_prime[i]) {
      primes.push_back(i);
      for (int j = i * i; j <= nsqrt; j += i) is_prime[j] = false;
    }
  }
  int result = 0;
  vector<char> block(S);
  for (int k = 0; k * S <= n; k++) {
    fill(block.begin(), block.end(), true);
    int start = k * S;
    for (int p : primes) {
      int start_idx = (start + p - 1) / p;
      int j = max(start_idx, p) * p - start;
      for (; j < S; j += p) block[j] = false;
    }
    if (k == 0) block[0] = block[1] = false;
    for (int i = 0; i < S && start + i <= n; i++) {
      if (block[i]) result++;
    }
  }
  return result;
}

```
分块筛法的渐进时间复杂度与埃氏筛法是一样的（除非块非常小），但是所需的内存将缩小为 $O(\sqrt{n} + S)$，并且有更好的缓存结果。另一方面，对于每一对块和区间 $[1, \sqrt{n}]$ 中的素数都要进行除法，而对于较小的块来说，这种情况要糟糕得多。因此，在选择常数 S 时要保持平衡。

块大小 $S$ 取 $10^4$ 到 $10^5$ 之间，可以获得最佳的速度。

## 欧拉函数

- [相关文章](https://zhuanlan.zhihu.com/p/349304172)
### 欧拉函数：

即 $\varphi(n)$，表示的是小于等于 $n$ 和 $n$ 互质的数的个数。

$\displaystyle \varphi(i)=\sum_{i=1}^n[\gcd(i,n)=1]$

性质：

- 欧拉函数是积性函数。如果有 $\gcd(a, b) = 1$，那么 $\varphi(a \times b) = \varphi(a) \times \varphi(b)$。特别地，当 $n$ 是奇数时 $\varphi(2n) = \varphi(n)$。

- $n = \sum_{d \mid n}{\varphi(d)}$。

- 若 $n = p^k$，其中 $p$ 是质数，那么 $\varphi(n) = p^k - p^{k - 1}$。 （根据定义可知）

- 由唯一分解定理，设 $n = \prod_{i=1}^{s}p_i^{k_i}$，其中$p_i$ 是质数，有 $\varphi(n) = n \times \prod_{i = 1}^s{\dfrac{p_i - 1}{p_i}}$。
 
实现：

#### 一个数的欧拉函数值:

```cpp
#include <cmath>

int euler_phi(int n) {
  int ans = n;
  for (int i = 2; i * i <= n; i++)
    if (n % i == 0) {
      ans = ans / i * (i - 1);
      while (n % i == 0) n /= i;
    }
  if (n > 1) ans = ans / n * (n - 1);
  return ans;
}
```

#### 筛法求欧拉函数值 : 
有：
$\varphi(n) = n \times \prod_{i = 1}^s{\dfrac{p_i - 1}{p_i}}$

$\displaystyle \varphi(i)=\sum_{i=1}^n[\gcd(i,n)=1]$

在线性筛的基础上修改：

```cpp
vector<int> minp, primes, phi;

void sieve(int n) {
    minp.assign(n + 1, 0);
    phi.assign(n + 1, 0);
    primes.clear();
	phi[1] = 1;
    for (int i = 2; i <= n; i++) {
        if (minp[i] == 0) {
            minp[i] = i;
            primes.push_back(i);
            phi[i] = i - 1;
        }

        for (auto p : primes) {
            if (i * p > n) break;
            minp[i * p] = p;
            if (p == minp[i]) {
                phi[i * p] = phi[i] * p;
                break;
            } 
            phi[i * p] = phi[i] * phi[p];
        }
    }
}
```

#### 练习题

##### [P2568 GCD](https://www.luogu.com.cn/problem/P2568)
给定正整数 $n$，求 $1\le x,y\le n$ 且 $\gcd(x,y)$ 为素数的数对 $(x,y)$ 有多少对。

即求 $\displaystyle \sum\limits_{i=1}^n\sum\limits_{j=1}^n[\gcd(i,j)=p]$

 $\implies\displaystyle \sum\limits_{p\in prims}\left( 2\sum\limits_{i=1}^{n/p}\varphi(i)-1 \right)$

```cpp
#define int long long
vector<int> minp, primes, phi;
signed main() {
    int n;cin >> n;
    sieve(n);
    phi[1] = 1;
    partial_sum(phi.begin(), phi.end(), phi.begin());
    int ans = 0;
    for (auto p : primes) {
        ans += 2 * phi[n / p] - 1;
    }
    cout << ans << '\n';
}
```

##### [P2398 GCD SUM](https://www.luogu.com.cn/problem/P2398)

求 $\displaystyle \sum\limits_{i=1}^n \sum\limits_{j=1}^n\gcd(i,j)$

对于 $\gcd(x,y)=1\to \gcd(xk,yk)=k$

$\gcd(x,y)=k$ 的个数为 $\displaystyle 2\sum\limits_{i=1}^{n/k}\varphi(i)-1$

所以遍历一遍 $k \to$ $\gcd(i,j)=k$ 的情况即可。

```cpp
#define int long long
signed main() {
    int n;cin >> n;
    sieve(n);
    partial_sum(phi.begin(), phi.end(), phi.begin());
    int ans = 0;
    for (int i = 1;i <= n;i++) {
        ans += i * (2 * phi[n / i] - 1);
    }
    cout << ans << '\n';
}
```

##### [P2158 仪仗队](https://www.luogu.com.cn/problem/P2158)
题目满足 $\gcd(\left|{x-x'}\right|,\left|{y-y'}\right|)=1$，有 $(x',y')=(1,1)$

则 $\gcd(x-1,y-1)=1$，求 $(x,y)$ 对数，即可以先将 $x,y$ 减去 1 (相当于将坐标向右上方移动了一位)，然后多出的 $(1,0),(0,1)$ 特判一下，则答案就是：

$\implies\displaystyle 2+2\times\left( \sum\limits_{i=1}^{n-1}\varphi(i)-1 \right)=2\times \sum\limits_{i=1}^{n-1}\varphi(i)+1$
```cpp
#define int long long
signed main() {
    ios::sync_with_stdio(false), cin.tie(nullptr);
    int n;cin >> n;
    sieve(n);
    if (n == 1) {
        cout << "0\n";return 0;
    }
    partial_sum(phi.begin(), phi.end(), phi.begin());
    cout << phi[n - 1] * 2 + 1 << '\n';
}
```

### 欧拉定理：

内容：若 $\gcd(a, m) = 1$，则 $a^{\varphi(m)} \equiv 1 \pmod{m}$。

>费马小定理可以看作当$m$ 是质数 $p$ 时欧拉定理的一个特殊情形。

### 扩展欧拉定理:

[扩展欧拉定理](https://oi-wiki.org/math/number-theory/fermat/#%E6%89%A9%E5%B1%95%E6%AC%A7%E6%8B%89%E5%AE%9A%E7%90%86)内容：

$$
a^b \equiv \begin{cases}
  a^{b \bmod \varphi (m)},                &\gcd (a, m) =  1,                   \\
  a^b,                                   &\gcd (a, m)\ne 1, b \lt   \varphi (m), \\
  a^{(b \bmod \varphi (m)) + \varphi (m)}, &\gcd (a, m)\ne 1, b \ge \varphi (m).
\end{cases} \pmod m
$$

## 威尔逊定理

### 1 威尔逊定理
**内容：**
对于素数 $p$ 有 $(p-1)!\equiv -1\pmod p.$

**推论：** 

$$
(p-1)! \equiv 0 \pmod p \quad (p \gt 4 \text{ 且 } p \text{ 为合数})
$$

 **<mark style="background: #CACFD9A6;">计算余数算法</mark>:**

实现 $n!$ % $p$.

**时间复杂度：** 时间复杂度为 $O(p + \log_p n)$. 如果需要多次调用函数，则可以在函数外部进行预计算，于是计算 $(n!)_p$ 的时间复杂度为 $O(\log_p n).$

```cpp
int factmod(int n, int p) {
  vector<int> f(p);
  f[0] = 1;
  for (int i = 1; i < p; i++) f[i] = f[i - 1] * i % p;
  int res = 1;
  while (n > 1) {
    if ((n / p) % 2) res = p - res;
    res = res * f[n % p] % p;
    n /= p;
  }
  return res;
}
```

### 2 **$Legendre$ 公式:**

$n!$ 中含有的素数 $p$ 的幂次 $v_p(n!)$ 为：

$v_p(n!) = \sum_{i=1}^{\infty} \left\lfloor \frac{n}{p^i} \right\rfloor = \frac{n-S_p(n)}{p-1}$
其中 $S_p(n)$ 为 $p$ 进制下 $n$ 的各个数位的和。

特别地，阶乘中 2 的幂次是 $v_2(n!)=n-S_2(n).$

$O(logn)$ 实现：

```cpp
int multiplicity_factorial(int n, int p) {
  int count = 0;
  do {
    n /= p;
    count += n;
  } while (n);
  return count;
}
```
### 3 $Kummer$ **定理:**

$p$ 在组合数 
$\dbinom{m}{n}$ 中的幂次，恰好是 $p$ 进制下 $m$ 减掉 $n$ 需要借位的次数。

即
$v_p\left(\dbinom{m}{n}\right)=\frac{S_p(n)+S_p(m-n)-S_p(m)}{p-1}$

特别地，组合数中 2 的幂次是 
$v_2\left(\dbinom{m}{n}\right)=S_2(n)+S_2(m-n)-S_2(m).$

### 4 $Wilson$ **定理的推广:**

对于素数 $p$和正整数 $q$ 有 $(p^q!)_p\equiv \pm 1\pmod{p^q}.$

$$
(p^q!)_p\equiv
\begin{cases}
  1,  & (p=2) \land (q\geq 3),\\
  -1, & \text{otherwise}.
\end{cases}
$$
