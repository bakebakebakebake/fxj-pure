---
title: Codeforces 题解整理 1：构造、位运算与贪心
description: 2024.1~7 以原题解记录为主，收录构造、位运算与贪心向的 Codeforces 题目。
publishDate: 2026-03-06
tags:
  - 算法竞赛
  - 题解整理
  - Codeforces
  - 构造
  - 位运算
  - 贪心
language: 中文
heroImageSrc: ../../pic/pawel-czerwinski-mv3APn9e7SU-unsplash.jpg
heroImageColor: " #0077b3 "
---

> [!note] 说明
> 这篇改成直接保留原来的 Codeforces 题解内容：单题就保留单题原稿，比赛笔记只抽出你书签里点名要留的那些题。

## 收录范围

- `B. Binary Colouring`
- `B. Collatz Conjecture`
- `C. Manhattan Permutations`
- `D. GCD-sequence`
- `CF 1985 Div.4 F`
- `CF 1985 Div.4 G`
- `CF 1985 Div.4 H`
- `CF 1995 Div.2 B1`
- `CF 1995 Div.2 B2`
- `CF 1995 Div.2 C`
- `CF 1988 Div.2 C`
- `CF 1988 Div.2 D`
- `CF 1918 Div.2 C`
- `CF 1946 Div.2 B`
- `CF 1946 Div.2 C`
- `CF 1946 Div.2 D`

## B. Binary Colouring

给你一个正整数 $x$ 。请找出下列条件成立的任意整数数组 $a_0, a_1, \ldots, a_{n-1}$ ：

- $1 \le n \le 32$ ,
- $a_i$ 是 $1$ ， $0$ 或 $-1$ 
- $x = \displaystyle{\sum_{i=0}^{n - 1}{a_i \cdot 2^i}}$ ,
- 不存在同时满足 $a_{i} \neq 0$ 和 $a_{i + 1} \neq 0$ 的索引 $0 \le i \le n - 2$ 。

可以证明，在问题的限制条件下，总是存在一个有效的数组。

#### Solution
位运算

本题的难点主要是注意到一个变形：

$$
a^i+a^{i+1}=a^{i+2}-a^{i}
$$

若某位数的第 $i$ 位满足：$(a_{i},a_{i+1})=(1,1)$，则不满足要求，需要变为 $(a_{i},a_{i+1},a_{i+2})=(-1,0,1)$

```cpp
void solve() {
    int x;cin >> x;
    vector<int> ans;
    for (int i = 0;i <= __lg(x);i++) {
        if (((x >> i) & 1) && ((x >> (i + 1)) & 1)) {
            ans.push_back(-1);
            x += (1 << (i + 1));
        } else {
            ans.push_back((x >> i) & 1);
        }
    }
    cout << ans.size() << '\n';
    for (auto x : ans)cout << x << " ";cout << '\n';
}
```

## B. Collatz Conjecture

有一个变量和一个常数。下面的操作进行 $k$ 次：

- 将 $x$ 增加 $1$ ，然后
- 当数字 $x$ 能被 $y$ 整除时，再除以 $y$ 。

请注意，这两个操作都是在一次操作中依次进行的。

例如，如果数字 $x = 16$ 、 $y = 3$ 和 $k = 2$ ，那么经过一次运算后， $x$ 就变成了 $17$ ，而经过另一次运算后， $x$ 就变成了 $2$ ，因为加一后， $x = 18$ 就能被 $3$ 整除两次。

鉴于初始值为 $x$ 、 $y$ 和 $k$ ，马克西姆想知道 $x$ 的最终值是多少。

>做时没有思路

若 $x<y$ ：则后面一定是 $x+1,x+2,\dots,y-1,(1,2,\dots,y-1)$ 呈现周期性。

若 $x\geq y$ ：尽量将 $x$ 降到小于 $y$

```cpp
void solve() {
    int x, y, k;cin >> x >> y >> k;
    while (x >= y && k > 0) {
        int t = min(k, y - x % y);
        k -= t;
        x += t;
        while (x % y == 0)x /= y;
    }
    if (x < y) {
        x = (x - 1 + k) % (y - 1) + 1;
    }
    cout << x << '\n';
}
```

## C. Manhattan Permutations

曼哈顿排列的值是 $\sum\limits_{i=1}^n\left|{p_{i}-i}\right|$, $p$ 是排列。

给定曼哈顿排列值，要求构造出这个排列。

#### Solution

>每次都能想到正确思路，但是就是写不出来，总感觉差点什么...

构造

首先讨论不可能的情况：

- 显然 $k$ 是奇数不可能
- $k$ 太大超过这个排列最大能到的数据也不可能

最大的数据是：$1,2,3\dots,n$ 和 $n,n-1,\dots1$ 这个两个排列的差的情况。

即 $\displaystyle \sum\limits_{i=1}^n\left|{n-2\times i+1}\right|=\sum\limits_{i=1}^{\lfloor{\frac{n+1}{2}}\rfloor}(n-2\times i+1)+\sum\limits_{i=\lfloor{\frac{n+1}{2}}\rfloor+1}^n(2\times i-n-1)$

拆开化简后最大值即为 $$2\times\lfloor\{\frac\{n+1\}\{2\}\}\rfloor(n-\lfloor\{\frac\{n+1\}\{2\}\}\rfloor)$$
再讨论符合条件的情况如何构造：

当 $1$ 和 $n$ 交换时，可以构造 $2(n-1)$ 的值，$2$ 和 $n-1$ 交换可以构造 $2(n-3)$ 这样的值，...，一共可以构造：

$\displaystyle \sum\limits_{i=1}^n 2(n+1-2\times i)=\text{MAX}$ 的值。所以这个情况是一定能够构造出所有可能的。

