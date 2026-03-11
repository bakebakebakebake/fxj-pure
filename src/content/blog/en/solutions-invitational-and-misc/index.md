---
title: "Invitational and Addendum: Zhengzhou, Kunming, HDU, and Luogu"
description: Primarily based on original solution records, including Zhengzhou Invitational, Kunming Invitational, HDU 2973, and Luogu B3645.
publishDate: 2026-03-06
tags:
  - Competitive Programming
  - Solution Collection
  - Invitational Contests
  - HDU
  - Luogu
  - Thinking Problems
language: English
heroImageSrc: ../../../pic/brianna-parks-OkiElXd_EDQ-unsplash.jpg
heroImageColor: "#6e8059"
---
> [!note] Instruction
> This article will no longer include summary-style short reviews. Instead, it will directly restore the original solutions for the invitational contest and individual problems, with only supplementary compatibility handling added on the site side.

## Scope of Inclusion

- `2024 Zhengzhou Invitational M`
- `2024 Zhengzhou Invitational H`
- `2024 Zhengzhou Invitational A`
- `2024 Zhengzhou Invitational D`
- `2024 Kunming Invitational A`
- `2024 Kunming Invitational E`
- `HDU 2973`
- `Luogu B3645`

## 2024 Zhengzhou Invitational M - Effective Algorithm

Given a sequence of positive integers ${a_n}$ and ${b_n}$ of length $n$. For each $a_i(1 ≤ i ≤ n)$, perform exactly one of the following operations:

- Change $a_i$ to any integer $x$ that satisfies $|a_i − x| ≤ k × b_i$.

Please find the smallest non-negative integer $k$ such that there exists at least one method to make all numbers in the sequence ${a_n}$ equal after the operations.

This is clearly a binary search problem. If the range of possible values for $x$ for all elements has an intersection, then such a $k$ exists; otherwise, it does not.

```cpp
#define int long long
void solve() {
    int n;cin >> n;
    vector<int> a(n + 1), b(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i];
    for (int i = 1;i <= n;i++)cin >> b[i];
    int l = 0, r = 1e9;
    while (l < r) {
        int mid = l + r >> 1;
        int x = 1, y = 1e18;
        for (int i = 1;i <= n;i++) {
            x = max(x, a[i] - mid * b[i]);
            y = min(y, a[i] + mid * b[i]);
        }
        if (x > y)l = mid + 1;
        else r = mid;
    }
    cout << l << '\n';
}
```

## 2024 Zhengzhou Invitational H - Random Stack

Toxel obtained a random "stack." This stack can be considered a **multiset** $S$. When an element is taken from a non-empty random stack $S$, any element in the set has an equal probability of being taken. After the element is taken, it is removed from the set. For example, with ${1, 2, 2}$, there is a $\frac{1}{3}$ probability of taking 1, leaving the set as ${2, 2}$, and a $\frac{2}{3}$ probability of taking 2, leaving the set as ${1, 2}$. Each element removal event is independent.

Toxel is performing some operations on this set. Initially, the set is empty. It performs a total of $2n$ operations, of which $n$ are insertions and $n$ are removals. Now, Toxel tells you the sequence of operations and the numbers inserted each time, ensuring that the set is non-empty each time a removal occurs. Toxel wants to know, if the numbers taken out each time are arranged into a sequence, what is the probability that this sequence is non-decreasing?

>Here, the strict definition of non-decreasing is: each element of the taken-out sequence (except the last) is **less than or equal to** its subsequent element.

Since the answer may not be an integer, you only need to output this value modulo $998\ 244\ 353$.

That is, $\frac{p}{q}\to p\times q^{-1}\mod 998\ 244\ 353$.

Different from the official approach, this uses a `multiset` for convenience.

