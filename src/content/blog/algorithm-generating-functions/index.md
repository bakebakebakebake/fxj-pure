---
title: 我对生成函数的入门理解：先把系数当答案
description: 以原始笔记为骨架，补回普通生成函数、指数生成函数、建模直觉与几道典型题。
publishDate: 2024-09-13
tags:
  - 算法
  - 生成函数
  - 组合数学
  - DP
language: 中文
---

> [!note] 说明
> 这篇继续按“原笔记 + 补充整理”的方式写。原来笔记里已经有普通生成函数、指数生成函数和三道题；这次主要把建模主线、常见式子和为什么这么做补齐，方便后面接到多项式那篇。

## 收录内容

- `原笔记里的母函数部分`
- `普通生成函数 / 指数生成函数的区别`
- `HDU 2152 / HDU 1085 / HDU 1521` 的建模整理
- `和 DP、卷积、多项式的关系`

## 先把最核心的话记住

生成函数最有用的地方，不是记一堆展开式，而是：

- 指数负责记录“选了多少个东西”；
- 系数负责记录“方案数 / 权值 / 排列数”；
- 乘法负责把“几个独立选择”合并起来。

所以我更愿意把它理解成一种**把计数问题装进系数里**的写法。

如果题目里出现了下面这些信号，通常就该往生成函数上想：

- 每一类物品可以选若干个；
- 最后只关心“总共选了多少个 / 总和是多少”；
- 多个独立选择合并时，本质是卷积；
- 顺序是否重要，会直接决定该用普通生成函数还是指数生成函数。

## 普通生成函数

> 原笔记里的叫法是“母函数”，我这里按竞赛里更常见的写法记成 OGF。

形式：

$$
F(x)=\sum_{n\ge 0} a_n x^n
$$

其中 $x^n$ 记录“规模是 $n$”，系数 $a_n$ 记录“规模为 $n$ 时的方案数 / 权值”。

### 原笔记里的三个基本性质

- 加减：
$$
  F(x) \pm G(x)=\sum_{n\ge 0}(a_n \pm b_n)x^n
$$
- 乘法：
$$
  F(x)G(x)=\sum_{n\ge 0}\left(\sum_{i=0}^n a_i b_{n-i}\right)x^n
$$
- 所以，乘法对应的就是卷积。

这也是为什么生成函数经常和 DP 放在一起：很多“前 $i$ 类物品凑出和为 $j$”的转移，本质上就是把前面的多项式再乘上一个“这一类物品能提供的选择式”。

> [!note]- 把普通生成函数常见形式先收一份
> 下面这些式子会反复出现：
>
> - 一个物品可以选 $0,1,2,\dots$ 次：
> $$
>   1+x+x^2+\cdots = \frac{1}{1-x}
> $$
> - 一个物品最多选 $a$ 次：
> $$
>   1+x+x^2+\cdots+x^a
> $$
> - 一个物品的“重量 / 代价”是 $w$，可以选 $0,1,2,\dots$ 次：
> $$
>   1+x^w+x^{2w}+\cdots = \frac{1}{1-x^w}
> $$
> - 一个物品的“重量 / 代价”是 $w$，最多选 $a$ 次：
> $$
>   1+x^w+x^{2w}+\cdots+x^{aw}
> $$
>
> 真正做题时，重点不是背公式，而是先想清楚：
>
> - 指数到底在记录什么；
> - 系数到底在记录什么；
> - 每一类物品的选择空间该写成哪个括号。

### 原笔记里的理解：指数是个数，系数是组合数

这个表述我觉得非常好记：

- 指数是“总共选了多少个 / 总权值是多少”；
- 系数是达到这个指数的方案数。

因此，多重集组合数问题特别适合直接写 OGF。

## 题 1：HDU 2152 - Fruit

题意可以压成一句：

- 有 $n$ 类物品；
- 第 $i$ 类必须选 $[l_i,r_i]$ 个；
- 问总共选 $m$ 个的方案数。

### 建模

设第 $i$ 类实际选了 $b_i$ 个，那么：

$$
0 \le l_i \le b_i \le r_i, \quad \sum_{i=1}^n b_i = m
$$

于是第 $i$ 类物品贡献一个多项式：

