---
title: "Sieve Methods Beyond Primes: A Unified View of Linear Sieve"
description: Based on original number theory notes, covering prime sieves, Euler's totient function, and Wilson's theorem.
publishDate: 2023-10-27
tags:
  - Algorithm
  - Number Theory
  - Sieve
  - Linear Sieve
  - Euler's Totient
  - Möbius Function
language: English
heroImageSrc: ../../../pic/gayatri-malhotra-4wF66_KWJxA-unsplash.jpg
heroImageColor: " #d4b337 "
---
> [!note] Note
> This article reverts to the original sieve method / Euler function notes, and incorporates Wilson's theorem, trying not to alter the original derivations and templates.

## Contents

- `Prime Sieve Methods`
- `Euler's Totient Function`
- `Wilson's Theorem`

## Prime Sieve Methods

## Linear Sieve Method
The **Linear Sieve Method** (also known as the Euler's Sieve) is the most commonly used!

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
        // In other words, i was previously sieved by pri[j]
        // Since primes in pri are in ascending order, the result of multiplying i by any other prime
        // will definitely be sieved later by a multiple of pri[j],
        // so there's no need to sieve it here. Hence, break directly.
        break;
      }
    }
  }
}
```

## Sieve of Eratosthenes
The Sieve of Eratosthenes is简称 the **Eratosthenes Sieve**. Its time complexity is $O(n\log\log n)$.

```cpp
bool is_prime[N];

int Eratosthenes(int n) {
  int p = 0;
  for (int i = 0; i <= n; ++i) is_prime[i] = 1;
  is_prime[0] = is_prime[1] = 0;
  for (int i = 2; i <= n; ++i) {
    if (is_prime[i]) {
      prime[p++] = i;  // prime[p] is i, post-increment represents the current prime count
      if ((long long)i * i <= n)
        for (int j = i * i; j <= n; j += i)
          // Since we've already sieved multiples of numbers from 2 to i-1, we start directly from
          // the square of i, which improves the running speed
          is_prime[j] = 0;  // Multiples of i are not primes
    }
  }
  return p;
}
```

**Sieving up to the square root** achieves $O(n \ln \ln \sqrt n + o(n))$

```cpp
bool is_prime[N];