若 $k<2(n-1)$ 时：$1$ 就不和 $n$ 交换，和 $n-1,n-2\dots$ 其中一个交换，
能构造的值 $v=2(n-3)-4k(k=0,1,2\dots)\cap v\geq 0$

若 $k\geq 2(n-1)$ 时：$1$ 和 $n$ 交换，进行下一轮，能构造的值为 $2(n-1)$。

后面的同理，容易知道能够构造所有合理值。

> [!example]
> 
> 例如：
> $n=5,k=6$，若 1 和 5 交换可以构造 $2(n-1)=8>6$，所以 1 和 $n-1=4$ 交换 $(1,4)-(4,1)$ 得到 6.
> 
> $n=5,k=10$，若 1 和 5 交换可以构造 $2(n-1)=8<10$，所以 1 和 5 需要交换，剩下 2。
> 下一轮若 2 和 4 交换可以构造 $2(n-3)=4>2$，所以不交换，选择之前的值 $n-2,n-3\dots$，可以知道 2 和 3 交换后恰好构造出 2，得到 2。

```cpp
#define int long long
void solve() {
    int n, k;cin >> n >> k;
    int m = (n + 1) / 2;
    int p = 2 * m * (n - m);
    if (k & 1 || k > p) {
        cout << "NO\n";return;
    }
    cout << "YES\n";
    vector<int> a(n + 1);
    for (int i = 1;i <= n;i++)a[i] = i;
    k /= 2;
    for (int i = 1;k > 0;i++) {
        if (k < n - 2 * i + 1) {
            swap(a[i], a[i + k]);k = 0;
        } else {
            swap(a[i], a[n - i + 1]);
            k -= n - 2 * i + 1;
        }
    }
    for (int i = 1;i <= n;i++)cout << a[i] << " \n"[i == n];
}
```

## D. GCD-sequence

给定大小为 $n$ 的数组 $a$

对于 $b$ 数组： $b_i = GCD(a_i, a_{i + 1})$ ， $1 \le i \le n - 1$ 。

确定是否有可能从数组 $a$ 中删除正好一个数，从而使序列 $b$ 不递减（即 $b_i \le b_{i+1}$ 始终为真）。

> [!example]
> 例如，假设 Khristina 有一个数组 $a$ = [ $20, 6, 12, 3, 48, 36$ ]。如果她从中取出 $a_4 = 3$ 并计算 $b$ 的 GCD 序列，她会得到：
> 
> - $b_1 = GCD(20, 6) = 2$
> - $b_2 = GCD(6, 12) = 6$
> - $b_3 = GCD(12, 48) = 12$
> - $b_4 = GCD(48, 36) = 12$
> 
> 得到的 GCD 序列 $b$ = \[ $2,6,12,12$ \]是非递减的，因为 $b_1 \le b_2 \le b_3 \le b_4$ .
> 

>无想法 

主要思路：

若本来就已经不递减了，这时只需要删除最后一个元素即可保证还是满足的，所以一定是满足条件的

若本来不满足，则一定至少有一个位置满足 $g_{i-1}>g_{i}$ ，依次判断在原数组基础上删除 $i-1,i,i+1$ 之一是否满足满足条件，只要有满足条件的就可以。

```cpp
void solve() {
    int n;cin >> n;
    vector<int> a(n), g(n - 1);
    for (int i = 0;i < n;i++)cin >> a[i];
    for (int i = 0;i < n - 1;i++)g[i] = __gcd(a[i], a[i + 1]);
    if (is_sorted(g.begin(), g.end())) {
        cout << "YES\n";return;
    }
    int idx = -1;
    for (int i = 1;i < n - 1;i++) {
        if (g[i - 1] > g[i]) {
            idx = i;
        }
    }
    vector<int> a1(a), a2(a), a3(a);
    a1.erase(a1.begin() + idx - 1);
    a2.erase(a2.begin() + idx);
    a3.erase(a3.begin() + idx + 1);

    vector<int> g1(n - 2), g2(n - 2), g3(n - 2);
    for (int i = 0;i < n - 2;i++) {
        g1[i] = __gcd(a1[i], a1[i + 1]);
        g2[i] = __gcd(a2[i], a2[i + 1]);
        g3[i] = __gcd(a3[i], a3[i + 1]);
    }

    int ok = 0;
    ok += is_sorted(g1.begin(), g1.end());
    ok += is_sorted(g2.begin(), g2.end());
    ok += is_sorted(g3.begin(), g3.end());
    if (ok) {
        cout << "YES\n";
    } else {
        cout << "NO\n";
    }
}
```

## CF 1985 Div.4 F - Final Boss
您正在面对您最喜欢的视频游戏中的最终 Boss。敌人的生命值为 $h$ 。你的角色有 $n$ 次攻击。 $i$ 的攻击会对敌人造成 $a_i$ 的伤害，但冷却时间为 $c_i$ 回合，也就是说，如果你当前的回合是 $x$ ，那么下一次使用该攻击的时间是 $x + c_i$ 回合。每个回合，你都可以使用当前未冷却的所有攻击，**一次**。如果所有攻击都处于冷却状态，则该回合你什么也不做，跳到下一回合。

最初，所有攻击都不在冷却时间内。要花多少回合才能打败老板？

显然有技能就放就是最优的，直接二分答案计算最小的回合即可(本题 $h\leq 2\times 19^5$，所以可以直接模拟，若 $h\leq 10^9$ 则一定需要二分答案了)

时间复杂度 $n\log n$