$$
x^{l_i}+x^{l_i+1}+\cdots+x^{r_i}
$$

全体方案对应：

$$
\prod_{i=1}^n \left(x^{l_i}+x^{l_i+1}+\cdots+x^{r_i}\right)
$$

我们要的就是 $x^m$ 的系数。

### 这题为什么和 DP 完全等价

如果写 DP，通常会设：

- `dp[j]` 表示当前处理到若干类物品时，凑出总数 $j$ 的方案数。

加入第 $i$ 类，相当于枚举这一类取了多少个，再把系数卷进去。这和把当前多项式乘上
$\left(x^{l_i}+\cdots+x^{r_i}\right)$ 是同一件事。

```cpp title="HDU 2152：普通生成函数写法"
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    while (cin >> n >> m) {
        vector<int> l(n + 1), r(n + 1);
        for (int i = 1; i <= n; ++i) {
            cin >> l[i] >> r[i];
        }

        vector<int> dp(m + 1), ndp(m + 1);
        dp[0] = 1;
        for (int i = 1; i <= n; ++i) {
            fill(ndp.begin(), ndp.end(), 0);
            for (int used = 0; used <= m; ++used) {
                if (!dp[used]) continue;
                for (int take = l[i]; take <= r[i] && used + take <= m; ++take) {
                    ndp[used + take] += dp[used];
                }
            }
            dp.swap(ndp);
        }
        cout << dp[m] << '\n';
    }
    return 0;
}
```

## 题 2：HDU 1085 - Holding Bin-Laden Captive!

原笔记的核心建模是：

- 有面值 $1,2,5$ 的硬币；
- 第 $i$ 种硬币有 $a_i$ 枚；
- 问最小的、无法凑出来的面值。

### 建模

三种硬币对应三项：

$$
(1+x+x^2+\cdots+x^{a_1})
(1+x^2+x^4+\cdots+x^{2a_2})
(1+x^5+x^{10}+\cdots+x^{5a_3})
$$

展开后：

- $x^s$ 的系数非零，表示金额 $s$ 可达；
- 第一个系数为零的位置，就是答案。

这个题很适合拿来体会“指数不是个数，而是目标量”。在上一题里指数记录的是“选了几个物品”，这里记录的是“凑出的金额”。

```cpp title="HDU 1085：看第一个系数为 0 的位置"
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int a1, a2, a3;
    while (cin >> a1 >> a2 >> a3 && (a1 || a2 || a3)) {
        int maxSum = a1 + 2 * a2 + 5 * a3;
        vector<int> dp(maxSum + 1), ndp(maxSum + 1);
        dp[0] = 1;

        vector<pair<int, int>> items = {{1, a1}, {2, a2}, {5, a3}};
        for (auto [w, cnt] : items) {
            fill(ndp.begin(), ndp.end(), 0);
            for (int s = 0; s <= maxSum; ++s) {
                if (!dp[s]) continue;
                for (int k = 0; k <= cnt && s + k * w <= maxSum; ++k) {
                    ndp[s + k * w] += dp[s];
                }
            }
            dp.swap(ndp);
        }

        int ans = 0;
        while (ans <= maxSum && dp[ans]) ++ans;
        cout << ans << '\n';
    }
    return 0;
}
```

## 指数生成函数

形式：

$$
F(x)=\sum_{n\ge 0} a_n \frac{x^n}{n!}
$$

原笔记里写得很到位：

- $\langle 1,1,1,\dots \rangle$ 的 EGF 是 $e^x$；
- $\langle 1,p,p^2,\dots \rangle$ 的 EGF 是 $e^{px}$。

### 为什么这里要除以 $n!$

因为 EGF 往往用来处理**带标号 / 顺序重要**的问题。

在 OGF 里，卷积给出的通常是“把数量加起来”的组合数；
在 EGF 里，乘法会自然带出组合数系数：

$$
F(x)G(x)=\sum_{n\ge 0}\frac{x^n}{n!}\sum_{i=0}^n \binom{n}{i}a_i b_{n-i}
$$

这里的 $\binom{n}{i}$ 就是“从 $n$ 个位置里分出 $i$ 个给第一部分、其余给第二部分”。

所以它非常适合处理：

- 顺序重要；
- 元素有标号；
- 排列数天然会冒出来。

