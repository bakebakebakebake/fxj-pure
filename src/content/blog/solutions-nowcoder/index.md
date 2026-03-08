---
title: 牛客题解整理：寒假赛、周赛与多校
description: 2023.12~2024.8 以原题解记录为主，收录书签里标出的寒假赛、周赛与多校题目。
publishDate: 2026-03-06
tags:
  - 算法竞赛
  - 题解整理
  - 牛客
  - DP
  - 图论
  - 构造
language: 中文
---

> [!note] 说明
> 这篇只做整合，不改你原来每道题的主体内容；主要是把分散在不同比赛笔记里的题解汇到同一篇，并顺手处理图片和链接兼容。

## 收录范围

- `寒假 2 - I/J`
- `寒假 2 - D`
- `寒假 3 - L/M`
- `寒假 3 - G/H`
- `寒假 5 - G/H`
- `牛客多校 4 - H`
- `牛客多校 4 - C`
- `牛客周赛 60 - D`
- `牛客周赛 60 - E`
- `牛客周赛 60 - F`
- `牛客周赛 51 - D`
- `牛客周赛 51 - E`
- `牛客周赛 51 - F`
- `牛客周赛 31 - E`
- `牛客周赛 52 - C`
- `牛客周赛 52 - E`
- `牛客周赛 52 - F`
- `牛客周赛 47 - D`
- `牛客周赛 47 - E`
- `牛客周赛 47 - F`
- `牛客周赛 35 - F/G`
- `牛客周赛 55 - E`

## 2024 牛客寒假算法基础集训营 2 - I/J Tokitsukaze and Short Path (plus)(minus)
加和减的唯一区别是边权的计算方式。

Tokitsukaze 有一个 n 个顶点的完全图 G，顶点编号是 1 到 n，编号为 i 的顶点的值是$a_i$。

完全图指的是每对顶点之间都恰好有一条无向边的图。对于顶点 u 和顶点 v 之间的无向边，边权计算方式如下：

$if(u=v) w_{u,v}=0,otherwise,w_{u,v}=\mid a_{u}+a_{v}\mid\pm\mid a_{u}-a_{v}\mid$

定义 $dist (i, j$)表示顶点 $i$ 为起点，顶点 $j$ 为终点的最短路。求 $∑\limits_{i=1}^ n∑\limits_{j=1}^ ndist(i,j)$

>关于最短路的定义：
>
>定义一条从 s 到 t 的路径为若干条首尾相接的边形成的序列且该序列的第一条边的起点为 s，最后一条边的终点为 t，特别的，当 s=t 时该序列可以为空。
>
>定义一条从 s 到 t 的路径长度为该路径中边权的总和。
>
>定义 s 到 t 的最短路为 s 到 t 所有路径长度中的最小值。

这题乍一看是图论，但是肯定不是用图论的方法做。

### Solution

#### I (plus)
按照题意：

- 最短路径一定是与之相连的节点，若不是结果一定会变大
- 如果 `a[u]>a[v}` 则 $w_{i,j}+=2\times a[u]$,反之则 $w_{i,j}+=2\times a[v]$

若将数组排序后则 `a[i]<=a[j]` 恒成立，之后只需要加 `2*a[j]` 即可。

则答案形式：
```python
for i (0, n - 1)
	for j (i + 1,n - 1)
		ans += 2 * a[j]
ans *= 2
```

- $1,2,3,4,\dots,n-1\to pre[n-1]-pre[0]$ 
- $2,3,4,\dots,n-1\to pre[n-1]-pre[1]$
- $3,4,\dots,n-1\to pre[n-1]-pre[2]$
- $n-1\to pre[n-1]-pre[n-2]$

```python
cnt = pre[n - 1]
for i (0, n - 2)
	ans += cnt - pre[i]
```

```cpp 岂敢高声
for(int i = 2, j = 1; i <= n; i ++, j ++)
	ans += w[i] * 2 * j;
```

```cpp 
void solve() {
    int n;
    cin >> n;
    vector<ll> a(n), pre(n);
    ll r1 = 0;
    for (int i = 0; i < n; i++) {
        cin >> a[i];
        r1 += a[i];
    }
    sort(a.begin(), a.end());
    pre[0] = a[0];
    for (int i = 1;i < n;i++) {
        pre[i] = pre[i - 1] + a[i];
    }

    ll ans = 0;
    for (int i = 1;i < n;i++) {
        ans += r1 - pre[i - 1];
    }
    cout << ans * 4 << '\n';
}
```

#### J (minus)

主要问题是找到最短路，只有两种可能：`a[i-1] * 2 || 4 * a[0]`

暴力做法：
```cpp
ll ans = 2 * a[0] * (n - 1);

for (int i = 1;i < n;i++) {
	for (int j = i + 1;j < n;j++) {
		ans += min(2 * a[i], 4 * a[0]);
	}
}
cout << ans * 2 << '\n';
```

正解：
```cpp
void solve() {
    int n;
    cin >> n;
    vector<ll> a(n);
    for (int i = 0;i < n;i++)
        cin >> a[i];

    sort(a.begin(), a.end());

    ll ans = 2 * a[0] * (n - 1);

    for (int i = 1;i < n;i++) {
        ans += min(2 * a[i], 4 * a[0]) * (n - i - 1);
    }
    cout << ans * 2 << '\n';
}
```

## 2024 牛客寒假算法基础集训营 2 - D Tokitsukaze and Slash Draw
Tokitsukaze 的卡组有 $n(1\leq n\leq 5000)$ 张卡片，她已经知道「一击必杀！居合抽卡」这张卡片是在卡组中从最下面往上数的第 $k$ 张卡片。她挑选了 $m(1\leq m\leq 1000)$ 种能够调整卡组中卡片顺序的卡片，第 $i$ 种类型的卡片效果是：把卡组最上方的 $a_i$ 张卡片拿出来按顺序放到卡组最下方。这个效果你可以理解为：首先将一张卡片拿出来，然后把这张卡片放到卡组最下方，这个动作重复做 $a_i$ 次。而发动第 $i$ 种类型的卡片效果，需要支付 $b_i$ 的 $\text{cost}$。

Tokitsukaze 可以通过一些操作使每种类型的卡片可以发动无限次，她是否能够让「一击必杀！居合抽卡」这张卡片出现在卡组的最上方？如果能，请输出最少需要支付的 $\text{cost}$，如果不能，请输出 `-1`。

### Solution
`DP` | `dijkstra` (同余最短路模型)

$dp[x]=\min(dp[x],dp[(x+a_{i})\%n]+b_{i})$

