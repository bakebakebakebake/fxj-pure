---
title: "From Divisibility to Congruence: Number Theory Basics"
description: "Based on original number theory notes, covering gcd, lcm, Bezout, exgcd, fast power, modular inverse, and CRT."
publishDate: 2023-10-23
tags:
  - Algorithm
  - Number Theory
  - Basics
  - Euclidean Algorithm
  - Congruence
language: English
heroImageSrc: ../../../pic/bekky-bekks-VcQkZl4Wf1Y-unsplash.jpg
heroImageColor: " #4a7273 "
---
> [!note] Note
> This article reverts to using your original number theory notes as the main body, only concatenating the scattered notes in blog order, preserving the original content as much as possible.

## Contents

- `gcd`
- `lcm`
- `Bézout's Identity`
- `Extended Euclidean Algorithm`
- `Fast Exponentiation`
- `Modular Inverse`
- `Chinese Remainder Theorem`

## gcd

<mark style="background: #ADCCFFA6;">Recursive Method</mark>:
```cpp
// Most commonly used
int gcd(int a, int b) // Quickly compute the greatest common divisor
{
    return !b ? a : gcd(b, a % b);
}
```
Iterative Method:
```cpp
int gcd(int a, int b) {
  while (b != 0) {
    int tmp = a;
    a = b;
    b = tmp % b;
  }
  return a;
}
```

C++14 provides `__gcd(a, b)`.

GCD for large numbers:
```cpp
Big gcd(Big a, Big b) {
  // Record the number of times the common factor 2 appears in a and b
  int atimes = 0, btimes = 0;
  while (a % 2 == 0) {
    a >>= 1;
    atimes++;
  }
  while (b % 2 == 0) {
    b >>= 1;
    btimes++;
  }
  for (;;) {
    // The common factor 2 in a and b has already been accounted for; a and b cannot both be even hereafter.
    while (a % 2 == 0) {
      a >>= 1;
    }
    while (b % 2 == 0) {
      b >>= 1;
    }
    if (a == b) break;
    // Ensure a >= b
    if (a < b) swap(a, b);
    a -= b;
  }
  return a << min(atimes, btimes);
}
```

## lcm

For two numbers:
$gcd(a,b) \times lcm(a,b) = a \times b$

To find the least common multiple of two numbers, first find their greatest common divisor.

For multiple numbers:
Once we find the $gcd$ of two numbers, finding the lcm is $O(1)$. For multiple numbers, we don't necessarily need to find a common gcd first. The most direct method is: after calculating the gcd of two numbers, perhaps when finding the gcd of multiple numbers, we can put it into the sequence and continue solving for the remaining numbers. So, we can simply put the least common multiple into the sequence directly.

## Bézout's Identity

### 1 Statement:
### 2 Let $a, b$ be integers not both zero. Then there exist integers $x, y$ such that $ax + by = \gcd(a, b)$.
#### 2.1 Proof:
Suppose the smallest positive integer value of $ax + by$ for some integers $x_0, y_0$ is $s$. That is, $ax_0 + by_0 = s$.

Since $\gcd(a, b) | ax_0$ and $\gcd(a, b) | ay_0$,

it follows that $\gcd(a, b) | s$. $.........(1)$

Let $a = qs + r$ where $0 \le r < s$.

Then $r = a - qs = a - q(ax_0 + by_0) = a(1 - qx_0) + b(-qy_0) = ax + by$.

Because $s$ is the smallest positive integer value, we must have $r = 0$.

Therefore $s | a$. Similarly, $s | b$.

Hence $s | \gcd(a, b)$. $..........(2)$

From $(1)$ and $(2)$, we get $s = \gcd(a, b)$.

QED.

### 3 Converse:

Let $a, b$ be integers not both zero. If $d > 0$ is a common divisor of $a$ and $b$, and there exist integers $x, y$ such that $ax + by = d$, then $d = \gcd(a, b)$.

A special case: Let $a, b$ be integers not both zero. If there exist integers $x, y$ such that $ax + by = 1$, then $a$ and $b$ are coprime.

### 4 Further Conclusions:
For natural numbers $a$, $b$ and an integer $n$, with $a$ and $b$ coprime, consider the indefinite equation:
$ax + by = n$
where $x$ and $y$ are natural numbers. If the equation has a solution, we say $n$ can be represented by $a$ and $b$.

Let $C = ab - a - b$. Since $a$ and $b$ are coprime, $C$ must be odd. Then we have the conclusion:

For any integer $n$, exactly one of $n$ and $C-n$ can be represented.

That is, the representable numbers and the non-representable numbers are symmetric in the interval $[0, C]$ (about half of $C$). $0$ is representable, $C$ is not representable; negative numbers are not representable, numbers greater than $C$ are representable.

