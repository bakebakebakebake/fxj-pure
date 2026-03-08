---
title: Codeforces 题解整理 2：前缀和、字符串与思维转化
description: 2023.12~2024.7 以原题解记录为主，收录前缀量、字符串与思维转化向的 Codeforces 题目。
publishDate: 2026-03-06
tags:
  - 算法竞赛
  - 题解整理
  - Codeforces
  - 前缀和
  - 字符串
  - 思维转化
language: 中文
---

> [!note] 说明
> 这一组保留原来的比赛题解片段，只按现在博客分组重新排了一下顺序，没有再把你的内容重写成统一口吻。

## 收录范围

- `CF 1994 Div.1+2 C`
- `CF 1994 Div.1+2 D`
- `CF 1994 Div.1+2 E`
- `CF 1994 Div.1+2 F`
- `CF 1996 Div.3 D`
- `CF 1996 Div.3 E`
- `CF 1907 Div.3 D`
- `CF 1907 Div.3 E`
- `CF 1907 Div.3 F`
- `CF 1921 Div.3 F`
- `CF 1933 Div.3 E`
- `CF 1941 Div.3 D`
- `CF 1941 Div.3 F`
- `CF 1968 Div.3 F`
- `CF 1981 Div.2 C`
- `CF 1981 Div.2 D`
- `CF 1937 Div.2 D`

## CF 1994 Div.1+2 C - Hungry Games
雅罗斯拉夫正在玩一款电脑游戏，在其中一个关卡中，他遇到了 $n$ 个排列成一排的蘑菇。每种蘑菇都有自己的毒性级别；从一开始的第 $i$ 个蘑菇的毒性级别为 $a_i$ 。雅罗斯拉夫可以选择两个整数 $1 \le l \le r \le n$ ，然后他的角色就会从左到右轮流逐个吃掉这个分段中的蘑菇，也就是数字为 $l, l+1, l+2, \ldots, r$ 的蘑菇。

角色的毒性等级为 $g$ ，最初等于 $0$ 。电脑游戏由数字 $x$ 定义--即任何时候的最大毒性级别。当食用毒性等级为 $k$ 的蘑菇时，会发生以下情况：

1.  角色的毒性等级会增加 $k$ 。
2.  如果 $g \leq x$ ，过程继续；否则， $g$ 变为零，过程继续。

雅罗斯拉夫感兴趣的是，有多少种方法可以选择 $l$ 和 $r$ 的值，使得 $g$ 的最终值不为零。帮助雅罗斯拉夫找到这个数字！

### Solution
DP

> [!NOTE] 新知识：
> 想要直接将某个数组做前缀和直接：`partial_sum(a.begin() + 1, a.end(), a.begin() + 1);`
>  (针对下标 1~n)

对于下标 $l$，找到后面的最小下标 $k$ 使得 $a_{l}+a_{l+1}+\dots+a_{k}>x\to pre_{k}-pre_{l-1}>x$，

即 $a_{l}+a_{l+1}+\dots+a_{k-1}\leq x\to pre_{k-1}-pre_{l-1}\leq x$，则有 $k-l$ 种满足要求。

$\implies pre_{k}-pre_{l-1}\implies0$，这个时候下标 $l\to k$ 之后结果为 0 ，若继续吃还有可能会有结果，即为 $f_{k+1}$

$f_{i}$ 代表左边界为 $i$ 的满足条件的区间个数。

DP 动态转移方程：$f_{l}=(k-l)+f_{k+1}$
```cpp
#define int long long
void solve() {
    int n, x;cin >> n >> x;
    vector<int> a(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i];
    partial_sum(a.begin() + 1, a.end(), a.begin() + 1);
    vector<int> f(n + 2);
    for (int i = n - 1;i >= 0;i--) {
        int j = upper_bound(a.begin(), a.end(), a[i] + x) - a.begin();
        f[i] = f[j] + j - i - 1;
    }
    cout << accumulate(f.begin(), f.end(), 0ll) << '\n';
}
```

## CF 1994 Div.1+2 D - Funny Game
Vanya 有一个包含 $n$ 个顶点（编号从 $1$ 到 $n$ ）和 $a$ 个 $n$ 个整数的数组的图形；最初，图形中没有边。万尼亚觉得无聊，为了找点乐子，他决定进行 $n - 1$ 次运算。

操作数 $x$ （操作数从 $1$ 开始依次编号）如下：

- 选择 $2$ 个不同的数字 $1 \leq u,v \leq n$ ，使得 $|a_u - a_v|$ 可以被 $x$ 整除。
- 在顶点 $u$ 和 $v$ 之间添加一条无向边。

使用 $n - 1$ 运算帮助凡亚得到一个连通的图，或者确定这是不可能的。

### Solution
抽屉原理

操作需要倒着进行(对答案没有影响)：从操作数 $n-1$ 开始(后面依次递减)，需要找到 $x|\left|{a_{u}-a_{v}}\right|$，即 $a_{u}\equiv a_{v}\pmod x$。

根据抽屉原理，每一次操作都一定能够找到两个点 $u,v$ 满足要求。

```cpp
void solve() {
    int n;cin >> n;
    vector<int> a(n), p(n);
    iota(p.begin(), p.end(), 0);
    vector<pair<int, int>> ans;
    for (auto& i : a)cin >> i;
    for (int i = n - 1;i >= 1;i--) {
        vector<int> occ(i, -1);
        for (auto j : p) {
            if (occ[a[j] % i] != -1) {
                ans.push_back({j, occ[a[j] % i]});
                p.erase(find(p.begin(), p.end(), j));
                break;
            }
            occ[a[j] % i] = j;
        }
    }
    cout << "YES\n";
    reverse(ans.begin(), ans.end());
    for (auto [x, y] : ans)cout << x + 1 << " " << y + 1 << "\n";
}
```

## CF 1994 Div.1+2 E - Wooden Game
有一片森林，里面有 $k$ 棵有根的树木 。伐木工蒂莫菲想通过以下操作砍伐整片森林：

- 选择其中一棵树的任意顶点的子树 ，并将其从树中移除。