## 题 3：HDU 1521 - 排列数模型

原笔记的表述是：

- 有 $n$ 类物品；
- 第 $i$ 类最多选 $a_i$ 个；
- 问恰好选 $m$ 个时，排列方案数。

如果第 $i$ 类选了 $b_i$ 个，那么总排列数是：

$$
\frac{m!}{b_1!b_2!\cdots b_n!}
$$

这正是 EGF 的经典味道：把每一类写成

$$
1+\frac{x}{1!}+\frac{x^2}{2!}+\cdots+\frac{x^{a_i}}{a_i!}
$$

乘起来后取 $x^m$ 前的系数，再乘回 $m!$ 即可。

```cpp title="HDU 1521：指数生成函数写法"
#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    vector<double> fac(11, 1.0);
    for (int i = 1; i < (int)fac.size(); ++i) fac[i] = fac[i - 1] * i;

    while (cin >> n >> m) {
        vector<int> a(n + 1);
        for (int i = 1; i <= n; ++i) cin >> a[i];

        vector<double> dp(m + 1), ndp(m + 1);
        dp[0] = 1.0;
        for (int i = 1; i <= n; ++i) {
            fill(ndp.begin(), ndp.end(), 0.0);
            for (int used = 0; used <= m; ++used) {
                if (dp[used] == 0.0) continue;
                for (int take = 0; take <= a[i] && used + take <= m; ++take) {
                    ndp[used + take] += dp[used] / fac[take];
                }
            }
            dp.swap(ndp);
        }

        cout << (long long)llround(dp[m] * fac[m]) << '\n';
    }
    return 0;
}
```

## 普通生成函数和指数生成函数怎么区分

这是我现在最常用的判断口径：

- **不看顺序 / 看总数 / 看组合数**：先往 OGF 想。
- **看顺序 / 看排列数 / 带标号**：先往 EGF 想。

再说细一点：

| 问题味道 | 更常见的选择 |
| --- | --- |
| 每类物品选几个，总共凑出多少 | 普通生成函数 |
| 只关心“和 / 个数”，顺序无关 | 普通生成函数 |
| 安排到若干位置里，位置区分开来 | 指数生成函数 |
| 结果里天然出现 $\frac{n!}{\prod c_i!}$ | 指数生成函数 |

## 它和 DP、多项式到底是什么关系

这块最好不要拆开看。

### 和 DP 的关系

很多生成函数题，落地写法就是 DP：

- `dp[j]` 维护当前多项式的第 $j$ 项系数；
- 加入一类物品，就是把一个括号乘上去；
- 所以转移本质就是卷积。

### 和多项式的关系

生成函数更偏向**建模**：

- 指数是什么；
- 系数是什么；
- 问题应该写成哪些括号。

多项式更偏向**运算**：

- 这堆系数怎么乘得更快；
- 如何从 $O(n^2)$ 卷积变成 $O(n\log n)$；
- 如何做求逆、对数、指数、开根。

所以我自己的理解是：

- 生成函数告诉你“为什么要把答案装进系数里”；
- 多项式告诉你“装进去以后怎么高效地算”。

## 做题时常见的坑

> [!note]- 这几个坑，我自己做题时最容易踩
> - 指数到底在记“个数”还是“权值”，不要混。
> - OGF / EGF 不要因为公式像就乱套；顺序是否重要是第一判断标准。
> - 题目若有限制“至多 $a_i$ 个”，括号一定是有限项，不是直接写成 $\frac{1}{1-x}$。
> - EGF 乘出来以后，别忘了最后通常还要乘回 $m!$。
> - 许多题本质是生成函数建模 + 普通 DP 实现，不一定真的需要把式子化简到底。

## 我现在会怎么学这一块

如果是重新走一遍，我会按这个顺序：

1. 先把“系数就是答案”这件事吃透；
2. 用 OGF 做几道多重集计数；
3. 用 EGF 理解排列数为什么自然出来；
4. 再去看卷积、多项式，把“建模”和“运算”连起来。

## 参考

- [OI-Wiki：生成函数](https://oi-wiki.org/math/gen-func/)
- [蒋炎岩：生成函数](https://www.bilibili.com/video/BV1eB4y1u76k/)