For example, in [luogu P3951](https://www.luogu.com.cn/problem/P3951), the problem essentially asks for the value of $ab - a - b$.

## Extended Euclidean Algorithm

**Euclidean Algorithm**: $\gcd(a, b) = \gcd(b, a \bmod b)$

[Proof](https://oi-wiki.org/math/number-theory/gcd/) (in Chinese)

**Extended Euclidean Algorithm** $(EXGCD)$

<mark style="background: #BBFABBA6;">Commonly used</mark> to find <mark style="background: #D2B3FFA6;">a set of feasible solutions</mark> to $$ ax + by = \gcd (a, b) $$.

Derivation:
$ax_1 + by_1 = ay_2 + bx_2 - \lfloor\frac{a}{b}\rfloor \times by_2 = ay_2 + b(x_2 - \lfloor\frac{a}{b}\rfloor y_2)$

Since $a = a$, $b = b$, we get $x_1 = y_2$, $y_1 = x_2 - \lfloor\frac{a}{b}\rfloor y_2$.

Recursively substitute $x_2, y_2$ until the gcd is $0$, then backtrack with $x=1, y=0$ to solve.

[Proof](https://oi-wiki.org/math/number-theory/gcd/) (in Chinese)
```cpp
int Exgcd(int a, int b, int &x, int &y) {
  if (!b) {
    x = 1;
    y = 0;
    return a;
  }
  int d = Exgcd(b, a % b, x, y);
  int t = x;
  x = y;
  y = t - (a / b) * y;
  return d;
}
```
Using `pair`:

```cpp
pair<int, int> extgcd(int a, int b) {
  if (!b) return make_pair(1, 0);
  int x, y;
  tie(y, x) = extgcd(b, a % b);
  y -= a / b * x;
  return make_pair(x, y);
}
```

Non-recursive:
```cpp
int gcd(int a, int b, int& x, int& y) {
  x = 1, y = 0;
  int x1 = 0, y1 = 1, a1 = a, b1 = b;
  while (b1) {
    int q = a1 / b1;
    tie(x, x1) = make_tuple(x1, x - q * x1);
    tie(y, y1) = make_tuple(y1, y - q * y1);
    tie(a1, b1) = make_tuple(b1, a1 - q * b1);
  }
  return a1;
}
```
Matrix method:
```cpp
int exgcd(int a, int b, int &x, int &y) {
  int x1 = 1, x2 = 0, x3 = 0, x4 = 1;
  while (b != 0) {
    int c = a / b;
    std::tie(x1, x2, x3, x4, a, b) =
        std::make_tuple(x3, x4, x1 - x3 * c, x2 - x4 * c, b, a - b * c);
  }
  x = x1, y = x2;
  return a;
}
```

## Fast Exponentiation
<mark style="background: #FFB8EBA6;">Remember to use long long</mark>
```cpp
int qpow(int x, int y)
{
    int ans = 1;
    while (y)
    {
        if (y % 2)
            ans = (ans * x) % p;
        x = (x * x) % p;
        y /= 2;
    }
    return ans;
}
```

## Modular Inverse

### 1 Definition
If a linear congruence equation $ax \equiv 1 \pmod b$ holds, then $x$ is called the modular inverse of $a \bmod b$, denoted as $a^{-1}$.
### 2 Fermat's Little Theorem:
$x \equiv a^{b-2} \pmod b$. This is only valid when $p$ is prime.

### 3 Extended Euclidean Algorithm:
```cpp
void Exgcd(ll a, ll b, ll &x, ll &y) {
    if (!b) x = 1, y = 0;
    else Exgcd(b, a % b, y, x), y -= a / b * x;
}
int main() {
    ll x, y;
    Exgcd (a, p, x, y);
    x = (x % p + p) % p;
    printf ("%d\n", x); // x is the inverse of a modulo p
}
```

### 4 Linear Recurrence Method:

```cpp
int inv[1000000];
void find_inv(int last, int p)
// Find the inverses of all numbers from 1 to last modulo p
{
    inv[1] = 1; // The inverse of 1 is 1 itself
    for(int i = 2; i <= last; i++)
        inv[i] = (long long)(p - p / i) * (inv[p % i]) % p;
    // Be careful with long long to prevent potential overflow
}
```

### 5 Linear Inverses for Any n Numbers

The method above can only find inverses for $1$ to $n$. If you need the inverses of any given $n$ numbers ($1 \le a_i < p$), you need the following method:

First, compute the prefix products of the $n$ numbers, denote them as $s_i$. Then, calculate the inverse of $s_n$ using fast exponentiation or the extended Euclidean algorithm, denote it as $sv_n$.

Since $sv_n$ is the inverse of the product of all $n$ numbers, multiplying it by $a_n$ will cancel out the inverse of $a_n$, yielding the inverse of the product of $a_1$ through $a_{n-1}$, denoted as $sv_{n-1}$.

Similarly, we can compute all $sv_i$ sequentially. Then, $a_i^{-1}$ can be obtained by $s_{i-1} \times sv_i$.

Thus, we can compute the inverses of $n$ numbers in $O(n + \log p)$ time.

```cpp
s[0] = 1;
for (int i = 1; i <= n; ++i) s[i] = s[i - 1] * a[i] % p;
sv[n] = qpow(s[n], p - 2);
// Of course, you can also use exgcd here to find the inverse, depending on personal preference.
for (int i = n; i >= 1; --i) sv[i - 1] = sv[i] * a[i] % p;
for (int i = 1; i <= n; ++i) inv[i] = sv[i] * s[i - 1] % p;
```

### 6 Some Practice Problems
- [Modular Inverse Practice Problems - OI Wiki](https://oi.wiki/math/number-theory/inverse/#%E9%80%86%E5%85%83%E7%BB%83%E4%B9%A0%E9%A2%98) (in Chinese) There are several problems here.
- B3645 Sequence Prefix Sum 2 - Luogu [Link](https://www.luogu.com.cn/problem/B3645) (in Chinese)
- [B3646 Sequence Prefix Sum 3 - Luogu](https://www.luogu.com.cn/problem/B3646) (in Chinese)

## Chinese Remainder Theorem

Used to solve systems of linear congruences.

- Calculate the product of all moduli: $\displaystyle M = \prod m_{i}$
- For the $i$-th equation, compute $c_{i} = \frac{M}{m_{i}}$
- Compute the modular multiplicative inverse of $c_{i}$ modulo $m_{i}$, denoted $c_{i}^{-1}$
- $\displaystyle x = \sum_{i=1}^n r_{i} c_{i} c_{i}^{-1} \pmod M$

  [P1495 【Template】Chinese Remainder Theorem (CRT) / Cao Chong Raises Pigs - Luogu](https://www.luogu.com.cn/problem/P1495) (in Chinese)