蒂莫菲喜欢位运算，因此他希望删除的子树的大小的 [bitwise OR](https://en.wikipedia.org/wiki/Bitwise_operation#OR) 是最大的。请帮助他，找出他能得到的最大结果。

### Solution
这个题目所给出的树没有任何用处，只有顶点个数 $a_{i}$ 有用。

对于某个树，设每次删除的子树大小为 $d_{1},d_{2},\dots,d_{t}$ ，易得： $\sum\limits_{i=1}d_{i}=n$，且 $d_{1}|d_{2}|\dots|d_{t}\leq n$。

>若无子树大小为 $k$，可以将子树中的节点一个一个删除从而构造出 $k$

因此，对于这个树，可以构造 $[1,n]$ 中的所有答案

对于某个树，$n$ 的第 $k$ 位是 1，则可以直接构造出 $2^k$，若答案已经拥有了这个部分，则可以构造出 $2^k-1$，从而保证了最优。

>非常妙！

```cpp
void solve() {
    int k;cin >> k;
    vector<int> a(k);
    for (int i = 0;i < k;i++) {
        cin >> a[i];
        for (int j = 0;j < a[i] - 1;j++) {
            int x;cin >> x;
        }
    }
    sort(a.rbegin(), a.rend());
    int ans = 0;
    for (auto x : a) {
        for (int i = __lg(x);i >= 0;i--) {
            if ((x >> i) & 1) {
                int y = (ans >> i) & 1;
                if (y == 0) {
                    ans |= (1 << i);
                } else {
                    ans |= (1 << i) - 1;
                    break;
                }
            }
        }
    }
    cout << ans << '\n';
}
```

## CF 1994 Div.1+2 F - Stardew Valley
鹈鹕镇由 $m$ 条双向道路连接着 $n$ 座房屋。有些道路上站着 NPC。农民布巴需要在每条路上与 NPC 走一走，并与他们交谈。

帮助农夫找到一条符合以下属性的路线：

- 路线从某个房子开始，沿着道路走，最后在同一个房子结束。
- 每条道路经过次数不能超过一次。
- 所有含有 NPC 的路都要走一次，没有 NPC 的道路则不用。

可以保证：只需在有 NPC 的道路上行走，就可以从任何其他房屋到达任何其他房屋。

### Solution
欧拉图

类似的题目还有：[F - Perils in Parallel](https://atcoder.jp/contests/abc155/tasks/abc155_f)

题目意思即这个图是 `NPC 边的全集` 加上 `无 NPC 边的子集` (即删除一些无 NPC 的边) ，求这个图的欧拉回路。

>拥有欧拉图的条件是每个顶点的度数都是偶数

>对于删除单独的某一条边，可以使用代码中的技巧，`g[u].push(i),edge[i]=u^v->int to=edge[i]^u` 。

对于这个题，可能需要删除部分无 NPC 的边组成的图来做欧拉回路。只要图中的每个顶点的度数都是偶数，则一定存在欧拉回路，否则一定不存在欧拉回路。

将图中无 NPC 的边组成一个图，对于这个图进行处理，若能够使得所有顶点度数为偶，则继续求欧拉回路。

>若有奇数个顶点有奇数的度数，则无法通过删边达到都为偶数度数，在搜索的过程中若某个顶点的度数为奇数，则需要将这个顶点和其连接的顶点之间的边删去一个

```cpp
void solve() {
    int n, m;cin >> n >> m;
    vector<vector<int>> g(n + 1), blk(n + 1);
    vector<int> edge(m + 1);
    for (int i = 1;i <= m;i++) {
        int u, v, is;cin >> u >> v >> is;
        g[u].push_back(i);
        g[v].push_back(i);
        edge[i] = u ^ v;
        if (!is) {
            blk[u].push_back(i);
            blk[v].push_back(i);
        }
    }
    vector<int> deg(n + 1);
    for (int i = 1;i <= n;i++)deg[i] = g[i].size() & 1;
    vector<int> del(m + 1), vis(n + 1);
    auto dfs = [&](auto self, int u)->void {
        vis[u] = 1;
        for (auto x : blk[u]) {
            int to = edge[x] ^ u;
            if (vis[to])continue;
            self(self, to);
            if (deg[to]) {
                del[x] = 1;
                deg[to] ^= 1;
                deg[u] ^= 1;
            }
        }
        };
    int ok = 1;
    for (int i = 1;i <= n;i++) {
        if (vis[i])continue;
        dfs(dfs, i);
        ok &= !deg[i];
    }
    if (!ok) {
        cout << "NO\n";return;
    }
    cout << "YES\n";
    cout << m - accumulate(del.begin() + 1, del.end(), 0) << '\n';
    auto euler = [&](auto self, int u) ->void {
        while (g[u].size()) {
            int x = g[u].back();g[u].pop_back();
            int to = edge[x] ^ u;
            if (del[x])continue;
            del[x] = 1;
            self(self, to);
        }
        cout << u << " ";
        };

    euler(euler, 1);
    cout << '\n';
}
```

## CF 1996 Div.3 D - Fun
给定两个整数 $n$ 和 $x$ ，求满足 $ab + ac + bc \le n$ 和 $a + b + c \le x$ 的三联数（ $a,b,c$ ）的个数。

>$(a,b,c)\neq(b,a,c)$ 即有顺序要求且 $a,b,c>0$

### Solution
>这个题很简单，是自己想复杂了，总觉得复杂度不对 hh。

知道了 $a,b$ 后，计算出满足条件的最大的 $c$，所以种类数加上 $c$ 即可.

```cpp
for i  i <= n i++
	for j  i * j <= n j++
```

运算次数为：$n+\frac{n}{2}+\frac{n}{3}+\dots+\frac{n}{n}$ 次

> [!NOTE] $\text{proof for}$ $n\log n$：
> 
> 原式可化为：$\displaystyle n\left( 1+\frac{1}{2}+\frac{1}{3}+\dots+\frac{1}{n} \right)$
> 
> 其中 $A=1+\frac{1}{2}+\frac{1}{3}+\dots+\frac{1}{n}$ 是一个调和级数。
> 
>  $A=\ln(n+1)+\gamma,\gamma \approx 0.5772156649$ ，即 $A\in O(\log n)$
> 
> 则原式 $\in O(n\log n)$

```cpp
void solve() {
    int n, x;cin >> n >> x;
    int sum = 0;
    for (int a = 1;a <= min(x - 2, n);a++) {
        for (int b = 1;a * b < n && a + b < x;b++) {
            sum += min((n - a * b) / (a + b), x - a - b);
        }
    }
    cout << sum << "\n";
}
```

## CF 1996 Div.3 E - Decode
为了获得你的 "女神 "最喜欢的角色，你不顾一切地侵入了游戏的源代码。经过数天的努力，你终于找到了编码游戏中 gacha 系统的二进制字符串。为了解码它，您必须首先解决以下问题。

给你一个长度为 $n$ 的二进制字符串 $s$ 。对于每一对整数 $(l, r)$ $(1 \leq l \leq r \leq n)$ ，请计算有多少对 $(x, y)$ $(l \leq x \leq y \leq r)$ 这样的整数。 $(l \leq x \leq y \leq r)$ 中 $\mathtt{0}$ 的数量等于子串 $s_xs_{x+1}...s_y$ 中 $\mathtt{1}$ 的数量。

输出所有可能的 $(l, r)$ modulo $10^9+7$ 的计数之和。

### Solution

遇到这种要让之相等的题目，和牛客周赛52-F 有点像。

若 $s_{i}=0$，则令 $pre_{i}=-1$,否则为 1，这样对于某个区间 $[l,r]$，直接判断 $pre_{r}-pre_{l-1}$ 是否为 0 即 $pre_{r}=pre_{l-1}$

即本问题变为：对于所有区间 $[l,r]$，数出使得满足 $pre_{y}=pre_{x-1}$ 的 $(x,y)$ 的对数之和.

若对于某个区间 $[l,r]$ 有 0 的个数等于 1 的个数即 $pre_{r}=pre_{l-1}$ 则这时有 $l\times (n-r+1)$ 种。

>即左边 $[1,l]$ 区间都可以选择，右边 $[r,n]$ 区间都可以选择

即：
```cpp
for (int l = 1;l <= n;l++) {
	for (int r = l;r <= n;r++) {
		if (pre[r] == pre[l - 1]) {
			ans += l * (n - r + 1);ans %= mod;
		}
	}
}
```

运用 DP 的思想，通过枚举 $r$，每次将 $l$ 叠加起来计算。

$f_{i}$ 代表 $i$ 作为 $r$，在 $[0,i-1]$ 的下标中满足和 $pre_{i}$ 相等的下标之和，即 $f_{i}=\sum\limits_{j=0}^{i-1}(j+1)\times[pre_{i}=pre_{j}]$
```cpp
#define int long long
constexpr int mod = 1e9 + 7;
void solve() {
    string s;cin >> s;int n = s.size();
    vector<int> pre(n + 1);
    for (int i = 0;i < n;i++) {
        pre[i + 1] = pre[i] + (s[i] == '0' ? -1 : 1);
    }
    vector<int> f(2 * n + 1);
    int ans = 0;
    for (int i = 0;i <= n;i++) {
        int t = pre[i] + n;
        ans += f[t] * (n - i + 1);ans %= mod;
        f[t] += i + 1;f[t] %= mod;
    }
    cout << ans << '\n';
}
```

## CF 1907 Div.3 D - Jumping Through Segments

求一个最小的移动距离 $k$ 使得能满足每次移动后都能在目标的 $[l, r]$ 区间内。 
 $\text{example 1 }\boxed{\begin{align}&5\\&1 &5\\&3 &4\\&5 &6\\&8 &10\\&0 &1\end{align}}\to \min(k) \text{ is }8-1=7.$
 
$\text{example 2 }\boxed{\begin{align}&3\\&3 &8\\&10 &18\\&6 &11\end{align}}\min(k)\text{ is } \frac{10}{2}=5$ 

在 $\text{example 2}$ 中玩家可以采取以下行动：

-   从点 $0$ 移动到点 $5$（$3 \le 5 \le 8$）;
-   从点 $5$ 移动到点 $10$（$10 \le 10 \le 18$）;
-   从点 $10$ 移动到点 $7$（$6 \le 7 \le 11$）。
请注意，对于最后一步，玩家可以选择不移动，仍然完成关卡。

在 $[1,10^{9}]$ 之间进行二分查找，直到找到最佳的 $k$.
`check` 函数：
用于检查在给定长度为 $k$ 的情况下，是否存在一种方式将所有的线段覆盖。
- 初始化 `ll` 和 `rr` 为 0，表示当前覆盖的区间的左右边界为0。
- 对于每个线段 $[a, b]$：
   a. 计算当前覆盖的区间的左边界为 `max (ll - k, a)`，表示在保证覆盖的情况下，尽可能向左移动。
   b. 计算当前覆盖的区间的右边界为 `min (rr + k, b)`，表示在保证覆盖的情况下，尽可能向右移动。
   c. 如果当前覆盖的区间的左边界大于右边界，则返回 `false`，表示无法覆盖所有线段。 
- 如果成功遍历了所有线段并且都能够被覆盖，则返回 `true`，表示存在一种方式将所有线段覆盖在长度为 $k$ 的情况下。 
`check` 函数的作用很重要，但是如何证明其正确性还是我的一个问题。

二分搜索：$\text{我仍然没有想出来}$
![](./Pasted%20image%2020231213195628.png)
将二维的 `vector<vector<int>>` 变为 `vector<array<int, 2>>` 节省了不少空间
```cpp
#include<bits/stdc++.h>
using namespace std;
bool check(int k, vector<array<int, 2>> &seg)
{
    int ll = 0, rr = 0;
    for (auto [a,b] : seg)
    {
        ll = max(ll - k, a),rr = min(rr + k, b);
        if (ll > rr) return false;
    }
    return true;
}
void solve()
{
    int n;
    cin >> n;
    vector<array<int,2>> seg(n);
    for (int i = 0; i < n; i++)
    {
        int a, b;
        cin >> a >> b;
        seg[i] = {a, b};
    }
    int l = -1, r = 1000000000;
    while (r - l > 1)
    {
        int mid = (r + l) / 2;
        if (check(mid, seg))
            r = mid;
        else
            l = mid;
    }
    cout << r << endl;
}
int main()
{
    int t;
    cin >> t;
    while(t--)
        solve();
}
```

## CF 1907 Div.3 E - Good Triples

给出 $n$, 找出满足 $a+b+c=n \cap f(a)+f(b)+f(c)=f(n)$ 的个数。$f(x)$ 代表 $x$ 各位数字之和。  

n | 0 | 1 | 2 | 3| 4|5|6|7|8|9
-- | -- | -- | --| --| -- | --| --| --| --| --
ans |1 | 3 | 6|10| 15|21 |28 |36 |45 |55 |
$n\geq 10,ans(n)=\prod ans(n\text{的各位数字})$ 

`int x=n%10,ans *= (x + 1) * (x + 2) / 2,n/=10;`
```cpp
#include <bits/stdc++.h>
using namespace std;
int t, a[] = {1, 3, 6, 10, 15, 21, 28, 36, 45, 55};
int main()
{
    cin >> t;
    while (t--)
    {
        long long ans = 1;
        int n;
        cin >> n;
        while (n)
            ans *= a[n % 10], n /= 10;//ans *= (x + 1) * (x + 2) / 2,n/=10;//jiangly写的
        cout << ans << '\n';
    }
}
```

## CF 1907 Div.3 F - Shift and Reverse

给定一个整数数组 $a_1,a_2,\ldots,a_n$。你可以用这个数组进行两种类型的操作： 

-   shift：将数组的最后一个元素移到第一个位置，并将所有其他元素向右移动，因此您将获得数组 $a_n,a_1,a_2,\ldots,a_{n-1}$。
-   Reverse：反转整个数组，所以你得到数组 $a_n,a_{n-1},\ldots,a_1$。
你的任务是使用最少的操作数对数组进行非降序排序. 不可能则输出 `-1`.

让我们**把数组写出来两次**，然后计算数组增加和减少的部分。这样，我们就能找到能对数组进行排序的所有可能的移动。
>down: 非递增
- 如果从位置 `st` 开始，数组 `a[st]` 到 `a[st + n - 1]` 是非递增的，那么我们只需要将这部分序列移至数组的前部，然后**反转**整个数组即可。移位的次数就是 `st + 1`，反转的次数为 `1`，因为每次移位都会将最后一个元素放到第一个，所以这部分的最小操作次数就是 `min(st + 1, n - st + 1)`，代表了向左或者向右移位的次数。再反转一次，所以操作次数总合为 `st + 1` 或是 `n - st + 1`。
>up: 非递减
- 如果从位置 `st` 开始，数组 `a[st]` 到 `a[st + n - 1]` 是非递减的，我们只需要将这部分序列移至数组的前部即可。移位次数为 `st + 1`。然而，由于每次移位都会将最后一个元素放到第一个，所以需要再反转一次。这样总的操作次数就为 `st + 2`。另外一种情况就是，我们仍然可以选择向另一个方向移位，也就是从尾部的 `n - st` 个元素向后累推，然后反转一次，操作次数就是 `n - st + 1`。但是考虑到 `st` 的位置肯定是非降序的，因此可以直接将其移位至队首，然后反转整个数组，操作次数为 `n - st`。所以这部分的最小操作次数就是 `min(st + 2, n - st)`。
所以我们就得到了从各个位置开始，可以使得整个数组非降序的最小操作次数。再各种情况中取最小值，就是答案。
```cpp
//core：
when down:
ans = min({ans,st + 1, n - st + 1});
when up:
ans = min({ans, st + 2, n - st});
```

```cpp
#include <bits/stdc++.h>
using namespace std;
int t, n;
int main()
{
    cin >> t;
    while (t--)
    {
        cin >> n;
        vector<int> a(2 * n, 0);
        for (int i = 0; i < n; i++)
            cin >> a[i];
        copy(a.begin(), a.begin() + n, a.begin() + n);
        if (is_sorted(a.begin(), a.begin() + n))// spj
        {
            cout << '0' << '\n';
            continue;
        }
        int ans = INT_MAX;
        for (int i = 0; i < n; i++) // down
        {
            int st = i, cnt = 1;
            while (i <= 2 * n - 1 && a[i] >= a[i + 1])
                i++, cnt++;
            if (cnt >= n)
                ans = min(ans,min(st + 1, n - st + 1));
        }
        for (int i = 0; i < n; i++) // up
        {
            int st = i, cnt = 1;
            while (i <= 2 * n - 1 && a[i] <= a[i + 1])
                i++, cnt++;
            if (cnt >= n)
                ans = min(ans, min(st + 2, n - st));//(if(!st)ans=0;)<->(spj)
        }
        if (ans == INT_MAX)
            cout << "-1" << '\n';
        else
            cout << ans << '\n';
    }
}
```

## CF 1921 Div.3 F - Sum of Progression
给你一个由 $n$ 个数字组成的数组 $a$ 。还有 $q$ 个形式为 $s, d, k$ 的查询。

对于每个查询 $q$ ，求 $a_s + a_{s+d} \cdot 2 + \dots + a_{s + d \cdot (k - 1)} \cdot k$ 即：

$$\large\{\sum\limits_\{i=1\}^ka_\{s+d(i-1)\}\times i\}$$

对于每个测试用例，输入形如：

```text title="input shape"
n q
a1 a2 ... an
s1 d1 k1
s2 d2 k2
...
sq dq kq
```

### Solution
<span style="color:#c00000">根号分治</span>
设置一个阈值: $$w=\sqrt\{ n \}$$

当 $d>w$,直接暴力做(因为这时的运算次数很少了)

当 $d\leq w$，开数组算前缀和. ($s,d\text{分别代表}i,j$)

- $f$ 数组来记录 $\lfloor{\frac{s}{d}}\rfloor\times a_{s+\lambda \times d}$ 前缀和，记录的是 $a_{s}\times \lfloor{\frac{s}{d}}\rfloor+s_{s+d}\times\lfloor{\frac{s+d}{d}}\rfloor+\dots$
- $g$ 数组记录的是 $a_{s+\lambda \times d}$ 的前缀和，记录的是 $a_{s}+s_{s+d}+\dots$
- 差距 $\left( \frac{s}{d}-1 \right)g=a_{s}\times\left( \frac{s}{d}-1 \right)+a_{s+d}\times\left( \frac{s}{d}-2 \right)+\dots$
- $\leftrightarrow$  $\text{ans}=f-\left( \frac{s}{d}-1 \right)g=a_{s}\times1+a_{s+d}\times 2+\dots+a_{s+(k-1)d}\times k=\text{target}$
- $\leftrightarrow\text{ans=}\textcolor{green}{f[s+d\times(k-1)][d]-f[s-d][d]}-(\textcolor{grey}{g[s+d\times(k-1)][d]-g[s-d][d]})\times\left( \frac{s}{d}-1 \right)$

处理方式可能不止一种...

```cpp
int n,q,a[100010];
ll f[100010][350],g[100010][350];//序号 步长d 
(ios::sync_with_stdio(false), cin.tie(nullptr);)//必须关闭同步流，不然会超时
void solve()
{
    cin >> n >> q;
	int value = sqrt(n);
    for (int i = 1; i <= n; i++)
        cin >> a[i];
    for (int d = 1; d <= value; d++){
        for (int i = 1; i <= n; i++){
            f[i][d] = ((i - d > 0) ? f[i - d][d] : 0ll) + 1ll * a[i] *(i / d); //((i - 1) / d + 1);灰色的另一种也可以
            g[i][d] = ((i - d > 0) ? g[i - d][d] : 0ll) + a[i];
        }
    }
    ll ans;
    while (q--){
        cin >> s >> d >> k;
        ans = 0;
        if (d > value){
            for (int i = 0; i < k; i++)
                ans += 1ll * a[s + i * d] * (i + 1);
        }
        else{
            ans = f[s + d * (k - 1)][d] - ((s - d > 0) ? f[s - d][d] : 0);
            ans -= (g[s + d * (k - 1)][d] - ((s - d > 0) ? g[s - d][d] : 0)) * (s / d - 1); //((s - 1) / d);
        }
        cout << ans << '\n';
    }
}
```

## CF 1933 Div.3 E - Turtle vs. Rabbit Race: Optimal Trainings
艾萨克开始了他的训练。有 $n$ 条跑道可供使用， $i$ 条跑道（ $1 \le i \le n$ ）由 $a_i$ 个等长的部分组成。

给定一个整数 $u$ ( $1 \le u \le 10^9$ )，完成每一段都能使艾萨克的能力提高一个特定值，具体描述如下：

- 完成 $1$ （ $1$ \-st）部分会使艾萨克的成绩提高 $u$ 。
- 完成 $2$ （nd）部分会使艾萨克的能力提高 $u-1$ 。
- 完成 $3$ \-rd 部分会使艾萨克的成绩提高 $u-2$ 。
- $\ldots$
- 完成 $k$ \-th 部分（ $k \ge 1$ ）会使艾萨克的成绩提高 $u+1-k$ 。 $u+1-k$ 的值可以是负数，这意味着完成额外的部分会降低艾萨克的成绩）。

您还得到了一个整数 $l$ 。您必须选择一个整数 $r$ ，使 $l \le r \le n$ 和艾萨克都能完成赛道 $l, l + 1, \dots, r$ 的**个**段（即总共完成 $l \le r \le n$ 个**段）。(即总共完成 $\sum_{i=l}^r a_i = a_l + a_{l+1} + \ldots + a_r$ 节）。

请回答下列问题：你所能选择的最佳 $r$ 是什么，能最大限度地提高艾萨克的成绩？

如果有多个 $r$ 可以最大限度地提高艾萨克的成绩，请选出**小的** $r$ 。

为了增加难度，你需要回答 $q$ 个不同值的 $l$ 和 $u$ 。

### Solution
<span style="color:#92d050">二分/三分</span>

三分板子题

由于这个题的收益是：当 $\text{pre[r]-pre[l-1]}\leq u(+)>u(-)$ 所以收益曲线是先上升后下降，只要找到最高点对应的 $r$ 即可。
```cpp
#define int long long
void solve() {
    int n;cin >> n;vector<int> a(n + 1), pre(n + 1);for (int i = 1;i <= n;i++)cin >> a[i];
    for (int i = 1;i <= n;i++)pre[i] = pre[i - 1] + a[i];
    int q;cin >> q;
    auto f = [&](int l, int r, int u) {//u u-1 u-2... u+1-k的等差数列前n项和
        return (u + u + 1 - pre[r] + pre[l - 1]) * (pre[r] - pre[l - 1]) / 2;
    };
    while (q--) {
        int L, u;cin >> L >> u;
        int l = L, r = n;
        while (l < r) {
            int lmid = l + (r - l) / 3;
            int rmid = r - (r - l) / 3;
            if (f(L, lmid, u) < f(L, rmid, u))l = lmid + 1;
            else r = rmid - 1;
        }
        cout << l << ' ';
    }
    cout << '\n';
}
```

```cpp Jiangly
i64 calc(int u, int x) {
    return 1LL * (u + u - x + 1) * x / 2;
}
 
void solve() {
    int n;
    std::cin >> n;
    
    std::vector<int> a(n);
    for (int i = 0; i < n; i++) {
        std::cin >> a[i];
    }
    
    std::vector<int> s(n + 1);
    for (int i = 0; i < n; i++) {
        s[i + 1] = s[i] + a[i];
    }
    
    int q;
    std::cin >> q;
    
    while (q--) {
        int l, u;
        std::cin >> l >> u;
        l--;
        
        int j = std::lower_bound(s.begin() + l + 1, s.end(), s[l] + u) - s.begin();
        i64 ans = -1E18;
        int r = -1;
        if (j <= n) {
            if (calc(u, s[j] - s[l]) > ans) {
                ans = calc(u, s[j] - s[l]);
                r = j;
            }
        }
        if (j - 1 > l) {
            if (calc(u, s[j - 1] - s[l]) >= ans) {
                ans = calc(u, s[j - 1] - s[l]);
                r = j - 1;
            }
        }
        std::cout << r << " \n"[q == 0];
    }
}
```

## CF 1941 Div.3 D - Rudolf and the Ball Game
鲁道夫和伯纳德决定和朋友们玩一个游戏。 $n$ 人站成一圈，开始互相扔球。他们按顺时针顺序从 $1$ 到 $n$ 依次编号。

让我们把球从一个人向他的邻居移动称为一次过渡。转换可以顺时针或逆时针进行。

初始时，球在编号为 $x$ 的棋手处（棋手按顺时针方向编号）。在第 $i$ 步时，持球人将球抛向 $r_i$ （ $1 \le r_i \le n - 1$ ）顺时针或 $7$ （ $2$ ）逆时针的距离。( $1 \le r_i \le n - 1$ ) 的距离顺时针或逆时针抛出。例如，如果有 $7$ 名球员，第 $2$ 名球员在接球后将球投掷到 $5$ 处，那么球将被第 $7$ 名球员（顺时针投掷）或第 $4$ 名球员（逆时针投掷）接住。该示例的图示如下。

由于下雨，比赛在 $m$ 次投掷后中断。雨停后，大家又聚在一起继续比赛。但是，没有人记得球在谁手里。结果，伯纳德记住了每次投掷的距离和**次投掷的方向（顺时针或逆时针）。

鲁道夫请你帮助他，根据伯纳德提供的信息，计算出 $m$ 次抛球后可能拿到球的球员人数。

### Solution
<span style="color:#92d050">DP/思维</span>

虽然这题并没有用到 dp，但是DP 需要专项练习了！

这题 Jiangly 的思路很棒，将每次能走到的地方更新到 `d` 数组中去，每次再将 d 数组中能走到的全部赋值给 dp 数组，这样，dp 数组中就有最后一次能走到的全部位置了。
```cpp
void solve() {
    int n, m, x;cin >> n >> m >> x;x--;
    vector<int> dp(n);dp[x] = 1;
    for (int i = 0;i < m;i++) {
        int d;char ch;cin >> d >> ch;
        vector<int> g(n);
        for (int j = 0;j < n;j++) {
            if (dp[j]) {
                if (ch != '1') {
                    g[(j + d) % n] = 1;
                }
                if (ch != '0') {
                    g[(j - d + n) % n] = 1;
                }
            }
        }
        dp = g;
    }
    cout << count(dp.begin(), dp.end(), 1) << '\n';
    for (int i = 0;i < n;i++) {
        if (dp[i])cout << i + 1 << ' ';
    }
    cout << '\n';
}
```

## CF 1941 Div.3 F - Rudolf and Imbalance
给出长度分别为 $n,m,k$ 的数组 $a,d,f$，$a$ 是升序的，现在可以在 $d,f$ 数组中各抽取一个数字放入 $a$ 数组，并按照升序排列。

求 $\max(a_{i}-a_{i-1})$ 的最大值是多少？

### Solution
<span style="color:#92d050">二分+双指针</span>

由于只能操作一次，所以肯定是对 $a_{i}-a_{i-1}$ 差距最大的位置进行操作，对第二大的一定不操作，所以操作后的答案一定不小于原来序列的第二大 $(a_{i}-a_{i-1})$

先找到序列中 $\max(a_{i}-a_{i-1})$ 的 $i$

对于 $\max(a_{i}-a_{i-1})$,我们总是要想办法去“中和”这个最大值，最好的情况就是，从 $d,f$ 序列选出的数字恰好是 $\lfloor{\frac{{a_{i-1}+a_{i}}}{2}}\rfloor$ ,就算到不了这个值，也要尽可能的接近这个值。

先找出最大值和第二大的值备用，再进行二分，二分出口会有 $l,r$ 两个值，分别比较取最小即可。

```cpp
#define int long long
void solve() {
    int n, m, k;cin >> n >> m >> k;
    vector<int> a(n), b(m), c(k);
    for (int i = 0;i < n;i++)cin >> a[i];
    for (int i = 0;i < m;i++)cin >> b[i];
    for (int i = 0;i < k;i++)cin >> c[i];
    sort(b.begin(), b.end());
    sort(c.begin(), c.end());
    int ma = 0, p = -1;
    for (int i = 1;i < n;i++) {
        if (a[i] - a[i - 1] > ma) {
            ma = a[i] - a[i - 1];
            p = i;
        }
    }
    int ans = ma;
    ma = 0;
    for (int i = 1;i < n;i++) {
        if (i != p && a[i] - a[i - 1] > ma) {
            ma = a[i] - a[i - 1];
        }
    }

    int t = a[p] + a[p - 1] >> 1;
    for (int i = 0;i < m;i++) {
        int l = 0, r = k - 1;
        while (l + 1 < r) {
            int mid = l + r >> 1;
            if (b[i] + c[mid] <= t) {
                l = mid;
            } else {
                r = mid;
            }
        }
        ans = min(ans, max({ma,abs(b[i] + c[l] - a[p - 1]),abs(b[i] + c[l] - a[p])}));
        ans = min(ans, max({ma,abs(b[i] + c[r] - a[p - 1]),abs(b[i] + c[r] - a[p])}));
    }
    cout << ans << '\n';
}
```

## CF 1968 Div.3 F - Equal XOR Segments
如果可以将一个数组分成个数组，我们就称它为 $x_1,\dots,x_m$ 个有趣的数组。

k>1 个部分，使得每个部分的值的 [bitwise XOR](http://tiny.cc/xor_wiki_eng) 都相等，那么这个数组就是有趣的数组。

更正式地说，你必须把数组 $x$ 分成 $k$ 个连续的部分， $x$ 中的每个元素都必须完全属于*** $1$ 个部分。设 $y_1,\dots,y_k$ 分别是各部分元素的 XOR。那么 $y_1=y_2=\dots=y_k$ 必须满足。

例如，如果是 $x = [1, 1, 2, 3, 0]$ ，可以将其拆分如下： $[\color{blue}1], [\color{green}1], [\color{red}2, \color{red}3, \color{red}0]$ .事实上是 $\color{blue}1=\color{green}1=\color{red}2 \oplus \color{red}3\oplus \color{red}0$ 。

给你一个数组 $a_1,\dots,a_n$ 。你的任务是回答 $q$ 个查询：

- 对于固定的 $l$ ， $r$ ，判断子数组 $a_l,a_{l+1},\dots,a_r$ 是否有趣。

### Solution
位运算

有 $\oplus$ 的性质：若有奇数个区间异或和相等，那么这所有的异或和与之前分别的异或和值相等。

在本题中，若有三个以上的区间异或和是相等的，则这三个区间可以合并成一个区间，且异或和与之前一样。

由于本题要求 $k>1$，则本题 $k$ 的范围只有 $k=2 \text{ or }k=3$。若 $k>3$ ，则一定可以通过上面的方法使得 $k\leq 3$

$s_{i}$ 代表前缀异或和

当 $k=2$ 时，则可以将该区间分为异或和相等的两部分 $[l,m],[m+1,r]$,则 $s_{m}\oplus s_{l-1}=s_{m+1}\oplus s_{r}\implies s_{l-1}=s_{r}$

当 $k=3$ 时，则将区间分为 $[l,t],[t+1,m],[m+1,r]$,则 $s_{t}\oplus s_{l-1}=s_{m}\oplus s_{t}\text{ and } s_{m}\oplus s_{t}=s_{r}\oplus s_{m}$

$\implies$ $s_{m}=s_{l-1}\text{ and } s_{r}=s_{t}$ $(t<m)$

要使得满足这个条件，就得让得到的 $t$ 尽可能小，$m$ 尽可能大，**在值相等的前提下**， 让 $t$ 为 $\geq l$ 的最小下标，$m$ 为 $< r$ 的最大下标

> 这里我记反了，`lower_bound` 是第一个大于等于的元素，`uppper_bound` 是第一个大于的元素

```cpp
void solve() {
    int n, q;cin >> n >> q;vector<int> a(n + 1), s(n + 1);
    map<int, vector<int>>mp;
    mp[0].push_back(0);
    for (int i = 1;i <= n;i++) {
        cin >> a[i];s[i] = s[i - 1] ^ a[i];
        mp[s[i]].push_back(i);
    }

    while (q--) {
        int l, r;cin >> l >> r;
        if (s[r] == s[l - 1]) {
            cout << "Yes\n";
        } else {
            auto t = *lower_bound(mp[s[r]].begin(), mp[s[r]].end(), l);
            auto m = *--lower_bound(mp[s[l - 1]].begin(), mp[s[l - 1]].end(), r);
            if (t < m) {
                cout << "Yes\n";
            } else {
                cout << "No\n";
            }
        }
    }
    cout << '\n';
}
```

## CF 1981 Div.2 C - Turtle and an Incomplete Sequence
补全 $a_{i}=-1$ 的位置，使得对于从 $1$ 到 $n - 1$ 的每一个整数 $i$ ， $a_i = \left\lfloor\frac{a_{i + 1}}{2}\right\rfloor$ 或 $a_{i + 1} = \left\lfloor\frac{a_i}{2}\right\rfloor$ 都成立。若无解，则输出 $-1$

这个题目可以算是大模拟或者思维题。

### jiangly 思路：

先将两边的 $-1$ 给补了，对于中间的若干个块，对于每个块，分别用 $i,j$ 代表 $[i+1,j-1]$ 区间都为 $-1$，从两边到中间填充，若最终到中间了相邻两个不满足条件则输出 $-1$，否则继续填充下一个块。
```cpp
void solve() {
    int n;
    cin >> n;

    vector<int> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }

    if (count(a.begin(), a.end(), -1) == n) {
        for (int i = 0; i < n; i++) {
            a[i] = i % 2 + 1;
        }
    } else {
        for (int i = 0, j = -1; i <= n; i++) {
            if (i == n || a[i] != -1) {
                if (j == -1) {
                    for (int k = i - 1; k >= 0; k--) {
                        a[k] = a[k + 1] == 1 ? 2 : a[k + 1] / 2;
                    }
                } else if (i == n) {
                    for (int k = j + 1; k < n; k++) {
                        a[k] = a[k - 1] == 1 ? 2 : a[k - 1] / 2;
                    }
                } else {
                    int l = j, r = i;
                    while (l + 1 < r) {
                        if (a[l] > a[r]) {
                            a[l + 1] = a[l] == 1 ? 2 : a[l] / 2;
                            l++;
                        } else {
                            a[r - 1] = a[r] == 1 ? 2 : a[r] / 2;
                            r--;
                        }
                    }
                    if (a[l] != a[r] / 2 && a[r] != a[l] / 2) {
                        cout << -1 << "\n";
                        return;
                    }
                }
                j = i;
            }
        }
    }

    for (int i = 0; i < n; i++) {
        cout << a[i] << " \n"[i == n - 1];
    }
}
```

### 官方题解 ：
将每次变换看作完全二叉树上的移动，则可以看作最短路问题，

$x\to y$ 的路径为 $x\to \text{LCA}(x,y)\to y$，设之间 $-1$ 的个数为 $m$，若之间经过的节点数为 $l$，那么当 $l>m$ 或者 $l$ 和 $m$ 的奇偶性不同的时候无解，否则先将前面空闲的填了，之后两个数循环即可。

代码：
同样先把前后都填充了，然后对于每一个块，单独处理。

先计算出这个块两端的路线是怎样的。按照思路处理即可。

path 函数即在满二叉树上进行操作：
```cpp
auto path = [](int x, int y)->vector<int> {
	vector<int> l, r;
	while (__lg(x) > __lg(y)) {
		l.push_back(x);x >>= 1;
	}
	while (__lg(y) > __lg(x)) {
		r.push_back(y);y >>= 1;
	}
	while (x != y) {
		l.push_back(x);
		r.push_back(y);
		x >>= 1;y >>= 1;
	}
	l.push_back(x);
	reverse(r.begin(), r.end());
	for (auto x : r)l.push_back(x);
	return l;
	};
```

```cpp
void solve() {
    int n;cin >> n;
    vector<int> a(n + 1), v;
    int s = 0, e = 0;
    for (int i = 1;i <= n;i++) {
        cin >> a[i];
        if (a[i] != -1) {
            if (!s)s = i;
            e = i;
            v.push_back(i);
        }
    }
    if (count(a.begin(), a.end(), -1) == n) {
        for (int i = 1;i <= n;i++) {
            cout << i % 2 + 1 << " \n"[i == n];
        }
        return;
    }
    for (int i = s - 1;i >= 1;i--) {
        a[i] = (a[i + 1] == 1) ? 2 : a[i + 1] / 2;
    }
    for (int i = e + 1;i <= n;i++) {
        a[i] = (a[i - 1] == 1) ? 2 : a[i - 1] / 2;
    }

    for (int i = 1;i < v.size();i++) {
        int l = v[i - 1], r = v[i];
        vector<int> p = path(a[l], a[r]);
        if ((p.size() & 1) != ((r - l + 1) & 1) || r - l + 1 < p.size()) {
            cout << "-1\n";return;
        }
        for (int j = 0;j < p.size();j++) {
            a[l + j] = p[j];
        }
        for (int j = l + p.size(), o = 1;j <= r;j++, o ^= 1) {
            a[j] = (o ? a[j - 1] * 2 : a[j - 1] / 2);
        }
    }

    for (int i = 1;i <= n;i++) {
        cout << a[i] << " \n"[i == n];
    }
}
```

## CF 1981 Div.2 D - Turtle and Multiplication
给一个整数 $n(2\leq n\leq 10^6)$ ，构造一个由满足以下条件的整数组成的数列 $a_1, a_2, \ldots, a_n$ ： 

- 对于所有 $1 \le i \le n$ ， $1 \le a_i \le 3 \cdot 10^5$ 。
- 对于所有 $1 \le i < j \le n - 1$ , $a_i \cdot a_{i + 1} \ne a_j \cdot a_{j + 1}$ .

在所有这些序列中，小猪要求乌龟找出具有**最少**个**不同**元素的序列。 

### Solution
欧拉路径/Hierholzer 算法

>需要学习欧拉图相关知识, 注：这个部分比较冷门

欧拉图问题

要使得 $a_{i}\cdot a_{i+1}\neq a_{j}\cdot a_{j+1}$，只要 $a_{i}$ 都取素数。这样只要满足 $(a_{i},a_{i+1}),(a_{j},a_{j+1})$ 是不同的即可(即经过不重复的边)。

将 $(a_{i},a_{i+1})$ 看作是图的一条边，则问题变为找到点数最小的无向完全图(加上自环 $(a_{i}=a_{i+1})$)，使得这个图存在一条经过 $(n-1)$ 条边且不经过重复边的路径。

若完全图的点数为 $m$ 。(这时确定了点数，需要使得边数尽可能大)

- 若 $m$ 为奇数，则每个点的度数都是偶数，则一定存在欧拉路径，路径则为边数 $\frac{m(m+1)}{2}$

- 若 $m$ 为偶数，则每个点的度数都为奇数，这个时候需要删除一些边至少保证有欧拉通路，最多只能剩下两个奇数度数的点，所以至少要删除 $\frac{m}{2}-1$ 条边，路径长度为 $\frac{m(m+1)}{2}-\frac{m}{2}+1=\frac{m^2}{2}+1$

若当 $n=10^6$ 时， $m\approx1415$，第 $m$ 个素数是 $11807\leq 3\times10^5$，满足要求。

所以这时只需要确定最小的 $m$，再跑一遍欧拉通路即可。

对于最小的 $m$，满足：
$$
\begin{cases}
 m \equiv 1 \pmod{2}, \quad \frac{(m-1)m}{2} < n-1 \le \frac{m(m+1)}{2}, \\
 m \equiv 0 \pmod{2}, \quad \frac{(m-1)^2}{2} + 1 < n-1 \le \frac{m^2}{2} + 1.
\end{cases}
$$

代码：
```cpp
void solve() {
    int n;
    cin >> n;

    int m = 1;
    while (n - 1 > (m % 2 == 1 ? m * (m + 1) / 2 : m * m / 2 + 1)) {
        m++;
    }

    vector<int> a;
    a.reserve(n);

    vector<vector<int>> g(m, vector<int>(m, 1));
    vector<int> cur(m);
    if (m % 2 == 0) {
        for (int i = 1; i < m - 1; i += 2) {
            g[i][i + 1] = g[i + 1][i] = 0;
        }
    }

    auto dfs = [&](auto&& self, int x) -> void {
        for (int& i = cur[x]; i < m; i++) {
            if (g[x][i]) {
                g[x][i] = g[i][x] = 0;
                self(self, i);
            }
        }
        a.push_back(primes[x]);
        };
    dfs(dfs, 0);

    a.resize(n);
    for (int i = 0; i < n; i++) {
        cout << a[i] << " \n"[i == n - 1];
    }
}
```

这里需要用到筛法；
模板整理

## CF 1937 Div.2 D - Pinball
有一个长度为 $n$ 的一维网格。网格的 $i$ /th 单元格包含一个字符 $s_i$ ，这个字符要么是"<"，要么是">"。

当一个弹球被放置在其中一个单元格上时，它会按照以下规则移动：

- 如果弹球位于 $i$ /th 单元格上，且 $s_i$ 为"<"，那么弹球会在下一秒向左移动一格。如果 $s_i$ 为">"，则向右移动一格。
- 弹球移动后，字符 $s_i$ 会被反转（即如果 $s_i$ 原来是'<'，则会变成'>'，反之亦然）。
- 当弹球离开网格时就会停止移动：无论是从左边界还是从右边界。

您需要回答 $n$ 个个**独立**查询。在 $i$ \-th 查询中，弹球将被放置在 $i$ \-th 单元格中。请注意，我们总是在初始网格上放置一个弹球。

对于每个查询，计算弹球离开网格需要多少秒。可以证明，弹球总是会在有限步数内离开网格。

### Solution

原： [Problem - E - Codeforces](https://mirror.codeforces.com/contest/733/problem/E)

[Codeforces Round 930 (Div. 2) A\~D - 知乎](https://zhuanlan.zhihu.com/p/684942870)

对于需要记录 `>` 的下标，个数的前缀和 以及下标
对于需要记录 `<` 的下标，个数的后缀和 以及下标

只有左边的 `>` ，右边的 `<` 能让 `s[i]` 返回, 如果没有的话就直接出去了

当 `s[i]=='>'` 时

- 若 $cnt_{1}[i-1]=cnt_{2}[i+1]$，则答案为 $i+2\times(suf[i+1]-pre[i-1])$
- 若 $cnt_{1}[i-1]>cnt_{2}[i+1]$，这时 $i$ 位置一定从右边出来，当左边比右边多 1 的时候才能将路径走满，其他情况都会有路径没走，所以需要减去多余部分。走满时，答案为 $i+n+1+2\times(suf[i+1]-pre[i-1])$，有多余部分时，答案为 $i+n+1+2\times(suf[i+1]-(pre[i-1]-pre[pos_{1}[cnt_{1}[i-1]-cnt_{2}[i+1]-2]]))$
- 若 $cnt_{1}[i-1]<cnt_{2}[i+1]$，这时 $i$ 位置一定从左边出来，右边的有些多余部分根本不走，所以需要减去多余的部分。答案为 $i+2\times(suf[i+1]-(pre[i-1]-pre[pos_{1}[cnt_{1}[i-1]-cnt_{2}[i+1]-1]]))$

当 `s[i]=='>'` 时，同理。

```cpp
#define int long long
void solve() {
    int n;cin >> n;string s;cin >> s;s = ' ' + s;
    vector<int> pre(n + 2), suf(n + 2), pos1, pos2, cnt1(n + 2), cnt2(n + 2), ans(n + 1);
    for (int i = 1;i <= n;i++) {
        if (s[i] == '>') {
            pre[i] = i;cnt1[i] = 1;
        } else {
            suf[i] = i;cnt2[i] = 1;
        }
    }
    for (int i = 1;i <= n;i++) {
        cnt1[i] += cnt1[i - 1];
        pre[i] += pre[i - 1];
        if (s[i] == '>')pos1.push_back(i);
    }
    for (int i = n;i >= 1;i--) {
        cnt2[i] += cnt2[i + 1];
        suf[i] += suf[i + 1];
        if (s[i] == '<')pos2.push_back(i);
    }
    for (int i = 1;i <= n;i++) {
        if (s[i] == '<') {
            if (cnt1[i - 1] > cnt2[i + 1]) {//向右边
                int num2 = suf[i + 1], num1 = 0;
                if (cnt1[i - 1] == cnt2[i + 1] + 1) {
                    num1 = pre[i - 1];
                } else {
                    num1 = pre[i - 1] - pre[pos1[cnt1[i - 1] - cnt2[i + 1] - 2]];
                }
                ans[i] = i + n + 1 + 2 * (num2 - num1);
            } else if (cnt1[i - 1] < cnt2[i + 1]) {//向左边
                int num1 = pre[i - 1];
                int num2 = suf[i + 1] - suf[pos2[cnt2[i + 1] - cnt1[i - 1] - 1]];
                ans[i] = i + 2 * (num2 - num1);
            } else {
                int num1 = pre[i - 1], num2 = suf[i + 1];
                ans[i] = i + 2 * (num2 - num1);
            }
        } else {
            if (cnt1[i - 1] < cnt2[i + 1]) {
                int num1 = pre[i - 1], num2 = 0;
                if (cnt2[i + 1] == cnt1[i - 1] + 1) {
                    num2 = suf[i + 1];
                } else {
                    num2 = suf[i + 1] - suf[pos2[cnt2[i + 1] - cnt1[i - 1] - 2]];
                }
                ans[i] = 2 * (num2 - num1) - i;
            } else if (cnt1[i - 1] > cnt2[i + 1]) {
                int num1 = pre[i - 1] - pre[pos1[cnt1[i - 1] - cnt2[i + 1] - 1]];
                int num2 = suf[i + 1];
                ans[i] = n + 1 - i + 2 * (num2 - num1);
            } else {
                int num1 = pre[i - 1], num2 = suf[i + 1];
                ans[i] = n + 1 - i + 2 * (num2 - num1);
            }
        }
    }
    for (int i = 1;i <= n;i++) {
        cout << ans[i] << " \n"[i == n];
    }
}
```
