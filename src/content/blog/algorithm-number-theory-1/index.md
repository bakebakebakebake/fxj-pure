---
title: 从整除到同余：数论入门该抓什么
description: 以原始数论笔记为主，保留 gcd、lcm、裴蜀定理、扩展欧几里得、快速幂、逆元与中国剩余定理。
publishDate: 2023-10-23
tags:
  - 算法
  - 数论
  - 入门
  - 欧几里得算法
  - 同余
language: 中文
heroImageSrc: /Users/xjf/Downloads/bekky-bekks-VcQkZl4Wf1Y-unsplash.jpg
heroImageColor: " #4a7273 "
---

> [!note] 说明
> 这篇改回以你原来的数论笔记为主体，只把分散的笔记按博客顺序拼接起来，正文内容尽量原样保留。

## 收录内容

- `gcd`
- `lcm`
- `裴蜀定理`
- `拓展欧几里得`
- `快速幂`
- `逆元`
- `中国剩余定理`

## gcd

<mark style="background: #ADCCFFA6;">递归求法</mark>：
```cpp
//用的最多
int gcd(int a, int b)//快速算最大公因数
{
    return !b ? a : gcd(b, a % b);
}
```
迭代求法：
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

C++14 可用 `__gcd (a, b)`

大数的 gcd：
```cpp
Big gcd(Big a, Big b) {
  // 记录a和b的公因数2出现次数
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
    // a和b公因数中的2已经计算过了，后面不可能出现a,b均为偶数的情况
    while (a % 2 == 0) {
      a >>= 1;
    }
    while (b % 2 == 0) {
      b >>= 1;
    }
    if (a == b) break;
    // 确保 a>=b
    if (a < b) swap(a, b);
    a -= b;
  }
  return a << min(atimes, btimes);
}

```

## lcm

两个数有：
$gcd(a,b)\times lcm(a,b)=a\times b$

求两个数的最小公倍数，先求出最大公约数即可。

多个数：
当我们求出两个数的 $gcd$ 时，求最小公倍数是 $O(1)$ 的复杂度。那么对于多个数，我们其实没有必要求一个共同的最大公约数再去处理，最直接的方法就是，当我们算出两个数的 $gcd$，或许在求多个数的 $gcd$ 时候，我们将它放入序列对后面的数继续求解，那么，我们转换一下，直接将最小公倍数放入序列即可

## 裴蜀定理

### 1 内容：
### 2 设 $a,b$ 是不全为零的整数，则存在整数 $x,y$, 使得 $ax+by=gcd(a,b)$.
#### 2.1 证明：
设取 $x_0$, $y_0$ 时，$ax+by$ 的最小整数是 $s$.即 $ax_0+by_0$ = $s$

因 $gcd(a,b)|ax_0$ ， $gcd(a,b)|ay_0$

所以 $gcd(a,b)|s$ $.........(1)$

设 $a=qs+r(0\le r\le s)$

$r=a-qs=a-q(ax_0+by_0)=a(1-qx_0)+b(-qy_0)=ax+by$

因为 $s$ 是最小整数，$\Rightarrow r=0$

所以 $s|a$,同理 $s|b$

$\Rightarrow s|gcd(a,b)$ $..........(2)$

由 $(1)(2)$ 可得 $s=gcd(a,b)$.

证毕。

### 3 逆定理：

设 $a, b$ 是不全为零的整数，若 $d > 0$ 是 $a, b$ 的公因数，且存在整数$x, y$, 使得 $ax+by=d$，则 $d = gcd(a, b)$。

特殊地，设 $a, b$ 是不全为零的整数，若存在整数 $x, y$, 使得 $ax+by=1$，则 $a, b$ 互质。

### 4 进一步结论:
 对自然数 $a$、$b$ 和整数 $n$，$a$ 与 $b$ 互素，考察不定方程： 
				$ax+by=n$
其中 $x$ 和 $y$ 为自然数。如果方程有解，称 $n$ 可以被 $a$、$b$ 表示。

记 $C=ab-a-b$。由 $a$ 与 $b$ 互素，$C$ 必然为奇数。则有结论：

对任意的整数 $n$，$n$ 与 $C-n$中有且仅有一个可以被表示。

即：可表示的数与不可表示的数在区间 $[0,C]$ 对称（关于 $C$ 的一半对称）。$0$ 可被表示，$C$ 不可被表示；负数不可被表示，大于 $C$ 的数可被表示。

例如在 $luogu P3951$ 就只是为了求 $ab-a-b$ 的值

## 拓展欧几里得

**欧几里得算法**：$gcd(a,b)=gcd(b,a$ $mod$ $b)$