>注：本题数据计算过程中最大的数据要达到 $(2\times10^5)^2\times \frac{l+r}{2}\leq 4\times 10^{23}$，会爆 `{c++}long long`，可以开 `{c++}int128` 或者当计算结果大于 $h$ 后就直接下一轮
```cpp
#define int long long
void solve() {
    int h, n;cin >> h >> n;
    vector<int> a(n + 1), c(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i];
    for (int i = 1;i <= n;i++)cin >> c[i];
    __int128_t hh = h;
    int l = 1, r = 1e13;
    while (l < r) {
        int mid = l + r >> 1;
        __int128_t sum = 0;
        for (int i = 1;i <= n;i++) {
            sum += (mid + c[i] - 1) / c[i] * a[i];
        }
        if (sum >= hh)r = mid;
        else l = mid + 1;
    }
    cout << l << '\n';
}
```

## CF 1985 Div.4 G - D-Function
让 $D(n)$ 表示 $n$ 的数位之和。有多少个整数 $n$ 其中的 $10^{l} \leq n < 10^{r}$ 满足 $D(k \cdot n) = k \cdot D(n)$ ?输出以 $10^9+7$ 为模数的答案。

当 $k\geq 10$ 时，$D(k\cdot n)\neq 10\cdot D(n)$ 恒成立，所以没有方案

当 $k\in[1,9]$ 时，若对于 $n$ 的每一位 $b_{i}$ 都满足 $k\cdot b_{i}<10$，则是一个方案

> [!example]-  以 k=2 为例：
> 
> 即要求 $n\in [10^l,10^r)$ 区间内满足每一位都 $\leq 4$ 的个数
> 
> 若 $n$ 位数为 $l+1$ (即和 $10^l$ 同数量级)，则除了第一位是 4 种选择，其他数都是 5 种选择，方案数为 $4\times5^{l}$
> 
> 同理，位数为 $l+2$，方案数为 $4\times 5^{l+1}$
> 
> 依次类推，位数为 $r$ 时方案数为 $4\times 5^{r-1}$
> 
> 则总方案数为：$4\times 5^l+4\times 5^{l+1}\times \dots \times4\times 5^{r-1}=5^r-5^l$

答案为 $\displaystyle {\lceil{\frac{10}{k}}\rceil}^r-{\lceil{\frac{10}{k}}\rceil}^l \bmod 10^9+7$
```cpp
constexpr int mod = 1e9 + 7;
void solve() {
    cout << (qpow((10 + k - 1) / k, r) - qpow((10 + k - 1) / k, l) + mod) % mod << '\n';
}
```

## CF 1985 Div.4 H - Maximize the Largest Component
给定一个 $n\times m(n\times m\leq 10^6)$ 的网格，可以从任意 `#` 单元格出发到其他 `#` 单元格，方向为上下左右，构成了若干连通块。

`{c++}easy version:`可以将某一行或某一列全变为 `#`

`{c++}hard version:` 可以将某一行和某一列全变为 `#`

求最大连通部分的最大可能大小。

### Solution

#### easy version
我的想法：先将所有的连通块找出来，再枚举 $n$ 行 $m$ 列看填满哪种情况最大。

代码：
```cpp fold title:"TLE Code"
int dx[] = {0,0,1,-1}, dy[] = {1,-1,0,0};
void solve() {
    int n, m;cin >> n >> m;
    vector<string> s(n + 1);
    for (int i = 1;i <= n;i++) {
        cin >> s[i];s[i] = ' ' + s[i];
    }

    map<pair<int, int>, pair<int, int>>vis;
    int cnt = 0;//第几个连通块

    auto bfs = [&](int sx, int sy) {
        int sum = 0;//连通块大小
        queue<pair<int, int>>q;cnt++;
        q.push({sx,sy});
        vis[{sx, sy}] = {cnt,++sum};
        while (q.size()) {
            auto [x, y] = q.front();q.pop();
            for (int i = 0;i < 4;i++) {
                int a = x + dx[i], b = y + dy[i];
                if (a<1 || b<1 || a>n || b>m || vis.count({a,b}) || s[a][b] == '.')continue;
                vis[{a, b}] = {cnt,++sum};q.push({a,b});
            }
        }
        q.push({sx,sy});
        vis[{sx, sy}] = {cnt,sum};
        map<pair<int, int>, int>mp;
        while (q.size()) {
            auto [x, y] = q.front();q.pop();
            for (int i = 0;i < 4;i++) {
                int a = x + dx[i], b = y + dy[i];
                if (a<1 || b<1 || a>n || b>m || s[a][b] == '.' || mp.count({a,b}))continue;
                if (vis.count({a,b})) {
                    vis[{a, b}] = {cnt,sum};q.push({a,b});mp[{a, b}] = 1;
                }
            }
        }
        };
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= m;j++) {
            if (s[i][j] == '#' && !vis.count({i,j})) {
                bfs(i, j);
            }
        }
    }
    int ans = 0;
    for (auto [x, y] : vis) {
        ans = max(ans, y.second);
    }

    for (int i = 1;i <= n;i++) {
        map<int, int>st;
        int sum = 0;
        for (int j = 1;j <= m;j++) {
            if (!vis.count({i,j})) {
                sum++;
            } else {
                if (!st.count(vis[{i, j}].first)) {
                    sum += vis[{i, j}].second;st[vis[{i, j}].first] = 1;
                }
            }
            if (vis.count({i - 1,j})) {
                if (!st.count(vis[{i - 1, j}].first)) {
                    sum += vis[{i - 1, j}].second;st[vis[{i - 1, j}].first] = 1;
                }
            }
            if (vis.count({i + 1,j})) {
                if (!st.count(vis[{i + 1, j}].first)) {
                    sum += vis[{i + 1, j}].second;st[vis[{i + 1, j}].first] = 1;
                }
            }
        }
        ans = max(ans, sum);
    }
    for (int j = 1;j <= m;j++) {
        map<int, int>st;
        int sum = 0;
        for (int i = 1;i <= n;i++) {
            if (!vis.count({i,j})) {
                sum++;
            } else {
                if (!st.count(vis[{i, j}].first)) {
                    sum += vis[{i, j}].second;st[vis[{i, j}].first] = 1;
                }
            }
            if (vis.count({i ,j - 1})) {
                if (!st.count(vis[{i, j - 1}].first)) {
                    sum += vis[{i, j - 1}].second;st[vis[{i, j - 1}].first] = 1;
                }
            }
            if (vis.count({i ,j + 1})) {
                if (!st.count(vis[{i, j + 1}].first)) {
                    sum += vis[{i, j + 1}].second;st[vis[{i, j + 1}].first] = 1;
                }
            }
        }
        ans = max(ans, sum);
    }
    cout << ans << '\n';
}
```

