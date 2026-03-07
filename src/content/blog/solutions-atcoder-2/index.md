---
title: 'AtCoder 题解整理 2：DP、概率、图与数据结构'
description: '以原题解记录为主，收录 ABC 348 E/F、350 D/E、351 D/E/F、357 D/E/F、358 C/E/G、360 E。'
publishDate: '2026-03-06'
tags:
  - 算法竞赛
  - 题解整理
  - AtCoder
  - DP
  - 图论
  - 数据结构
language: '中文'
---

> [!note] 说明
> 这篇继续直接回填原来的题解笔记，尽量不改原有描述，只处理了站点里的图片、链接和分节兼容问题。

## 收录范围

- `ABC 348 E`
- `ABC 348 F`
- `ABC 350 D`
- `ABC 350 E`
- `ABC 351 D`
- `ABC 351 E`
- `ABC 351 F`
- `ABC 357 D`
- `ABC 357 E`
- `ABC 357 F`
- `ABC 358 C`
- `ABC 358 E`
- `ABC 358 G`
- `ABC 360 E`

## ABC 348 E - Minimize Sum of Distances
给你一棵有 $N$ 个顶点的树。顶点的编号为 $1$ 至 $N$ ， $i$ -th 边连接顶点 $A_{i}$ 和 $B_{i}$ 。

我们还给出了一个长度为 $N$ 的正整数序列 $C$ 。设 $d(a, b)$ 是顶点 $a$ 和 $b$ 之间的边数，而对于 $x = 1, 2, \ldots, N$ ，设 $\displaystyle f(x) = \sum_{i=1}^{N} (C_{i} \times d(x, i))$ 。求出 $\displaystyle \min_{1 \leq v \leq N} f(v)$ 。

### Solution
换根 DP/树形 DP/<span style="color:#92d050">换根/树的重心</span>

