---
title: '邀请赛与补遗：郑州、昆明、HDU 与洛谷'
description: '以原题解记录为主，收录郑州邀请赛、昆明邀请赛、HDU 2973 与洛谷 B3645。'
publishDate: '2026-03-06'
tags:
  - 算法竞赛
  - 题解整理
  - 邀请赛
  - HDU
  - 洛谷
  - 思维题
language: '中文'
---

> [!note] 说明
> 这篇不再写概述式短评，直接回填原来的邀请赛和单题题解，只在站点侧补兼容处理。

## 收录范围

- `2024 郑州邀请赛 M`
- `2024 郑州邀请赛 H`
- `2024 郑州邀请赛 A`
- `2024 郑州邀请赛 D`
- `2024 昆明邀请赛 A`
- `2024 昆明邀请赛 E`
- `HDU 2973`
- `洛谷 B3645`

## 2024 郑州邀请赛 M - 有效算法
给出长度为 $n$ 的正整数序列 ${a_n}$ 和 ${b_n}$。对于每个 $a_i(1 ≤ i ≤ n)$，进行恰好一次以下操作：

- 将 $a_i$ 变成满足 $|a_i − x| ≤ k × b_i$ 的任意整数 x。

请你求出最小的非负整数 $k$，使得存在至少一种方法使得操作后序列 ${a_n}$ 所有数都相等。

很明显的二分答案，若对于所有元素 $x$ 取值范围区间有交集则存在这个 $k$ ，否则不存在。
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

## 2024 郑州邀请赛 H - 随机栈
Toxel 获得了一个随机的 “栈”。这个栈可被视为一个**多重集** $S$，从一个非空的随机栈 $S$ 中取出一个元素时，有可能从中取出任何一个元素，其中每个元素被取出的概率是相等的。取出该元素后，该元素会从集合中删除。以 ${1, 2, 2}$ 为例，有 $\frac{1}{3}$ 的概率取出 1，使得集合变为 ${2, 2}$，有 $\frac{2}{3}$ 的概率取出 2，使得集合变为 ${1, 2}$。每次取出元素的事件相互独立。

Toxel 正在对这个集合做一些操作。集合初始时为空，它总共进行了 $2 n$ 次操作，其中 $n$ 次操作为插入，$n$ 次操作为取出。现在，Toxel 告诉了你它操作的顺序以及每次插入的数，且保证每次取出时，集合非空。Toxel 想知道，如果把每次取出数排成一个序列，那么这个序列递增的概率是多少？

>这里，递增的严格定义是：取出数列的每一项（除最后一项）小. 于. 等. 于. 它的后一项。

由于答案可能不是整数，为了方便计算，你只需要求出这个值对 $998\ 244\ 353$ 取模的结果

即 $\frac{p}{q}\to p\times q^{-1}\mod998\ 244\ 353$。

与官方做法不同，用了 `multiset` 的方式，更加方便

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

## 2024 郑州邀请赛 A - Once In My Life
对于小 A 而言，数位包含 $1 ∼ 9$，并且至少两个数位是 $d (1 ≤ d ≤ 9)$ 的 **十进制正整数** 都是幸运数。

当 $d = 3$时，显然 $1234567890123$ 是小 A 的幸运数，但 $987654321$ 因为数位 $3$ 仅出现了一次而不是幸运数，$998244353$ 因为缺少数位 $1, 6, 7$ 而不是幸运数。

现在小 A 有一个正整数 $n$，并给出正整数 $d$。他想找到正整数 $k$ 使得二者的乘积 $n · k$ 是幸运数。你能用计算机辅助他的计算 $k(k\leq 2\times10^{10})$ 吗？

构造

对于官方的题解：
$\displaystyle N=(1234567890+d)\cdot10^{\lceil{\log_{10}n}\rceil}$

$\displaystyle  K=\lceil{\frac{N}{n}}\rceil\leq 2\cdot 10^9\cdot \frac{10^{\lceil{\log_{10}n}\rceil}}{n}\leq 2\cdot 10^{10}$

