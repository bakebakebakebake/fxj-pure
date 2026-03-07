---
title: 'Codeforces 题解整理 3：数论、博弈、组合与 EDU'
description: '以原题解记录为主，收录数论、博弈、组合与 EDU 向的 Codeforces 题目。'
publishDate: '2026-03-06'
tags:
  - 算法竞赛
  - 题解整理
  - Codeforces
  - 数论
  - 博弈论
  - 组合数学
language: '中文'
---

> [!note] 说明
> 这里保留你原来更偏“证明链”的题解内容，尤其是数论、SG、组合和 EDU 这些不适合再被我压成摘要的部分。

## 收录范围

- `CF 1931 Div.3 D`
- `CF 1931 Div.3 E`
- `CF 1931 Div.3 G`
- `CF 2008 Div.3 G`
- `CF 2008 Div.3 H`
- `CF 1925 Div.2 B`
- `CF 1928 Div.2 C`
- `CF 1928 Div.2 D`
- `CF 1928 Div.2 E`
- `CF 2004 EDU Div.2 D`
- `CF 2004 EDU Div.2 E`
- `CF 1957 Div.2 C`
- `CF 1957 Div.2 D`
- `CF 1957 Div.2 E`
- `CF 1935 Div.2 D`
- `CF 1997 EDU Div.2 D`

## CF 1931 Div.3 D - Divisible Pairs
给出一个数组 $a$，求满足 $(a_{i}+a_{j})\%x=0\cap(a_{i}-a_{j})\%y=0(i<j)$ 的个数。

### Solution
易得：

$(a_{i}\%x+a_{j}\%x)\%x=0,(a_{i}\%y-a_{j}\%y)\%y=0$
$\to a_{i}\%x+a_{j}\%x=x,a_{i}\%y-a_{j}\%y=0$

存下 $a_{i}\%x,a_{i}\%y$,满足 $(x-a_{i}\%x)\%x\cap a_{i}\%y$ 即为对应的条件

```cpp
void solve() {
    int n, x, y;cin >> n >> x >> y;
    vector<int> a(n);
    for (auto& i : a)cin >> i;
    ll cnt = 0;
    map<pair<int, int>, int> mod;
    for (int i = 0;i < n;i++) {
        cnt += mod[{(x - a[i] % x) % x, a[i] % y}];
        mod[{a[i] % x, a[i] % y}]++;
    }
    cout << cnt << '\n';
}
```
或
```cpp
void solve() {
    int n, x, y;cin >> n >> x >> y;
    vector<int> a(n);
    for (auto& i : a)cin >> i;
    ll cnt = 0;
    map<pair<int, int>, int> mod;
    for (int i = 0;i < n;i++) {
        mod[{a[i] % x, a[i] % y}]++;
    }
    for (int i = 0;i < n;i++) {
        --mod[{a[i] % x, a[i] % y}];
        cnt += mod[{(x - a[i] % x) % x, a[i] % y}];
        ++mod[{a[i] % x, a[i] % y}];
    }
    cout << cnt / 2 << '\n';
}
```

## CF 1931 Div.3 E - Anna and the Valentine's Day Gift
给出一个长度为 $n$ 的数组 $a$，Anna 先手

- Anna 选择一个 $a_{i}\to$ $reverse(a_{i})$,去掉前导 0
- Sasha 选择 $a_{i},a_{j}\to$ $cat(a_{i},a_{j})$

当 Anna 下完棋且数组中只剩下一个元素的时候，游戏结束，如果剩下的数字 $\geq 10^m$,Sasha 获胜，反之，Anna 获胜。

双方都以最佳方式玩游戏，输出获胜方。

### Solution
<span style="color:#92d050">博弈论</span>

容易发现，Anna 每次优先翻转 `后导 0 最多的数`，Sasha 每次优先以 `有最多后导 0 的数` 作为 $a_{i}$ 。

以 $a=\{10,10,10,10\}.m=5$ 为例执行流程：

- Anna：$1,10,10,10\to$ Sasha：$1,1010,10$
- Anna：$1,1010,1\to$ Sasha：$1,10101$
- Anna：$1,10101\to$ Sasha：$110101$
- Anna：$101011\to$ $\text{Game-Over}$，$101011\geq 10^5\to$ Sasha WIN

即每次 Anna 删除一个最多的，Sasha 保留一个第二多的，以此类推。

比较简单。
```cpp
void solve() {
    int n, m;cin >> n >> m;
    vector<pair<int, int>> a(n);for (auto& [i, j] : a)cin >> j;
    int sum = 0;
    for (int i = 0;i < n;i++) {
        string num = to_string(a[i].second);
        sum += num.size();
        int cnt = 0;
        for (int i = num.size() - 1;i >= 0;i--) {
            if (num[i] == '0')cnt++;
            else break;
        }
        a[i].first = cnt;
    }
    sort(a.begin(), a.end());
    for (int i = n - 1;i >= 0;i -= 2) {
        sum -= a[i].first;
    }
    if (sum - 1 >= m)cout << "Sasha\n";
    else cout << "Anna\n";
}
```

## CF 1931 Div.3 G - One-Dimensional Puzzle