[D\_哔哩哔哩\_bilibili](https://www.bilibili.com/video/BV1Hm411Q7Ta?p=5&vd_source=cb670d82714ee9baee22c33ef083884d)

$mn_{i}$ 表示在 `mod n` 条件下目标卡片向上移动 $i$ 步的最小 $\text{cost}$

(没看懂 $\dots$)
```cpp tokitsukaze(没看懂)
const int maxn = 3e5 + 10;
int a[maxn], b[maxn];
ll mn[maxn], dp[5010][5010];
void solve() {
    int n, m, k;
    cin >> n >> m >> k;

    for (int i = 1; i <= n; i++) {
        mn[i] = 1e18;
    }

    for (int i = 1; i <= m; i++) {
        cin >> a[i] >> b[i];
        for (int j = 1; j <= n; j++) {
            int nxt = j * a[i] % n;//表示a[i]的倍数都可以翻
            if (!nxt) nxt = n; //可以注释掉？
            mn[nxt] = min(mn[nxt], 1ll * j * b[i]);//表示a[i]的倍数时的cost
        }
    }

    for (int i = 1; i <= n; i++) {
        if (i == k) {
            dp[0][i] = 0;
        } else {
            dp[0][i] = 1e18;
        }
    }

    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) {
            dp[i][j] = dp[i - 1][j];
        }

        for (int j = 1; j <= n; j++) {
            int nxt = (j + i) % n;
            if (!nxt) nxt = n;
            dp[i][nxt] = min(dp[i][nxt], dp[i - 1][j] + mn[i]);
        }
    }

    if (dp[n][n] == 1e18) {
        cout << -1 << '\n';
    } else {
        cout << dp[n][n] << '\n';
    }
}
```

[【持续更新】2024牛客寒假算法基础集训营2 题解 | JorbanS - 知乎](https://zhuanlan.zhihu.com/p/681575077)
```cpp 
 int n, m, k, a[N], b[N];
 ll f[N];
 
 ll solve() {
     cin >> n >> m >> k;
     for (int i = 0; i < m; i ++) cin >> a[i] >> b[i];
     memset(f, -1, sizeof f);
     f[k - 1] = 0;
     queue<int> q;
     q.push(k - 1);
     while (!q.empty()) {
         auto u = q.front();
         q.pop();
         for (int i = 0; i < m; i ++) {
             int v = (u + a[i]) % n;
             if (f[v] != -1 && f[v] <= f[u] + b[i]) continue;
             f[v] = f[u] + b[i];
             q.push(v);
         }
     }
     return f[n - 1];
 }
```

[D\_哔哩哔哩\_bilibili](https://www.bilibili.com/video/BV1Hm411Q7Ta?p=5&vd_source=cb670d82714ee9baee22c33ef083884d)

$dp[x]=\min(dp[x],dp[(x+a_{i})\%n]+b_{i})$

```cpp
void solve() {
    int n, m, k;
    cin >> n >> m >> k;
    vector<ll> a(m+1), b(m+1), d(n+1, INTMAX_MAX);
    vector<bool> vis(n+1, 0);
    for (int i = 1;i <= m;i++)cin >> a[i] >> b[i];
    priority_queue<pair<ll, ll>> q;
    q.push({ 0,0 });
    d[0] = 0;
    while (q.size()) {
        ll u = q.top().second; q.pop();
        if (vis[u])continue;
        vis[u] = true;
        for (int i = 1;i <= m;i++) {
            ll v = (u + a[i]) % n;
            if (d[v] > d[u] + b[i]) {
                d[v] = d[u] + b[i];
                if (!vis[v])q.push({ -d[v], v });
            }
        }
    }
    if (d[n - k] == INTMAX_MAX)d[n - k] = -1;
    cout << d[n - k] << '\n';
}
```

## 2024 牛客寒假算法基础集训营 3 - L/M 智乃的 36 倍数 (easy)(normal)
定义运算 $f$，表示将两个正整数按照字面值从左到右拼接

智乃现在有一个大小为 $N$ 的正整数数组 $a$，第 $i$ 个元素为 $a_i$，现在他想选出两个正整数进行前后拼接，使得它们拼接后是一个 $36$ 的倍数，问智乃有多少种可行的方案。

>她想要知道有多少对有序数对 $(i, j)(i≠j)$ 满足 $f (a_i, a_j)$ 是一个 $36$ 的倍数。

- `easy`: $1\leq N\leq 1000,1\leq a_{i}\leq 10$
- `normal`: $1\leq N\leq 10^5,1\leq a_{i}\leq 10^{18}$

###  $\text{easy:}$
法一：暴力枚举

`stoi`: 即 `string to int`
```cpp 
void solve() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0;i < n;i++) {
        cin >> a[i];
    }
    int cnt = 0;
    for (int i = 0;i < n;i++) {
        for (int j = 0;j < n;j++) {
            if (i != j) {
                string s = to_string(a[i]) + to_string(a[j]);
                int num = stoi(s);
                if (num % 36 == 0) {
                    cnt++;
                }
            }
        }
    }
    cout << cnt << '\n';
}
```

法二：只需要统计 36 72 108 即可。
```cpp 
void solve() {
    int n, x;
    cin >> n;
    vector<int> a(11);
    for (int i = 1;i <= n;++i) {
        cin >> x;
        a[x]++;
    }
    cout << a[3] * a[6] + a[7] * a[2] + a[10] * a[8] << '\n';
}
```

###  $\text{normal:}$
法一：可以考虑 36 实际上就是 4 的倍数和 9 的倍数

- 4 的倍数只要后两位可以被 4 整除即可。
- 9 的倍数只要所有数位和可以被 9 整除即可。

如果按这个思路继续写下去，其实就是把“能否拼成 4 的倍数”和“数位和能否拼成 9 的倍数”拆开计数，再做分类讨论；不过就这题而言，后面的桶计数做法更直接，也更适合代码实现。

法二：根据模的性质，两个数字求和模 36 实际上就是每一部分分别模 36 求和后再模 36

即 $(a+b)\%36=(a\%36+b\%36)\%36$，

所以可以直接开桶统计每个数字模 36 后是几，然后 36 还有个特殊性质， $10^k\ \%36=28(k\geq 2)$ 所以只需要知道它是不是 10 位数即可。

 $f(j,i)=j\times10^k+i$ ($k$ 为 $i$ 的位数)

如果 $k\geq 2(i\geq 10),j\times10^k\%36=j\times28$
如果 $k=1(i<10),j\times10^k\%36=j\times10$

$f(j,i)$ 即 `(j * (i < 10LL ? 10LL : 28LL) + i)` $j$ 是 `a[i]` 中的元素 $\text{mod 36}$ 的结果， $i$ 是 `a[i]`，$sum[i]$ 是代表 $a[i]\%36$ 结果相同的数量(证明这些数相差 36 的倍数，对结果不影响，在 $f(j,i)\%36$ 时会消掉，这些数就可以一起加上降低复杂度)

对于 `a[i]` 中的每个元素，遍历 $f(j,a[i])$,若被 36 整除加上

```cpp 作者题解
void solve() {
    int n;
    ll ans = 0;
    cin >> n;
    vector<ll> a(n);
    for (int i = 0; i < n; ++i) {
        cin >> a[i];
    }

    auto calc = [&]() {
        ll ans = 0;
        vector<ll> sum(36, 0);
        for (auto i : a) {
            for (int j = 0; j < 36; ++j) {
                if ((j * (i < 10LL ? 10LL : 28LL) + i) % 36 == 0) {
                    ans += sum[j];
                }
            }
            sum[i % 36]++;
        }
        return ans;
    };

    ans += calc();
    reverse(a.begin(), a.end());
    ans += calc();
    cout << ans << '\n';
}
```

>代码没有怎么看懂，我主要是想预处理 $sum[i]$ 数组，然后在两层循环中两层循环所对应的下标不能相同 (即不能和自己拼接)，这样就不用翻转数组再来一次了
>
```cpp 给予实现
void solve() {
    int n;
    ll ans = 0;
    cin >> n;
    vector<ll> a(n);
    for (int i = 0; i < n; ++i) {
        cin >> a[i];
    }

    vector<ll> sum(36, 0);
    for (auto i : a) {
        sum[i % 36]++;
    }
    for (auto i : a) {
        --sum[i % 36];
        for (int j = 0; j < 36; ++j) {
            if ((j * (i < 10LL ? 10LL : 28LL) + i) % 36 == 0) {
                ans += sum[j];
            }
        }
        ++sum[i % 36];
    }

    cout << ans << '\n';
}
```

## 2024 牛客寒假算法基础集训营 3 - G/H 智乃的比较函数 (easy)(normal)
$cmp(x,y)$ : 

-  $x<y,cmp (x, y)=1$ 
- $x\geq y,cmp(x,y)=0$

有 $a_{1},a_{2},a_{3}$ 整型变量，给出 $N$ 组 $cmp(a_{x},a_{y})$ 的值，问是否产生了矛盾。

- `easy`: $1\leq N\leq 2$
- `normal`: $1\leq N\leq 50$

### $\text{easy:}$

```cpp
void solve() {
    int n; cin >> n;
    bool ok = true;
    int xx, yy, zz, x, y, z;
    for (int i = 1;i <= n;i++) {
        cin >> x >> y >> z;
        if (i == 1) {
            xx = x, yy = y, zz = z;
        }
        if (x == y && z) {
            ok = false;
        }
    }
    if (n == 2) {
        if (xx == x && yy == y && zz != z) {
            ok = false;
        }
        if (xx == y && yy == x && zz == z) {
            if (z == 1) {
                ok = false;
            }
        }
    }
    if (ok) {
        cout << "Yes\n";
    } else {
        cout << "No\n";
    }
}
```

### $\text{normal:}$
枚举 $a_{1},a_{2},a_{3}(1,2,3)$ 如果有满足 $z=1\&\&a[x]\geq a[y]\mid\mid z=0\&\&a[x]<a[y]$,则产生了矛盾。

只要找到符合条件的情况，则存在

感觉代码很简单，只是自己没有想到。
```cpp
int i, j, k, n, m, t, a[1005];
vector<tuple<int, int, int> > v;
bool fuck() {
    for (auto [x, y, w] : v) {
        if (w == 1) {
            if (a[x] < a[y])continue;
            else return 0;
        } else {
            if (a[x] >= a[y])continue;
            else return 0;
        }
    }
    return 1;
}
void solve() {
    int n;
    cin >> n;
    while (n--) {
        cin >> i >> j >> k;
        v.push_back({ i,j,k });
    }
    int res = 0;
    for (i = 1;i <= 3;i++)
        for (j = 1;j <= 3;j++)
            for (k = 1;k <= 3;k++) {
                a[1] = i; a[2] = j; a[3] = k;
                int ans = 0;
                res |= fuck();
            }
    if (res)cout << "Yes\n";
    else cout << "No\n";
    v.clear();
}
```

这一场后面其余没有纳入本篇主线的题先不展开，保留到真正补完对应专题时再单独整理。

## 2024 牛客寒假算法基础集训营 5 - G/H sakiko 的排列构造
sakiko 想要构造一个长度为 $n$ 的排列 $p$，使得每一个 $p_i+i (1≤i≤n)(1\leq n\leq 10^6)$ 都是质数。

### Solution
<span style="color:#92d050">网络流/找规律</span>

>发现：如果 $n=4:$ $p:4,3,2,1$,则 $p_{i}+i$ 是 $5,5,5,5$ 每一项都是 $n+1$

对于 $n$ ，若 $\text{isPrime(n+1)}$,则 $p:\{n,n-1,\dots,2,1\}$ $p_{i}+i:\{n+1(n)\}$

若对于 $n$，如果 $\text{isPrime(n+2)}$,则 $p:\{1,n,n-1,\dots,3,2\}$ $p_{i}+i:\{2,n+2(n-1)\}$

>发现：如果 $n=8:$ $11-3=8$ $p:\{2,1,8,7,6,5,4,3\}$ $p_{i}+i=\{3,3,11(6)\}$
>
>如果 $n=7:11-(5-1)=7 \ p:\{1,3,2,7,6,5,4\}$ $p_{i}+i:\{2,5,5,11(4)\}$

对于偶数 $n:$ $(n+m)-(m)=n$ 若能保证 $(n+m)(m)$ 均为质数，则能构造出 $p:\{m-1,m-2,\dots 1,n,n-1,\dots,m\}$ $p_{i}+i:\{m(m-1),(n+m)(n-m+1)\}$

对于奇数 $n:$ $(n+m)-(m-1)=n$ 若能保证 $(n+m)(m)$ 均为质数，则能构造出 $p:\{1,m-2,m-3,\dots,2,n,n-1,\dots n-m+1\}$ $p_{i}+i:\{2,(m)(m-2),(n+m)(n-m+1)\}$

```cpp
void solve() {
    int n;cin >> n;
    auto check = [&](int x) {
        for (int i = 2;i * i <= x;i++)
            if (x % i == 0)
                return 0;
        return 1;
    };
    int a = 1;
    if (n % 2) {
        cout << "1 ";a++;
    }
    for (int i = a;i <= n;i++) {
        if (check(i + a) && check(i + 1 + n)) {
            for (int j = i;j >= a;j--)
                cout << j << " ";
            for (int j = n;j > i;j--)
                cout << j << " ";
            cout << '\n';
            return;
        }
    }
    for (int i = n;i >= 1;i--)cout << i << " \n"[i == 1];
}
```

## 2024 牛客多校 4 - H Yet Another Origami Problem
炸鸡讨厌折纸问题！别人能轻松解决的折纸问题（例如 CF 1966 E 和 HDU 6822），他总是解决不了。不过，今天炸鸡是出题人！轮到他给参赛者出一道非常难的折纸题了！

给定一个长度为 $\textstyle n$ 的数组 $\textstyle a$，你可以执行以下任意次数（可能为零）的操作：

选择一个索引 $\textstyle p$，然后执行以下两种操作之一：

1.  对于所有 $\textstyle i$，如 $\textstyle a_i \leq a_p$，让 $\textstyle a_i \gets a_i + 2(a_p - a_i)$。
2.  对于所有 $\textstyle i$，如 $\textstyle a_i \geq a_p$，让 $\textstyle a_i \gets a_i - 2(a_i - a_p)$。

现在，你想通过这些操作最小化数组的范围。回想一下，数组的范围是数组中最大元素和最小元素之差。

每次两个数的操作本质上两个数之间的差值并不会改变。每次都以第二大的数和最大的数来操作，每次都让最大的数变到前面去，直到最后只剩下两个数为止。这两个数字的差值即为答案。

直接用差分数组所有数的 gcd 即可。

至于证明...

```cpp
#define int long long
void solve() {
    int n;cin >> n;
    vector<int> a(n + 1), suf(n);
    for (int i = 1;i <= n;i++)cin >> a[i];
    sort(a.begin() + 1, a.end());
    if (n <= 2) {
        if (n == 1) {
            cout << "0\n";return;
        } else {
            cout << abs(a[1] - a[0]) << '\n';return;
        }
    }
    for (int i = 1;i < n;i++)suf[i] = a[i + 1] - a[i];
    int g = suf[1];
    for (int i = 2;i < n;i++) {
        g = __gcd(g, suf[i]);
    }
    cout << g << '\n';
}
```

## 2024 牛客多校 4 - C Sort 4
给定一个长度为 $\textstyle n$ 的排列 $\textstyle ^\dagger$。在一次操作中，你可以从排列中选择**不超过 4**个元素，并任意交换它们的位置。按升序排列该排列所需的最少操作次数是多少？

根据题意可以知道：每次在没有还原的对应位置一定有环。

即在这个排列中有若干个环，对于每个环都是相互独立的。

对于这些环，有的可以拼接，有的环较大，需要多次操作且每次需要花费 4 次操作来使得 3 个元素被还原。

```cpp
void solve() {
    int n;cin >> n;
    vector<int> p(n + 1);
    vector<int> a(n + 1);
    for (int i = 1;i <= n;i++) {
        cin >> a[i];p[a[i]] = i;
    }
    vector<int>vis(n + 1), ans;
    int cnt = 0;

    auto dfs = [&](auto self, int x, int y)->void {
        if (vis[x]) {
            return;
        }
        cnt++;vis[x] = 1;
        self(self, y, p[y]);
        };
    for (int i = 1;i <= n;i++)if (p[i] == i)vis[i] = 1;
    for (int i = 1;i <= n;i++) {
        if (!vis[a[i]]) {
            cnt = 0;
            dfs(dfs, a[i], p[a[i]]);
            ans.push_back(cnt);
        }
    }
    int res = 0;
    int c[4] = {};
    for (auto x : ans) {
        res += x / 3;x %= 3;
        c[x]++;
    }
    cout << c[3] + (c[2] + 1) / 2 + res << '\n';
}
```

## 牛客周赛 60 - D 我们 N 个真是太厉害了
这天，$n$ 位小朋友聚在一起吹牛，他们每个人手里都有一定数量的小星星，为了方便统计，我们使用 $a_1,a_2,\dots,a_n$ 来表示。  
小小歪吹牛到，从我们几个人中挑出几个来，手里的小星星数量全部加起来，可以表示出 $n$ 以内的任意一个正整数！  
小小龙认为小歪错了，但是他是小朋友，他不会计算。  

所以小小龙来求助你，他想让你找到最小的整数证明小小歪是错误的。

### Solution

DP 的思想

bitset 优化 01 背包(和之前 swpuOj 里面的散兵几乎一样)

时间复杂度：$O\left( \frac{n^2}{w} \right)\approx1.5e8$ 勉强能过
```cpp
void solve() {
    int n;cin >> n;
    vector<int> a(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i];
    bitset<100010> b;

    b[0] = 1;
    for (int i = 1;i <= n;i++) {
        b |= (b << a[i]);
    }
    for (int i = 1;i <= n;i++) {
        if (!b[i]) {
            cout << i << '\n';return;
        }
    }
    cout << "Cool!\n";
}
```

若已经能组成 $[1,x]$ 中的任何数，则下一个数 $a_{i}$ 需要达到什么要求能使得组成 $[1,x+a_i]$ 的所有数呢？

条件：$a_{i}\leq x+1$ ，当 $a_{i}> x+1$ 时，则 $x+1$ 这个数一定无法组成，否则 $a_{i}$ 一定能和前面的数构成 $[x+1,x+a_{i}]$ 区间的数
```cpp
void solve() {
    int n;cin >> n;
    vector<int> a(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i];
    sort(a.begin() + 1, a.end());
    int x = 0;
    for (int i = 1;i <= n;i++) {
        if (a[i] > x + 1 && x < n) {
            cout << x + 1 << '\n';return;
        }
        x += a[i];
    }
    cout << "Cool!\n";
}
```

## 牛客周赛 60 - E 折返跑

$\,\,\,\,\,\,\,\,\,$ 上体育课了！今天的项目是折返跑，笔直的跑道可以看作是一条数轴。跑道上有 $n$ 个点位，其中，老师在 $1$ 点和 $n$ 点处各放了两根杆子，称为左杆和右杆，作为折返跑的折返点。  
$\,\,\,\,\,\,\,\,\,$老师规定，今天一共需要跑 $m$ 趟。我们认为，从一根杆子开始，跑到另一根杆子结束为一趟，显然，一共需要进行 $m-1$ 次折返。$\sf Zaoly$偶然发现，杆子是可推动的，所以他有了一个大胆的想法——  
$\,\,\,\,\,\,\,\,\,\,\,\,\,\,\bullet\,$每次跑至右杆折返后，都需要把右杆向左推动一段距离（大于 $0$），但仍保证右杆位于整数点，且在左杆的右边（不能与左杆重合）；  
$\,\,\,\,\,\,\,\,\,\,\,\,\,\,\bullet\,$每次跑至左杆折返后，都需要把左杆向右推动一段距离（大于 $0$），但仍保证左杆位于整数点，且在右杆的左边（不能与右杆重合）；  
$\,\,\,\,\,\,\,\,\,$ 现在，给出整数 $n$ 和 $m$ 的值，请问 $\sf Zaoly$ 一共有多少种不同的推杆方法？由于答案可能很大，请将答案对 $(10^9+7)$ 取模后输出。注意，每次折返时都需要推杆，如果某一轮无法推动，则这一轮推杆非法。

### Solution

实际上是要在 $m-1$ 次折返中每次至少推 1，一共不能超过 $n-2$ 即 $\in[m-1,n-2]$。

> 1931(925div3)：组合数学的复习

>相当于一共有 $x(m-1\leq x\leq n-2)$ 个球分别放入 $m-1$ 个盒子中(每个盒子至少有一个球)。即 $C(x-1,m-2)$

即答案是 $\displaystyle C(n-3,m-2)+C(n-2,m-2)+\dots+C(m-2,m-2)=\sum_{i=m-1}^{n-2}C(i-1,m-2)$

时间复杂度是 $O(Tn\log n)$ 的，复杂度过高了。所以需要换一种方式解决。

引入一个 $a_{m}$，代表有多少个"球"没有用上，所以有：

$x_{1}+x_{2}+\dots+x_{m-1}+x_{m}=n-2,x_{i}\geq 1\cap x_{m}\geq 0$

所以：

$(x_{1}-1)+(x_{2}-1)+\dots+(x_{m-1}-1)+x_{m}=n-2,x_{i}\geq 0$

$\implies x_{1}+x_{2}+\dots+x_{m}=n-2-m+1,x_{i}\geq 0$

即有 $n-m-1$ 个球，放入 $m$ 个盒子内(盒子内可以没有球)，有多少种方式？

$\to C(n-2-m-1 +m-1,m-1)=C(n-2,m-1)$

$\implies C(n-2,m-1)$

时间复杂度 $O(T\log n)$

> [!NOTE]- 证明 $\displaystyle \sum_{i=m-1}^{n-2}C(i-1,m-2)=C(n-2,m-1)$ 成立
> 考虑组合数的性质，我们知道：
> 
> $$\binom\{i\}\{j\} = \binom\{i-1\}\{j\} + \binom\{i-1\}\{j-1\}$$
> 
> 利用这个性质，将原等式视为累加，从而它等价于：
> 
> $$\sum_\{i=m-1\}^\{n-2\} \binom\{i-1\}\{m-2\} = \sum_\{i=m-1\}^\{n-2\} \binom\{i-1\}\{i-m+1\}$$
> 
> 从而，这个和可以被重新组合并逐渐结合利用 Pascal’s 恒等式化简到：
> 
> $$\sum_\{i=m-1\}^\{n-2\} \binom\{i-1\}\{m-2\} = \binom\{n-2\}\{m-1\}$$
> 
> 这个是给定组合的性质。从组合意义上来讲，右边的组合数$\binom{n-2}{m-1}$表示从$n-2$个元素选择出$m-1$个的方案数，而等式左边逐渐累加到这个上限，反映了选择某个特定点作为其余选择的开端，通过累积实现满足条件的排列。
> 
> 综上所述，这个等式成立。

```cpp
void solve() {
    int n, m;cin >> n >> m;
    cout << C(n - 2, m - 1) << '\n';
}
```

## 牛客周赛 60 - F 口吃
$\sf Zaoly$要讲一句话，这句话有 $n$ 个字，他要一个字一个字讲出来。奈何 $\sf Zaoly$ 口吃：  
讲到第 $1$ 个字时，下一个要讲的字有 $\frac {a_1} {a_1 + b_1}$ 的概率前进到第 $2$ 个字，有 $\frac {b_1} {a_1 + b_1}$ 的概率仍是第 $1$ 个字。  
讲到第 $i$（$2 \leq i \leq {n - 1}$）个字时，下一个要讲的字有 $\frac {a_i^2} {a_i^2 + 2 a_i \cdot b_i + b_i^2}$ 的概率前进到第 $i + 1$ 个字，有 $\frac {2 a_i \cdot b_i} {a_i^2 + 2 a_i \cdot b_i + b_i^2}$ 的概率仍是第 $i$ 个字，有 $\frac {b_i^2} {a_i^2 + 2 a_i \cdot b_i + b_i^2}$ 的概率倒退到第 $i - 1$ 个字。  

讲到第 $n$ 个字时，讲话完毕，停止讲话。  

直到讲话完毕，$\sf Zaoly$ 总共讲出的字数的期望是多少？

### Solution

设 $e_{u,u+1}$ 代表从 $u\to u+1$ 的期望步数，根据题意有：(将题目的三个概率设为 $p_{1i,2i,3i}$)

$e_{u,u+1}=p_{1u}\times e_{u+1,u+1}+p_{2u}\times e_{u,u+1}+p_{3u}\times e_{u-1,u+1}+1$

有 $e_{u-1,u+1}=e_{u-1,u}+e_{u,u+1}$ 带入得：($e_{u,u}=0$)

$\displaystyle \implies e_{u,u+1}=\frac{1+p_{3u}\times e_{u-1,u}}{p_{1u}}\to\frac{b_{i}^2\times e_{i-1,i}+(a_{i}+b_{i})^2}{a_{i}^2}$

将 $e_{i,i+1}\to e_{i}$ 代表从 $i\to i+1$ 的期望步数。

$e_{0}=1,e_{1}= \frac{a_{1}+b_{1}}{a_{1}}$

$\displaystyle e_{i}=\frac{b_{i}^2\times e_{i-1}+(a_{i}+b_{i})^2}{a_{i}^2}$ 

```cpp
void solve() {
    int n;cin >> n;
    vector<int> p(n), q(n), e(n);
    for (int i = 1;i < n;i++)cin >> p[i];
    for (int i = 1;i < n;i++)cin >> q[i];
    e[0] = 1;e[1] = (p[1] + q[1]) * inv(p[1]) % mod;
    for (int i = 2;i < n;i++) {
        e[i] = (q[i] * q[i] % mod * e[i - 1] % mod + (p[i] + q[i]) * (p[i] + q[i]) % mod) % mod * inv(p[i]) % mod * inv(p[i]) % mod;
    }
    int ans = 0;
    for (int i = 0;i < n;i++) {
        ans += e[i];ans %= mod;
    }
    cout << ans << '\n';
}
```

官方题解：

> [!NOTE]
> 
> 设 $f_{i}$ 代表从第 $i$ 个字开始讲完这句话的期望
> 
> $f_{1}= \frac{a_{1}}{a_{1}+b_{1}}f_{2}+ \frac{b_{1}}{a_{1}+b_{1}}f_{1}+1\to f_{1}=f_{2}+ \frac{a_{1}+b_{1}}{a_{1}}$
> 
> $P=1,Q=\frac{a_{1}+b_{1}}{a_{1}}\to f_{1}=Pf_{2}+Q$
> 
> > $f_{2}=\frac{a^2}{(a+b)^2}f_{3}+\frac{2ab}{(a+b)^2}f_{2}+\frac{b^2}{(a+b)^2}f_{1}+1\to (a+b)^2f_{2}=a^2f_{3}+b^2\left( f_{2}+\frac{a_{1}+b_{1}}{a_{1}} \right)+(a+b)^2$
> > 
> > $f_{2}=f_{3}+\frac{b_{2}^2}{a_{2}^2}\times \frac{a_{1}+b_{1}}{a_{1}}+\frac{(a_{2}+b_{2})^2}{a_{2}^2}$
> 
> $(a_{i}+b_{i})^2f_{i}=a_{i}^2f_{i+1}+b_{i}^2f_{i-1}+(a_{i}+b_{i})^2$，这时的 $f_{i-1}=Pf_{i}+Q$ 已经得到了，所以 $f_{i}$ 的式子是可求的了。
> 
> 所以可以直接推 $f_{i}$ 的通项公式：
> 
> $\displaystyle f_{i}=\frac{a^2f_{i+1}+ Qb^2+(a+b)^2}{a^2+b^2-b^2P}$ $(P,Q)$ 由前一项得到，则这一项的 $P'=\frac{a^2}{a^2+b^2-b^2P},Q'=\frac{Qb^2+(a+b)^2}{a^2+b^2-b^2P}$
> 
> 
> 处理完所有的 $P_{i},Q_{i}$ 后，按照公式 $f_{i-1}=P_{i-1}f_{i}+Q_{i-1}$ 递推

```cpp
#define int long long
constexpr int mod = 1e9 + 7;
void solve() {
    int n;cin >> n;
    vector<int> p(n), q(n);
    for (int i = 1;i < n;i++)cin >> p[i];
    for (int i = 1;i < n;i++)cin >> q[i];
    int P = 1, Q = (p[1] + q[1]) * inv(p[1]) % mod;
    p[1] = P, q[1] = Q;
    for (int i = 2;i < n;i++) {
        int a = p[i], b = q[i];
        int mu = (((a * a % mod + b * b % mod) % mod - b * b % mod * P % mod) + mod) % mod;
        P = a * a % mod * inv(mu) % mod;
        Q = (Q * b % mod * b % mod + (a + b) * (a + b) % mod) % mod * inv(mu) % mod;
        p[i] = P, q[i] = Q;
    }
    vector<int> f(n + 1);
    f[n] = 1;
    for (int i = n - 1;i >= 1;i--) {
        f[i] = p[i] * f[i + 1] % mod + q[i];f[i] %= mod;
    }
    cout << f[1] << '\n';
}
```

## 牛客周赛 51 - D 小红的 gcd
给两个正整数 $a,b$，输出他们的最大公约数 $\gcd(a, b)$。

$1\leq a \leq 10^{10^6}$。  
$1\leq b \leq 10^9$。

### Solution
大数取模

即一个大数和一个 int 数求 gcd

易得：gcd (a, b)=gcd (b, a%b)

**即求** x=a%b，ans=gcd (b, x) $x\in[0,b)$

运用性质：多个因子连续的乘积取模的结果等于每个因子取模后的乘积再取模的结果

即：$(a\times b)\%p=(a\%p\times b\%p)\%p$ 

由此性质，可以将 a 分为若干块，假设每次分割 9 位数字 $\implies a_{0}\times10^9\times a_{1}\times10^{18}\times \dots$ (但是似乎没有必要的...)

>只需要一位一位计算即可。

则 $a\bmod b=\sum a_{i}\bmod b$

```cpp
#define int long long
void solve() {
    string a;int b;cin >> a >> b;
    vector<int> ans;
    for (int i = 0;i < a.size();i += 9) {
        string s = a.substr(i, 9);
        ans.push_back(stoi(s));
    }
    int x = 0;
    for (auto m : ans) {
        x *= qpow(10, to_string(m).size(), b);x += m;x %= b;
    }
    cout << __gcd(x, b) << '\n';
}
```
$\implies$
$ans = (a[0]\times 10^{n-1} \mod b + a[1]\times 10^{n-2} \mod b + ... + a[i]\times 10^{n-i-1} \mod b)$

```cpp
#define int long long
void solve() {
    string a;int b;cin >> a >> b;
    int ans = 0;
    for (auto x : a) {
        ans = (ans * 10 + x - '0') % b;
    }
    cout << __gcd(ans, b) << '\n';
}
```

## 牛客周赛 51 - E 小红走矩阵
给定 $n \times n$ 的矩阵，矩阵中的每个元素都是正整数，小红能当前位于左上角 $(1,1)$，每次可以从 $(x, y)$ 走到 $(x+1, y)$、$(x, y+1)$、$(x-1, y)$、$(x, y-1)$，但不能走出矩阵。小红希望找到一条到右下角 $(n,n)$ 的路径，定义路径权值为路径上经过的每个点的最大值，求所有路径中的最小路径权值。

### Solution
BFS+二分

>做法很多：二分/最短路/并查集，但 DP 不可行。

二分答案想到了应该就不难了！时间复杂度 $O(n^2\log n)$；如果继续扩展，这题还可以往并查集或最短路的角度去理解。
```cpp
constexpr int dx[] = {1, -1, 0, 0};
constexpr int dy[] = {0, 0, 1, -1};
int n,g[505][505];
bool check(int mid) {
    if (g[0][0] > mid) return false;

    vector<vector<bool>>  vis(n, vector<bool>(n, false));
    queue<pair<int, int>> q;
    q.push({0, 0}); vis[0][0] = true;

    while (!q.empty()) {
        auto [x, y] = q.front();q.pop();
        if (x == n - 1 && y == n - 1) return true;
        for (int i = 0; i < 4; ++i) {
            int nx = x + dx[i], ny = y + dy[i];
            if (nx >= 0 && nx < n && ny >= 0 && ny < n && ! vis[nx][ny] && g[nx][ny] <= mid) {
                q.push({nx, ny});
                vis[nx][ny] = true;
            }
        }
    }
    return false;
}
int main() {
    cin >> n;
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < n; ++j) {
            cin >> g[i][j];
        }
    }

    int l = INT_MAX, r = INT_MIN;
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < n; ++j) {
            l = min(l, g[i][j]);
            r = max(r, g[i][j]);
        }
    }
    
    while (l < r) {
        int mid = l + r >> 1;
        if (check(mid)) r = mid;
        else l = mid + 1;
    }
    cout << l << '\n';
}
```

并查集的思路:即按权值从小到大合并，直至 (0,0)和 (n-1, m-1)连通.

## 牛客周赛 51 - F 小红的数组
小红有一个数组，这个数组中有 $n$ 个数 $a_i$。  
小红有 $q$ 次询问，每次询问给定一个区间 $[l,r]$，询问区间连续子段和的绝对值最大是多少，即区间存在 $x,y$ 使得 $l \leq x \leq y \leq r$，求最大的 $\mathrm{abs}(a[x]+a[x+1]+.....+a[y])$ 是多少。

### Solution
线段树/莫队/ ST表

线段树需要维护的信息：
1. 区间和 (sum)，包含左端点开始的最大字段和 (lmax)，右端点的 (rmax)，区间最大字段和 (mmax)
2. 最大值和最小值

题目其实有提示：$\mathrm{abs}(a[x]+a[x+1]+.....+a[y])$ 是连续的一段区间，即 $pre[y]-pre[x-1]$ 在 $[l,r]$ 区间内前缀和的最大值减去最小值即是答案，所以需要维护区间最大值和最小值即可。

>将 i=1 改为 i=0 后就过了？不懂
```cpp
#define int long long
int f1[500010][30], f2[500010][30];
void solve() {
    int n;cin >> n;
    vector<int> a(n + 1), pre(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i];
    for (int i = 1;i <= n;i++)pre[i] = pre[i - 1] + a[i];

    for (int i = 1;i <= n;i++)f1[i][0] = pre[i], f2[i][0] = f1[i][0];

    for (int j = 1;j <= 30;j++) {
        for (int i = 0;i + (1 << j) - 1 <= n;i++) {//将i=1改为i=0后就过了？
            f1[i][j] = max(f1[i][j - 1], f1[i + (1 << (j - 1))][j - 1]);
            f2[i][j] = min(f2[i][j - 1], f2[i + (1 << (j - 1))][j - 1]);
        }
    }
    int q;cin >> q;
    while (q--) {
        int l, r;cin >> l >> r;l--;
        int k = __lg(r - l + 1);
        cout << max(f1[l][k], f1[r - (1 << k) + 1][k]) - min(f2[l][k], f2[r - (1 << k) + 1][k]) << '\n';
    }
}
```

若这个题目改动一下：将绝对值去掉，则题目变为[245. 你能回答这些问题吗 - AcWing题库](https://www.acwing.com/problem/content/246/)

## 牛客周赛 31 - E 小红的子集取反
小红拿到了一个数组，她准备选择若干元素乘以 -1，使得最终所有元素的和为 0。小红想知道最少需要选择多少个元素？

### Solution.
<span style="color:#92d050">DP</span>

```cpp bitset
#define N 40000
int i, j, k, n, m, t, res = -1;
bitset<80005> f[205];

int main() {
    ios::sync_with_stdio(0);
    f[0][N] = 1;
    cin >> n;
    for (i = 1;i <= n;i++) {
        cin >> k;
        for (j = n;j >= 0;j--) {
            if (k >= 0) {
                f[j] >>= k;
                if (j) f[j] |= (f[j - 1] << k);
            } else {
                f[j] <<= -k;
                if (j) f[j] |= (f[j - 1] >> -k);
            }
        }
    }
    for (i = 0;i <= n;i++)
	    if (f[i][N]) {
        res = i; break;
    }
    cout << res;
}
```

如果 ndp 中没有存储 $c + x$ 的值，则将其设置为 `y`；如果已经存在，则将其更新为 `min (ndp[c + x], y)`。

同样的方法用于 $c - x$，将其设置为 `y + 1` 或者更新为 `min (ndp[c - x], y + 1)`。

对于每一个读入的数据，都要与数组中的数相加或相减

`dp[i][j] = min (dp[i - 1][j + arr[i]], dp[i - 1][j - arr[j]] + 1)`

```cpp
int main() {
    map<int, int> dp;
    int n;
    cin >> n;
    dp[0] = 0;
    for (int i = 1; i <= n; i++) {
        int x;
        cin >> x;
        map<int, int> ndp;
        for (auto [c, y] : dp) {
            if (!ndp.count(c + x)) ndp[c + x] = y;
            else ndp[c + x] = min(ndp[c + x], y);
            if (!ndp.count(c - x)) ndp[c - x] = y + 1;
            else ndp[c - x] = min(ndp[c - x], y + 1);
        }
        dp = ndp;
    }
    if (!dp.count(0)) cout << -1;
    else cout << dp[0];
}
```

`x + y = s`
`x - y = 0` $\to y=\frac{s}{2}$
从集合中挑选最少的元素，使得恰好为 $S/2$ 即可。落地时就是一个“最少选多少个数凑出指定和”的 0/1 背包：状态记到达某个和时的最少选取次数，最后看能否转移到 $S/2$。

## 牛客周赛 52 - C 小红的数字对对碰
红有一个长度为 $n$ 的数组 $a$ ，第 $i$ 位的值为 $a_i$ 。她想通过以下方式，尽可能地减少数组长度。  

- 当 $len(a)>1$ 且存在二元组 $(i,j)$ ，满足 $i<j$ 且 $a_i + a_j \leq 0$ ，则可消去 $a_i$ 和 $a_j$ 。  
- 当 $len(a)>1$ 且存在二元组 $(i,j)$ ，满足 $i<j$ 且 $a_i \oplus a_j \leq 0$ ，则可消去 $a_i$ 和 $a_j$ 。  

请你输出最小化后的数组的长度。

按照 $a_{i}$ 的+/-/0来分类。

由给出的条件：

$a_{i}+a_{j}\leq 0$：
$\implies$

- $(\leq0,\leq0)$
- $(>0,<0)$

$a_{i}\oplus a_{j}\leq 0$：
$\implies$

- $a_i=a_{j}$
- $(\geq0,<0)$

综上：只有 $a_{i}\geq 0\cap a_{j}\geq 0\cap a_{i}\neq a_{j}$ 才不满足消去的条件。

有贪心的思想：正数是不利于答案的计算的，所以尽量先将正数去掉，即先将 $a_{i}=a_{j}>0$ 的消去。
```cpp
#define int long long
void solve() {
    int n;cin >> n;
    int pos = 0, neg = 0, z = 0;
    map<int, int>mp;
    for (int i = 1;i <= n;i++) {
        int x;cin >> x;
        if (x == 0) {
	        z++;
        } else if (x > 0) {
            pos++;mp[x]++;
            if (mp[x] == 2) {
	            pos -= 2, mp[x] = 0;
            } 
        } else {
            neg++;
        }
    }
    if (pos <= neg) {
        cout << (neg - pos + z) % 2 << '\n';
    } else {
        cout << pos - neg + z << '\n';
    }
}
```

## 牛客周赛 52 - E 小红的图上加边
小红有一张 $n$ 个点 $m$ 条边的无向图，每个节点的权值是 $a_i$。  
现在小红希望加边把这个图连成连通图，每次连接的代价是新形成的联通块的最大元素值，小红想知道最小需要消耗多少代价可以把这个图连成连通的。

这个题目居然是最简单的...

按照缩点的思想，每个块的权值是 $w_{j}=\max(a_{i}),a_{i}\in Block$

则易得答案就是 $\sum w_{i}-\min(w_{i})$

```cpp
#define int long long
void solve() {
    int n, m;cin >> n >> m;
    vector<int> a(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i];
    vector<vector<int>> g(n + 1);
    for (int i = 1;i <= m;i++) {
        int u, v;cin >> u >> v;
        g[u].push_back(v);
        g[v].push_back(u);
    }
    vector<int> vis(n + 1);
    int sum = 0, mi = 1e18;

    for (int i = 1;i <= n;i++) {
        if (!vis[i]) {
            int mx = a[i];
            queue<int>q;vis[i] = 1;q.push(i);
            while (q.size()) {
                int u = q.front();q.pop();
                for (auto v : g[u]) {
                    if (vis[v])continue;
                    vis[v] = 1;
                    mx = max(mx, a[v]);
                    q.push(v);
                }
            }
            mi = min(mi, mx);
            sum += mx;
        }
    }
    cout << sum - mi << '\n';
}
```

## 牛客周赛 52 - F 小红的括号串
小红有一个只包含 '(' 、')' 和 '?' 的字符串，小红想知道有多少种将 '?' 替换成 '(' 或 ')' 的方式使得存在一种循环移位、让该字符串为合法的括号串。  

假设一个长度为 $n$ 的字符串 $s[k:n] + s[1:k)$ 是字符串 $s$ 的循环移位，那么，若字符串 $s$ 是合法的括号串，$s[k:n] + s[1:k)$ 也是合法的括号串。

### Solution

可以参考小学哥的题解：[题解 | 小红的括号串\_牛客博客](https://blog.nowcoder.net/n/1d8f5a27daee4b8f9eaee4999e339bfe)  ->具体数学 P301

新知识：Raney 引理：若 $\displaystyle \sum\limits_{i=1}^mx_{i}=1$ ，则其所有循环位移中恰好有一个满足所有的前缀和都是正数。

意在告诉我们只要满足序列和为 0 的均合法。

```cpp
constexpr int mod = 1e9 + 7;
void solve() {
    int n;cin >> n;
    string s;cin >> s;
    if (n & 1) {
        cout << "0\n";return;
    }
    int x = 0, y = 0;
    for (auto c : s) {
        if (c == '(') x++;
        else if (c == ')') y++;
    }
    cout << C(n - x - y, n / 2 - x) << '\n';
}
```

## 牛客周赛 47 - D 萌萌的好数
萌萌喜欢“好数”，这种“好数“需要满足以下两个条件：  
1. 该数对 $3$ 取模不为 $0$  
2. 该数的最后一位数字不为 $3$  
请你告诉他第 $n$ 个好数是什么。

如果知道一个值 $x$，则可以计算 $x$ 前面有多少个数被叉掉了。

被叉掉的个数：$\lfloor{\frac{x}{3}}\rfloor+\lfloor{\frac{x-3}{10}}\rfloor-\lfloor{\frac{x-3}{30}}\rfloor$

则满足：$n+\lfloor{\frac{x}{3}}\rfloor+\lfloor{\frac{x-3}{10}}\rfloor-\lfloor{\frac{x-3}{30}}\rfloor=x$

直接枚举答案一定会超时，但由于**答案具有单调性**(即数字越大，答案越大)，所以可以二分。

```cpp
#define int long long
void solve() {
    int n;cin >> n;
    int l = 1, r = 1e14;
    while (l < r) {
        int mid = l + r >> 1;
        int x = mid - mid / 3 - (mid - 3) / 10 + (mid - 3) / 30;
        if (x >= n) {
            r = mid;
        } else {
            l = mid + 1;
        }
    }
    cout << l << "\n";
}
```

## 牛客周赛 47 - E 茜茜的计算器
茜茜有一个计算器，这个计算器在显示数字的时候会把所有的前导 0 都显示出来。  
在这个计算器上，0-9 分别被显示为：  
![](https://uploadfiles.nowcoder.com/images/20240612/0_1718201015082/3B10E49DCF39E70AEEE9ED31FF6EA778)  
即，当这个计算器显示屏有 10 位时，让它显示数字 123456 则会显示为“0000123456”。  
茜茜发现，这个计算器有时候显示的数字是一个轴对称图形，如“80808”  
![](https://uploadfiles.nowcoder.com/images/20240612/0_1718201028497/F051744115F6A43C1EDBDECBCE97C866)  
（“80808”的对称轴可以为横轴，也可以为纵轴。而有一些数字可能只以横轴或纵轴中的一个为对称轴，但这样的仍然是轴对称图形。）  

请问，如果这个计算器显示的数有 $n(1\leq n\leq 10^9)$ 位时它能显示的数字中有多少种不同的轴对称图形。

### Solution

由于 $n\leq 10^9$，所以一般都是 $O(logn)/O(1)$ 求解。

容斥：**横对称+纵对称−(横/纵对称)**

横对称：$0,1,3,8$ 可以任意组成(横着一定是对称的)，即为 $4^n$.
竖对称：有 $(2,5),(0,0),(8,8),(5,2)$ 四种可能，只能按照中心对称放置

>注：$(1,1)$ 并不能放进去，在计算器显示中是靠右边的并不对称

若 $n$ 为奇数，中间位置只能放 $0,8$ 两种，则答案就是 $4^{n/2}\times2$，偶数则为 $4^{n/2}$，化简后奇偶可以合并为 $2^n$
																			
需要减去重复计算了关于横纵都对称的部分，即只有 $(0,0),(8,8)$ 任意放置的时候会重复计算，这部分为 $2^{\lceil{n/2}\rceil}$

答案即为 $\displaystyle 4^n+2^n-2^{\lceil{\frac{n}{2}}\rceil}$，$O(1)$ 求出。

```cpp
void solve() {
    int n;cin >> n;
    cout << (qpow(4, n) + qpow(2, n) + mod - qpow(2, (n + 1) / 2)) % mod;
}
```

## 牛客周赛 47 - F 花花的地图
A 市地图是一个 $n \times m$ 的网格图，字符'#'表示障碍，'.' 表示空地。花花住在左上角 $(1,1)$，花花的朋友萌萌住在右下角 $(n,m)$。花花要去萌萌家玩。  
花花如果走到空地则不需要任何代价，但是如果要走到障碍点则他需要先摧毁该障碍。每次可以走到相邻的四个方向之一，即从 $(x,y)$ 可以走到 $(x+1,y)$，$(x-1,y)$，$(x,y+1)$，$(x,y-1)$。  
花花可以花费 $C_i$ 的代价将第 $i$ 列的所有障碍都消灭。  
请帮花花计算她去萌萌家最少需要多少代价。

数据范围: $1\leq n,m\leq 100,1\leq c_{i}\leq 10^5$

### Solution
数位DP / 最短路 dijkstra

最短路思路：每次需要走到含有 `#` 的地方时，则那一列的代价都是相等的，将这一列的点及其代价全部加入进去。

#### 法一 ：

`{c++}dp[i][j]` 为到达 $(i+1,j+1)$ 点最少需要花费的代价，则答案为 `{c++}dp[n - 1][m - 1]`

时间复杂度：$O(n^3+n^2\log n^2)$ 若 $n,m\leq 1000$ 时会超时

>堆也可以开大根堆，加入时添加一个符号即可。
```cpp
void solve() {
    int n, m; cin >> n >> m;

    vector<string> g(n);
    for (int i = 0; i < n; i++) cin >> g[i];

    vector<int> cost(m);
    for (int i = 0; i < m; i++) cin >> cost[i];

    vector<vector<int>> dp(n, vector<int>(m, INT_MAX));
    priority_queue<tuple<int, int, int>, vector<tuple<int, int, int>>, greater<tuple<int, int, int>>> pq;

    if (g[0][0] == '.') {
        pq.push({0,0,0});
        dp[0][0] = 0;
    } else {
        for (int i = 0; i < n; i++) {
            pq.push({cost[0], i,0});
            dp[i][0] = cost[0];
        }
    }

    while (!pq.empty()) {
        auto [c, x, y] = pq.top();pq.pop();
        if (c > dp[x][y]) continue;

        const int dx[] = {0, 0, 1, -1}, dy[] = {1, -1, 0, 0};
        for (int i = 0;i < 4;i++) {
            int cx = x + dx[i], cy = y + dy[i];
            if (cx < 0 || cx >= n || cy < 0 || cy >= m) continue;
            if (g[cx][cy] == '.') {
                if (dp[cx][cy] > c) {
                    dp[cx][cy] = c;
                    pq.push({dp[cx][cy], cx, cy});
                }
            } else {
                for (int j = 0; j < n; j++) {
                    if (dp[j][cy] > c + cost[cy]) {
                        dp[j][cy] = c + cost[cy];
                        pq.push({dp[j][cy], j, cy});
                    }
                }
            }

        }
    }
    cout << dp[n - 1][m - 1] << '\n';
}
```

#### 法二 ：

参见：[牛客周赛 Round 47 解题报告 | 珂学家 \_牛客博客](https://blog.nowcoder.net/n/ad8632f0439546e6a3771ff324a7509c)

时间复杂度为 $O(n^2\log n^2)$,当 $n,m\leq 1000$ 时也能通过，

```cpp 
void solve() {
    int n, m;
    cin >> n >> m;
    vector<string> g(n);
    for (auto& s : g) cin >> s;

    vector<int> cost(m);
    for (auto& x : cost) cin >> x;

    vector<vector<int>> dp(n + 1, vector<int>(m, INT_MAX));
    priority_queue<tuple<int, int, int>, vector<tuple<int, int, int>>, greater<tuple<int, int, int>>> pq;

    if (g[0][0] == '.') {
        pq.emplace(0, 0, 0);
        dp[0][0] = 0;
    } else {
        pq.emplace(cost[0], n, 0);
        dp[n][0] = cost[0];
    }

    while (!pq.empty()) {
        auto [c, y, x] = pq.top();
        pq.pop();
        if (c > dp[y][x]) {
            continue;
        }

        if (y == n) {
            for (int i = 0; i < n; i++) {
                if (dp[i][x] > c) {
                    dp[i][x] = c;
                    pq.emplace(dp[i][x], i, x);
                }
            }
        } else {
            vector<pair<int, int>> dir = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
            for (auto& [dy, dx] : dir) {
                int ty = y + dy, tx = x + dx;
                if (0 <= ty && ty < n && 0 <= tx && tx < m) {
                    if (g[ty][tx] == '.' && dp[ty][tx] > c) {
                        dp[ty][tx] = c;
                        pq.emplace(dp[ty][tx], ty, tx);
                    }
                }
            }
            for (int dx = -1; dx <= 1; dx++) {
                int tx = x + dx;
                if (0 <= tx && tx < m) {
                    if (dp[n][tx] > c + cost[tx]) {
                        dp[n][tx] = c + cost[tx];
                        pq.emplace(dp[n][tx], n, tx);
                    }
                }
            }
        }
    }
    cout << dp[n - 1][m - 1] << endl;
}
```

## 牛客周赛 35 - F/G 小红的子序列权值和
>小红定义一个数组的权值为：数组所有元素乘积的因子数量。例如，$[1,2,3]$ 的权值为 4。

现在小红拿到了一个数组，她想求出数组中所有非空子序列的权值之和。你能帮帮她吗？由于答案过大，请对 $10^9+7$ 取模。

>定义数组的子序列为：从左到右选择若干个元素（可以不连续）组成的数组，例如 $[1,2,3,2]$ 的子序列有 $[2,2]$ 等。因此，一个大小为 $n$ 的数组有恰好 $2^ n -1$ 个子序列。

$1\leq a_{i}\leq 3$

- $(1\leq n\leq 1000)$
- $(1\leq n\leq 10^5)$

### Solution
<span style="color:#92d050">杨辉三角求组合数/逆元/数论</span>

$C(n,m)=\frac{n!}{(n-m)!\times m!}$

设 $n_{1},n_{2},n_{3}$ 分别为 $1,2,3$ 的个数，则：

- $n_{1}=2^{n_{1}}$
- $n_{2}=\sum\limits_{i=0}^{n_{2}}(i+1)\times C(n_{2},i)$
- $n_{3}=\sum\limits_{i=0}^{n_{3}}(i+1)\times C(n_{3},i)$

$\text{ans=}n_{1}\times n_{2}\times n_{3}-1$

```cpp F
void solve() {
    int n;cin >> n;
    vector<vector<ll>> c(n + 1, vector<ll>(n + 1));
    for (int i = 0;i <= n;i++) {
        for (int j = 0;j <= i;j++) {
            if (j == 0 || j == i)c[i][j] = 1;
            else c[i][j] = (c[i - 1][j] + c[i - 1][j - 1]) % mod;
        }
    }
    array<int, 4> num = {};
    ll t = 1;
    for (int i = 1;i <= n;i++) {
        int x;cin >> x;
        num[x]++;
    }
    ll ans = 0;
    for (int i = 1;i <= num[1];i++) {
        t = (2 * t) % mod;
    }
    for (int i = 0;i <= num[2];i++) {
        for (int j = 0;j <= num[3];j++) {
            ans += c[num[2]][i] * c[num[3]][j] % mod * (i + 1) % mod * (j + 1) % mod * t % mod;
            ans %= mod;
        }
    }
    cout << (ans + mod - 1) % mod << '\n';
}
```

```cpp G
const int mod = 1e9 + 7;
vector<ll> fact(1e5 + 1);
ll c(int n, int m) {
    return fact[n] * (qpow(fact[n - m], mod - 2)) % mod * (qpow(fact[m], mod - 2)) % mod;
}
void solve() {
    int n;cin >> n;
    fact[0] = 1;
    for (int i = 1;i <= n;i++)fact[i] = fact[i - 1] * i % mod;
    
    array<int, 4> num = {};
    for (int i = 0;i < n;i++) {
        int x;cin >> x;num[x]++;
    }
    ll t = qpow(2, num[1]);
    ll ans = 0, c2 = 0, c3 = 0;
    for (int i = 0;i <= num[2];i++) {
        c2 += c(num[2], i) * (i + 1) % mod;
        c2 %= mod;
    }
    for (int i = 0;i <= num[3];i++) {
        c3 += c(num[3], i) * (i + 1) % mod;
        c3 %= mod;
    }
    cout << (c2 % mod * c3 % mod * t % mod - 1 + mod) % mod << '\n';
}
```

## 牛客周赛 55 - E 小红的序列乘积 2.0
对于一个长度为 $m$ 的整数序列 $\{b_1,b_2,\dots,b_m\}$，定义 $f_i = b_1 \times b_2 \times \cdots \times b_i$ ，即前 $i$ 项的乘积。这个序列的权值即为 $f_1, f_2, \dots, f_m$ 中个位数是 $6$ 的数字个数。

小红有一个长度为 $n$ 的整数序列 $\{a_1,a_2,\dots,a_n\}$，她想知道这个序列全部 $2^n-1$ 个非空子序列的权值和是多少。

### Solution
DP

$f_{i,j}$ 代表前 $i$ 个数字有多少种以 $j$ 结尾的方案数。

设 $f_{i,j}$ 为当前状态，$f_{i-1,j}$ 为之前的状态，则：

当前状态一定是包含了之前的状态的，即 $f_{i,j}=f_{i-1,j}+\dots$

当前数字为 $a_{i}$，则 $f_{i,j\times a_{i}\%10}$ 即加入当前数字之后，以 $j\times a_{i}\%10$ 结尾。则：

$f_{i,j\times a_{i}\%10}=f_{i-1,j}+\dots$

当加入当前数字后，以 6 结尾了，满足要求，设该子序列为 $\{1,\dots,i\}$，则下标更大的序列都可以包含这个子序列，有 $n-i$ 个，每个序列都可以选/不选，则有 $2^{n-i}$ 种方式
```cpp
#define int long long
constexpr int mod = 1e9 + 7;
void solve() {
    int n;cin >> n;
    vector<int> a(n + 1);
    for (int i = 1;i <= n;i++) {
        cin >> a[i];a[i] %= 10;
    }
    vector<array<int, 10>> f(n + 1);//代表前i个数字有多少种以j结尾的方案数
    f[0][1] = 1;
    int ans = 0;
    for (int i = 1;i <= n;i++) {
        for (int j = 0;j < 10;j++) {
            if (j * a[i] % 10 == 6) {
                ans += f[i - 1][j] * qpow(2, n - i) % mod;ans %= mod;
            }
            f[i][j] += f[i - 1][j];f[i][j] %= mod;
            f[i][j * a[i] % 10] += f[i - 1][j];f[i][j * a[i] % 10] %= mod;
        }
    }
    cout << ans << '\n';
}
```

>F 的计算几何暗示我该学习计算几何了!