$\displaystyle K=\lceil{\frac{(1234567890+d)\cdot10^{\lceil{\log_{10}n}\rceil}}{n}}\rceil$

```cpp
cout << ((1234567890 + d) * (int)pow(10, ceil(log10(n))) + n - 1) / n << '\n';
```

这里其实写的太急躁，容易出问题，可以将 $10^{\lceil{\log_{10}n}\rceil}$ 的 $10$ 一个一个乘起来，这样不会丢失精度

## 2024 郑州邀请赛 D - 距离之比
给定在平面上互不重合的 $n$ 个点 $P_{1},P_{2},\dots P_{n}$，

(下标为 1 代表曼哈顿距离- $\left|{x_{1}-x_{2}}\right|+\left|{y_{1}-y_{2}}\right|$，2 代表欧几里得距离- $\sqrt{ (x_{1}-x_{2})^2+(y_{1}-y_{2})^2 }$)

求：$\displaystyle \max\limits_{1\leq i\leq j\leq n} \frac{\left|{\left|{P_{i}P_{j}}\right|}\right|_{1}}{\left|{\left|{P_{i}P_{j}}\right|}\right|_{2}}$

简单数学 ：

[2024CCPC郑州邀请赛暨河南省赛（A,B,C,D,F,G,H,J,K,L,M）](https://blog.csdn.net/qq_45809243/article/details/138890493)

令 $\displaystyle \tan \theta=\frac{\left|{x_{i}-x_{j}}\right|}{\left|{y_{i}-y_{j}}\right|}$,化简后 $\displaystyle \frac{\left|{\left|{P_{i}P_{j}}\right|}\right|_{1}}{\left|{\left|{P_{i}P_{j}}\right|}\right|_{2}}=\left|{\sin \theta+\cos \theta}\right|=\sqrt{ 2 }\sin\left( \theta\pm\frac{\pi}{4} \right)$

当 $\theta=45^{\circ} \text{ or }135^{\circ}$ 时，才能达到最大。这时 $\displaystyle \tan \theta=1\to \left|{x_{i}-x_{j}}\right|=\left|{y_{i}-y_{j}}\right|$

去掉绝对值可以得到 $x_{i}-y_{i}=x_{j}-y_{j}\text{ or }x_{i}+y_{i}=x_{j}+y_{j}$

所以分别让按照横坐标按照 $x+y$ 和 $x-y$ 排序，取其中最大值即可。

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

## 2024 昆明邀请赛 A - 两星级竞赛
教育专家们出于某种原因, 准备对 $n$ 项竞赛进行评级。专家们已经决定了每项竞赛的评级结果, 其中第 $i$ 项竞赛被评为 $s_i$ 星级竞赛。

据说每项竞赛都会依据 $m$ 种属性进行评级, 其中第 $i$ 项竞赛的第 $j$ 种属性记为 $p_{i, j}$, 每种属性的取值范围从 0 到 $k$ (含两端)。一项竞赛的分数是其所有 $m$ 种属性的总和。也就是说, 令 $v_i$ 表示第 $i$ 项竞赛的分数, 我们有 $v_i=\sum_{j=1}^m p_{i, j}$ 。

如果一项星级更高的赛事有更高的分数, 看起来会比较自然。专家们要求, 对于任意两项竞赛 $1 \leq i, j \leq n$, 若 $s_i>s_j$, 则必须有 $v_i>v_j$ 。不幸的是, 专家们忘了采集一些竞赛部分 (甚至全部）属性的数据。作为专家们的助手, 您被要求填充这些不存在的属性值, 使得上述限制条件对任意两项竞赛都成立。

从小到大贪心即可，注意一个 trick：如何将下标还原？$\to$ 逆向 sort 即可。

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

## 2024 昆明邀请赛 E - 学而时习之
给定长度为 $n$ 的正整数序列 $a_1, a_2, \cdots, a_n$ 以及一个非负整数 $k$, 您可以执行以下操作至多一次: 

>选择两个整数 $l$ 和 $r$ 满足 $1 \leq l \leq r \leq n$, 之后对于每个 $l \leq i \leq r$, 将 $a_i$ 变为 $\left(a_i+k\right)$ 。

即区间 $[l,r]$ 整体加 $k$，要求最大化整个序列的最大公因数。

差分思想+思维

暴力：发现这个题目对于差分数组只会涉及到两个下标，若纯差分，则只需要枚举差分数组中的两个下标即可。只是时间复杂度为 $O(n^3\log n)$，必然超时。

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

Solution：这个题目可以将 $[1,n]$ 分为 4 个部分：$[1,l-1],[l,r-1],r,[r+1,n]$

答案为 $\gcd(a_{1},a_{2},\dots a_{l-1}),\gcd(\left|{a_{l}-a_{l+1}}\right|,\dots,\left|{a_{r-1}-a_{r}}\right|),a_{r}+k,\gcd(a_{r+1},\dots a_{n})$ 这四个数的 gcd。

对于前缀和后缀的 gcd 和之前结果相比改变了的点不会很多，依次枚举即可。

>方法不止一种，关键在于想到使得 gcd 改变的数量很少的特性。

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

威尔逊定理

给定 $n$, 计算

$\sum_{k=1}^n\left\lfloor\frac{(3k+6)!+1}{3k+7}-\left\lfloor\frac{(3k+6)!}{3k+7}\right\rfloor\right\rfloor$

思路：
容易想到[威尔逊定理](https://www.luogu.com.cn/blog/FXJ-HOME/wei-er-xun-ding-li)

1. 若 $3k+7$ 是质数，则
$(3k+6)!\equiv-1\pmod{3k+7}$

易得 $(3k+6)!+1=m(3k+7)$

则
$\left\lfloor\frac{(3 k+6)!+1}{3 k+7}-\left\lfloor\frac{(3 k+6)!}{3 k+7}\right\rfloor\right\rfloor=\left\lfloor m-\left\lfloor m-\frac{1}{3 k+7}\right\rfloor\right\rfloor=1$

2. 若 $3k+7$ 不是质数 ,则有 $(3k+7)\mid(3k+6)!$ (由威尔逊定理的推论）

设 $(3k+6)!=k(3k+7)$，

$\left\lfloor\frac{(3k+6)!+1}{3k+7}-\left\lfloor\frac{(3k+6)!}{3k+7}\right\rfloor\right\rfloor=\left\lfloor k+\frac{1}{3k+7}-k\right\rfloor=0$

因此

$\sum_{k=1}^n\left\lfloor\frac{(3k+6)!+1}{3k+7}-\left\lfloor\frac{(3k+6)!}{3k+7}\right\rfloor\right\rfloor=\sum_{k=1}^n[3k+7\text{ is prime}]$

考虑[筛法](https://www.luogu.com.cn/blog/FXJ-HOME/eratosthenes-shai-fa): 素数筛法

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

## 洛谷 B3645 - 数列前缀和 2

[B3645 数列前缀和 2 - 洛谷](https://www.luogu.com.cn/problem/B3645)
[B 3645 数列前缀和2 题解 - lrqlrq250 的博客 - 洛谷博客](https://www.luogu.com.cn/blog/lrqlrq250/b-3645-shuo-lie-qian-zhui-hu-2-ti-xie)


常用的 $\LaTeX$ 公式

> [!NOTE]-
> 
>  ![](./Pasted%20image%2020231127160008.png)
> 

![](./Pasted%20image%2020231127154615.png)

 $\prod \limits_{i=l}^r a_i \pmod p$ 发现等价于 $\Huge{\frac{\prod\limits_{i=1}^{r}a_i}{\prod\limits_{i=1}^{l-1} a_i}}$ 
 
 则答案为 $\prod\limits_{i=1}^{r}a_i \times inv[\prod\limits_{i=1}^{l-1}a_i]$ , $inv[i]$ 为 $i$ 在 $\mod p$ 意义下的乘法逆元

即为 $s[r]\times inv[s[l-1]]$ ,
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
    for (int i = 1; i <= n;i++) s[i] = s[i - 1] * a[i] % p;//前缀积s[i]
    for (int i = 2; i <= p; i++)//到p，不是到n!!！
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
