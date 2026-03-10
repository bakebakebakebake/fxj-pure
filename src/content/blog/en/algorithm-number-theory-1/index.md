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
> This article is based on the original number theory notes, assembling scattered notes in blog order while preserving the original content as much as possible.

## Contents

- `gcd`
- `lcm`
- `Bézout's theorem`
- `Extended Euclidean algorithm`
- `Fast exponentiation`
- `Modular inverse`
- `Chinese Remainder Theorem`

## gcd

<mark style="background: #ADCCFFA6;">Recursive approach</mark>:
```cpp
//most commonly used
int gcd(int a, int b)//fast gcd computation
{
    return !b ? a : gcd(b, a % b);
}
```
Iterative approach:
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

C++14 can use `__gcd (a, b)`

gcd for large numbers:
```cpp
Big gcd(Big a, Big b) {
  // count occurrences of factor 2 in a and b
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
    // common factor 2 in a and b has been calculated, no more even cases
    while (a % 2 == 0) {
      a >>= 1;
    }
    while (b % 2 == 0) {
      b >>= 1;
    }
    if (a == b) break;
    // ensure a>=b
    if (a < b) swap(a, b);
    a -= b;
  }
  return a << min(atimes, btimes);
}

```

## lcm

For two numbers:
$gcd(a,b)\\times lcm(a,b)=a\\times b$

To find the least common multiple of two numbers, first find the greatest common divisor.

For multiple numbers:
When we compute the $gcd$ of two numbers, finding the lcm is $O(1)$ complexity. So for multiple numbers, we don't need to find a common gcd first. The most direct method is: when we calculate the gcd of two numbers, or while finding the gcd of multiple numbers, we put it into the sequence to continue solving. We can transform this and directly put the lcm into the sequence.

## Bézout's Theorem

### 1 Statement:
### 2 For integers $a,b$ not both zero, there exist integers $x,y$ such that $ax+by=gcd(a,b)$.
#### 2.1 Proof:
Let $s$ be the minimum positive integer value of $ax+by$ when $x=x_0$, $y=y_0$. That is, $ax_0+by_0 = s$

Since $gcd(a,b)|ax_0$ and $gcd(a,b)|ay_0$

Therefore $gcd(a,b)|s$ $.........(1)$

Let $a=qs+r(0\\le r\\le s)$

$r=a-qs=a-q(ax_0+by_0)=a(1-qx_0)+b(-qy_0)=ax+by$

Since $s$ is the minimum positive integer, $\\Rightarrow r=0$

Therefore $s|a$, similarly $s|b$

$\\Rightarrow s|gcd(a,b)$ $..........(2)$

From $(1)(2)$ we get $s=gcd(a,b)$.

Q.E.D.

### 3 Converse:

For integers $a, b$ not both zero, if $d > 0$ is a common divisor of $a, b$, and there exist integers $x, y$ such that $ax+by=d$, then $d = gcd(a, b)$.

In particular, for integers $a, b$ not both zero, if there exist integers $x, y$ such that $ax+by=1$, then $a, b$ are coprime.

### 4 Further result:
For natural numbers $a$, $b$ and integer $n$, where $a$ and $b$ are coprime, consider the Diophantine equation:
			$ax+by=n$
where $x$ and $y$ are natural numbers. If the equation has a solution, $n$ is said to be representable by $a$, $b$.

Let $C=ab-a-b$. Since $a$ and $b$ are coprime, $C$ must be odd. Then we have:

For any integer $n$, exactly one of $n$ and $C-n$ can be represented.

That is: representable and non-representable numbers are symmetric in the interval $[0,C]$ (symmetric about $C/2$). $0$ can be represented, $C$ cannot be represented; negative numbers cannot be represented, numbers greater than $C$ can be represented.

For example, in Luogu P3951, the goal is just to find the value of $ab-a-b$

## Extended Euclidean Algorithm

**Euclidean algorithm**: $gcd(a,b)=gcd(b,a$ $mod$ $b)$