int Eratosthenes(int n) {
  int p = 0;
  for (int i = 0; i <= n; ++i) is_prime[i] = 1;
  is_prime[0] = is_prime[1] = 0;
  // i * i <= n means i <= sqrt(n)
  for (int i = 2; i * i <= n; ++i) {
    if (is_prime[i]) {
      prime[p++] = i;
      for (int j = i * i; j <= n; j += i) is_prime[j] = 0;
    }
  }
  return p;
}
```
### 1 Optimized Version
**Sieve only odd numbers**
(Because all even numbers except 2 are composite, we can skip them directly and only care about odd numbers.)

First, this halves our memory requirement; second, the required operations are approximately halved.

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

## Segmented Sieve

**Uses very little memory**!!!
The following implementation uses a segmented sieve to count the number of primes less than or equal to n.
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
The asymptotic time complexity of the segmented sieve is the same as the Sieve of Eratosthenes (unless the block is very small), but the required memory is reduced to $O(\sqrt{n} + S)$, and it has better cache performance. On the other hand, for each pair of block and primes in the interval $[1, \sqrt{n}]$, division is required, which is much worse for smaller blocks. Therefore, a balance must be struck when choosing the constant S.

Taking the block size $S$ between $10^4$ and $10^5$ yields the best speed.

## Euler's Totient Function

- [Related Article](https://zhuanlan.zhihu.com/p/349304172) (in Chinese)
### Euler's Totient Function:

Denoted as $\varphi(n)$, it represents the count of numbers less than or equal to $n$ that are coprime to $n$.

$\displaystyle \varphi(i)=\sum_{i=1}^n[\gcd(i,n)=1]$

Properties:

- Euler's totient function is multiplicative. If $\gcd(a, b) = 1$, then $\varphi(a \times b) = \varphi(a) \times \varphi(b)$. Particularly, when $n$ is odd, $\varphi(2n) = \varphi(n)$.

- $n = \sum_{d \mid n}{\varphi(d)}$.

- If $n = p^k$, where $p$ is prime, then $\varphi(n) = p^k - p^{k - 1}$. (Follows from the definition)

- From the unique factorization theorem, let $n = \prod_{i=1}^{s}p_i^{k_i}$, where $p_i$ are primes, then $\varphi(n) = n \times \prod_{i = 1}^s{\dfrac{p_i - 1}{p_i}}$.

Implementation:

#### Euler's Totient for a Single Number:

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

#### Sieve for Euler's Totient Function:
We have:
$\varphi(n) = n \times \prod_{i = 1}^s{\dfrac{p_i - 1}{p_i}}$

$\displaystyle \varphi(i)=\sum_{i=1}^n[\gcd(i,n)=1]$

Modified based on the linear sieve:

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

#### Practice Problems

##### [P2568 GCD](https://www.luogu.com.cn/problem/P2568)
Given a positive integer $n$, find the number of pairs $(x, y)$ such that $1\le x,y\le n$ and $\gcd(x,y)$ is prime.

That is, find $\displaystyle \sum\limits_{i=1}^n\sum\limits_{j=1}^n[\gcd(i,j)=p]$

 $\implies\displaystyle \sum\limits_{p\in primes}\left( 2\sum\limits_{i=1}^{n/p}\varphi(i)-1 \right)$

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

Find $\displaystyle \sum\limits_{i=1}^n \sum\limits_{j=1}^n\gcd(i,j)$

For $\gcd(x,y)=1 \implies \gcd(xk,yk)=k$

The count of pairs with $\gcd(x,y)=k$ is $\displaystyle 2\sum\limits_{i=1}^{n/k}\varphi(i)-1$

So iterate over $k$ and sum the cases where $\gcd(i,j)=k$.

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

##### [P2158 Guard of Honor](https://www.luogu.com.cn/problem/P2158)
The problem requires $\gcd(|x-x'|, |y-y'|)=1$, with $(x',y')=(1,1)$.

Then $\gcd(x-1, y-1)=1$. Find the number of pairs $(x, y)$. We can first subtract 1 from $x, y$ (which effectively shifts the coordinate origin one unit up and right), then handle the special points $(1,0)$ and $(0,1)$ separately. The answer becomes:

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

### Euler's Theorem:

Statement: If $\gcd(a, m) = 1$, then $a^{\varphi(m)} \equiv 1 \pmod{m}$.

> Fermat's Little Theorem can be seen as a special case of Euler's Theorem when $m$ is a prime $p$.

### Extended Euler's Theorem:

[Extended Euler's Theorem](https://oi-wiki.org/math/number-theory/fermat/#%E6%89%A9%E5%B1%95%E6%AC%A7%E6%8B%89%E5%AE%9A%E7%90%86) content:

$$
a^b \equiv \begin{cases}
  a^{b \bmod \varphi (m)},                &\gcd (a, m) =  1,                   \\
  a^b,                                   &\gcd (a, m)\ne 1, b \lt   \varphi (m), \\
  a^{(b \bmod \varphi (m)) + \varphi (m)}, &\gcd (a, m)\ne 1, b \ge \varphi (m).
\end{cases} \pmod m
$$

## Wilson's Theorem

### 1 Wilson's Theorem
**Statement:**
For a prime $p$, $(p-1)! \equiv -1 \pmod p.$

**Corollary:**

$$
(p-1)! \equiv 0 \pmod p \quad (p \gt 4 \text{ and } p \text{ is composite})
$$

 **<mark style="background: #CACFD9A6;">Algorithm for computing remainder</mark>:**

Compute $n!$ % $p$.

**Time Complexity:** $O(p + \log_p n)$. If the function needs to be called multiple times, precomputation can be done outside the function, making the time to compute $(n!)_p$ equal to $O(\log_p n).$

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

### 2 **Legendre's Formula:**

The exponent of a prime $p$ in $n!$, denoted $v_p(n!)$, is given by:

$v_p(n!) = \sum_{i=1}^{\infty} \left\lfloor \frac{n}{p^i} \right\rfloor = \frac{n - S_p(n)}{p-1}$
where $S_p(n)$ is the sum of the digits of $n$ when expressed in base $p$.

Specifically, the exponent of 2 in a factorial is $v_2(n!) = n - S_2(n).$

$O(\log n)$ implementation:

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
### 3 **Kummer's Theorem:**

The exponent of a prime $p$ in the binomial coefficient $\dbinom{m}{n}$ is exactly the number of carries when adding $n$ and $m-n$ in base $p$ (or equivalently, when subtracting $n$ from $m$ in base $p$).

That is,
$v_p\left(\dbinom{m}{n}\right)=\frac{S_p(n)+S_p(m-n)-S_p(m)}{p-1}$

Specifically, the exponent of 2 in a binomial coefficient is
$v_2\left(\dbinom{m}{n}\right)=S_2(n)+S_2(m-n)-S_2(m).$

### 4 **Generalization of Wilson's Theorem:**

For a prime $p$ and a positive integer $q$, we have $(p^q!)_p \equiv \pm 1 \pmod{p^q}.$

$$
(p^q!)_p \equiv
\begin{cases}
  1,  & (p=2) \land (q\geq 3),\\
  -1, & \text{otherwise}.
\end{cases}
$$