原：[Problem - F - Codeforces](https://codeforces.com/contest/1092/problem/F) 不过这个题目是求的最大值，前面的处理一样，第二个 DFS 有所区别：

$\Huge{CF_{DFS_{2}}}$
```cpp 
void go(int v, int p = -1) {
	ans = max(ans, res);
	for (auto to : g[v]) {
		if (to == p) {
			continue;
		}
		
		res -= sum[to];
		sum[v] -= sum[to];
		res += sum[v];
		sum[to] += sum[v];
		
		go(to, v);
		
		sum[to] -= sum[v];
		res -= sum[v];
		sum[v] += sum[to];
		res += sum[to];
	}
}
```

此题目的类似写法：
```cpp
ll ans = INF;
void dfs(int u, int fa) {
    ans = min(ans, res);
    for (auto v : G[u]) {
        if (v == fa) { 
            continue;
        }
        res -= sum[v];
        res += sum[1] - sum[v];
        dfs(v, u);
        res += sum[v];
        res -= sum[1] - sum[v];
    }
}
```

先以 $1$ 为根节点扫一遍树，$sum[i]$ 代表节点 $i$ 及其节点 $i$ 加起来的权重，根节点的权重一定是所有权重的和。

> 然后去找到权重占到 > 总权重一半的节点 $x$，这时将 $x$ 作为根节点，由于本身的权重不计入，这样就可以省去最多的权重，从而答案最小。
> 
> 若等于总权重一半，则换不换根节点都可以。
> 
> 若根节点没变，则本身就是最小。

通常的来讲，上面所描述的可以叫做树的重心，可以证明，每一个树都存在重心，至多有两个重心。

以树的重心为根时，所有子树的大小都不超过整棵树大小的一半。这里的大小带有权重，则是指加权大小。

> [树的重心 - OI Wiki](https://oi-wiki.org/graph/tree-centroid/) 关于树的重心 (质心)，致力于解决图论及其优化问题

```cpp Jiangly
void solve() {
    int n;cin >> n;
    vector<vector<int>> g(n + 1);
    for (int i = 1;i < n;i++) {
        int u, v;cin >> u >> v;
        g[u].push_back(v);g[v].push_back(u);
    }
    vector<int>c(n + 1);
    for (int i = 1;i <= n;i++)cin >> c[i];
    vector<ll> sum(n + 1);
    auto dfs1 = [&](auto self, int x, int p) -> void {
        sum[x] = c[x];
        for (auto y : g[x]) {
            if (y == p)continue;
            self(self, y, x);
            sum[x] += sum[y];
        }
        };
    dfs1(dfs1, 1, 0);

    auto dfs2 = [&](auto self, int x, int p) -> int {
        for (auto y : g[x]) {
            if (y == p || 2 * sum[y] <= sum[1])continue;
            return self(self, y, x);
        }
        return x;
        };
    int x = dfs2(dfs2, 1, 0);
    dfs1(dfs1, x, 0);
    ll ans = 0;
    for (int i = 1;i <= n;i++) {
        if (i != x)ans += sum[i];
    }
    cout << ans << '\n';
}
```

另：此题目算是换根 DP 模板, 此处并未给出做法。贴上代码：

```cpp
#include <bits/stdc++.h>
using namespace std;
using i64 = long long;

int main() {
    cin.tie(nullptr)->sync_with_stdio(false);
    int n; cin >> n;
    vector<vector<int>> g(n + 1);
    for (int i = 1; i < n; ++i) {
        int u, v;
        cin >> u >> v;
        g[u].push_back(v);
        g[v].push_back(u);
    }
    vector<i64> c(n + 1);
    for (int i = 1; i <= n; ++i)
        cin >> c[i];
    vector<i64> dp(n + 1), res(n + 1);
    auto pre_dfs = [&](auto &f, int fa, int u)->void {
        dp[u] = c[u];
        for (auto &v : g[u]) {
            if (v == fa) continue;
            f(f, u, v);
            dp[u] += dp[v];
            res[u] += res[v] + dp[v];
        }
    };
    pre_dfs(pre_dfs, 1, 1);
    auto dfs = [&](auto &f, int fa, int u)->void {
        if (fa != u)
            res[u] = res[fa] - (res[u] + dp[u]) + (dp[1] - dp[u]) + res[u];
            // res[u] = res[fa] + dp[1] - 2 * dp[u]
        for (auto &v : g[u]) {
            if (v == fa) continue;
            f(f, u, v);
        }  
    };
    dfs(dfs, 1, 1);
    cout << *min_element(begin(res) + 1, end(res)) << '\n';
}
```

## ABC 348 F - Oddly Similar
有长度为 $M$ 的 $N$ 个序列，表示为 $A_1, A_2, \ldots, A_N$ 。长度为 $i$ 的序列由 $M$ 个整数 $A_{i,1}, A_{i,2}, \ldots, A_{i,M}$ 表示。

长度为 $M$ 的两个序列 $X$ 和 $Y$ 如果且仅当 $i (1 \leq i \leq M)$ 中 $X_i = Y_i$ 的索引数为奇数时，才可以说这两个序列是相似的。

求满足 $1 \leq i < j \leq N$ 的一对整数 $(i,j)$ 中， $A_i$ 和 $A_j$ 相似的个数。

### Solution
bitset/技巧

```cpp
#pragma GCC optimize("Ofast,unroll-loops")
```
开启了 `O3` 后就可以直接暴力过
```cpp
int ans = 0;
for (int i = 0;i < n;i++) {
	for (int j = i + 1;j < n;j++) {
		int cnt = 0;
		for (int k = 0;k < m;k++) {
			if (a[i][k] == a[j][k])cnt++;
		}
		if (cnt & 1)ans++;
	}
}
cout << ans << '\n';
```

bitset 硬凹时间复杂度: $O\left( \frac{N^2M}{64} \right)$
```cpp
bitset<2010> f[2010][1000];
void solve() {
    int n, m;cin >> n >> m;
    vector<vector<int>>a(n, vector<int>(m));
    for (int i = 0;i < n;i++) {
        for (int j = 0;j < m;j++) {
            cin >> a[i][j];
            f[j][a[i][j]][i] = 1;
        }
    }
    int ans = 0;
    for (int i = 0;i < n;i++) {
        bitset<2010> g;
        for (int j = 0;j < m;j++) {
            g ^= f[j][a[i][j]];
        }
        g[i] = 0;
        ans += g.count();
    }
    cout << ans / 2 << '\n';
}
```

## ABC 350 D - New Friends
有一个由 $N$ 用户使用的 SNS，标有从 $1$ 到 $N$ 的编号。

在这个 SNS 中，两个用户可以互相成为**好友。  
好友关系是双向的；如果用户 X 是用户 Y 的好友，则用户 Y 始终是用户 X 的好友。

目前，SNS 上有 $M$ 对好友关系，其中 $i$ 对由用户 $A_i$ 和 $B_i$ 组成。

请确定以下操作的最大执行次数：

- 操作：选择三个用户 X、Y 和 Z，使得 X 和 Y 是好友，Y 和 Z 是好友，但 X 和 Z 不是好友。让 X 和 Z 成为好友。

这个题目一眼就可看出答案: 对于每个连通块：连通块的大小*(连通块大小-1)/2-连通块的边数。
令连通块为  $\text{Connected-Block}\to \text{C}$，大小：$\text{size()}$ 边数：$\text{edge\_num}$

即：$\frac{1}{2}\sum \text{C.size()*(C.size()-1)-edge\_num}$

```cpp
#define int long long
void solve() {
    int n, m;cin >> n >> m;vector<vector<int>>g(n + 1);
    vector<int> vis(n + 1);
    for (int i = 1;i <= m;i++) {
        int a, b;cin >> a >> b;g[a].push_back(b);g[b].push_back(a);
    }
    int ans = 0, res = 0, cnt = 0;

    auto dfs = [&](auto self, int v) ->void {
        vis[v] = 1;res++;
        cnt += g[v].size();
        for (auto i : g[v]) {
            if (vis[i])continue;
            self(self, i);
        }
        };

    for (int i = 1;i <= n;i++) {
        if (!vis[i]) {
            res = 0, cnt = 0;
            dfs(dfs, i);
            ans += res * (res - 1) / 2 - cnt / 2;
        }
    }
    cout << ans << '\n';
}
```

## ABC 350 E - Toward 0
给你一个整数 $N$ 。您可以进行以下两种运算：

- 支付 $X$ 日元，将 $N$ 替换为 $\displaystyle\left\lfloor\frac{N}{A}\right\rfloor$ 。
- 支付 $Y$ 日元，掷出一个骰子（骰子），该骰子以相等的概率显示一个介于 $1$ 和 $6$ 之间的整数。让 $b$ 成为掷骰子的结果，用 $\displaystyle\left\lfloor\frac{N}{b}\right\rfloor$ 代替 $N$ 。

这里， $\lfloor s \rfloor$ 表示小于或等于 $s$ 的最大整数。例如， $\lfloor 3 \rfloor=3$ 和 $\lfloor 2.5 \rfloor=2$ 。

求在最优化选择操作时， $N$ 变为 $0$ 之前支付的最小预期成本。  
每次操作的掷骰子结果与其他掷骰子结果无关，可以在观察前面操作的结果后选择操作。

### Solution
期望/记忆化搜索

* * *

这个问题可以通过记忆化递归来解决。

<span style="color:#92d050">问题 1</span>

首先考虑下面的问题。

> 设置与原始问题相同。但是，操作只有一种。
> 
> - 支付 Y 日元。掷一个骰子，结果是一个从 2 到 6 的整数，等概率出现。将 N 替换为 $\left\lfloor\frac{N}{b}\right\rfloor$。

我们将期望值记为 $f(N)$。这样，

$f (N)=Y +\frac{1}{5}f\left (\left\lfloor\frac{N}{2}\right\rfloor\right) +\frac{1}{5}f\left (\left\lfloor\frac{N}{3}\right\rfloor\right) +\frac{1}{5}f\left (\left\lfloor\frac{N}{4}\right\rfloor\right) +\frac{1}{5}f\left (\left\lfloor\frac{N}{5}\right\rfloor\right) +\frac{1}{5}f\left (\left\lfloor\frac{N}{6}\right\rfloor\right)$

因此，我们可以通过记忆化递归来计算。（关于计算复杂度，稍后会提到）

<span style="color:#92d050">问题 2</span>

接下来考虑下一个问题。

> 设置与原始问题相同。但是，操作只有一种。
> 
> - 支付 Y 日元。掷一个骰子，结果是一个从 1 到 6 的整数，等概率出现。将 N 替换为 $\left\lfloor\frac{N}{b}\right\rfloor$。

我们将期望值记为 $f(N)$。这样，

$f (N)=Y +\frac{1}{6}f\left (\left\lfloor\frac{N}{1}\right\rfloor\right) +\frac{1}{6}f\left (\left\lfloor\frac{N}{2}\right\rfloor\right) +\frac{1}{6}f\left (\left\lfloor\frac{N}{3}\right\rfloor\right) +\frac{1}{6}f\left (\left\lfloor\frac{N}{4}\right\rfloor\right) +\frac{1}{6}f\left (\left\lfloor\frac{N}{5}\right\rfloor\right) +\frac{1}{6}f\left (\left\lfloor\frac{N}{6}\right\rfloor\right)$

右边也包含了 $f(N)$，看起来无法通过递归计算，但我们可以通过将左边移项并乘以 $\frac{6}{5}$ 来得到

$\color{green}{f (N)= \frac{6}{5}Y +\frac{1}{5}f\left (\left\lfloor\frac{N}{2}\right\rfloor\right) +\frac{1}{5}f\left (\left\lfloor\frac{N}{3}\right\rfloor\right) +\frac{1}{5}f\left (\left\lfloor\frac{N}{4}\right\rfloor\right) +\frac{1}{5}f\left (\left\lfloor\frac{N}{5}\right\rfloor\right) +\frac{1}{5}f\left (\left\lfloor\frac{N}{6}\right\rfloor\right)}$

因此，我们可以通过记忆化递归来计算。（关于计算复杂度，稍后会提到）

<span style="color:#92d050">原始问题</span>

考虑原始问题。将期望值记为 $f(N)$。由于有 2 种操作，我们选择较小的期望值是最优的。

$f(N)=\min\left(X+f\left(\left\lfloor\frac{N}{A}\right\rfloor\right), \frac{6}{5}Y +\frac{1}{5}f\left(\left\lfloor\frac{N}{2}\right\rfloor\right) +\frac{1}{5}f\left(\left\lfloor\frac{N}{3}\right\rfloor\right) +\frac{1}{5}f\left(\left\lfloor\frac{N}{4}\right\rfloor\right) +\frac{1}{5}f\left(\left\lfloor\frac{N}{5}\right\rfloor\right) +\frac{1}{5}f\left(\left\lfloor\frac{N}{6}\right\rfloor\right) \right)$

因此，我们可以通过记忆化递归来计算。

为了计算 $f(N)$，我们需要注意 $\displaystyle \left\lfloor\frac{\left\lfloor\frac{N}{a}\right\rfloor}{b}\right\rfloor=\left\lfloor\frac{N}{ab}\right\rfloor$，因此 f (N) 只出现在能够写成 $m=2^p3^q5^r$ 的整数 m 的地方。

这样的 m 最多有 $O((\log N)^3)$ 个，因此总体计算复杂度为 $O((\log N)^3)$。

* * *

<span style="color:#92d050">摘要</span>

与[官方解释](https://atcoder.jp/contests/abc350/editorial/9812)相同，我们将寻找的期望值记为 $f(N)$。另外，问题中的两种操作分别称为操作 A 和操作 B。

如果直接对原问题进行模型建立，可以得到以下方程：

$$
 f(N) = \min \left( X + f \left( \left\lfloor \frac{N}{A} \right\rfloor \right), Y + \frac{1}{6} \sum_{i = 1}^6 f \left( \left\lfloor \frac{N}{i} \right\rfloor \right) \right). 
$$

在[官方解释](https://atcoder.jp/contests/abc350/editorial/9812)中可能有些含糊，但是由于存在 $\min$ ，不能简单地通过代数变换去除右边的 $f(N)$。

因此，我们可以将问题中的两种操作替换为以下两种操作，以便更容易讨论。通过这种替换，我们可以得到与[官方解释](https://atcoder.jp/contests/abc350/editorial/9812)相同的方程。

-   支付 $X$ 日元。将 $N$ 替换为 $\left\lfloor N / A \right\rfloor$。（不变）
-   “支付 $Y$ 日元，掷一个均匀分布的骰子，直到出现 2 到 6 之间的整数为止”。将出现的整数 $b$ 用于将 $N$ 替换为 $\left\lfloor N / b \right\rfloor$。

如果操作 B 是最小化期望值的最佳操作，则即使进行操作 A，也不会带来额外收益。因此，即使通过上述替换，期望值也不会改变。

<span style="color:#92d050">后一操作的期望值</span>

关于后一操作的期望值，我们可以通过以下方法进行建模。

<span style="color:#00b0f0">直到出现 2 以上的数为止所支付的金额的期望值</span>

掷骰子 $i \geq 1$ 次并且直到出现 2 以上的数的概率，即第 $i$ 次仍然支付 $Y$ 日元掷骰子的概率为 $(1/6)^{i-1}$。因此支付金额的期望值如下：

$$
 \sum_{i = 1}^{\infty} Y \cdot \left( \frac{1}{6} \right)^{i-1} = \frac{6}{5} Y. 
$$

参考：[无穷等比数列的收敛和发散条件以及证明等 | 高中数学优美物语](https://manabitimes.jp/math/1055)

$$
a+ar+ar^2+\dots=\frac{a}{1-r}(-1<r(\text{Common radio})<1)
$$

<span style="color:#00b0f0">出现 2 以上的数后的期望值</span>

以 $1/5$ 的概率，$N$ 可以被替换为 $\lfloor N / 2 \rfloor, \lfloor N / 3 \rfloor, \lfloor N / 4 \rfloor, \lfloor N / 5 \rfloor, \lfloor N / 6 \rfloor$ 中的一个。因此，期望值为：

$$
 \frac{1}{5} \cdot f \left(\left\lfloor \frac{N}{2} \right\rfloor \right) + \frac{1}{5} \cdot f \left(\left\lfloor \frac{N}{3} \right\rfloor \right) + \frac{1}{5} \cdot f \left(\left\lfloor \frac{N}{4} \right\rfloor \right) + \frac{1}{5} \cdot f \left(\left\lfloor \frac{N}{5} \right\rfloor \right) + \frac{1}{5} \cdot f \left(\left\lfloor \frac{N}{6} \right\rfloor \right). 
$$

将上述两个期望值相加，得到的结果与[官方解释](https://atcoder.jp/contests/abc350/editorial/9812)中 $\min$ 内的第二项相匹配。

---

### Code
转移方程：

$f(N)=\min\left(X+f\left(\left\lfloor\frac{N}{A}\right\rfloor\right), \frac{6}{5}Y +\frac{1}{5}f\left(\left\lfloor\frac{N}{2}\right\rfloor\right) +\frac{1}{5}f\left(\left\lfloor\frac{N}{3}\right\rfloor\right) +\frac{1}{5}f\left(\left\lfloor\frac{N}{4}\right\rfloor\right) +\frac{1}{5}f\left(\left\lfloor\frac{N}{5}\right\rfloor\right) +\frac{1}{5}f\left(\left\lfloor\frac{N}{6}\right\rfloor\right) \right)$

```cpp
#define int long long
map<int, double>mp;
int a, x, y;
double f(int n) {
    if (!n)return 0;
    if (mp.count(n))return mp[n];
    return mp[n] = min(x + f(n / a), 1.2 * y + 0.2 * (f(n / 2) + f(n / 3) + f(n / 4) + f(n / 5) + f(n / 6)));
}
void solve() {
    int n;cin >> n >> a >> x >> y;
    printf("%.10f", f(n));
}
```

## ABC 351 D - Grid and Magnet
有一个行数为 $H$ 列数为 $W$ 的网格。有些单元格（可能为零）包含磁铁。  
网格的状态由长度为 $W$ 的 $H$ 个字符串 $S_1, S_2, \ldots, S_H$ 表示。如果 $S_i$ 的 $j$ 个字符是 "#"，则表示从上往下 $i$ 行、从左往上 $j$ 列的单元格中有磁铁；如果是"."，则表示单元格是空的。

身穿铁甲的高桥可以在网格中做如下移动：

- 如果与当前单元格垂直或水平相邻的任何一个单元格中含有磁铁，他就不能移动。
- 否则，他可以移动到任何一个垂直或水平相邻的单元格。  
    但是，他不能离开网格。

对于每个没有磁铁的单元格，将其自由度定义为他从该单元格重复移动所能到达的单元格数。求网格中所有没有磁铁的单元格的最大自由度。

这里，在自由度的定义中，"他可以通过重复移动到达的单元格 "指的是从初始单元格通过一定的移动序列（可能是零移动）可以到达的单元格。不一定要有一个移动序列能从初始单元格开始访问所有这些可到达的单元格。具体来说，每个单元格本身（没有磁铁）总是包含在从该单元格可到达的单元格中。

>这个题目在赛时 `cnt` 数组开小了 $\dots$ 没有报 RE，却是 WA

总体思路较为简单，将 `#` 周围的标记为 1，将走过的路标记为 2，这样使得每次进入一个连通块时只访问一次标记为 1/2 的，这样就能算出在每个连通块内能走的路程。
```cpp
char s[1010][1010];
int vis[1010][1010], dx[] = {0,0,1,-1}, dy[] = {1,-1,0,0};
void solve() {
    int n, m;cin >> n >> m;
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= m;j++) {
            cin >> s[i][j];
            if (s[i][j] == '#') {
                if (i - 1 >= 1)vis[i - 1][j] = 1;
                if (i + 1 <= n) vis[i + 1][j] = 1;
                if (j + 1 <= m) vis[i][j + 1] = 1;
                if (j - 1 >= 1) vis[i][j - 1] = 1;
            }
        }
    }
    int k = 0, ans = 1;
    auto bfs = [&](int sx, int sy) {
        map<pair<int, int>, int>once;
        queue<pair<int, int>>q;q.push({sx,sy});vis[sx][sy] = 2;k++;
        while (q.size()) {
            auto [x, y] = q.front();q.pop();
            for (int i = 0;i < 4;i++) {
                int a = x + dx[i], b = y + dy[i];
                if (a < 1 || b<1 || a>n || b>m || vis[a][b] == 2 || s[a][b] == '#')continue;
                if (vis[a][b] == 1) {
                    if (!once.count({a,b})) {
                        once[{a, b}] = 1; k++;
                    }
                    continue;
                }
                q.push({a,b});vis[a][b] = 2;k++;
            }
        }
        };
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= m;j++) {
            if (s[i][j] == '.' && !vis[i][j]) {
                k = 0;
                bfs(i, j);
                ans = max(ans, k);
            }
        }
    }
    cout << ans << '\n';
}
```

## ABC 351 E - Jump Distance Sum
在坐标平面上，有 $N$ 个点 $P_1, P_2, \ldots, P_N$ ，其中点 $P_i$ 的坐标为 $(X_i, Y_i)$ 。  
两点 $A$ 与 $B$ 之间的距离 $\text{dist}(A, B)$ 定义如下：

> 一只兔子最初位于点 $A$ 。  
> 位置为 $(x, y)$ 的兔子可以一次跳到 $(x+1, y+1)$ 、 $(x+1, y-1)$ 、 $(x-1, y+1)$ 或 $(x-1, y-1)$ 。  
> $\text{dist}(A, B)$ 被定义为从 $A$ 点跳到 $B$ 点所需的最少跳跃次数。  
> 如果经过任意次数的跳跃都无法从点 $A$ 到达点 $B$ ，则设为 $\text{dist}(A, B) = 0$ 。

计算 $$\displaystyle\sum_\{i=1\}^\{N-1\}\displaystyle\sum_\{j=i+1\}^N \text\{dist\}(P_i, P_j)$$

### Solution

类似题目：
[P3964  松鼠聚会 ](https://www.luogu.com.cn/problem/P3964)

---
**将切比雪夫距离转化为曼哈顿距离**：$\max(\mid x_{1}-x_{2}\mid,\mid y_{1}-y_{2}\mid)\implies\mid x_{1}-x_{2}\mid+\mid y_{1}-y_{2}\mid$

>[!tip]- $\text{Chebyshev} \to \text{Manhattan }$
> 首先，通过绕原点旋转 $45$ 度并按 $\sqrt{2}$ 倍缩放的变换，原点为 $(X,Y)$ 的点移动到 $(X+Y,X-Y)$。设变换后点的坐标为 $(x_i,y_i)$，则有 $x_i=X_i+Y_i$ 和 $y_i=X_i-Y_i$。
> 
> 接下来，我们考虑距离 $\text{dist}(A,B)$ 的定义如何改变。在原始定义中，兔子可以从 $(X,Y)$ 跳到 $(X+1,Y+1)$、$(X+1,Y-1)$、$(X-1,Y+1)$ 和 $(X-1,Y-1)$；因此，在变换后，它可以从 $(X+Y,X-Y)$ 跳到 $(X+Y+2,X-Y)$、$(X+Y,X-Y+2)$、$(X+Y,X-Y-2)$ 和 $(X+Y-2,X-Y)$。将 $x=X+Y$ 和 $y=X-Y$ 代入，可以得到它可以从 $(x,y)$ 跳到 $(x+2,y)$、$(x,y+2)$、$(x,y-2)$ 和 $(x-2,y)$。从而，从 $A$ 到 $B$ 的最小跳数就是 $\text{dist}(A,B)$ 的定义（如果无法到达则为 $0$）。
> 
> 接下来，我们考虑经过变换后的问题。也就是说，我们令 $P_i=(x_i,y_i)$，定义 $\text{dist}(A,B)$，并考虑 $\displaystyle\sum_{i=1}^{N-1}\displaystyle\sum_{j=i+1}^N \text{dist}(P_i,P_j)$，其中 $\text{dist}(A,B)$ 的定义如上所述。显然，这给出的答案与原问题相同。
> 
> 我们进一步考虑 $A=(x_1,y_1)$、$B=(x_2,y_2)$ 的情况。如果 $x_1\not\equiv x_2 \pmod{2}$ 或 $y_1\not\equiv y_2 \pmod{2}$，则兔子无法从 $A$ 到 $B$，因此 $\text{dist}(A,B)=0$。否则，它将恰好是曼哈顿距离的一半，即 $\frac{1}{2}(\lvert x_1-x_2\rvert+\lvert y_1-y_2\rvert)$。

旋转 45° 并放大 $\sqrt{ 2 }$ 倍后转化为曼哈顿距离：
由 $x_i=X_i+Y_i$ 和 $y_i=X_i-Y_i$ 可以推出 $x_{i},y_{i}$ 是同奇偶性的

$N$ 个点可以被分为两组：$x_i$ 和 $y_i$ 都是偶数，或者 $x_i$ 和 $y_i$ 都是奇数。对于属于不同组的两点 $A$ 和 $B$，$\text{dist}(A,B)=0$；对于属于同一组的两个不同点，$\text{dist}(A,B)=\frac{1}{2}(\lvert x_1-x_2\rvert+\lvert y_1-y_2\rvert)$。

设 $S$ 为其中 $x_{i},y_{i}$ 都为偶数或奇数的集合，由于该题是两两计算，先后计算并不影响结果，所以可以先**降序排列**简化运算：

对于 $x_{i}$： ($y_{i}$ 同理)
$$\displaystyle \frac\{1\}\{2\}\sum\limits_\{i=1\}^\{\mid S\mid\}\sum\limits_\{j=i+1\}^\{\mid S\mid\}\mid x_\{j\}-x_\{i\}\mid=\displaystyle \frac\{1\}\{2\}\sum\limits_\{i=1\}^\{\mid S\mid\}\sum\limits_\{j=i+1\}^\{\mid S\mid\} (x_\{i\}-x_\{j\})=\frac\{1\}\{2\}\sum\limits_\{i=1\}^\{\mid S\mid\}(\left|S\right|-1-2i)$$

```cpp
#define int long long
void solve() {
    int n;cin >> n;vector<int>  a[4];
    for (int i = 1;i <= n;i++) {
        int x, y;cin >> x >> y;
        if ((x + y) % 2 == 0) {
            a[0].push_back(x + y);a[1].push_back(x - y);
        } else {
            a[2].push_back(x + y);a[3].push_back(x - y);
        }
    }
    int ans = 0;
    for (int i = 0;i < 4;i++) {
        sort(a[i].rbegin(), a[i].rend());
        for (int j = 0;j < a[i].size();j++) {
            ans += a[i][j] * (a[i].size() - 1 - 2 * j);
        }
    }
    cout << ans / 2 << '\n';
}
```

## ABC 351 F - Double Sum
给你一个整数序列 $A = (A_1, A_2, \dots, A_N)$ 。  
请计算以下表达式：

$$\displaystyle \sum_\{i=1\}^N \sum_\{j=i+1\}^N \max(A_j - A_i, 0)$$

>约束条件保证答案小于 $2^{63}$ 。

### Solution
<span style="color:#92d050">树状数组/线段树/扫描线</span>

>树状数组求 $k_{th}$ 小的元素：[牛客](https://ac.nowcoder.com/acm/contest/view-submission?submissionId=66730392)

> [!NOTE]- 官方题解
> 在这里，对于一个固定的 $i$，对双重求和的贡献可以表示为
> 
> $$
> \sum_{i < j} \max(A_j - A_i, 0)
> = \sum_{i < j,\, A_i \le A_j} (A_j - A_i).
> $$
> 
> 也就是：对固定的 $i$，只需要知道右侧满足 $A_i \le A_j$ 的那些 $A_j$ 的总和，以及它们的个数。
> 
> 利用这个事实，可以通过扫描线算法来解决这个问题，方法如下。
> 
> - 准备一个管理以下两个值的数据结构：
>   - 支持两种查询的多重集 $S_0$，检索不小于 $x$ 的元素数。
>   - 支持两种查询的多重集 $S_1$，检索不小于 $x$ 的元素之和。
> - 同样，准备一个变量 $\mathrm{ans}$ 来存储答案。最初，让 $\mathrm{ans} = 0$。
> - 对于每个 $i = N, N-1, \dots, 2, 1$，执行以下操作。
>   - 用 $x = A_i$ 对 $S_0$ 进行查询，并将响应值命名为 $c$。
>   - 用 $x = A_i$ 对 $S_1$ 进行查询，并将响应值命名为 $s$。
>   - 将 $s - c \times A_i$ 加到 $\mathrm{ans}$ 中。
>   - 将 $A_i$ 插入到 $S_0$ 和 $S_1$ 中。
> - 打印出 $\mathrm{ans}$ 的结果值。
> 
> $S_0$ 和 $S_1$ 可以通过树状数组和坐标压缩来实现；它们可以在 $\mathrm{O}(\log N)$ 的时间内处理每个查询。

落地实现时，把所有 $A_i$ 做坐标压缩，再开两棵树状数组：一棵维护计数，一棵维护值之和。倒序扫描，每次查询“右侧不小于 $A_i$ 的个数与总和”，再把当前值插进去即可。
```cpp
class FenwickTree {
private:
    vector<long long> bit;  // 1-indexed
    int n;

public:
    FenwickTree(int n) {
        this->n = n;
        bit.assign(n + 1, 0);
    }

    FenwickTree(vector<int> a) : FenwickTree(a.size()) {
        for (size_t i = 0; i < a.size(); i++)add(i + 1, a[i]);
    }

    long long sum(int i) {
        long long ans = 0;
        while (i)ans += bit[i], i -= i & -i;
        return ans;
    }

    long long sum(int l, int r) {
        return sum(r) - sum(l - 1);
    }

    void add(int i, int delta) {
        while (i <= n)bit[i] += delta, i += i & -i;
    }
};

int main() {
    int N;
    cin >> N;
    vector<int> A(N);
    for (int& x : A) cin >> x;

    vector<int> B = A;
    sort(B.begin(), B.end());
    B.erase(unique(B.begin(), B.end()), B.end());
    int M = B.size();

    FenwickTree sum0(M), sum1(M);
    long long ans = 0;
    for (int i = N - 1; i >= 0; --i) {
        int k = lower_bound(B.begin(), B.end(), A[i]) - B.begin() + 1;
        long long c = sum0.sum(k, M);
        long long s = sum1.sum(k, M);
        ans += s - c * A[i];
        sum0.add(k, 1);
        sum1.add(k, A[i]);
    }
    cout << ans << '\n';
}
```

## ABC 357 D - 88888888
对于正整数 $N$ ，设 $V_N$ 是由 $N$ 恰好连接 $N$ 次所组成的整数。  
更确切地说，把 $N$ 看作一个字符串，连接它的 $N$ 份，并把结果看作一个整数，得到 $V_N$ 。  

求 $V_N$$\bmod998244353$ 

考察能否想到等比数列公式...[^1]

 $s=n.size()$

$\displaystyle V_{n}=n+n\times10^{s^1}+n\times 10^{s^2}+\dots+n\times 10^{s^{n-1}}=n(1+10^{s^1+\dots+10^{s^{n-1}}})=\frac{n(10^{sn}-1)}{10^s-1}\pmod {998244353}$

知道等比数列即解决。

>注意：这里 $s\times n\leq 18\times10^{18}<2\times10^{19}$，超出了 long long 的范围，可以强转 int128 或者将 $10^s$ 和 $10^n$ 分开计算，这里直接开 int128.

```cpp
void solve() {
    int n;cin >> n;
    int s = to_string(n).size();
    int x = n % mod * (qpow(10, (__int128_t)s * n) % mod - 1) % mod;x %= mod;
    int y = qpow(10, s) - 1;y %= mod;
    cout << x * qpow(y, mod - 2) % mod << '\n';
}
```

[^1]: 等比数列求和公式：$\frac{a_{1}(1-q^n)}{1-q}$

## ABC 357 E - Reachability in Functional Graph
有一个有向图，图中有 $N$ 个顶点，编号为 $1$ 至 $N$ ，有 $N$ 条边。  
每个顶点的外度为 $1$ ，顶点 $i$ 的边指向顶点 $a_i$ 。  
计算顶点 $(u, v)$ 与顶点 $u$ 之间可以到达顶点 $v$ 的顶点对 $(u, v)$ 的个数。

这里，如果存在长度为 $K+1$ 的顶点序列 $w_0, w_1, \dots, w_K$ 且满足以下条件，则顶点 $v$ 可以从顶点 $u$ 到达。其中，如果 $u = v$ 总是可达的。

- $w_0 = u$ .
- $w_K = v$ .
- 每个 $0 \leq i \lt K$ 都有一条从顶点 $w_i$ 到顶点 $w_{i+1}$ 的边。

### Solution
 基环树 / 拓扑排序 /缩点

$n$ 个点 $n$ 条有向边即构成了一个基环树, 一定**有且仅有**一个环。**断环和分类讨论**是基环树常用的手段。

#### 法一 ：拓扑排序

这个题目可以分为三种情况：

- 对于一条链：设链上的点个数为 $x$，则对数为 $\frac{n(n+1)}{2}$
- 对于一个环：设环上的点个数为 $y$，则对数为 $y^2$
- 对于链和环结合的部分：则增加的对数为 $x \times y$

将各个部分加起来即可。

示例图：
![](./Pasted%20image%2020240609211726.png)

代码：先进行拓扑排序顺便将链上的部分计算了，在环中部分，计算出 `环中点的个数` 和 `能到环的点的个数` 即可。

```cpp
#define int long long
void solve() {
    int n;cin >> n;
    vector<int> to(n + 1), in(n + 1);
    for (int i = 1;i <= n;i++) {
        cin >> to[i];
        ++in[to[i]];
    }
    queue<int>q;
    for (int i = 1;i <= n;i++) {
        if (!in[i])q.push(i);
    }
    int ans = 0;
    vector<int>f(n + 1);
    while (q.size()) {
        auto x = q.front();q.pop();
        ++f[x];
        f[to[x]] += f[x];
        ans += f[x];
        if (--in[to[x]] == 0){
            q.push(to[x]);
        }
    }
    vector<int> vis(n + 1);

    for (int i = 1;i <= n;i++) {
        if (in[i] > 0) {
            int cnt = 0, sum = 0;
            for (int j = i;!vis[j];j = to[j]) {
                ++cnt;
                sum += f[j];
                vis[j] = 1;
            }
            ans += cnt * (cnt + sum);
        }
    }
    cout << ans << '\n';
}
```

#### 法二 ：缩点

首先还是找环，找到环后将环缩成一个点，这样对于这个图就好处理了。

对于这个环的权重为 `环中点的个数`，对于其他的点，权重即为 1。

然后这个图就变为了一个有向无环图(DAG)，只需要记忆化搜索即可解决本题。

代码：

```cpp
#define int long long
void solve() {
    int n;cin >> n;
    vector<int> a(n + 1), vis(n + 1), f(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i];
    for (int i = 1;i <= n;i++) {//找环的步骤
        if (vis[i])continue;
        int u = i;
        while (1) {
            if (vis[u]) {
                if (vis[u] == i) {
                    int x = a[u], cnt = 1;
                    while (x != u) {
                        x = a[x];cnt++;
                    }
                    f[u] = cnt;
                    x = a[u];
                    while (x != u) {
                        f[x] = cnt;x = a[x];
                    }
                }
                break;
            }
            vis[u] = i;
            u = a[u];
        }
    }
    int ans = 0;
    auto dfs = [&](auto self, int x) {
        if (f[x])return f[x];
        return f[x] = self(self, a[x]) + 1;
        };
    for (int i = 1;i <= n;i++)ans += dfs(dfs, i);
    cout << ans << '\n';
}
```

## ABC 357 F - Two Sequence Queries
给你长度为 $N$ 、 $A=(A_1,A_2,\ldots,A_N)$ 和 $B=(B_1,B_2,\ldots,B_N)$ 的序列。  
您还得到了 $Q$ 个查询，需要按顺序处理。

查询有三种类型：

- `1 l r x` : 在 $A$ 数组的 $[l,r]$ 区间加 $x$  
- `2 l r x` : 在 $B$ 数组的 $[l,r]$ 区间加 $x$  
- `3 l r` : 查询 $\displaystyle\sum_{i=l}^r (A_i\times B_i)$$\bmod998244353$ 

### Solution
线段树

>线段树经典题目

对于单个点 $(a_{i},b_{i})$ 加上 $(x,y)$，则：

则 $a_{i}\times b_{i}=(a_{i}+x)(b_{i}+y)=a_{i}b_{i}+xb_{i}+ya_{i}+xy$ 

对于区间 $[l,r]$ 分别加上 $x,y$，则：

$\displaystyle \sum\limits_{i=l}^r (a_{i}\times b_{i})=\sum\limits_{i=l}^r(a_{i}b_{i}+xb_{i}+ya_{i}+xy)=\sum\limits_{i=l}^r a_{i}b_{i}+x\sum b_{i}+y\sum\limits_{i=l}^r a_{i}+xy(r-l+1)$

这样只需要维护 4 个信息：$\displaystyle \sum a_{i},\sum b_{i},\sum a_{i}b_{i},len$

对于 $a_{i},b_{i}$ 本身，$\displaystyle \sum\limits_{i=l}^r(a_{i}+x)=\sum\limits_{i=l}^ra_{i}+(r-l+1)x,\sum\limits_{i=l}^r(b_{i}+x)=\sum\limits_{i=l}^rb_{i}+(r-l+1)x$

需要开记录 $\sum a_{i},\sum b_{i},\sum a_{i}b_{i}$ 信息的数组 $sa,sb,sab$，和 `lazy tag`：`ta`, `tb`

代码：(两种码风：结构体(我觉得这个方便一点)和直接开数组)

```cpp
#define lc u<<1
#define rc u<<1|1
constexpr int mod = 998244353, N = 2e5 + 10;
int a[N], b[N];
struct Tree {
    int l, r, sa, sb, sab, ta, tb;
}tr[N << 2];
void pushup(int u) {
    tr[u].sa = (tr[lc].sa + tr[rc].sa) % mod;
    tr[u].sb = (tr[lc].sb + tr[rc].sb) % mod;
    tr[u].sab = (tr[lc].sab + tr[rc].sab) % mod;
}
void ca(int u, int x) {
    tr[u].sa = (tr[u].sa + x * (tr[u].r - tr[u].l + 1)) % mod;
    tr[u].sab = (tr[u].sab + x * tr[u].sb) % mod;
    tr[u].ta = (tr[u].ta + x) % mod;
}
void cb(int u, int x) {
    tr[u].sb = (tr[u].sb + x * (tr[u].r - tr[u].l + 1)) % mod;
    tr[u].sab = (tr[u].sab + x * tr[u].sa) % mod;
    tr[u].tb = (tr[u].tb + x) % mod;
}
void pushdown(int u) {
    ca(lc, tr[u].ta);
    ca(rc, tr[u].ta);
    tr[u].ta = 0;
    cb(lc, tr[u].tb);
    cb(rc, tr[u].tb);
    tr[u].tb = 0;
}
void build(int u, int l, int r) {
    tr[u] = {l,r,a[l],b[l],a[l] * b[l] % mod,0,0};
    if (l == r)return;
    int m = l + r >> 1;
    build(lc, l, m);
    build(rc, m + 1, r);
    pushup(u);
}
void modify1(int u, int l, int r, int x) {
    if (l <= tr[u].l && tr[u].r <= r) {
        ca(u, x);
        return;
    }
    int m = tr[u].l + tr[u].r >> 1;
    pushdown(u);
    if (l <= m) modify1(lc, l, r, x);
    if (r > m) modify1(rc, l, r, x);
    pushup(u);
}
void modify2(int u, int l, int r, int x) {
    if (l <= tr[u].l && tr[u].r <= r) {
        cb(u, x);
        return;
    }
    int m = tr[u].l + tr[u].r >> 1;
    pushdown(u);
    if (l <= m) modify2(lc, l, r, x);
    if (r > m) modify2(rc, l, r, x);
    pushup(u);
}
int query(int u, int l, int r) {
    if (l <= tr[u].l && tr[u].r <= r) return tr[u].sab;
    int m = tr[u].l + tr[u].r >> 1;
    pushdown(u);
    int sum = 0;
    if (l <= m) sum = (sum + query(lc, l, r)) % mod;
    if (r > m) sum = (sum + query(rc, l, r)) % mod;
    return sum;
}
void solve() {
    int n, q;cin >> n >> q;
    for (int i = 1;i <= n;i++)cin >> a[i];
    for (int i = 1;i <= n;i++)cin >> b[i];
    build(1, 1, n);
    while (q--) {
        int op, l, r;cin >> op >> l >> r;
        if (op == 1) {
            int x;cin >> x;
            modify1(1, l, r, x);
        } else if (op == 2) {
            int x;cin >> x;
            modify2(1, l, r, x);
        } else {
            cout << query(1, l, r) << '\n';
        }
    }
}
```

## ABC 358 C - Popcorn
在 AtCoder 乐园里，有 $N$ 个爆米花摊位，编号从 $1$ 到 $N$ 。它们有 $M$ 种不同口味的爆米花，标号为 $1, 2, \dots, M$ ，但并不是每个摊位都出售所有口味的爆米花。$1\leq N,M\leq 10$

高桥获得了关于每个摊位出售哪些口味爆米花的信息。这些信息由长度为 $M$ 的 $N$ 字符串 $S_1, S_2, \dots, S_N$ 表示。如果 $S_i$ 的 $j$ 个字符是 "o"，则表示 $i$ 摊位出售 $j$ 口味的爆米花。如果是 "x"，则表示 $i$ 号摊位不出售 $j$ 口味的爆米花。每个摊位至少出售一种口味的爆米花，每种口味的爆米花至少在一个摊位上出售。

高桥想尝遍所有口味的爆米花，但又不想走动太多。求高桥至少要去多少个摊位才能买到所有口味的爆米花？

根据数据量，直接**二进制枚举**即可。
```cpp
void solve() {
    int n, m;cin >> n >> m;
    vector<string> s(n);
    for (int i = 0;i < n;i++) {
        cin >> s[i];
    }
    int ans = 1e9;
    for (int i = 1;i < (1 << n);i++) {
        vector<int> vis(m);
        for (int j = 0;j <= __lg(i);j++) {
            if (((i >> j) & 1)) {
                for (int k = 0;k < m;k++) {
                    if (s[j][k] == 'o') {
                        vis[k] = 1;
                    }
                }
            }
        }
        int ok = 1;
        for (int j = 0;j < m;j++) {
            if (!vis[j])ok = 0;
        }
        if (ok)ans = min(ans, __builtin_popcount(i));
    }
    cout << ans << '\n';
}
```

## ABC 358 E - Alphabet Tiles
求长度在 $[1,k]$ 之间的由大写英文字母组成的字符串中，满足以下条件的字符串的个数 (模为 $998244353$ )：

- 对于满足 $1 \leq i \leq 26$ 的每个整数 $i$ ，下面的条件都成立：
    - $a_{i}$ 满足 `a[i] = 'a' + i - 1` 
    - 字符串中 $a_{i}$ 的出现次数介于区间 $[0,c_{i}]$。

$1\leq K\leq 1000,0\leq C_{i}\leq 1000$

### Solution
DP+组合数, 是个原题：[ABC234_F](https://atcoder.jp/contests/abc234/tasks/abc234_f)

典 ——和 P1077 摆花基本一样

$dp_{i,j}$ 代表使用前 $i$ 种字母，已经组成了长度为 $j$ 的字符串的方案数。

转移方程：$\displaystyle dp_{i,j}=\sum\limits_{k=0}^{\min(c_{i},j)} dp_{i-1,j-k}\times \binom{j}{k}$

>前 $i$ 种字母长度为 $j$ 的字符串可以由前 $i-1$ 种字母长度为 $j-k$ 的字符串加上 $k$ 个该字符转移而来，而每种可以转移过来的方式有多种(在长度为 $j$ 的字符串种有 $k$ 个该字符可以任意调换位置，方案数 $\binom{j}{k}$)

```cpp
#define int long long
constexpr int mod = 998244353;
int a[27], f[27][1010], c[1010][1010];
void solve() {
    int n;cin >> n;
    for (int i = 1;i <= 26;i++)cin >> a[i];

    for (int i = 0;i <= n;i++)c[i][0] = 1, c[i][1] = i;
    for (int i = 2;i <= n;i++) {
        for (int j = 2;j <= n;j++) {
            c[i][j] = c[i - 1][j - 1] + c[i - 1][j];c[i][j] %= mod;
        }
    }

    f[0][0] = 1;
    for (int i = 1;i <= 26;i++) {
        for (int j = 0;j <= n;j++) {
            for (int k = 0;k <= min(a[i], j);k++) {
                f[i][j] += f[i - 1][j - k] * c[j][k];f[i][j] %= mod;
            }
        }
    }
    int ans = 0;
    for (int i = 1;i <= n;i++) {
        ans += f[26][i];ans %= mod;
    }
    cout << ans << '\n';
}
```

> [!question]- F - Easiest Maze
>  
> 斯努克计划在 AtCoder 乐园建造一个迷宫作为新景点。迷宫是一个有 $N$ 行和 $M$ 列的网格，右上角单元格的顶边是入口，右下角单元格的底边是出口。他将通过在相邻单元格之间适当放置墙壁来创建迷宫。
> 
> 他喜欢简单的迷宫，因此他希望从入口到出口的路径正好经过 $K$ 个单元格，且没有任何分支。请判断是否可能创建这样一个迷宫，如果可能，请建造一个。
> 
> 例如，在下图中， $N=3$ 和 $M=3$ ，并在实线处设置墙壁（除入口和出口外，墙壁总是设置在外围）。在这种情况下，从入口到出口的路径正好经过 $7$ 个单元格，没有任何分支。
> ![](https://img.atcoder.jp/abc358/74c8a9b7121eee699525805e4974b285.png)
> 
> 下面是一个正式的说明。
> 
> 有一个网格，网格中有 $N$ 行和 $M$ 列。让 $(i, j)$ 表示位于从上往下第 $i$ 行和从左往上第 $j$ 列的单元格。对于每一对边相邻的单元格，你可以决定是否在它们之间放置一堵墙。确定是否有可能放置墙来满足以下条件，如果有可能，请构建一个这样的放置方式。
> 
> > 考虑一个有 $NM$ 个顶点的无向图 $G$ 。 $G$ 的每个顶点都由一对整数 $(i,j)\ (1\leq i\leq N, 1\leq j\leq M)$ 唯一标注。两个不同的顶点 $(i_1,j_1)$ 和 $(i_2,j_2)$ 由一条边连接，当且仅当 $|i_1-i_2|+|j_1-j_2|=1$ 和网格上对应的单元格 $(i_1,j_1)$ 和 $(i_2,j_2)$ 之间没有墙。
> >
> > 条件：存在一条顶点为 $K$ 的简单路径连接两个顶点 $(1,M)$ 和 $(N,M)$ ，且包含顶点 $(1,M)$ 和 $(N,M)$ 的连通部分仅由该路径组成。
>

## ABC 358 G - AtCoder Tour
AtCoder Land 由一个网格表示，网格中有 $H$ 行和 $W$ 列。让 $(i, j)$ 表示第 $i$ 行和第 $j$ 列上的单元格。

高桥从 $(S_i, S_j)$ 单元格开始，重复下面的操作 $K$ 次：

- 他要么停留在当前单元格，要么移动到相邻单元格。在此操作之后，如果他位于 $(i, j)$ 单元格，他将获得 $A_{i, j}$ 的趣味值。

请找出他能获得的最大总乐趣值。

### Solution
$\displaystyle dp_{op,i,j}=\max(dp_{op,i,j},dp_{op-1,prei,prej}+A_{i,j})$
时间复杂度：$O(n^2m^2)$
```cpp
#define int long long
int dx[] = {1, 0, -1, 0, 0};
int dy[] = {0, 1, 0, -1, 0};
void solve() {
    int n, m, K;
    cin >> n >> m >> K;
    int Si, Sj;
    cin >> Si >> Sj;
    Si--;
    Sj--;
    vector<vector<int>> A(n, vector<int>(m));
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            cin >> A[i][j];
        }
    }
    int N = min(n * m, K);
    vector<vector<vector<int>>> dp(N + 1, vector<vector<int>>(n, vector<int>(m, INT_MIN)));
    dp[0][Si][Sj] = 0;
    for (int i = 0; i < N; i++) {
        for (int j = 0; j < n; j++) {
            for (int k = 0; k < m; k++) {
                for (int l = 0; l < 5; l++) {
                    int x = j + dx[l];
                    int y = k + dy[l];
                    if (0 <= x && x < n && 0 <= y && y < m) {
                        dp[i + 1][x][y] = max(dp[i + 1][x][y], dp[i][j][k] + A[x][y]);
                    }
                }
            }
        }
    }
    int ans = 0;
    for (int i = 0; i < n; i++) {
        for (int j = 0; j < m; j++) {
            ans = max(ans, dp[N][i][j] + (K - N) * A[i][j]);
        }
    }
    cout << ans << '\n';
}
```

## ABC 360 E - Random Swaps of Balls
有 $N - 1$ 个白球和一个黑球。这些 $N$ 球排列成一排，黑球最初位于最左边的位置。

高桥将执行下面的操作 $K$ 次。

- 在  $[1,n]$ 之间均匀随机地选择一个整数两次。设 $a$ 和 $b$ 为所选整数。如果是 $a \neq b$ ，把左边的 $a$ 和 $b$ 交换。

经过 $K$ 次操作后，让黑球位于左边第 $x$ 个位置。求 $x$ 的期望值 modulo $998244353$ .

### Solution
组合数学/ 概率DP

> [!question] 
>
>> [!NOTE]- 我的思维过程
> > 设 $P_{i}$ 为最终经过 $K$ 次操作后的位置，容易知道：后面 $N-1$ 个球都是等价的，概率 $P_{2\sim N}$ 必然相同，只有 $P_{1}$ 可能不同
> > 
> > $P$ 的分母是 $N^{2k}$，每次选择两次是 $N^2$，共 $k$ 轮。
> > 
> > 若知道了 $P_{1}$ 的分子设为 $X$，则可以开始推导：
> > 
> > 这时 $\displaystyle P_{1}=\frac{X}{N^{2k}},P_{2}=P_{3}=P_{4}=\dots=P_{N}=\frac{1-P_{1}}{N-1}= \frac{N^{2k}-X}{N^{2k}(N-1)}$
> > 
> > $\displaystyle E=\sum \limits_{i=1}^Ni\times P_{i}=P_{1}+P_{2}\times(2+3+\dots +N)=P_{1}+\frac{(N-1)(N+2)}{2}\times P_{2}$
> > 
>>
>> $\displaystyle \implies E=\frac{\left( X+ \frac{(N+2)(N^{2k}-X)}{2} \right)}{N^{2k}}=1+\frac{N}{2}-\frac{X}{2N^{2k-1}}$
>
> $$ E=1+ \frac\{N^\{2k\}-X\}\{2N^\{2k-1\}\}=1+\left( \frac\{N\}\{2\} \right)(1-P_\{1\})$$
> 
> 
> 只需求出 $P_{1}$ 即可求出答案。然后卡住了... 组合数学得泰拉了

每次操作都有：$p=\frac{N^2-2(n-1)}{N^2}$ 的概率位置不变 $(i)$，$q=\frac{2}{N^2}$ 会变为位置 $j(j\neq i)$

即在第 $k$ 次操作之前，要计算在第 $1$ 个位置的概率，要么是不动的，要么是不在位置 1 而移动到位置 1. 只有两种选择，

**状态转移方程**：$f_{k}=f_{k-1}\times p+(1-f_{k-1})\times q$

计算出的 $f_{k}$ 即代表进行了 $k$ 轮后仍然在位置 1 的概率，即计算出了 $P_{1}$，带入公式：

$$
E= \frac{2+N(1-P_{1})}{2}
$$
>千万要注意 mod 的各种情况，防止犯低级错误！
```cpp
void solve() {
    int n, k;cin >> n >> k;
    int p = (n * n - 2 * (n - 1)) % mod * inv(n * n % mod) % mod;
    int q = 2 * inv(n * n % mod) % mod;
    vector<int> f(k + 1);
    f[0] = 1;
    for (int i = 1;i <= k;i++) {
        f[i] = (f[i - 1] * p % mod + (1 - f[i - 1] + mod) * q % mod) % mod;
    }
    cout << (2 + n * (1 - f[k] + mod) % mod) % mod * inv(2) % mod << '\n';
}
```

<span style="color:#92d050">更加容易理解的方式：</span>
与上面的思想相同都是想办法计算出 $P_{1}$。

$f_{i,0/1}$ 代表经过 $i$ 次操作在/不在位置 1 的概率

易得：在没有进行操作的时候 $f_{0,0}=1$

若经过操作在位置 1，则有两种可能：

- 本来就在位置 1，位置没有变化
- 本来不在位置 1，位置交换到了位置 1

$f_{i,0}=f_{i-1,0}\times p+f_{i-1,1}\times q$

若经过操作不在位置 1，则有两种可能：

- 本来在位置 1，位置发生了改变
- 本来不在位置 1，位置随意，只要不交换到位置 1 即可

$f_{i,1}=f_{i-1,0}\times(1-p)+f_{i-1,1}\times(1-q)$

```cpp
void solve() {
    int n, k;cin >> n >> k;
    int p = (n * n - 2 * (n - 1)) % mod * inv(n * n % mod) % mod;
    int q = 2 * inv(n * n % mod) % mod;
    vector<array<int, 2>> f(k + 1);//f[i][0/1]代表经过i次操作后在/不在位置1
    f[0][0] = 1;
    for (int i = 1;i <= k;i++) {
        f[i][0] = f[i - 1][0] * p % mod + f[i - 1][1] * q % mod;
        f[i][0] %= mod;
        f[i][1] = f[i - 1][0] * (1 - p + mod) % mod + f[i - 1][1] * (1 - q + mod) % mod;
        f[i][1] %= mod;
    }
    cout << (2 + n * (1 - f[k][0] + mod) % mod) % mod * inv(2) % mod << '\n';
}
```