![](https://espresso.codeforces.com/d862915ed3dc627101b0e632c1c778b818648879.png)

每种类型包含 $a,b,c,d$ 个元素。如果成功地将所有元素组合成一条长链，就算完成了。求有多少种方法(不能翻转)。

### Solution
<span style="color:#92d050">组合数 (隔板法)</span>

[Codeforces Round 925 (Div. 3) A-G 比赛录屏+讲解（60分钟开始）\_哔哩哔哩\_bilibili](https://www.bilibili.com/video/BV16p421d7xw/?spm_id_from=333.337.search-card.all.click&vd_source=cb670d82714ee9baee22c33ef083884d) 

注意：本题写的 $C(x,y)$ 写为了 $C(y,x)$ (写反了 $\dots$)

前置小练习：

> $\text{eg1:}$ 将 10 个相同的小球放入 8 个盒子里(每个盒子至少有一个小球)，有多少种放法？
> 
> 插空法：10 个小球有 9 个空可以插，有 7 个隔板,  (即两块板之间不能相邻且第一块板左侧与最后一块板右侧必须有球)。
> 
> 则答案 $C(7,9)$
> 
> $\text{eg2:}$ 将 10 个相同的小球放入 8 个盒子里 (盒子可以为空)，有多少种放法？
> 
> 隔板法：10 个小球和 7 个隔板，可以组成一个由 17 个物件的排列，从中选择 7 个位置放置隔板，这样就可以把小球分配到 8 个盒子中
> 
> 答案：$C(7,17)$
> 
> $\text{eg3:}$ 求 $x_{1}+x_{2}+x_{3}+x_{4}=10$ 有多少个正整数解？
> 
> 即在 10 个 1 之间的 9 个空里选择 3 个位置插入隔板，答案：$C(3,9)$
> 
> $\text{eg4:}$ 求 $x_{1}+x_{2}+x_{3}+x_{4}=10$ 有多少个非负整数解？
> 
>法一：可以变换一下思路：这时的 $x_{i}\geq 0$,将等式两边同时加上 4，则 $x_{i}\geq 1$ 求 $x_{1}+x_{2}+x_{3}+x_{4}=14$ 的正整数解
>
>法二：将 3 个隔板和 10 组成一个 13 件物品的排列，选择 3 个位置放置隔板
>
>答案：$C(3,13)$

则可以抽象：

求 $x_{1}+x_{2}+x_{3}+\dots+x_{r}=n$ 的非负整数解个数以及正整数解个数。

$(1):$ $C(r-1,r+n-1)$

$(2):C(r-1,n-1)$

将 $n$ 个相同的小球放入 $r$ 个盒子里, (盒子可以为空和至少一个)各有多少种放法？

$(1):C(r-1,n+r-1)$

$(2):C(r-1,n-1)$

可以在 $1,2$ 之间插入 $3$,在 $2,1$ 之间插入 $4$

- $121212$
- $212121$
- $333333$ 放在 $1$ 和 $2$ 之间
- $444444$ 放在 $2$ 和 $1$ 之间
- $\textcolor{red}{1}\textcolor{green}{333\dots3}\textcolor{red}{2}\textcolor{gray}{444\dots4}\textcolor{red}{1}\textcolor{green}{333\dots3}\textcolor{red}{2}\textcolor{gray}{444\dots4}\textcolor{red}{1}$

本题目插入的意思 ,设空位个数为 $m$

1. 先考虑把同类元素（$c$ 个 3 或 $d$ 个 4）放到 $m$ 个空位中（可以为空）的方法个数
2. $x_{1}+x_{2}+x_{3}+\dots+x_{m}=c|d$ 非负整数解个数

下面的个数为 $C(m-1,m+c|d-1)$,由于插入 $3|4$ 不冲突，所以直接相乘。

当 $a=b$ 

- $12121212$ 空位： $3:a,4:a+1$
- $21212121$ 空位： $3:a+1,4:a$

方案数：$C(a-1,a+c-1)\times C(a,a+d)+C(a,a+c)\times C(a-1,a+d-1)$

当 $a=b-1$

- $2121212$ 空位： $3:a+1,4:a+1$

方案数：$C(a,a+c)\times C(a,a+d)$

当 $a=b+1$

- $1212121$ 空位： $3:a,4:a$

方案数：$C(a-1,a+c-1)\times C(a-1,a+d-1)$

然后就是预处理与逆元的计算。这里把阶乘、逆元阶乘预处理到上界之后，所有组合数都可以 $O(1)$ 取出；若不想写线性逆元，直接快速幂也能过，只是常数稍大一些。

```cpp
const int mod = 998244353, N = 2e6 + 10;
ll fac[N], jv[N], inv[N];
void init(int n) {
    jv[0] = fac[0] = 1;
    for (int i = 1;i <= n;i++) {
        inv[i] = i == 1 ? 1 : (mod - mod / i) * inv[mod % i] % mod;
        fac[i] = fac[i - 1] * i % mod;
        jv[i] = jv[i - 1] * inv[i] % mod;
    }
}
ll C(int m, int n) {
    if (n < m || m < 0) return 0;
    return fac[n] * jv[n - m] % mod * jv[m] % mod;
}
void solve() {
    int a, b, c, d;cin >> a >> b >> c >> d;
    if (abs(a - b) >= 2) {
        cout << 0 << '\n';return;
    }
    ll ans = 0;
    if (!a && !b)ans = c == 0 || d == 0;
    else if (a == b) {
        ans = (C(a - 1, a + c - 1) * C(a, a + d) % mod + C(a, a + c) * C(a - 1, a + d - 1) % mod) % mod;
    } else if (a == b - 1) {
        ans = C(a, a + c) * C(a, a + d) % mod;
    } else if (a == b + 1) {
        ans = C(a - 1, a + c - 1) * C(a - 1, a + d - 1) % mod;
    }
    cout << ans << '\n';
}
main::init(2e6);
```

## CF 2008 Div.3 G - Sakurako's Task
樱子为你准备了一项任务：

她给了你一个由 $n$ 整数组成的数组，让你选择 $i$ 和 $j$ 这样的 $i \neq j$ 和 $a_i \ge a_j$ ，然后指定 $a_i = a_i - a_j$ 或 $a_i = a_i + a_j$ 。只要满足条件，您可以对任意 $i$ 和 $j$ 执行任意次数的操作。

樱子问你，数组的 $mex_k$ $^{*}$ 在任意多次操作后的最大可能值是多少？

$^{*}$ $mex_k$ 是数组中不存在的第 $k$ 个非负整数。例如：$mex_1(\{1,2,3\})=0$，因为 $0$ 是数组中不存在的第一个元素；$mex_2(\{0,2,4\})=3$，因为 $3$ 是数组中不存在的第二个元素。

### Solution

- 需要证明： 根据操作，可以得到最终的的数组是 $a_{i}=(i-1)\times \gcd(\{a_{i}\})$
- 得到了这个数组，如何以一种较快的方式求出 $\text{mex}_{k}$

最终能凑出来的是 $0,g,2g,3\mathbf{g}\dots,(n-1)g$

在每个间隔有 $g-1$ 个数没有凑出，一共有 $(n-1)$ 个 $(g-1)$ 凑不出来。

如果大于了这个数，说明已经超出了 $(n-1)g$，在范围外面还有 $k-(n-1)(g-1)$ 个数，
即 $(n-1)g+k-(n-1)(g-1)=n-1+k$，否则同理

按照这种方式来求 $\text{mex}_{k}$

```cpp
#define int long long
void solve() {
    int n, k;cin >> n >> k;
    vector<int> a(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i];
    int g = a[1];
    for (int i = 1;i <= n;i++)g = __gcd(g, a[i]);
    if (n == 1) {
        cout << (a[1] >= k ? k - 1 : k) << '\n';return;
    }
    int t = (g - 1) * (n - 1);
    if (k > t) {
        cout << n - 1 + k << '\n';
    } else {
        if (k % (g - 1) == 0) {
            cout << k / (g - 1) * g - 1 << '\n';
        } else {
            cout << k / (g - 1) * g + k % (g - 1) << '\n';
        }
    }
}
```

## CF 2008 Div.3 H - Sakurako's Test
樱子即将参加一项测试。测试可以描述为一个整数数组 $n$ 和一个任务：

给定一个整数 $x$ ，樱子可以执行以下操作任意多次：

- 选择一个整数 $i$ ( $1\le i\le n$ )，使得 $a_i\ge x$ ；
- 将 $a_i$ 的值改为 $a_i-x$ 。

任意多次使用此操作，她必须找出数组 $a$ 的最小中值 $^{*}$。

樱子知道数组，但不知道整数 $x$ 。有人说漏了嘴， $x$ 的 $q$ 值中有一个会出现在下一次测试中，所以樱子问你每个这样的 $x$ 的答案是什么。

$^{*}$ 长度为 $n$ 的数组的中位数是位于排序数组中间的元素（对于偶数 $n$，位于 $\frac{n+2}{2}$-th 位置；对于奇数，位于 $\frac{n+1}{2}$-th 位置）。

### Solution
调和级数复杂度&lt;-&gt;mod Q

根据贪心的思想，$a_{i}\to a_{i} \bmod x$

提前预处理出 $x\in[1,n]$ 的所有情况，对于每一种情况，答案范围是 $[0,x-1]$。

可以二分答案(对于 $x$，数组 $a$ 的最小中位数)，对于每一个 $mid$，可以计算出余数为 $[0,mid]$ 区间内的数的个数，只需要判断个数是否占 $\lfloor{\frac{n}{2}}\rfloor+1$ 个即可。

时间复杂度: $O(n\log^2n)$

```cpp
void solve() {
    int n, q;cin >> n >> q;
    vector<int> mp(n + 1);
    for (int i = 1;i <= n;i++) {
        int x;cin >> x;mp[x]++;
    }

    for (int i = 1;i <= n;i++)mp[i] += mp[i - 1];
    vector<int> ans(n + 1);

    for (int i = 1;i <= n;i++) {//x
        int l = 0, r = i - 1;
        while (l < r) {
            int mid = l + r >> 1;
            int s = 0;
            for (int j = 0;j <= n;j += i) {
                s += mp[min(n, j + mid)] - (j == 0 ? 0 : mp[j - 1]);
            }
            if (s >= n / 2 + 1) {
                r = mid;
            } else {
                l = mid + 1;
            }
        }
        ans[i] = l;
    }
    while (q--) {
        int x;cin >> x;
        cout << ans[x] << ' ';
    }
    cout << '\n';
}
```

## CF 1925 Div.2 B - A Balanced Problemset?
将 $x$ 分解为 $n$ 个整数组成，使得这 $n$ 个数的 `gcd` 最大，也就是最平衡。

### Solution
想了半天没想出来 $\dots$

没太搞懂 $\dots$

这段代码已经被 HACK 了，现在提交会 T
![](./Pasted%20image%2020240128171314.png)
```cpp
void solve()
{
    int n, x;
    cin >> x >> n;
    if (n == 1)
    {
        cout << x << '\n';
        return;
    }
    for (int i = x / n; i >= 1; i--)
    {
        if (x % i == 0 && x / i >= n)
        {
            cout << i << '\n';
            return;
        }
    }
}
```

有： $GCD(a_1,a_2,a_3,\ldots,a_n) = GCD(a_1,a_1+a_2,a_1+a_2+a_3,\ldots,a_1+a_2+a_3+\ldots+a_n)$ $\leftrightarrow GCD(a_1,a_1+a_2,a_1+a_2+a_3,\ldots,x)$

所以答案一定是 $x$ 的一个约数。

现在，考虑 $x$ 的一个因数 $d$，我有两种想法
$(1)$

- 当 $n\times d\leq x$,选择为：$d,d,d,\ldots,x-(n-1)d\leftrightarrow \gcd(d,2d,3d..,x)$ 有可行答案 $d$
- 当 $n\leq d$,有可行答案 $x//d$（本来每一份是 $\frac{x}{n},n$ 份，这时 $n\leq d$，如果分为 $d$ 份每一份就是 $\frac{x}{d}$ 可以分为更多份，每一份也更大，$\geq n$ 的部分可以直接安到任意位置，这时的 $\frac{x}{d}$ 也可以作为答案）

$(2)$

- 直接遍历因子 $1$ 到 $x$，然后判断 $n \times d \le x$ 并取 $d$，会超时
- 只遍历因子 $1$ 到 $\sqrt{x}$，再分别检查 $d$ 和 $x / d$ 是否满足条件，这样就能把所有因子都覆盖到。

找到满足该条件的最大 $d$。这可以在 $\mathcal{O}(\sqrt{x})$ 时间内通过简单的因数分解来实现。

![](./Pasted%20image%2020240128180042.png)

```cpp
void solve()
{
    int n, x;
    cin >> x >> n;
    int ans = 1;
    for (int i = 1; i * i <= x; i++)
    {
        if (x % i == 0)//如果i是x的因子
        {
            if (n <= x / i)//n*i<=x ->i i i ... x-(n-1)*i  ->i
                ans = max(ans, i);
            if (n <= i)
                ans = max(ans, x / i);
        }
    }
    cout << ans << '\n';
}
```

## CF 1928 Div.2 C - Physical Education Lesson
每个人都排成一排，并被要求站在 "第 $k$ 个 "的位置上。

$1\sim k,k-1\sim 2,1\sim k,k-1\sim 2,\dots$ 以此类推。这样，每隔 $2k - 2$ 个位置就重复一次。( $k \neq 1$)

给出在队伍中的位置 $n$结算时得到的数字 $x$,输出有多少个符合条件的 $k$。

**eg**
$n=10,x=2$， $\to k$ = $2, 3, 5, 6$ 。

解决这些问题的例子是 $k$ ：

| $k$ / № | $1$ | $2$ | $3$ | $4$ | $5$ | $6$ | $7$ | $8$ | $9$ | $10$ |
| ------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | ---- |
| $2$     | $1$ | $2$ | $1$ | $2$ | $1$ | $2$ | $1$ | $2$ | $1$ | $2$  |
| $3$     | $1$ | $2$ | $3$ | $2$ | $1$ | $2$ | $3$ | $2$ | $1$ | $2$  |
| $5$     | $1$ | $2$ | $3$ | $4$ | $5$ | $4$ | $3$ | $2$ | $1$ | $2$  |
| $6$     | $1$ | $2$ | $3$ | $4$ | $5$ | $6$ | $5$ | $4$ | $3$ | $2$  |

### Solution

- 当在左边部分的时候：只需要满足 $n\%(2 k-2)=x$ 即可(当为 0 时需要特判为 2)
- 反之满足 $2 k-n\%(2 k-2)=x$ 即可

暴力做法：(TLE)由于是 $O(n)$ ($n\leq 10^9$)的做法肯定会 T
```cpp
void solve() {
    int n, x;cin >> n >> x;
    int ans = 0;
    for (int k = 2;k <= n;k++) {
        int m = n % (2 * k - 2);
        if (!m) m = 2;
        if (m <= k) {
            if (m == x) ans++;
        } else {
            m = 2 * k - m;
            if (m == x) ans++;
        }
    }
    cout << ans << '\n';
}
```

由上文：$k$ 满足 $(2 k-2)\times t+x=n\cup(2k-2)\times t+2k-x=n$ 

可以变形为：$(2k-2)|(n-x)\cup(2k-2)|(n+x-2k)\to(2k-2)|(n+x-2)$

所以只需要判断哪些数是 $(n-x)\cup(n+x-2)$ 的偶数 `(由于(2k-2)一定是偶数)` 因子，即代表 $(2k-2)$，所以存入的时候存 $k$ 即 $\frac{i}{2}+1$。

$k$ 与 $x$ 还满足 $k\geq x$

NOTE: <span style="color:#92d050">试除法</span>：要找到某个数的所有因子只需要 $\sqrt{ n }$ 在 $i$ 是因子的情况下加入 $i,$ $\frac{n}{i}$ 即：

(不过当 $n$ 为平方数的时候会有重叠，将 `vector` 换为 `set` 去重即可)
```cpp
auto find = [&](int n) {
	vector<int> ans;
	for (int i = 1;i * i <= n;i++) {
		if (n % i == 0) {
			ans.push_back(i);
			ans.push_back(n / i);
		}
	}
	return ans;
};
```

`unordered_set` 可换为 `set`。但是 `unordered_set` 的插入是 $O(1)$ 的
```cpp
void solve() {
    int n, x;cin >> n >> x;
    unordered_set<int> can;
    auto find = [&](int a) {
        unordered_set<int> ans;
        for (int i = 1;i * i <= a;i++) {
            if (a % i == 0) {
                if (i % 2 == 0)can.insert(1 + i / 2);
                if ((a / i) % 2 == 0)can.insert(1 + (a / i) / 2);
            }
        }
        return ans;
    };
    for (auto i : find(n - x))can.insert(i);
    for (auto i : find(n + x - 2))can.insert(i);
    int ans = 0;
    for (auto i : can) {
        if (i >= x)ans++;
    }
    cout << ans << '\n';
}
```

## CF 1928 Div.2 D - Lonely Mountain Dungeons
中土世界居民的军队将由几个小队组成。众所周知，每一对同种族的生物分属不同的小队，军队的总兵力就会增加 $b$ 个单位。但由于提摩西很难领导一支由大量小队组成的军队，因此由 $k$ 个小队组成的军队的总兵力会减少 $(k - 1) \cdot x$ 个单位。注意，军队总是由**个至少一个班**组成。

有 $n$ 个种族，而 $i$ 个种族的生物数量等于 $c_i$ 。确定他们所能组建的军队的最大兵力。

### Solution
<span style="color:#92d050">三分</span>（先单增，再单减）组合数

注意：`long long` 的计算稍不注意就会wa

三分这里的关键不是模板本身，而是先证明 `check(k)` 呈现“先增后减”的单峰形态。因为随着队伍数增加，每个种族内部贡献的变化是平滑的，总答案可以按单峰函数处理，于是可以安全三分，再在收缩后的短区间里暴力枚举收尾。

[codeforces round 924 (Div2) A-E 思路分享\_哔哩哔哩\_bilibili](https://www.bilibili.com/video/BV1wy421a7iy/?spm_id_from=333.337.search-card.all.click&vd_source=cb670d82714ee9baee22c33ef083884d)

对于计算分成 $k$ 个队伍时的战斗力(每个种族其实是独立的，所以可以分开计算)：

先算出 $\frac{i}{k}$ 的整数部分，意味着每个队伍都至少有 $\lfloor{\frac{i}{k}}\rfloor$ 个人

当每个队伍都是 $\lfloor{\frac{i}{k}}\rfloor$ 个人，这时的贡献：$\frac{\lfloor{\frac{i}{k}}\rfloor\times(k-1)\times \lfloor{\frac{i}{k}}\rfloor\times k}{2}$

>对于一个人来说，其他队伍的人都有助于贡献：$\lfloor{\frac{i}{k}}\rfloor\times(k-1)$
>
>对于和他同一个队伍的人来说：$\lfloor{\frac{i}{k}}\rfloor\times(k-1)\times \lfloor{\frac{i}{k}}\rfloor$
>
>其他队伍的也是一样，所以这时的贡献：$\frac{\lfloor{\frac{i}{k}}\rfloor\times(k-1)\times \lfloor{\frac{i}{k}}\rfloor\times k}{2}$

余数部分，只有部分队伍仅有 1 人，贡献：$\frac{i\%k\times(i\%k-1)}{2}$

余数和整数部分的接壤：则贡献：$(k-1)\times \lfloor{\frac{i}{k}}\rfloor\times i\%k$

>对于后加入的余数部分，之前整数部分和他不在同一个队伍的 $(k-1)\times \lfloor{\frac{i}{k}}\rfloor$ 个人需要算上贡献

`则该种族的战斗力`：$\textcolor{green}{\frac{\lfloor{\frac{i}{k}}\rfloor\times(k-1)\times \lfloor{\frac{i}{k}}\rfloor\times k}{2}+\frac{i\%k\times(i\%k-1)}{2}+(k-1)\times \lfloor{\frac{i}{k}}\rfloor\times i\%k-(k-1)\times x}$

```cpp 三分
void solve() {
    int n, b, x;cin >> n >> b >> x;
    vector<int> c(n);for (int i = 0;i < n;i++)cin >> c[i];
    auto check = [&](ll k) {//计算分成k个队伍时的战斗力
        ll ans = 0;
        for (auto i : c) {
            ll t = i / k, tt = i % k, res = 0;
            res += t * t * k * (k - 1) / 2;
            if (tt > 0) {//可忽略这个条件
                res += tt * (tt - 1) / 2;
                res += tt * t * (k - 1);
            }
            ans += res * b;
        }
        ans -= (k - 1) * x;
        return ans;
    };
    ll l = 1, r = *(max_element(c.begin(), c.end()));
    while (r - l + 1 > 3) {//这段代码的主要目的是将l,r区间缩小到足够小了方便之后枚举
        ll lmid = l + (r - l + 1) / 3;
        ll rmid = r - (r - l + 1) / 3;
        if (check(lmid) > check(rmid))r = rmid;//目的为了缩减区间长度
        else l = lmid;
    }
    ll ans = 0;
    for (ll i = l;i <= r;i++)ans = max(ans, check(i));
    cout << ans << '\n';
}
```

[D\_哔哩哔哩\_bilibili](https://www.bilibili.com/video/BV1Cu4m1P7My?p=5&vd_source=cb670d82714ee9baee22c33ef083884d)
(我认为最简单的思路）：在 $c[i]$ 中会有一些重复的数字，如果依次枚举的话重复的数字就重复计算了，所以可以算出之后乘以个数即可。

复杂度：最坏情况 (有 $m$ 个种族人数不同）：$1,2,3,\dots,m$ 互不相同 $\sum c=\frac{m(m+1)}{2}\in m^2\leq 2\times10^5\in n$, $\to O(mn)=O(n\sqrt{ n })$

注：
- `num` 数组只能开在外面，开在里面会 T ,要将 `num` 数组放里面，需要将 `num` 的大小改为 $\max(c_{i})$

```cpp 
vector<int> num(2e5 + 1);
void solve() {
    int n, b, x;cin >> n >> b >> x;
    unordered_set<int> c;
    for (int i = 0;i < n;i++) {
        int x;cin >> x;
        c.insert(x);
        num[x]++;
    }
    auto check = [&](ll k) {
        ll ans = 0;
        for (auto i : c) {
            ll t = i / k, tt = i % k, res = 0;
            res += t * t * k * (k - 1) / 2;
            res += tt * (tt - 1) / 2;
            res += tt * t * (k - 1);
            ans += res * b * num[i];
        }
        ans -= (k - 1) * x;
        return ans;
    };
    ll l = 1, r = *(max_element(c.begin(), c.end())), ans = 0;
    for (ll i = l;i <= r;i++)
        ans = max(ans, check(i));
    cout << ans << '\n';
    for (auto p : c)num[p] = 0;
}
```

[Codeforces Round 924 (Div. 2) A - E - 知乎](https://zhuanlan.zhihu.com/p/682080153)

可以看出，最佳方案肯定是将每个种族<span style="color:#ffc000">均匀分配</span>到每个队伍中。

假设某个种族有 $c_{i}$ 个，我们可以暴力枚举队伍数为 $[1,c_{i}-1]$ 时对答案的贡献，对于 $\left[ c_{i},\sum c \right]$ 区间贡献是确定的，可以使用静态区间加实现。

由于 $\sum c$ 有限制，所以这种方法可以在 $O\left( \sum c \right)$ 的时间内完成。
```cpp
void solve() {
    int n, b, x, m = 0;cin >> n >> b >> x;
    vector<int>c(n);for (int i = 0;i < n;i++)cin >> c[i], m += c[i];
    vector<ll>d(m + 1);
    auto add = [&](int l, int r, ll x) {
        d[l] += x;
        if (r + 1 <= m)d[r + 1] -= x;
    };
    for (auto x : c) {
        for (int i = 1;i < x;i++) {
            ll sum = 1ll * x * (x - 1);
            int t = x / i, r = x % i;
            sum -= (i - r) * 1ll * t * (t - 1);
            sum -= r * 1ll * (t + 1) * t;
            add(i, i, sum / 2);
        }
        add(x, m, 1ll * x * (x - 1) / 2);
    }
    ll ans = 0;
    for (int i = 1;i <= m;i++) {
        d[i] += d[i - 1];
        ans = max(ans, d[i] * b - 1ll * (i - 1) * x);
    }
    cout << ans << '\n';
}
```

[D\_哔哩哔哩\_bilibili](https://www.bilibili.com/video/BV1B2421c7GQ?p=5&vd_source=cb670d82714ee9baee22c33ef083884d)
平均分配最优，先排序，枚举队伍数量，种族数量小的下次不算了，数量大的在算一遍，直到不会被更新

```cpp
#define int long long
void solve() {
    int n, b, x;cin >> n >> b >> x;
    vector<int> a(n);for (auto& i : a)cin >> i;sort(a.begin(), a.end());
    int maxx = 1e9, divi = 0, hascal = 0;
    int ans = 0;
    for (int i = 2;divi <= n - 1 && i <= maxx;i++) {
        int res = 0;
        for (int j = divi;j <= n - 1;j++) {
            if (a[j] <= i) {
                hascal += b * (a[j] * (a[j] - 1)) / 2;
                divi++;
            } else {
                int cnt = a[j] / i, mod = a[j] % i;
                int a1 = i - mod, a2 = mod;
                res += b * a[j] * (a[j] - 1) / 2;
                res -= b * a1 * cnt * (cnt - 1) / 2;
                res -= b * a2 * (cnt + 1) * cnt / 2;
            }
        }
        res += hascal;
        res -= (i - 1) * x;
        ans = max(ans, res);
    }
    cout << ans << '\n';
}
```

## CF 1928 Div.2 E - Modular Sequence
给你两个整数 $x$ 和 $y$ 。长度为 $n$ 的序列 $a$ 如果是 $a_1=x$ ，且对于所有 $1 < i \le n$ 的 $a_{i}$ 值要么是 $a_{i-1} + y$ 要么是 $a_{i-1} \bmod y$ 

判断是否存在长度为 $n$ 的模数序列，其元素之和等于 $S$ ，如果存在，请找出任何这样的序列。

### Solution
<span style="color:#92d050">DP</span>

暴力搜索$O(2^n)$
```cpp
void solve() {
    int n, x, y, s;cin >> n >> x >> y >> s;vector<int> a(n, 0);a[0] = x;
    ll sum = x;
    auto dfs = [&](auto self, int i, ll currSum) -> bool {
        if (currSum > s) return false; // 前缀和剪枝
        if (i == n) return currSum == s;
        a[i] = (a[i - 1] + y) % y;
        if (self(self, i + 1, currSum + a[i])) return true;
        a[i] = a[i - 1] + y;
        if (self(self, i + 1, currSum + a[i])) return true;
        return false;
    };
    if (dfs(dfs, 1, sum)) {
        cout << "yes\n";for (int i = 0;i < n;i++)cout << a[i] << " \n"[i == n - 1];
    } else {
        cout << "no\n";
    }
}
```

官方题解：

> 我们先来看答案的形式：首先会有形如 $x, x+y, \ldots, x+k\cdot y$ 的前缀，然后会有一些形如 $x \bmod y, x \bmod y+y, \ldots, x \bmod y+k\cdot y$ 的块。
> 
> 我们可以从序列的所有元素中减去 $x \bmod y$，然后将所有元素除以 $y$（所有元素最初的余数都为 $x\bmod y$，因此它们都是可被 $y$ 整除的）。设 $b_1 = \frac{x-x\bmod y}{y}$。那么我们的序列将以 $b_1, b_1+1, \ldots, b_1+k_1$ 开头，然后会有形如 $0,1,\ldots,k_i$ 的块。
> 
> 现在让我们计算这些值：$dp_i$ 表示形如 $0,1, \ldots, k_j$ 且和为 $i$ 的块序列的最小长度。我们可以利用动态规划计算从 $0$ 到 $s$ 的所有数的这个值。如果我们已经处理了从 $0$ 到 $k-1$ 的所有值，那么对于 $k$，我们已经计算出了最小长度，并且我们可以更新 $k+1, k+1+2,\ldots$ 的 $dp$ 值，总共不超过 $s$ 的值有 $O(\sqrt{s})$ 个。在同一个 $dp$ 中，我们可以记录经过哪些值进行了重新计算，以便恢复答案。
> 
> 现在，我们可以遍历形如 $b_1, b_1+1,\ldots,b_1+k_1$ 的第一个块的长度。然后我们就知道剩余块的和，并利用预先计算的 $dp$，我们可以确定是否能够形成所需的序列。

[codeforces round 924 (Div2) A-E 思路分享\_哔哩哔哩\_bilibili](https://www.bilibili.com/video/BV1wy421a7iy/?spm_id_from=333.337.search-card.all.click&vd_source=cb670d82714ee9baee22c33ef083884d)

序列形式如下图(当全部都减去 $x\%y$,并除以 $y$)

第一部分 $x,x+y,\dots x+k_{1}y\to$ $\frac{x-x\%y}{y},\frac{x-x\%y}{y}+1,\frac{x-x\%y}{y}+2,\dots,\frac{x-x\%y}{y}+k_{1}$

其余部分 $x\%y,x\%y+y,\dots x\%y+k_{i}y\to$  $0,1,2,\dots k_{i}$

`dp[x]={达到这个面积最少的长度，从哪里转移过来，最后高度}`

要满足条件必须满足：`dp[s][0]&lt;=n`

这里继续往下推，其实就是一个背包式 DP：`dp[s]` 维护凑出面积 `s` 时所需的最小长度、转移来源和最后一层高度。只要最后 `dp[s][0] <= n`，就说明能在长度限制内构造成功，再按记录的前驱回溯方案即可。

![](./Pasted%20image%2020240215152354.png)

```cpp
void solve() {
    ll n, x, y, s;cin >> n >> x >> y >> s;
    if (x + (n - 1) * (x % y) > s) {
        cout << "NO\n";return;
    }
    s -= (x % y) * n;
    vector<array<int, 3>>dp(s + 1, {INT_MAX,0,0});
    for (int ns = x - x % y, h = x - x % y, i = 1;ns <= s;i++, h += y, ns += h) {
        dp[ns] = {i,0,h};
    }
    for (int i = 0;i <= s;i++) {
        if (dp[i][0] != INT_MAX) {
            for (int j = 1, t = 0/*t代表一部分的柱子的长度*/;t + i <= s;t += j * y, j++) {
                dp[t + i] = min(dp[t + i], {dp[i][0] + j, i, (j - 1)* y});
            }
        }
    }
    if (dp[s][0] > n) {
        cout << "NO\n";return;
    }
    vector<int> ans(n);
    int v = s;
    while (v) {
        auto [i, ns, h] = dp[v];
        while (v != ns) {
            i--;
            ans[i] = h;
            v -= h, h -= y;
        }
    }
    cout << "YES\n";
    for (auto i : ans)cout << i + (x % y) << " ";cout << "\n";
}
```

## CF 2004 EDU Div.2 D - Colored Portals
在一条直线上有 $n$ 座城市。这些城市的编号从 $1$ 到 $n$ 。

传送门用于在城市之间移动。传送门有 $4$ 种颜色：蓝色、绿色、红色和黄色。每个城市都有两种不同颜色的传送门。如果城市 $i$ 和城市 $j$ 的传送门颜色相同，则可以从城市 $i$ 移动到城市 $j$ （例如，可以在 "蓝-红 "城市和 "蓝-绿 "城市之间移动）。这种移动需要花费 $|i-j|$ 枚金币。

你的任务是回答 $q$ 个独立的问题：计算从城市 $x$ 移动到城市 $y$ 的最小花费。

### Solution
二分

>表面看是最短路，其实仔细想想就知道不是这个做法 

思路：

从题目可以知道，一共六种组合，若出现两个城市无法配对的问题，则最多只用中转一次就能到另外一个城市

若除了 $x,y$ 颜色没有其他颜色的城市了，则无法到达，否则一定能找到一个城市作为中转达到另外一个城市。

现在就有另外一个问题：如何在其他不同颜色的所有城市中找到使得 $\left|{i-k}\right|+\left|{j-k}\right|$ 最小的值呢？

如果能找到一个 $k$ 使得 $i<k<j$ ，则这时答案就是 $j-i$ .

若不能找到这样的 $k$，则每次二分的去寻找使得答案相对最小的，即距离 $i$ 或 $j$ 最近的 $k$ 即可，在这里面取最小值即可。

>思路完全正确，但是写代码写错了... 正确代码如下：

```cpp
const string tar[] = {"BG", "BR", "BY", "GR", "GY", "RY"};
void solve() {
    int n, q;cin >> n >> q;
    vector<string> s(n + 1);
    vector<vector<int>> idx(6);
    for (int i = 0;i < 6;i++)idx[i].push_back(0);
    for (int i = 1;i <= n;i++) {
        cin >> s[i];
        for (int j = 0;j < 6;j++)if (s[i] == tar[j])idx[j].push_back(i);
    }
    for (int i = 0;i < 6;i++)idx[i].push_back(1e9);

    while (q--) {
        int x, y;cin >> x >> y;
        if (x > y)swap(x, y);
        if (s[x][0] == s[y][0] || s[x][0] == s[y][1] || s[x][1] == s[y][1] || s[x][1] == s[y][0]) {
            cout << y - x << '\n';continue;
        }
        int ok = 0;
        for (int i = 0;i < 6;i++) {
            if (tar[i] == s[x] || tar[i] == s[y] || !idx[i].size()) continue;
            auto k = lower_bound(idx[i].begin(), idx[i].end(), x);
            if (*k != 1e9 && *k < y) {
                ok = 1;break;
            }
        }
        if (ok) {
            cout << y - x << '\n';continue;
        }
        int ans = 1e9;
        for (int i = 0;i < 6;i++) {
            if (tar[i] == s[x] || tar[i] == s[y] || !idx[i].size()) continue;
            auto k1 = lower_bound(idx[i].begin(), idx[i].end(), x);
            if (*k1 != 1e9) {
                ans = min(ans, *k1 - y + *k1 - x);
            }
            auto k2 = upper_bound(idx[i].begin(), idx[i].end(), x);
            --k2;
            if (*k2 != 0) {
                ans = min(ans, x + y - *k2 - *k2);
            }
        }
        if (ans == 1e9)ans = -1;
        cout << ans << '\n';
    }
}
```

其实代码还可以简化:
```cpp
const string tar[] = {"BG", "BR", "BY", "GR", "GY", "RY"};
void solve() {
    int n, q;cin >> n >> q;
    vector<string> s(n + 1);
    vector<vector<int>> idx(6);
    for (int i = 0;i < 6;i++)idx[i].push_back(0);
    for (int i = 1;i <= n;i++) {
        cin >> s[i];
        for (int j = 0;j < 6;j++)if (s[i] == tar[j])idx[j].push_back(i);
    }
    for (int i = 0;i < 6;i++)idx[i].push_back(1e9);

    while (q--) {
        int x, y;cin >> x >> y;
        if (x > y)swap(x, y);
        if (s[x][0] == s[y][0] || s[x][0] == s[y][1] || s[x][1] == s[y][1] || s[x][1] == s[y][0]) {
            cout << y - x << '\n';continue;
        }
        int ans = 1e9;
        for (int i = 0;i < 6;i++) {
            if (tar[i] == s[x] || tar[i] == s[y] || !idx[i].size()) continue;
            auto k = lower_bound(idx[i].begin(), idx[i].end(), x);
            if (*k != 1e9) {
                ans = min(ans, abs(*k - y) + *k - x);
            }
            --k;
            if (*k != 0) {
                ans = min(ans, x + y - *k - *k);
            }
        }
        if (ans == 1e9)ans = -1;
        cout << ans << '\n';
    }
}
```

## CF 2004 EDU Div.2 E - Not a Nim Problem
爱丽丝和鲍勃正在玩一个游戏。他们有 $n$ 堆棋子，其中 $i$ 堆最初有 $a_i$ 颗棋子。

在他们的回合中，玩家可以选择任意一堆石子，并从中取出任意正数的石子，但有一个条件：

- 让当前石堆中的石子数量为 $x$ 。从棋子堆中取走 $y$，使得 $x$ 和 $y$ 的最大公约数等于 1。

无法下棋的棋手输棋。两位棋手都以最佳状态下棋（也就是说，如果一位棋手的策略能让他获胜，那么无论对手如何回应，他都会获胜）。爱丽丝先下。

确定谁会赢。

### Solution
博弈论 /SG 函数

>EDU：学习博弈论

可以先暴力列出 $sg$ 函数，根据 sg 函数的值来找规律：
```cpp
void solve() {
    constexpr int N = 500;
    vector<int> sg(N);
    for (int i = 1;i < N;i++) {
        set<int>s;
        for (int j = 1;j <= i;j++) {
            if (__gcd(i, j) == 1) {
                s.insert(sg[i - j]);
            }
        }
        int idx = 0;
        for (auto x : s) {
            if (x == idx)idx++;
        }
        sg[i] = idx;
    }
    vector<vector<int>> q(N);
    for (int i = 0;i < N;i++)q[sg[i]].push_back(i);
    for (int i = 0;i < N;i++) {
        cout << i << ": ";
        for (auto x : q[i])cout << x << " ";
        cout << '\n';
    }
}
```

得到 $sg_{0\sim 99}$：
```cpp
0 1 0 2 0 3 0 4 0 2 0 5 0 6 0 2 0 7 0 8 0 2 0 9 0 3 0 2 0 10 0 11 0 2 0 3 0 12 0 2 0 13 0 14 0 2 0 15 0 4 0 2 0 16 0 3 0 2 0 17 0 18 0 2 0 3 0 19 0 2 0 20 0 21 0 2 0 4 0 22 0 2 0 23 0 3 0 2 0 24 0 4 0 2 0 3 0 25 0 2 
```
$q_{0\sim 99}$: (即 $q_{sg_{i}}$)

```cpp
0: 0 2 4 6 8 10 12 14 16 18 20 22 24 26 28 30 32 34 36 38 40 42 44 46 48 50 52 54 56 58 60 62 64 66 68 70 72 74 76 78 80 82 84 86 88 90 92 94 96 98 
1: 1 
2: 3 9 15 21 27 33 39 45 51 57 63 69 75 81 87 93 99 
3: 5 25 35 55 65 85 95 
4: 7 49 77 91 
5: 11 
6: 13 
7: 17 
8: 19 
9: 23 
10: 29 
11: 31 
12: 37 
13: 41 
14: 43 
15: 47 
16: 53 
17: 59 
18: 61 
19: 67 
20: 71 
21: 73 
22: 79 
23: 83 
24: 89 
25: 97 
```

易得

- 当 $i$ 为偶数时 $sg_{i}=0$ 
- 只看第一项，从 2 开始，之后的每一项是 $3,5,7,11,\dots$ 都是质数项即 $sg_{3}=2,sg_{5}=3,\dots,\to sg_{primes_{i}}=i+1$
- 在一个值 $x$ 对应多个 $sg_{i}$ 时，可以发现后面的数的最小质因数就是第一个质数，即:
		$sg_{\{list\}}=x$，$\{in\ list \cap i> 0:minp[list_{i}]=list_{0}\}$

则有：$\displaystyle sg_{primes_{i}=i+1}$，$sg_{i}=sg_{minp_{i}}$

```cpp
constexpr int N = 1e7;
int sg[N + 1];
void solve() {
    int n;cin >> n;
    int ans = 0;
    for (int i = 1;i <= n;i++) {
        int x;cin >> x;ans ^= sg[x];
    }
    if (ans != 0) {
        cout << "Alice\n";
    } else {
        cout << "Bob\n";
    }
}
int main() {
    ios::sync_with_stdio(false), cin.tie(nullptr);
    sieve(N);
    sg[0] = 0;sg[1] = 1;sg[2] = 0;
    for (int i = 1;i < primes.size();i++) {
        sg[primes[i]] = i + 1;
    }
    for (int i = 3;i <= N;i++) {
        sg[i] = sg[minp[i]];
    }
    int _ = 1;
    cin >> _;
    while (_--)
        solve();
}
```

## CF 1957 Div.2 C - How Does the Rook Move?
给您一个 $n \times n$ 棋盘，您和电脑轮流在棋盘上分别放置白车和黑车。在放置车的过程中，您必须确保没有两只车互相攻击。如果两只车共用同一行或同一列，则无论颜色如何，都会互相攻击。

有效的一步棋是将一只车放在一个位置（ $r$ ， $c$ ）上，使它不会攻击任何其他车。

你先开始，当你在自己的回合中走了一步有效的棋，将白车置于位置（ $r$ ， $c$ ）时，电脑会照搬你的棋，在它的回合中将黑车置于位置（ $c$ ， $r$ ）。如果是 $r = c$ ，那么电脑就无法映射你的棋步，并跳过它的回合。

您已经与计算机下了 $k$ 步棋（计算机也会尝试复制这些棋步），您必须继续下棋直到没有剩余的有效棋步为止。在下完 $k$ 步之后，如果继续下棋，最终会有多少种不同的配置？可以保证 $k$ 步和隐含的计算机步都是有效的。由于答案可能较大，请打印出 $10^9+7$ 的模数。

如果存在一个坐标（ $r$ ， $c$ ），其中一个配置中有一个车，而另一个配置中没有，或者坐标上的车的颜色不同，那么这两个配置就被认为是不同的。

### Solution
<span style="color:#92d050">组合数学/DP</span>

法一：DP 转移方程：`f[i] = f[i - 1] + f[i - 2] * 2 * (i - 1)`

若从后往前推：

对于棋下在对角线上时，选择 $(i,i)$ 这时消耗了 $1r\times1l$ 则贡献为 $f[i-1]$

若没有下在对角线上：选定该行 $i(row)$ 后，则列可以在前面 $(i-1)$ 个位置任意挑选，列 $i(line)$ 同理，消耗 $2r\times2l$，则贡献为 $2(i-1)f[i-2]$

```cpp
#define int long long
constexpr int mod = 1e9 + 7;
int f[300010];
void solve() {
    int n, k;cin >> n >> k;int cnt = n;
    for (int i = 1;i <= k;i++) {
        int x, y;cin >> x >> y;cnt -= 2 - (x == y);
    }
    cout << f[cnt] << '\n';
}
signed main() {
    ios::sync_with_stdio(false), cin.tie(nullptr);
    f[0] = 1;f[1] = 1;f[2] = 3;
    for (int i = 3;i <= 3e5;i++) {
        f[i] = f[i - 1] + f[i - 2] * 2 * (i - 1);f[i] %= mod;
    }
    int _ = 1;
    cin >> _;
    while (_--)
        solve();
}
```

组合数学：

$C_{n}^m=\frac{n!}{(n-m)!\times m!}$

$cnt$ 代表可用的行列数，则： $ans=\sum\limits_{i=0}^{cnt/2}(C_{cnt}^{2i}\times C_{2i}^{i}\times i!)\equiv\sum\limits_{i=0}^{cnt/2}\left( \frac{cnt!}{(cnt-2i)!\times i!} \right)=\sum\limits_{i=0}^{cnt/2}\left( C_{cnt}^{2i}\times \frac{2i!}{i!} \right)$

不懂是如何推出的 $\dots$
```cpp
#define int long long
constexpr int mod = 1e9 + 7;
int fac[300010];
int inv(int a, int b = mod - 2) {
    int ans = 1;
    while (b) {
        if (b & 1)ans = (ans * a) % mod;
        a = (a * a) % mod;b >>= 1;
    }
    return ans;
}
int c(int a, int b) {
    return fac[a] * inv(fac[a - b]) % mod * inv(fac[b]) % mod;
}
void solve() {
    int n, k;cin >> n >> k;int cnt = n;
    for (int i = 1;i <= k;i++) {
        int x, y;cin >> x >> y;cnt -= 2 - (x == y);
    }
    int ans = 0;
    for (int i = 0;i * 2 <= cnt;i++) {
        ans = (ans + c(cnt, 2 * i) * c(2 * i, i) % mod * fac[i]) % mod;
    }
    cout << ans << '\n';
}
signed main() {
    ios::sync_with_stdio(false), cin.tie(nullptr);
    fac[0] = fac[1] = 1;
    for (int i = 2;i <= 3e5;i++) {
        fac[i] = fac[i - 1] * i % mod;
    }
    int _ = 1;
    cin >> _;
    while (_--)
        solve();
}
```

## CF 1957 Div.2 D - A BIT of an Inequality
 给你一个数组 $a_1, a_2, \ldots, a_n$ 。请找出有多少个图元（ $x, y, z$ ）符合下列条件：

- $1 \leq x \leq y \leq z \leq n$ , 和
- $f(x, y) \oplus f(y, z) > f(x, z)$ .

定义 $f(l, r) = a_l \oplus a_{l + 1} \oplus \ldots \oplus a_{r}$。

### Solution
位运算

$f(x, y) \oplus f(y, z)>f(x,z)\implies f(x,z)\oplus a_{y} > f(x, z)$

> 设前缀异或为 $s$，$s_{i}$ 代表前 $i$ 个数进行异或。
> 
> 则可以将要求简化为求 $s_{z}\oplus s_{x-1}\oplus a_{y}>s_{z}\oplus s_{x-1}$ 的个数。
> 
> 现在进行分类讨论：设 $s_{z},s_{x-1}$ 当前比特位分别为 $r,l_{-1}$，$t$ 代表的是 $a_{y}$ 最高比特位的值
> 
> 当 $t=0$ 时：无论 $r,l_{-1}$ 为 $0|1$，$s_{z}\oplus s_{x-1}$ 的值都不会变
> 
> 当 $t=1$ 时，若此时 $r,l_{-1}$ 的值不同，则最终的值会变小，否则最终的值会变大

总结：变大的情况只有 $t=1 \cap r=l_{-1}=0\text{ or }1$ 时才会出现。

这样对于 $a_{i}$，只要先找到其最高位为 1 的位置 $(j=\_\_lg(a_{i}))$

由题目可得 $z \in[i,n],x-1 \in[0,i-1]$，所以答案就是 $i$ 两边都是 1 的情况加上两边都是 $0$ 的情况。

即 $[i,n]$ 中 1 的数量乘以 $[0,i-1]$ 中 1 的数量加上 $[i,n]$ 中 0 的数量乘以 $[0,i-1]$ 中 0 的数量

>1 的数量算出来之后，这个区间 0 的数量就是区间长度减去 1 的数量。

```cpp 幻想家协会会长
#define int long long
int c[32][100010];
void solve() {
    int n;cin >> n;vector<int> a(n + 1), s(n + 1);
    for (int i = 1;i <= n;i++) {
        cin >> a[i];s[i] = s[i - 1] ^ a[i];
        for (int j = 0;j <= 30;j++) {
            c[j][i] = c[j][i - 1] + (s[i] >> j & 1);
        }
    }
    int ans = 0;
    for (int i = 1;i <= n;i++) {
        int k = __lg(a[i]);
        ans += (c[k][n] - c[k][i - 1]) * c[k][i - 1];
        ans += (n - i + 1 - (c[k][n] - c[k][i - 1])) * (i - c[k][i - 1]);
    }
    cout << ans << '\n';
}
```

现在只需要进行预处理：需要得到的是 $f(l,r)=0\text{ or }1(\text{k bit})$，即：从 $l$ 到 $r$ 的元素的第 $k$ 位一起异或起来是 $0$ 还是 1

> 
> 这里需要处理其前缀与后缀：(官方题解)
> 
> `pre[i][j][k = 0]` 代表 $a[1\sim j]$ 个数的第 $i$ 位是 $0$ 的个数，$k=1$ 同理。
> 
> `suf[i][j][k = 0]` 代表 $a[n\sim j]$ 个数的第 $i$ 位是 $0$ 的个数，$k=1$ 同理。
> 
> 注意：由于这里没有错位的进行前缀与后缀计算，所以在对 $a_{i}$ 进行操作时，需要将 $a_{i}$ 归于

```cpp 官方题解
constexpr int Z = 30, MAX_N = 1e5 + 3;
int pref[Z][MAX_N][2];
int suff[Z][MAX_N][2];

void solve() {
    int n;
    cin >> n;
    vector<int> a(n + 1);
    for (int i = 1; i <= n; i++) cin >> a[i];
    for (int i = 0; i < Z; i++) suff[i][n + 1][0] = suff[i][n + 1][1] = 0;
    for (int i = 0; i < Z; i++) {
        for (int j = 1; j <= n; j++) {
            int t = (a[j] >> i) & 1;
            for (int k = 0; k < 2; k++) pref[i][j][k] = (t == k) + pref[i][j - 1][k ^ t];
        }
        for (int j = n; j >= 1; j--) {
            int t = (a[j] >> i) & 1;
            for (int k = 0; k < 2; k++) suff[i][j][k] = (t == k) + suff[i][j + 1][k ^ t];
        }
    }
    long long ans = 0;
    for (int i = 1; i <= n; i++) {
        int z = __lg(a[i]); // <-> 31 - __builtin_clz(a[i])
        ans += 1ll * pref[z][i - 1][1] * (1 + suff[z][i + 1][0]);
        ans += 1ll * (1 + pref[z][i - 1][0]) * suff[z][i + 1][1];
    }
    cout << ans << "\n";
}
```

## CF 1957 Div.2 E - Carousel of Combinations
给你一个整数 $n$ 。函数 $C(i,k)$ 表示从集合 \{ $1, 2, \ldots, i$ \} 中选择 $k$ 个不同的数字并将它们围成一个圆圈 $^\dagger$ 的不同方法的数目。

求

$$
\sum\limits_{i=1}^n \sum\limits_{j=1}^i \left( C(i,j) \bmod j \right). 
$$

由于这个值可能非常大，因此求它的模数 $10^9+7$ 。

### Solution
<span style="color:#92d050">威尔逊定理</span>

容易知道 $C(i,j)=Comb(i,j)\times(j-1)! =\frac{i!}{(i-j)!\times j}=\frac{i(i-1)(i-2)\dots(i-j+1)}{j}$

可以知道的是 $n\dots(n-j+1)$ 有 $j$ 项，由于是连续的 $j$ 个数，每个数对 $j$ 的 模数一定不一样 $(0\sim j-1)$，其中一定有一项能够被 $j$ 整除($0\pmod j$)，至于其他项则构成了 $(j-1)!$

$\implies C(i,j)=(j-1)!\times \lfloor{\frac{i}{j}}\rfloor\pmod j$

> $\text{wilson}$ 定理：对于素数 $p$，$(p-1)! \equiv(p)-1\pmod p$，对于合数 $(p\neq4)$，$(p-1)! \equiv0\pmod p$

这里利用差分数组 $d$，对于位置 $i(i=k\times j,k=1,2,3\dots)$，则要使得 $\lfloor{\frac{i}{j}}\rfloor$ 的结果相同，$i \in[kj,kj+j-1]$ 即 $[i,i+j-1]$ 位置的贡献 $\left( \lfloor{\frac{i}{j}}\rfloor \right)$ 和 $i$ 位置相同，直到 $[i+j]$ 才使得 $\lfloor{\frac{i}{j}}\rfloor$ 增加了 1，所以在 $i$ 位置加上对应贡献，在 $[i+j]$ 位置减去相应贡献，这样，对 $d$ 数组进行前缀和后就能够计算出每个位置正确的贡献，对答案而言，是 $[1,n]$ 的贡献之和，所以还需要对 $d$ 数组再进行一次前缀和则就是对应的答案。

```cpp
#define int long long
constexpr int N = 1e6, mod = 1e9 + 7;
int vis[N + 10], pri[N + 10], isp[N + 10];//判断是否是素数
int d[N + 10];
void init(int n) {//线性筛
    int cnt = 0;
    for (int i = 2; i <= n; ++i) {
        if (!vis[i]) {
            pri[cnt++] = i;isp[i] = 1;
        }
        for (int j = 0; j < cnt; ++j) {
            if (i * pri[j] > n) break;
            vis[i * pri[j]] = 1;
            if (i % pri[j] == 0) break;
        }
    }
}
signed main() {
    ios::sync_with_stdio(false), cin.tie(nullptr);
    init(N);
    for (int j = 2;j <= N;j++) {
        if (j == 4 || isp[j]) {
            int v = (j == 4 ? 2 : j - 1);
            for (int i = j;i <= N;i += j) {//枚举j的倍数
                int t = v * (i / j) % j;
                d[i] = (d[i] + t) % mod;
                if (i + j <= N)d[i + j] = (d[i + j] - t + mod) % mod;
            }
        }
    }
    for (int i = 1;i <= N;i++)d[i] = (d[i] + d[i - 1]) % mod;
    for (int i = 1;i <= N;i++)d[i] = (d[i] + d[i - 1]) % mod;
    int _;cin >> _;
    while (_--) {
        int n;cin >> n;cout << d[n] << '\n';
    }
}
```

## CF 1935 Div.2 D - Exam in MAC
给出一个长度为 $n$ 的数组 $s$，求 $x,y(x\leq y)$ (满足 $x+y,y-x$ 都不是数组中的元素, $0\leq x,y\leq c$)的对数

### Solution
<span style="color:#92d050">容斥原理/组合数学</span>

主要是要往这个方面想，想到了就很简单了。

官方题解：

用容斥原理：$\mathrm{cnt}(x, y) - \mathrm{cnt}(x, y: x + y \in s) - \mathrm{cnt}(x, y: y - x \in s) + \mathrm{cnt}(x, y: x + y, y - x \in s)$。

 $x, y$ 的总对数数量是 $\frac{(c+1)\cdot(c+2)}{2}$。

 $x, y: x + y \in s$。遍历和值 $s_i$，假设 $x + y = s_i$，则对于 $0 \leq x \leq \lfloor \frac{s_i}{2} \rfloor$ 会有一个对应的 $y$，因此具有这样的和的对的数量是 $\lfloor \frac{s_i}{2} \rfloor + 1$。

 $x, y: y - x \in s$。遍历差值 $s_i$，假设 $y - x = s_i$，则对于 $s_i \leq y \leq c$ 会有一个对应的 $x$，因此具有这样的差的对的数量是 $c - s_i + 1$。

 $x, y: x + y, y - x \in s$。假设 $x+y=s_i$，$y-x=s_j$，则 $x = \frac{s_i - s_j}{2}$，$y = \frac{s_i+s_j}{2}$。当奇偶性相同时就可以计入答案。 让我们计算 $s$ 中偶数和奇数的数量——分别为 $even$ 和 $odd$。因此，这样的对的数量是 $\frac{even\cdot(even+1)}{2}+\frac{odd\cdot(odd+1)}{2}$。

```cpp
#define int long long
void solve() {
    int n, c;cin >> n >> c;
    vector<int> a(n);
    for (int i = 0;i < n;i++) {
        cin >> a[i];
    }
    int cnt = (c + 2) * (c + 1) / 2, odd = 0;
    for (int i = 0;i < n;i++) {
        cnt -= a[i] / 2 + 1;
        cnt -= c - a[i] + 1;
        if (a[i] % 2)odd++;
    }
    int even = n - odd;
    cnt += (odd + 1) * odd / 2 + (even + 1) * even / 2;
    cout << cnt << '\n';
}
```

## CF 1997 EDU Div.2 D - Maximize the Root
给你一棵有根的树，由 $n$ 个顶点组成。树中的顶点编号为 $1$ 至 $n$ ，根顶点为 $1$ 。数值 $a_i$ 写在第 $i$ 个顶点上。

您可以执行以下任意次数（可能为零）的操作：选择一个顶点 $v$ 该顶点至少有一个子顶点。对 $v$ 的子树（ $v$ 本身除外）中的所有顶点 $u$ ，将 $a_v$ 增加 $1$ ，并将 $a_u$ 减少 $1$ 。但是，每次操作后，所有顶点上的值都应该是非负值。

您的任务是通过上述操作计算出写入根的最大可能值。

### Solution
树形 DP/二分

这个题目一眼二分，但是可惜自己的图论方面的代码能力太差，没写出来。(似乎有许多解法)

$O(n\log n)$

dfs 判断是否能够在 $u$ 的子树中得到至少 $x$ 的值

dfs 思路是：对于 1 的子树而言，需要满足大于等于 mid 的需求，若不满足，则子树的节点需要被增加一些才能满足需求，而这里增加了对于该子树节点的子树会提出更高的要求，即 $x$ 会增加。

```cpp
#define int long long
void solve() {
    int n;cin >> n;
    vector<int> a(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i];
    vector<vector<int>> g(n + 1);
    for (int i = 2;i <= n;i++) {
        int x;cin >> x;
        g[x].push_back(i);
    }

    auto dfs = [&](auto self, int u, int x)->bool {
        if (x > 1e9)return 0;
        bool leaf = 1;
        if (u != 1) {
            x += max(0ll, x - a[u]);
        }
        for (auto v : g[u]) {
            leaf = 0;
            if (!self(self, v, x))return 0;
        }
        return (!leaf || x <= a[u]);
        };

    int l = 0, r = 1e10;
    while (l < r) {
        int mid = l + r >> 1;

        if (!dfs(dfs, 1, mid))r = mid;
        else l = mid + 1;
    }
    cout << a[1] + l - 1 << '\n';
}
```

$O(n)$

思路和我刚开始的想法接近，尽量让上下两层最小值接近, 

若 $u$ 子树的最小值 $mi$ 比 $a_{u}$ 还小，则证明子树没什么能提交给 $a_u$ 的了，这个子树最多能凑出 $mi$ 的值，

若 $u$ 子树的最小值 $mi$ 比 $a_{u}$ 大，则可以按照题目要求将子树中的值整体提交给父亲一些，当接近的时候最优

搜索之后，根节点的子树则为下面的节点提交后的值，则答案就是 $a_{1}$ 加上子树的最小值。

```cpp
#define int long long
void solve() {
    int n;cin >> n;
    vector<int> a(n + 1), val(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i];
    vector<vector<int>> g(n + 1);
    for (int i = 2;i <= n;i++) {
        int x;cin >> x;
        g[x].push_back(i);
    }
    int inf = 1e18;
    auto dfs = [&](auto self, int u)->void {
        val[u] = a[u];
        int mi = inf;
        for (auto v : g[u]) {
            self(self, v);mi = min(mi, val[v]);//mn是求的u节点子树的最小值
        }
        if (mi != inf) {// 不是叶子节点
            if (val[u] > mi) {
                val[u] = mi;
            } else {
                val[u] = val[u] + mi >> 1;
            }
        }
        };
    dfs(dfs, 1);
    int ans = inf;
    for (auto v : g[1]) {
        ans = min(ans, val[v]);
    }
    cout << ans + a[1] << '\n';
}
```