[证明](https://oi-wiki.org/math/number-theory/gcd/)

**扩展欧几里得算法**$:(Extended Euclidean algorithm, EXGCD)$

<mark style="background: #BBFABBA6;">常用于</mark>求  $$ ax+by=gcd (a, b) $$ <mark style="background: #D2B3FFA6;">的一组可行解</mark>。

 $ax_1+by_1=ay_2+bx_2-\lfloor\frac{a}{b}\rfloor\times by_2=ay_2+b(x_2-\lfloor\frac{a}{b}\rfloor y_2)$
 
 $a=a,b=b$ ,$\Rightarrow$  $x_1=y_2,y_1=x_2-\lfloor\frac{a}{b}\rfloor y_2$

将 $x_2,y_2$ 不断代入递归求解直至 $gcd$ $($ 最大公约数，下同 $)$ 为 $0$ 递归 
$x=1,y=0$ 回去求解。

[证明](https://oi-wiki.org/math/number-theory/gcd/)
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
用 `pair` 表示

```cpp
pair<int, int> extgcd(int a, int b) {
  if (!b) return make_pair(1, 0);
  int x, y;
  tie(y, x) = extgcd(b, a % b);
  y -= a / b * x;
  return make_pair(x, y);
}
```

非递归：
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
矩阵法：
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

## 快速幂
<mark style="background: #FFB8EBA6;">注意开 long long</mark>
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

## 逆元

### 1 定义
如果一个线性同余方程 $ax \equiv 1 \pmod b$，则 $x$ 称为 $a \bmod b$ 的逆元，记作 $a^{-1}$。
### 2 费马小定理：
$x \equiv a^{b-2} \pmod b$。$p$ 为质数才成立

### 3 拓展欧几里得：
```cpp
void Exgcd(ll a, ll b, ll &x, ll &y) {
    if (!b) x = 1, y = 0;
    else Exgcd(b, a % b, y, x), y -= a / b * x;
}
int main() {
    ll x, y;
    Exgcd (a, p, x, y);
    x = (x % p + p) % p;
    printf ("%d\n", x); //x是a在mod p下的逆元
}
```

### 4 线性递推求法：

```cpp
int inv[1000000];
void find_inv(int last,int p)
//求1~last所有数模p意义下的逆元
{
    inv[1]=1;//1的逆元就是1本身
    for(int i=2;i<=last;i++)
        inv[i]=(long long)(p-p/i)*(inv[p%i])%p;
    //注意longlong，否则有可能导致溢出
}
```

### 5 线性求任意 n 个数的逆元

上面的方法只能求 $1$ 到 $n$ 的逆元，如果需要求任意给定 $n$ 个数（$1 \le a_i < p$）的逆元，就需要下面的方法：

首先计算 $n$ 个数的前缀积，记为 $s_i$，然后使用快速幂或扩展欧几里得法计算 $s_n$ 的逆元，记为 $sv_n$。

因为 $sv_n$ 是 $n$ 个数的积的逆元，所以当我们把它乘上 $a_n$ 时，就会和 $a_n$ 的逆元抵消，于是就得到了 $a_1$ 到 $a_{n-1}$ 的积逆元，记为 $sv_{n-1}$。

同理我们可以依次计算出所有的 $sv_i$，于是 
$a_i^{-1}$ 就可以用 $s_{i-1} \times sv_i$ 求得。

所以我们就在 $O (n + \log p)$ 的时间内计算出了 $n$ 个数的逆元。

```cpp
s[0] = 1;
for (int i = 1; i <= n; ++i) s[i] = s[i - 1] * a[i] % p;
sv[n] = qpow(s[n], p - 2);
// 当然这里也可以用 exgcd 来求逆元,视个人喜好而定.
for (int i = n; i >= 1; --i) sv[i - 1] = sv[i] * a[i] % p;
for (int i = 1; i <= n; ++i) inv[i] = sv[i] * s[i - 1] % p;
```

### 6 一些练习题
- [乘法逆元 - OI Wiki](https://oi.wiki/math/number-theory/inverse/#%E9%80%86%E5%85%83%E7%BB%83%E4%B9%A0%E9%A2%98) 这里有几道题
- B3645 数列前缀和 2 - 洛谷  [链接](https://www.luogu.com.cn/problem/B3645)
- [B3646 数列前缀和 3 - 洛谷](https://www.luogu.com.cn/problem/B3646)

## 中国剩余定理

用于求解线性同余方程组

- 计算所有模数乘积：$\displaystyle M=\Pi m_{i}$
- 对于第 $i$ 个方程，计算 $c_{i}=\frac{M}{m_{i}}$
- 计算 $c_{i}$ 在摸 $m_{i}$ 意义下的乘法逆元 $c_{i}^{-1}$
- $\displaystyle x=\sum_{i=1}^nr_{i}c_{i}c_{i}^{-1}$

  
  [P1495 【模板】中国剩余定理（CRT）/ 曹冲养猪 - 洛谷](https://www.luogu.com.cn/problem/P1495)