```cpp
#define int long long
constexpr int mod = 998244353;
int inv(int a, int b = mod - 2) {
    int ans = 1;
    while (b) {
        if (b & 1)ans = (ans * a) % mod;
        a = (a * a) % mod;b >>= 1;
    }
    return ans;
}
void solve() {
    int n;cin >> n;
    multiset<int>s;
    int p = 1, q = 1;
    int mx = -1;
    map<int, int>mp;
    for (int i = 1;i <= 2 * n;i++) {
        int x;cin >> x;
        if (x >= 0) {
            if (x < mx) {
                cout << "0\n";exit(0);
            }
            s.insert(x);mp[x]++;
        } else {
            int cnt = mp[*s.begin()];
            p = (p * cnt) % mod;
            q = (q * s.size()) % mod;
            mx = max(mx, *s.begin());
            mp[*s.begin()]--;
            s.erase(s.begin());
        }
    }
    cout << p * inv(q) % mod << '\n';
}
```

## 2024 Zhengzhou Invitational A - Once In My Life

For little A, positive integers whose digits include $1 ∼ 9$ and have at least two digits equal to $d (1 ≤ d ≤ 9)$ are considered lucky numbers.

When $d = 3$, obviously $1234567890123$ is a lucky number for little A, but $987654321$ is not a lucky number because the digit $3$ appears only once, and $998244353$ is not a lucky number because digits $1, 6, 7$ are missing.

Now little A has a positive integer $n$ and a positive integer $d$. He wants to find a positive integer $k$ such that their product $n · k$ is a lucky number. Can you use a computer to help him compute $k(k\leq 2\times10^{10})$?

Construction.

According to the official solution:
$\displaystyle N=(1234567890+d)\cdot10^{\lceil{\log_{10}n}\rceil}$

$\displaystyle K=\lceil{\frac{N}{n}}\rceil\leq 2\cdot 10^9\cdot \frac{10^{\lceil{\log_{10}n}\rceil}}{n}\leq 2\cdot 10^{10}$

$\displaystyle K=\lceil{\frac{(1234567890+d)\cdot10^{\lceil{\log_{10}n}\rceil}}{n}}\rceil$

```cpp
cout << ((1234567890 + d) * (int)pow(10, ceil(log10(n))) + n - 1) / n << '\n';
```

The code here was written hastily and may cause issues; you can compute $10^{\lceil{\log_{10}n}\rceil}$ by multiplying $10$ step by step to avoid precision loss.

## 2024 Zhengzhou Invitational D - Ratio of Distances

Given $n$ distinct points $P_{1},P_{2},\dots P_{n}$ in the plane (subscript 1 represents Manhattan distance - $\left|{x_{1}-x_{2}}\right|+\left|{y_{1}-y_{2}}\right|$, subscript 2 represents Euclidean distance - $\sqrt{ (x_{1}-x_{2})^2+(y_{1}-y_{2})^2 }$).

Find: $\displaystyle \max\limits_{1\leq i\leq j\leq n} \frac{\left|{\left|{P_{i}P_{j}}\right|}\right|_{1}}{\left|{\left|{P_{i}P_{j}}\right|}\right|_{2}}$

Simple mathematics:

[2024CCPC Zhengzhou Invitational and Henan Provincial Competition (A,B,C,D,F,G,H,J,K,L,M)](https://blog.csdn.net/qq_45809243/article/details/138890493)

Let $\displaystyle \tan \theta=\frac{\left|{x_{i}-x_{j}}\right|}{\left|{y_{i}-y_{j}}\right|}$. After simplification, $\displaystyle \frac{\left|{\left|{P_{i}P_{j}}\right|}\right|_{1}}{\left|{\left|{P_{i}P_{j}}\right|}\right|_{2}}=\left|{\sin \theta+\cos \theta}\right|=\sqrt{ 2 }\sin\left( \theta\pm\frac{\pi}{4} \right)$

When $\theta=45^{\circ} \text{ or }135^{\circ}$, the maximum is achieved. Then $\displaystyle \tan \theta=1\to \left|{x_{i}-x_{j}}\right|=\left|{y_{i}-y_{j}}\right|$

Removing the absolute value yields $x_{i}-y_{i}=x_{j}-y_{j}\text{ or }x_{i}+y_{i}=x_{j}+y_{j}$

Thus, sort by $x+y$ and $x-y$ respectively, and take the maximum among them.

```cpp
#define int long long
void solve() {
    int n;cin >> n;
    vector<pair<int, int>> p(n);
    for (int i = 0;i < n;i++)cin >> p[i].first >> p[i].second;
    sort(p.begin(), p.end(), [](auto x, auto y) {
        return x.first + x.second < y.first + y.second;
        });
    double ans = 1;
    for (int i = 1;i < n;i++) {
        auto [x2, y2] = p[i];
        auto [x1, y1] = p[i - 1];
        ans = max(ans, (abs(x1 - x2) + abs(y1 - y2)) / hypot(x1 - x2, y1 - y2));
    }
    sort(p.begin(), p.end(), [](auto x, auto y) {
        return x.first - x.second < y.first - y.second;
        });
    for (int i = 1;i < n;i++) {
        auto [x2, y2] = p[i];
        auto [x1, y1] = p[i - 1];
        ans = max(ans, (abs(x1 - x2) + abs(y1 - y2)) / hypot(x1 - x2, y1 - y2));
    }

    cout << fixed << setprecision(15) << ans << '\n';
}
```

## 2024 Kunming Invitational A - Two-Star Competition

For some reason, education experts are preparing to rate $n$ competitions. The experts have already determined the rating outcome for each competition, where the $i$-th competition is rated as $s_i$ stars.

It is said that each competition is rated based on $m$ attributes, where the $j$-th attribute of the $i$-th competition is denoted as $p_{i, j}$, and each attribute ranges from 0 to $k$ (inclusive). The score of a competition is the sum of all its $m$ attributes. That is, let $v_i$ represent the score of the $i$-th competition, we have $v_i=\sum_{j=1}^m p_{i, j}$.

It seems natural that a higher-star competition should have a higher score. The experts require that for any two competitions $1 \leq i, j \leq n$, if $s_i>s_j$, then $v_i>v_j$ must hold. Unfortunately, the experts forgot to collect some (or even all) attribute data for some competitions. As the expert's assistant, you are tasked with filling in these missing attribute values so that the above constraint holds for any two competitions.

Greedy from smallest to largest, note a trick: how to restore the indices? $\to$ sort in reverse order.

```cpp
#define int long long
void solve() {
    int n, m, k;cin >> n >> m >> k;

    vector<int> s(n + 1);
    vector<vector<int>> v(n + 1, vector<int>(m + 4));

    for (int i = 1;i <= n;i++) {
        cin >> s[i];v[i][0] = s[i];
        int sum = 0, cnt = 0;
        for (int j = 1;j <= m;j++) {
            cin >> v[i][j];
            if (v[i][j] != -1) {
                sum += v[i][j];
            } else {
                cnt++;
            }
        }
        v[i][m + 1] = sum;
        v[i][m + 2] = cnt;
        v[i][m + 3] = i;
    }
    sort(v.begin(), v.end(), [](auto x, auto y) {
        return x[0] < y[0];
        });

    int last = -1, cur = -1;
    for (int i = 1;i <= n;i++) {
        if (v[i][0] != v[i - 1][0]) {
            last = cur;
        }

        int x = v[i][m + 1] - last - 1;
        if (x >= 0) {
            for (int j = 1;j <= m;j++) {
                if (v[i][j] == -1) {
                    v[i][j] = 0;
                }
            }
        } else {
            x = -x;
            if (v[i][m + 2] * k + v[i][m + 1] <= last) {
                cout << "No\n";return;
            }
            for (int j = 1;j <= m;j++) {
                if (v[i][j] == -1) {
                    v[i][j] = min(k, x);
                    x -= v[i][j];
                }
            }
        }
        int sum = 0;
        for (int j = 1;j <= m;j++) {
            sum += v[i][j];
        }
        cur = max(cur, sum);
    }
    cout << "Yes\n";

    sort(v.begin(), v.end(), [&](auto x, auto y) {
        return x[m + 3] < y[m + 3];
        });

    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= m;j++) {
            cout << v[i][j] << " \n"[j == m];
        }
    }
}
```

## 2024 Kunming Invitational E - Learn and Practice

Given a sequence of positive integers $a_1, a_2, \cdots, a_n$ of length $n$ and a non-negative integer $k$, you can perform the following operation at most once:

>Choose two integers $l$ and $r$ such that $1 \leq l \leq r \leq n$, then for each $l \leq i \leq r$, change $a_i$ to $\left(a_i+k\right)$.

That is, add $k$ to the entire interval $[l,r]$, aiming to maximize the greatest common divisor of the entire sequence.

Difference idea + thinking.

Brute force: This problem only involves two indices in the difference array. Using pure difference, you only need to enumerate two indices in the difference array. However, the time complexity is $O(n^3\log n)$, which will definitely time out.

```cpp
void solve() {
    int n, k;cin >> n >> k;
    vector<int> a(n + 1), dif(n + 2);
    int ans = a[1];
    for (int i = 1;i <= n;i++)cin >> a[i], ans = __gcd(ans, a[i]);
    for (int i = 1;i <= n;i++)dif[i] = a[i] - a[i - 1];
    
    for (int i = 1;i <= n;i++) {
        for (int j = i;j <= n;j++) {
            dif[i] += k;dif[j + 1] -= k;
            int res = dif[1];
            for (int k = 1;k <= n;k++) {
                res = __gcd(dif[k], res);
            }
            ans = max(ans, abs(res));

            dif[i] -= k;dif[j + 1] += k;
        }
    }
    cout << ans << '\n';
}
```

Solution: This problem can divide $[1,n]$ into 4 parts: $[1,l-1],[l,r-1],r,[r+1,n]$

The answer is the gcd of these four numbers: $\gcd(a_{1},a_{2},\dots a_{l-1}),\gcd(\left|{a_{l}-a_{l+1}}\right|,\dots,\left|{a_{r-1}-a_{r}}\right|),a_{r}+k,\gcd(a_{r+1},\dots a_{n})$.

The number of points where the prefix and suffix gcd change compared to the previous result is small, so enumerate them sequentially.

>There is more than one method; the key is to realize the characteristic that the number of points where the gcd changes is small.

```cpp
#define int long long
void solve() {
    int n, k;cin >> n >> k;
    vector<int> a(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i];
    if (n == 1) {
        cout << k + a[1] << '\n';return;
    }

    unordered_set<int>s1, s2;
    s1.insert(1);
    s2.insert(n);
    int g = a[1];
    for (int i = 1;i <= n;i++) {
        int gg = g;
        g = __gcd(g, a[i]);
        if (gg != g) {
            s1.insert(i);
        }
    }

    g = a[n];
    for (int i = n;i >= 1;i--) {
        int gg = g;
        g = __gcd(g, a[i]);
        if (gg != g) {
            s2.insert(i);
        }
    }

    vector<int> pre(n + 1), suf(n + 1);
    pre[1] = a[1];suf[n] = a[n];
    for (int i = 2;i <= n;i++) {
        pre[i] = __gcd(pre[i - 1], a[i]);
    }
    for (int i = n - 1;i >= 1;i--) {
        suf[i] = __gcd(suf[i + 1], a[i]);
    }

    int ans = pre[n];
    for (auto l : s1) {
        for (auto r : s2) {
            if (l <= r) {
                int x = __gcd(pre[l - 1], suf[r + 1]);
                if (l == 1) {
                    x = suf[r + 1];
                }
                if (r == n) {
                    x = pre[l - 1];
                }

                int res = l != r ? abs(a[l] - a[l + 1]) : a[r] + k;
                for (int i = l + 1;i <= r - 1;i++) {
                    res = __gcd(res, abs(a[i] - a[i + 1]));
                }
                int y = __gcd(res, a[r] + k);
                if (l == 1 && r == n) {
                    x = y;
                }
                ans = max(ans, __gcd(x, y));
            }
        }
    }
    cout << ans << '\n';
}
```

## HDU 2973

Wilson's Theorem

Given $n$, compute

$\sum_{k=1}^n\left\lfloor\frac{(3k+6)!+1}{3k+7}-\left\lfloor\frac{(3k+6)!}{3k+7}\right\rfloor\right\rfloor$

Idea:
Easily think of [Wilson's Theorem](https://www.luogu.com.cn/blog/FXJ-HOME/wei-er-xun-ding-li)

1. If $3k+7$ is prime, then
$(3k+6)!\equiv-1\pmod{3k+7}$

It's easy to see $(3k+6)!+1=m(3k+7)$

Then
$\left\lfloor\frac{(3 k+6)!+1}{3 k+7}-\left\lfloor\frac{(3 k+6)!}{3 k+7}\right\rfloor\right\rfloor=\left\lfloor m-\left\lfloor m-\frac{1}{3 k+7}\right\rfloor\right\rfloor=1$

2. If $3k+7$ is not prime, then $(3k+7)\mid(3k+6)!$ (by the corollary of Wilson's Theorem)

Let $(3k+6)!=k(3k+7)$,

$\left\lfloor\frac{(3k+6)!+1}{3k+7}-\left\lfloor\frac{(3k+6)!}{3k+7}\right\rfloor\right\rfloor=\left\lfloor k+\frac{1}{3k+7}-k\right\rfloor=0$

Therefore

$\sum_{k=1}^n\left\lfloor\frac{(3k+6)!+1}{3k+7}-\left\lfloor\frac{(3k+6)!}{3k+7}\right\rfloor\right\rfloor=\sum_{k=1}^n[3k+7\text{ is prime}]$

Consider [sieve method](https://www.luogu.com.cn/blog/FXJ-HOME/eratosthenes-shai-fa): prime sieve.

```cpp
#include <iostream>

const int M = 1e6 + 5, N = 3 * M + 7;

bool not_prime[N];
int sum[M];

int main() {
  for (int i = 2; i < N; ++i)
    if (!not_prime[i])
      for (int j = 2; j * i < N; ++j) 
      not_prime[j * i] = 1;
  for (int i = 1; i < M; ++i) 
  sum[i] = sum[i - 1] + !not_prime[3 * i + 7];

  int t;
  std::cin >> t;
  while (t--) {
    int n;
    std::cin >> n;
    std::cout << sum[n] << std::endl;
  }
}

```

## Luogu B3645 - Sequence Prefix Sum 2

[B3645 Sequence Prefix Sum 2 - Luogu](https://www.luogu.com.cn/problem/B3645)
[B 3645 Sequence Prefix Sum 2 Solution - lrqlrq250's Blog - Luogu Blog](https://www.luogu.com.cn/blog/lrqlrq250/b-3645-shuo-lie-qian-zhui-hu-2-ti-xie)


![](../../solutions-invitational-and-misc/Pasted%20image%2020231127154615.png)

 $\prod \limits_{i=l}^r a_i \pmod p$ is found to be equivalent to $\Huge{\frac{\prod\limits_{i=1}^{r}a_i}{\prod\limits_{i=1}^{l-1} a_i}}$ 
 
 Then the answer is $\prod\limits_{i=1}^{r}a_i \times inv[\prod\limits_{i=1}^{l-1}a_i]$ , where $inv[i]$ is the multiplicative inverse of $i$ modulo $p$.

That is, $s[r]\times inv[s[l-1]]$ ,
$\therefore$ $ans\ \oplus={s[r]\times inv[s[l-1]]}$ 

```cpp
#include <bits/stdc++.h>
using namespace std;
#define ll long long
const ll p = 1145141;
int n, q;
ll a[1000010],inv[1200010],s[1000010];
int main()
{
    ios::sync_with_stdio(0), cin.tie(nullptr);
    s[0] = inv[1] = 1;
    cin >>n >> q;
    for (int i = 1; i <= n;i++) cin >> a[i];
    for (int i = 1; i <= n;i++) s[i] = s[i - 1] * a[i] % p;//prefix product s[i]
    for (int i = 2; i <= p; i++)//up to p, not n!!!
        inv[i] = (p - p / i) * inv[p % i] % p;
    ll ans = 0;
    while(q--)
    {
        int l, r;
        cin >> l >> r;
        ans ^= s[r] * inv[s[l-1]] % p;
    }
    cout << ans << '\n';
}
```