>当 `#` 特别多的时候会 TLE

先将整个网格含 `#` 的用并查集连成若干连通块，再和之前思路一样分别考虑即可。
```cpp title:"jiangly-Code" ref:https://codeforces.com/contest/1985/submission/265264217
// 模板整理——并查集
void solve() {
    int n, m;
    cin >> n >> m;

    vector<string> s(n);
    for (int i = 0; i < n; i++) {
        cin >> s[i];
    }

    const int N = n * m;
    DSU dsu(N);
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            if (i + 1 < n && s[i][j] == '#' && s[i + 1][j] == '#') {
                dsu.merge(i * m + j, (i + 1) * m + j);
            }
            if (j + 1 < m && s[i][j] == '#' && s[i][j + 1] == '#') {
                dsu.merge(i * m + j, i * m + j + 1);
            }
        }
    }

    vector<int> vis(N, -1);
    int ans = 0;
    for (int r = 0; r < n; r++) {
        int res = 0;
        for (int i = 0; i < m; i++) {
            if (s[r][i] == '.') {
                res++;
            }
            for (int x = max(0, r - 1); x <= min(n - 1, r + 1); x++) {
                if (s[x][i] == '#') {
                    int u = dsu.find(x * m + i);
                    if (vis[u] != r) {
                        vis[u] = r;
                        res += dsu.size(u);
                    }
                }
            }
        }
        ans = max(ans, res);
    }
    vis.assign(N, -1);
    for (int c = 0; c < m; c++) {
        int res = 0;
        for (int i = 0; i < n; i++) {
            if (s[i][c] == '.') {
                res++;
            }
            for (int y = max(0, c - 1); y <= min(m - 1, c + 1); y++) {
                if (s[i][y] == '#') {
                    int u = dsu.find(i * m + y);
                    if (vis[u] != c) {
                        vis[u] = c;
                        res += dsu.size(u);
                    }
                }
            }
        }
        ans = max(ans, res);
    }

    cout << ans << "\n";
}
```

#### hard version

...

## CF 1995 Div.2 B1 - Bouquet (Easy Version)
**这是问题的简单版本。唯一不同的是，在这个版本中，花朵是通过枚举来指定的**。

一个女孩准备过生日，她想买一束最漂亮的花。商店里一共有 $n$ 种花，每种花的特征是花瓣数，一朵有 $k$ 个花瓣的花需要花费 $k$ 个硬币。女孩决定花束中任何两朵花的花瓣数之差不能超过 1。同时，女孩希望花束的花瓣数尽可能多。不幸的是，她只有 $m$ 枚金币，无法再花费更多。她能组合的花束的花瓣总数最多是多少？

这个题太可惜了！一秒钟有思路，双指针(滑动窗口)，就是细节没考虑到

#### 法一 ：滑动窗口
```cpp
#define int long long
void solve() {
    int n, m;cin >> n >> m;
    vector<int> a(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i];
    sort(a.begin() + 1, a.end());
    int l = 1, r = 1, ans = 0, sum = 0;
    while (r <= n && a[r] <= m) {
        while (r <= n && sum + a[r] <= m && abs(a[r] - a[l]) <= 1) {
            sum += a[r];r++;
            ans = max(ans, sum);
            if (r > n) {
                cout << ans << '\n';return;
            }
        }
        while (l < r && abs(a[r] - a[l]) > 1) {
            sum -= a[l];l++;
            ans = max(ans, sum);
        }
        while (l < r && sum + a[r] > m) {
            sum -= a[l];l++;
            ans = max(ans, sum);
        }
    }
    cout << ans << '\n';
}
```

#### 法二 ：官方题解