[Proof](https://oi-wiki.org/math/number-theory/gcd/)

**Extended Euclidean algorithm** $:(Extended Euclidean algorithm, EXGCD)$

<mark style="background: #BBFABBA6;">Commonly used</mark> to find  $$ ax+by=gcd (a, b) $$ <mark style="background: #D2B3FFA6;">a feasible solution</mark>.

 $ax_1+by_1=ay_2+bx_2-\\lfloor\\frac{a}{b}\\rfloor\\times by_2=ay_2+b(x_2-\\lfloor\\frac{a}{b}\\rfloor y_2)$

 $a=a,b=b$ ,$\\Rightarrow$  $x_1=y_2,y_1=x_2-\\lfloor\\frac{a}{b}\\rfloor y_2$

Continuously substitute $x_2,y_2$ and recursively solve until $gcd$ $($ greatest common divisor, same below $)$ is $0$, then recursively return
$x=1,y=0$ to solve.

[Proof](https://oi-wiki.org/math/number-theory/gcd/)
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
<mark style="background: #FFB8EBA6;">Note: use long long</mark>
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
If a linear congruence equation $ax \\equiv 1 \\pmod b$ holds, then $x$ is called the modular inverse of $a \\bmod b$, denoted as $a^{-1}$.
### 2 Fermat's Little Theorem:
$x \\equiv a^{b-2} \\pmod b$. Only holds when $p$ is prime

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
    printf ("%d\\n", x); //x is the modular inverse of a mod p
}
```

### 4 Linear recursion method:

```cpp
int inv[1000000];
void find_inv(int last,int p)
//find modular inverses of 1~last under mod p
{
    inv[1]=1;//inverse of 1 is 1 itself
    for(int i=2;i<=last;i++)
        inv[i]=(long long)(p-p/i)*(inv[p%i])%p;
    //note long long, otherwise may overflow
}
```

### 5 Linear computation of inverses for arbitrary n numbers

The above method can only find inverses from $1$ to $n$. If we need to find inverses of any given $n$ numbers ($1 \\le a_i < p$), we need the following method:

First calculate the prefix product of $n$ numbers, denoted as $s_i$, then use fast exponentiation or extended Euclidean algorithm to calculate the inverse of $s_n$, denoted as $sv_n$.

Since $sv_n$ is the inverse of the product of $n$ numbers, when we multiply it by $a_n$, it will cancel with the inverse of $a_n$, thus we get the inverse of the product from $a_1$ to $a_{n-1}$, denoted as $sv_{n-1}$.

Similarly we can compute all $sv_i$ in sequence, so
$a_i^{-1}$ can be obtained by $s_{i-1} \\times sv_i$.

Thus we compute the inverses of $n$ numbers in $O (n + \\log p)$ time.

```cpp
s[0] = 1;
for (int i = 1; i <= n; ++i) s[i] = s[i - 1] * a[i] % p;
sv[n] = qpow(s[n], p - 2);
// of course exgcd can also be used here, depending on preference
for (int i = n; i >= 1; --i) sv[i - 1] = sv[i] * a[i] % p;
for (int i = 1; i <= n; ++i) inv[i] = sv[i] * s[i - 1] % p;
```

### 6 Practice problems
- [Modular Inverse - OI Wiki](https://oi.wiki/math/number-theory/inverse/#%E9%80%86%E5%85%83%E7%BB%83%E4%B9%A0%E9%A2%98) has several problems
- B3645 Sequence Prefix Sum 2 - Luogu  [Link](https://www.luogu.com.cn/problem/B3645)
- [B3646 Sequence Prefix Sum 3 - Luogu](https://www.luogu.com.cn/problem/B3646)

## Chinese Remainder Theorem

Used to solve systems of linear congruences

- Calculate the product of all moduli: $\\displaystyle M=\\Pi m_{i}$
- For the $i$-th equation, calculate $c_{i}=\\frac{M}{m_{i}}$
- Calculate the modular inverse of $c_{i}$ modulo $m_{i}$: $c_{i}^{-1}$
- $\\displaystyle x=\\sum_{i=1}^nr_{i}c_{i}c_{i}^{-1}$


  [P1495 【Template】Chinese Remainder Theorem (CRT) / Cao Chong Raises Pigs - Luogu](https://www.luogu.com.cn/problem/P1495)