> [!NOTE]- 官方题解
> 
> 首先，我们可以将花瓣数为 $x$ 的花朵数汇总为 $c_{x}$ （例如，对数组进行排序，然后创建数组对 $(x, c_{x})$ ，其中 $c_{x}$ 是元素长度等于 $x$ 的段。(例如，对数组排序，然后创建数组对 $(x, c_{x})$ ，其中 $c_{x}$ 是元素等于 $x$ 的段长度）。
> 
> 请注意 $\sum_{x} c_{x} = n$ 。还要注意的是，每 $x$ 朵花所需的花瓣数不会超过 $\left\lfloor\frac{m}{x}\right\rfloor$ （否则花瓣总数将超过 $m$ ）。
> 
> 然后我们遍历所有的 $x$ 。假设我们想要组合一束有 $x, x + 1$ 个花瓣的花束。我们可以在 $O(c_{x})$ 中暴力破解有 $x$ 个花瓣的花朵数量。如果我们有 $0 \le k_1 \le min(c_{x}, \left\lfloor\frac{m}{x}\right\rfloor)$ 朵花和 $x$ 片花瓣，那么我们就已经有了 $k_1 * x$ 片花瓣。还有 $m - k_1 * x$ 枚硬币可以用来购买有 $x + 1$ 个花瓣的花朵。我们最多可以买到 $k_2 = min(c_{x + 1}, \left\lfloor\frac{m - k_1 * x}{x + 1}\right\rfloor)$ 朵带有 $x + 1$ 个花瓣的花。因此我们需要找出所有这些 $k_1 * x + k_2 * (x + 1)$ 的最大值。
> 
> 求最大值的总复杂度为 $O(\sum_{x} c_{x}) = O(n)$ ，排序的总复杂度为 $O(n \log n)$ 。

```cpp
#define int long long
void solve() {
    int n, m;cin >> n >> m;
    map<int, int>mp;
    for (int i = 1;i <= n;i++) {
        int x;cin >> x;mp[x]++;
    }
    int ans = 0;
    for (auto [x, y] : mp) {
        ans = max(ans, x * min(y, m / x));
        if (mp.count(x + 1)) {
            int z = mp[x + 1];
            for (int i = 1;i <= min(y, m / x);i++) {
                ans = max(ans, i * x + (x + 1) * min(z, (m - i * x) / (x + 1)));
            }
        }
    }
    cout << ans << '\n';
}
```

## CF 1995 Div.2 B2 - Bouquet (Hard Version)
**这是问题的困难版本。唯一不同的是，在这个版本中，不是列出每种花的花瓣数，而是为所有类型的花设置花瓣数和商店中的花的数量。

一个女孩准备过生日，想买一束最漂亮的花。店里一共有 $n$ 种不同类型的花，每种花的花瓣数和数量都有相应的特征。一朵有 $k$ 个花瓣的花的价格是 $k$ 个金币。女孩决定，她用来装饰蛋糕的任何两朵花的花瓣数之差都不能超过 1。同时，女孩还想用尽可能多的花瓣组合成一束花。不幸的是，她只有 $m$ 枚金币，无法再花费更多。她能组合的花束花瓣总数最多是多少？

### Solution

总的来说和 B1 做法相似，但是不能暴力做了。

首先尽量让 $x$ 装满，将剩余的给 $x+1$ 装了直到装不下为止，这样之后若 $m$ 还有剩余，可能可以将 $x$ 替换为 $x+1$ ，这样就可以让答案净赚 1。若无法再替换，则 $(x,x+1)$ 此处达到最优。

将 $x$ 替换为 $x+1$ 的条件有：

- 场上还有 $x$ 剩余
- 预备的 $x+1$ 还有剩余
- 手里的金币还有剩余

```cpp
#define int long long
void solve() {
    int n, m;cin >> n >> m;
    vector<int> a(n + 1), c(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i];
    map<int, int>mp;
    for (int i = 1;i <= n;i++) {
        int x;cin >> x; mp[a[i]] = x;
    }
    int ans = 0;
    for (auto [x, y] : mp) {
        ans = max(ans, x * min(y, m / x));
        if (mp.count(x + 1)) {
            int z = mp[x + 1];
            int k1 = min(y, m / x);
            int k2 = min(z, (m - k1 * x) / (x + 1));
            int coins = m - k1 * x - k2 * (x + 1);
            int r = min({k1, coins, z - k2});
            ans = max(ans, k1 * x + k2 * (x + 1) + r);
        }
    }
    cout << ans << '\n';
}
```

## CF 1995 Div.2 C - Squaring
ikrpprpp 发现了一个由整数组成的数组 $a$ 。他想让 $a$ 不递减。为此，他可以在数组的索引 $1 \le i \le n$ 上执行一个公正的操作，将 $a_i$ 替换为 $a_i ^ 2$ （位置 $i$ 的元素及其平方）。

要使数组不递减，最少需要多少次正义行动？

### Solution

#### 法一 ：正常思路做：

当 $a_{i-1}>a_{i}$ 时：说明这个时候并不满足要求，需要（计算出） $cur$ 次才能使得 $a_{i-1}\leq a_{i}$，这时候才满足要求

当 $a_{i-1}\ll a_{i}$，即至少 $a_{i-1}^2\leq a_{i}$ ，这个时候 $a_{i}$ 又分为两种情况：(先计算出 $a_{i-1}\geq a_{i}$ 需要操作几次)

设到达 $a_{i}$ 时的虚拟最大值是 $tmp$

- $a_{i}$ 非常大，以至于 $a_{i-1}$ 本来要进行 $lst$ 次操作，而在这里 $a_{i-1}$ 要到达 $a_{i}$ 需要的操作已经大于等于 $lst$，那么这个时候 $a_{i}$ 自热不需要进行操作 $\implies a_{i}\geq tmp \to \text{don't do op}$
- $a_{i}$ 很大，但不至于不需要操作，即 $a_{i}\geq a_{i-1}^2$，$a_{i-1}$ 本来需要进行 $lst$ 次操作，这里需要进行 $< lst$ 次的操作, 则相减则是 $a_{i}$ 需要进行的操作次数 $\implies a_{i-1}^2\leq a_{i}<tmp\to \text{do op and not do much op}$
- $a_{i}$ 不够大，即 $a_{i-1}\leq a_{i}<a_{i-1}^2$，$a_{i-1}$ 本来需要进行 $lst$ 次操作，这里不需要进行操作，则 $a_{i}$ 需要进行 $lst$ 次操作即操作数和 $a_{i-1}$ 相同。$\implies a_{i-1}\leq a_{i}<a_{i-1}^2<tmp\to \text{do op and do the same op}$

```cpp
#define int long long
void solve() {
    int n;cin >> n;
    vector<int> a(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i];
    for (int i = 2;i <= n;i++) {
        if (a[i] < a[i - 1] && a[i] == 1) {
            cout << "-1\n";return;
        }
    }
    int ans = 0, lst = 0;
    for (int i = 1;i <= n;i++) {
        int cur = 0;
        int x = a[i];
        while (x < a[i - 1]) {
            x *= x;cur++;
        }
        x = a[i - 1];
        while (lst > 0 && x * x <= a[i]) {
            x *= x;lst--;
        }
        cur += lst;
        ans += cur;
        lst = cur;
    }
    cout << ans << '\n';
}
```

#### 法二 ：浮点数做法：

>这个做法也是这个 Round 的 EDU 做法

若将数组进行对数处理，即 $a_{i}:=\ln a_{i}$，这样，$a_{i}^2\leftrightarrow2\ln a_{i}$，当操作次数较大的时候 $a_{i}=2^k\ln a_{i}$ ，$2^k$ 的数量级也很大，无法用浮点数存储。

若 $a_{i}:=\ln \ln a_{i}$，则 $a_{i}^2\leftrightarrow\ln2+\ln \ln a_{i}$,这样操作数较大也随便存储了。

由于 $\ln \ln1$ 无意义，所以先将 $a_{i}=1$ 的情况处理了。 

之后的数组只需要看 $a_{i-1}$ 和 $a_{i}$ 之间差的 $\ln2$ 有多少个即可。即 $\displaystyle \lceil{\frac{{\ln \ln a_{i-1}-\ln \ln a_{i}}}{\ln2}}\rceil$

```cpp
#define int long long
constexpr double eps = 1e-9;
void solve() {
    int n;cin >> n;
    vector<double> a(n);
    for (auto& i : a)cin >> i;
    for (int i = 1;i < n;i++) {
        if (a[i - 1] > 1 && a[i] == 1) {
            cout << "-1\n";return;
        }
    }
    for (int i = 0;i < n;i++) {
        if (a[i] == 1) {
            a.erase(a.begin());
        } else {
            break;
        }
    }
    
    for (auto& i : a)i = log(log(i));
    
    int ans = 0;
    for (int i = 1; i < a.size(); i++) {
        double need = a[i - 1] - a[i];
        if (need > eps) {
            int cnt = 1 + (need - eps) / log(2);
            ans += cnt;
            a[i] += cnt * log(2);
        }
    }
    cout << ans << '\n';
}
```

## CF 1988 Div.2 C - Increasing Sequence with Fixed OR
给你一个正整数 $n$ 。求满足以下条件的正整数 $a=[a_1,a_2,\ldots,a_k]$ 的最长序列：

- $a_i\le n$ 。
- $a$ 数组严格递增。
- $a_i\ \text{OR}\,a_{i-1}=n$ 

这个题目难度和 B 相同

只需要每个元素去掉一位为 1 的二进制位即可。所以方法个数是 $\text{popcount(n)}+1$ (还需要加上自身)

坑点：

- `__builtin_popcount()` 参数是 `unsigned int`，对于 long long 不适用
- 当数据范围超 int 之后，都需要 `1ll<<i` 这样，养成习惯
- 需要特判一下只有一个二进制位是 1 的情况，因为去掉一位之后就是 0 了，而题目要求正整数。需要去掉

```cpp
#define int long long
void solve() {
    int n;cin >> n;
    int k = 0;
    vector<int>ans;
    for (int i = __lg(n);i >= 0;i--) {
        if ((n >> i) & 1) {
            k++;
            ans.push_back(n - (1ll << i));
        }
    }
    if (k == 1) {
        cout << "1\n" << n << "\n";
        return;
    }
    cout << k + 1 << '\n';
    for (auto x : ans)cout << x << " ";
    cout << n << '\n';
}
```

## CF 1988 Div.2 D - The Omnipotent Monster Killer
你是怪物杀手，想要杀死一群怪物。这些怪物位于一棵有 $n$ 个顶点的树上。在编号为 $i$ ( $1\le i\le n$ ) 的顶点上，有一个攻击点为 $a_i$ 的怪物。你需要与怪物战斗 $10^{100}$ 个回合。

在每个回合中，会依次发生以下情况：

1.  所有活着的怪物攻击你。你的生命值会按照所有活体怪物攻击点的总和减少。
2.  您选择一些（可能是全部，也可能是一个都没有）怪物并杀死它们。被杀死后，怪物将无法再进行任何攻击。

有一个限制条件：在一个回合内，您不能杀死由一条边直接相连的两只怪物。

如果您以最佳方式选择攻击的怪物，那么在所有回合后，受到的最小伤害是多少？

### Solution

若这个题目只有一个回合，实际上就是 树的最大权值的独立集。即没有上司的舞会

树形 DP

$dp_{i,j}$ 代表在 $i$ 的子树中，$i$ 节点是第 $j$ 次删除。在某个子树(顶点个数为 $n$)中，最多 $\log n$ 次就可以将这个子树删光。

$\displaystyle dp_{u,i}=\sum\limits_{v\in son(u)}\min_{i\neq j}dp_{v,j}+i\times a_{u}$
```cpp
#define int long long
void solve() {
    int n;cin >> n;
    vector<int> a(n + 1);
    for (int i = 1; i <= n; i++) cin >> a[i];
    vector<vector<int>> g(n + 1);
    for (int i = 1; i < n; i++) {
        int u, v;cin >> u >> v;
        g[u].push_back(v), g[v].push_back(u);
    }
    vector<array<int, 30>> dp(n + 1);
    auto dfs = [&](auto self, int u, int fa = -1)->void {
        for (int i = 1; i <= 25; i++) dp[u][i] = a[u] * i;
        for (auto v : g[u]) {
            if (v == fa) continue;
            self(self, v, u);
            for (int i = 1; i <= 25; i++) {
                int mn = 9e18;
                for (int j = 1; j <= 25; j++)
                    if (i != j) mn = min(mn, dp[v][j]);
                dp[u][i] += mn;
            }
        }
        };

    dfs(dfs, 1);
    int res = 9e18;
    for (int i = 1; i <= 25; i++) res = min(res, dp[1][i]);
    cout << res << '\n';
}
```

## CF 1918 Div.2 C - XOR-distance
 $x\in[0,r]$ 找出 $\min(\mid(a\oplus x)-(b\oplus x)\mid)$

### Solution
贪心

官方题解：

我们来考虑数字 $a$、$b$、$x$ 的位表示。让我们看看 $a$ 和 $b$ 在同一位置的任意 2 位，

1. 如果它们相同，那么无论 $x$ 在该位置上是什么，数字 $|({a \oplus x}) - ({b \oplus x})|$ 在这个位置上都会是 0。因此，在所有这样的位置上设置为 0 是有利的（因为我们希望 $x\leq r$，并且答案不取决于位）。

2. 如果 $a$ 和 $b$ 在同一位置的位不同，则在该位置上，无论是在 $a \oplus x$ 还是在 $b \oplus x$ 中都会有一个1，取决于 $x$ 在该位置上是什么。

假设 $a$ < $b$，如果不是的话，我们将交换它们。然后在最高的位置上，位不同，$a$ 中有一个 0，$b$ 中有一个 1。

位不同则有 $2$ 个选择

- 要么在这个位置上在 $x$ 中设置一个 1（然后在该位 $a \oplus x=1,b\oplus x=0$）
- 要么在 $x$ 中设置一个 0（然后在该位 $a \oplus x=0, b\oplus x=1$）。

假设我们在 $x$ 中设置一个 0，那么 $a \oplus x$ 肯定会小于 $b \oplus x$（因为在最高位不同的情况下一定有: $a \oplus x=0, b\oplus x=1$）。因此，有利的是在所有接下来的位置上，在 $a \oplus x$ 中设置一个 1，因为这将使它们的差值更小。

因此，我们可以按降序遍历位置，如果位置不同，则在该位置上设置一个 1 在 $a \oplus x$ 中（如果这样 $x$ 不会超过 $r$ 的话）。

第二种情况（当我们在第一个不同的位上设置 1）类似地进行分析，但实际上并不需要，因为答案不会更小，而 $x$ 会变得更大。

时间复杂度：每个测试用例 $O(\log 10^{18})$。

代码

我一开始没有看懂为什么后面直接答案输出 $b-a$ 即可，后面发现可以更简单
```cpp
#define int long long
void solve()
{
    int a, b, r, x = 0;
    cin >> a >> b >> r;
    if (a > b)
        swap(a, b);
    bool cn = 1;
    for (int i = 60; i >= 0; i--)
    {
        if ((a & (1LL << i)) != (b & (1LL << i)))//同一位置的位不同
        {
            if (cn)//第一个最高位不同的位置
                cn = 0;
            else
            {
                if (!(a & (1LL << i)) && x + (1LL << i) <= r)
                {
                    x += (1ll << i);//x在该位为1
                    a ^= (1ll << i);
                    b ^= (1ll << i);
                }
            }
        }
    }
    cout << b - a << '\n';
}
```

搞了半天和我的想法是一样的，最终的答案就是 $a,b(a<b)$ 从高到低位不同的位中 $a$ 该位为 $0$ 且 $x\leq r$ 各位之和(最高位除外)

>假设我们在 $x$ 中设置一个 0，那么 $a \oplus x$ 肯定会小于 $b \oplus x$（因为在最高位不同的情况下一定有: $a \oplus x=0, b\oplus x=1$）。因此，有利的是在所有接下来的位置上，在 $a \oplus x$ 中设置一个 1，因为这将使它们的差值更小。
```cpp
#define int long long
void solve()
{
    int a, b, r, x = 0;
    cin >> a >> b >> r;
    if (a > b)
        swap(a, b);
    bool cn = 1;
    for (int i = 60; i >= 0; i--)
    {
        if ((a & (1LL << i)) != (b & (1LL << i)))
        {
            if (cn)
                cn = 0;
            else
            {
                if (!(a & (1LL << i)) && x + (1LL << i) <= r)
                    x += (1ll << i);
            }
        }
    }
    cout << (b ^ x) - (a ^ x) << '\n';
}
```

## CF 1946 Div.2 B - Maximum Sum
你有一个由 $n$ 个整数组成的数组 $a$ 。

你要对它进行 $k$ 次操作。其中一个操作是选择数组 $a$ 的任意连续子数组（可能为空），并在数组的任意位置插入该子数组的和。

你的任务是找出 $k$ 次这样的操作后数组可能的最大和。

由于这个数字可能非常大，请输出取模为 $10^9 + 7$ 的答案。

一眼看出答案是 $2^k\times res-res+sun$，但是对于如何找到子数组的最大和($res$) [P1115 最大子段和 - 洛谷](https://www.luogu.com.cn/problem/P1115)。

```cpp
for (int i = 1;i <= n;i++)cin >> a[i];
int s = 0, cur = 0, ans = 0;
for (int i = 1;i <= n;i++) {
	s += a[i];cur += a[i];
	cur = max(0, cur);
	ans = max(ans, cur);
}
if (!ans)ans = *(max_element(a.begin() + 1, a.end()));
cout << ans << '\n';
```

只要之前的累加和大于 0，那么加上后面的值就始终是增加的，否则将该值重置为 0，这样可以求最大字段和。
```cpp
#define int long long
const int mod = 1e9 + 7;
void solve() {
    int n, k;cin >> n >> k;;
    int s = 0, res = 0, cur = 0;
    for (int i = 1;i <= n;i++) {
        int x;cin >> x;
        s += x;
        cur += x;
        cur = max(0ll, cur);
        res = max(res, cur);
    }
    res %= mod;s %= mod;
    int ans = (qpow(2, k) * res - res + s + mod) % mod;
    cout << ans << '\n';
}
```

## CF 1946 Div.2 C - Tree Cutting
给出一个有 $n$ 个顶点 $n-1$ 条边的二叉树，求删去 $k$ 条边后被分成的连通块中**最小的连通块**的最大大小是多少。

### Solution
二分

很典的题目：二分模型：最小值最大化
判定函数的写法通常是：DFS 统计每个子树里能否切出大小至少为 `mid` 的连通块；若某棵子树达到阈值，就把它作为一个可切块计数并向上返回 `0`，否则把子树大小继续往父亲传。最后检查可切出的块数是否至少为 `k+1`，就能完成二分。

> [!NOTE]-  求树每个点对应的的深度：(BFS)
> ```cpp
> queue< int >q;vector< int > dis(n + 1), vis(n + 1);
> q.push(1);vis[1] = 1;
> while (q.size()) {
> 	int now = q.front();q.pop();
> 	for (auto i : g[now]) {
> 		if (vis[i])continue;
> 		vis[i] = 1;
> 		dis[i] = dis[now] + 1;
> 		q.push(i);
> 	}
> }
> for (int i = 1;i <= n;i++)cout << dis[i] + 1 << " ";
> ```
> 

```cpp
void solve() {
    int n, k;cin >> n >> k;
    vector<vector<int>> g(n + 1);
    for (int i = 1;i < n;i++) {
        int u, v;cin >> u >> v;
        g[u].push_back(v);
        g[v].push_back(u);
    }
    auto check = [&](int x) {
        int res = 0;
        auto dfs = [&](auto self, int u, int p = 0) ->int {
            int ans = 1;
            for (auto i : g[u]) {
                if (i == p)continue;
                ans += self(self, i, u);
            }
            if (ans >= x) {
                res++;return 0;
            }
            return ans;
            };
        dfs(dfs, 1);
        return res > k;
        };
    int l = 1, r = n + 1;
    while (l < r) {
        int mid = l + r + 1 >> 1;
        if (check(mid))l = mid;
        else r = mid - 1;
    }
    cout << l << "\n";
}
```

## CF 1946 Div.2 D - Birthday Gift
给定一个长度为 $n$ 的数组 $a$ 和一个数字 $x$，将数组分为 $k$ 段，要求每一段的异或或 $\leq x$，即 $(a_{l_1} \oplus a_{l_1 + 1} \oplus \ldots \oplus a_{r_1}) | (a_{l_2} \oplus a_{l_2 + 1} \oplus \ldots \oplus a_{r_2}) | \ldots | (a_{l_k} \oplus a_{l_k + 1} \oplus \ldots \oplus a_{r_k}) \le x$

求出最大的 $k$,若不存在则输出 $-1$。

### Solution
位运算+思维

[Codeforces Round 936(A-E讲解)\_哔哩哔哩\_bilibili](https://www.bilibili.com/video/BV1wJ4m1777P/?spm_id_from=333.337.search-card.all.click&vd_source=cb670d82714ee9baee22c33ef083884d)

从高位到低位进行枚举

如果 $x$ 该位为 1

- 若得出答案该位为 0，(在 $a_{i}$ 数组中该位为 1 的个数为偶数)，在 $[i,j)$ $(bit(a_{i}=1,a_{j}=1))$ 之间不能分割，其他位置则都可以分割(因为无论怎样分割都比 $x$ 小了)，遍历完更新答案
- 若得出答案该位为 1，则无论怎样分割都不影响答案了，

如果 $x$ 该位为 0

- 若得出答案该位为 0，在 $[i,j)$ 之间一定不能分割(这里不能分割指的是后面的位也不能取 $[i,j)$)，一旦分割就会使得该位变成 1。
- 若得出答案该位为 1，这时得出的答案比 $x$ 还大，不满足要求。将当前已经存储的答案输出

```cpp
void solve() {
    int n, x;cin >> n >> x;
    vector<int> a(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i];
    vector<int> flag(n + 1, 1);
    int ans = -1;
    for (int i = 30;i >= 0;i--) {
        int cnt = 0;//能分割成几组
        if (x & (1 << i)) {//x当前位是1
            int ok = 1;
            for (int j = 1;j <= n;j++) {
                if (a[j] & (1 << i))ok ^= 1;//如果当前位置是1，那后面就不能分割了，直到再次遇到1
                if (ok && flag[j])cnt++;
            }
            if (ok) {//若1的个数是偶数个，则可以修改答案
                ans = max(ans, cnt);
            }
        } else {//x当前位是0
            int ok = 1;
            for (int j = 1;j <= n;j++) {
                if (a[j] & (1 << i))ok ^= 1;
                if (!ok)flag[j] = 0;
            }
            if (!ok) {//如果是奇数个，则直接返回答案
                cout << ans << '\n';return;
            }
        }
    }
    int tmp = 0;
    for (int i = 1;i <= n;i++) {
        if (flag[i]) {
            tmp++;
        }
    }
    cout << max(ans, tmp) << '\n';
}
```
