---
title: 生成函数
description: 普通生成函数、指数生成函数、斐波那契与卡特兰数的推导，以及和 DP、多项式的关系。
publishDate: 2024-09-13
tags:
  - 算法
  - 生成函数
  - 组合数学
  - DP
language: 中文
heroImageSrc: ../../pic/jackson-simmer-ZxRHtPacwUY-unsplash.jpg
heroImageColor: " #d6ed9a "
---

## 一个计数问题

有 $n$ 类物品，第 $i$ 类最多选 $a_i$ 个。问恰好选 $m$ 个的方案数。

把第 $i$ 类的选择方案写成多项式：

$$
\underbrace{1}_{\text{选 0 个}} + \underbrace{x}_{\text{选 1 个}} + \underbrace{x^2}_{\text{选 2 个}} + \cdots + x^{a_i}
$$

指数记录"选了几个"，系数记录"方案数"（这里每种选择恰好对应 1 种方案）。

把所有类乘起来：

$$
\prod_{i=1}^n \left(1 + x + x^2 + \cdots + x^{a_i}\right)
$$

展开后，$x^m$ 的系数就是答案——因为每次从每个括号里挑一项，指数加起来恰好等于 $m$，系数乘起来恰好是 1（每种选法贡献 1）。

这个把计数问题装进多项式系数里的写法，就是生成函数。

## 普通生成函数（OGF）

序列 $a_0, a_1, a_2, \dots$ 的普通生成函数（Ordinary Generating Function）定义为：

$$
F(x) = \sum_{n \ge 0} a_n x^n
$$

### 基本运算

加法：

$$
F(x) \pm G(x) = \sum_{n \ge 0} (a_n \pm b_n) x^n
$$

乘法（卷积）：

$$
F(x)G(x) = \sum_{n \ge 0} \left( \sum_{i=0}^n a_i b_{n-i} \right) x^n
$$

OGF 的乘法天然对应序列卷积。这是它和 DP 关系密切的根本原因：很多"前若干类合并出和为 $n$"的 DP 转移，本质就是在把多项式一个一个乘上去。

### 常见封闭形式

可能反复出现的几个式子：

- 每类可以选任意多个：$1 + x + x^2 + \cdots = \dfrac{1}{1-x}$
- 每类最多选 $a$ 个：$1 + x + \cdots + x^a = \dfrac{1-x^{a+1}}{1-x}$
- 重量为 $w$，可以选任意多个：$1 + x^w + x^{2w} + \cdots = \dfrac{1}{1-x^w}$
- 重量为 $w$，最多选 $a$ 个：$1 + x^w + \cdots + x^{aw} = \dfrac{1-x^{(a+1)w}}{1-x^w}$
- 二项式系数：$(1+x)^m = \sum_{n \ge 0} \binom{m}{n} x^n$
- 多重集组合数：$\dfrac{1}{(1-x)^{m+1}} = \sum_{n \ge 0} \binom{m+n}{n} x^n$

公式并不重要，需要想清楚的是：指数记录什么，系数记录什么，每一类物品的选择空间该写成哪个括号。

### 例 1：HDU 2152 — Fruit

有 $n$ 类物品，第 $i$ 类必须选 $[l_i, r_i]$ 个，问总共选 $m$ 个的方案数。

第 $i$ 类贡献的多项式是：

$$
x^{l_i} + x^{l_i+1} + \cdots + x^{r_i}
$$

全体方案：

$$
\prod_{i=1}^n \left( x^{l_i} + x^{l_i+1} + \cdots + x^{r_i} \right)
$$

取 $x^m$ 的系数即可。实现上直接用 DP 做多项式乘法：

```cpp title="HDU 2152"
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

这题的 DP 和生成函数多项式乘法是完全等价的两套表述。

### 例 2：HDU 1085 — Holding Bin-Laden Captive!

有面值 $1,2,5$ 的硬币，第 $i$ 种有 $a_i$ 枚。问最小的无法凑出的金额。

三种硬币对应三项：

$$
(1+x+\cdots+x^{a_1})(1+x^2+x^4+\cdots+x^{2a_2})(1+x^5+\cdots+x^{5a_3})
$$

展开后，第一个系数为 $0$ 的位置就是答案。这里指数记录的是"金额"而非"个数"，是生成函数建模灵活性的好例子。

```cpp title="HDU 1085"
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

上面两题的做法都是"建模成生成函数 + DP 实现乘法"。但生成函数不只是一个建模容器——它还能通过化简封闭形式，直接解出通项。

### 例 3：斐波那契数列

斐波那契数列：$F_0 = 0,\; F_1 = 1,\; F_n = F_{n-1} + F_{n-2}\;(n \ge 2)$。

设 $F(x) = \sum_{n \ge 0} F_n x^n$。利用递推关系：

$$
\begin{aligned}
F(x) &= F_0 + F_1 x + \sum_{n \ge 2} F_n x^n \\
     &= x + \sum_{n \ge 2} (F_{n-1} + F_{n-2}) x^n \\
     &= x + x\sum_{n \ge 2} F_{n-1} x^{n-1} + x^2 \sum_{n \ge 2} F_{n-2} x^{n-2} \\
     &= x + xF(x) + x^2 F(x)
\end{aligned}
$$

解出：

$$
F(x) = \frac{x}{1 - x - x^2}
$$

对分母做部分分式分解。设 $1 - x - x^2 = (1 - \alpha x)(1 - \beta x)$，其中：

$$
\alpha = \frac{1 + \sqrt{5}}{2},\quad \beta = \frac{1 - \sqrt{5}}{2}
$$

则：

$$
F(x) = \frac{1}{\sqrt{5}}\left( \frac{1}{1 - \alpha x} - \frac{1}{1 - \beta x} \right)
$$

利用 $\frac{1}{1 - cx} = \sum_{n \ge 0} c^n x^n$ 展开：

$$
F_n = \frac{1}{\sqrt{5}}\left( \alpha^n - \beta^n \right)
$$

这就是斐波那契数列的通项公式。整个过程大概是：**递推式 → 生成函数方程 → 封闭形式 → 展开 → 通项**。这是生成函数很强大的用法：通过代数操作直接求解。

### 例 4：卡特兰数

卡特兰数的递推：

$$
C_0 = 1,\quad C_n = \sum_{i=0}^{n-1} C_i C_{n-i-1}\;(n \ge 1)
$$

等号右边是自己卷自己。设 $C(x) = \sum_{n \ge 0} C_n x^n$：

$$
\begin{aligned}
C(x) &= 1 + \sum_{n \ge 1} \left( \sum_{i=0}^{n-1} C_i C_{n-i-1} \right) x^n \\
     &= 1 + x \sum_{n \ge 1} \sum_{i=0}^{n-1} C_i C_{n-i-1} x^{n-1} \\
     &= 1 + x \cdot C(x)^2
\end{aligned}
$$

这给出了关于 $C(x)$ 的二次方程：

$$
xC(x)^2 - C(x) + 1 = 0
$$

解得（取满足 $C(0) = C_0 = 1$ 的根）：

$$
C(x) = \frac{1 - \sqrt{1 - 4x}}{2x}
$$

用牛顿二项式定理展开 $(1 - 4x)^{1/2}$：

$$
\begin{aligned}
(1 - 4x)^{1/2} &= \sum_{n \ge 0} \binom{\frac{1}{2}}{n} (-4x)^n \\
               &= 1 - 2x - 2x^2 - 4x^3 - \cdots
\end{aligned}
$$

代入整理得：

$$
C(x) = \sum_{n \ge 0} \frac{1}{n+1} \binom{2n}{n} x^n
$$

所以：

$$
C_n = \frac{1}{n+1} \binom{2n}{n}
$$

这个推导展示了生成函数处理"自卷"结构的能力——递推式里 $C(x)$ 和自己卷，就转化成了关于 $C(x)$ 的代数方程。

> [!note]- 简化版的系数提取
> 也可以不展开 $\sqrt{1-4x}$，直接利用广义二项式系数：
> $$
> \binom{1/2}{n} = \frac{(-1)^{n-1}}{n \cdot 2^{2n-1}} \binom{2n-2}{n-1}
> $$
> 代入整理同样得到 $\displaystyle C_n = \frac{1}{n+1}\binom{2n}{n}$。

## 指数生成函数（EGF）

序列 $a_0, a_1, a_2, \dots$ 的指数生成函数（Exponential Generating Function）定义为：

$$
F(x) = \sum_{n \ge 0} a_n \frac{x^n}{n!}
$$

### 为什么除以 $n!$

OGF 的卷积是 $\sum_{i=0}^n a_i b_{n-i}$，而 EGF 乘法给出的是：

$$
\begin{aligned}
F(x)G(x) &= \left( \sum_{i \ge 0} a_i \frac{x^i}{i!} \right) \left( \sum_{j \ge 0} b_j \frac{x^j}{j!} \right) \\
         &= \sum_{n \ge 0} \frac{x^n}{n!} \sum_{i=0}^n \binom{n}{i} a_i b_{n-i}
\end{aligned}
$$

卷积里多出了一个 $\binom{n}{i}$。这个组合数恰好对应"从 $n$ 个带标号的位置中，分 $i$ 个给第一类、其余 $n-i$ 个给第二类"。

所以 EGF 和 OGF 的分工很明确：

- **OGF**：只关心"选了几个"，顺序无关，计数用组合数；
- **EGF**：关心"安排在哪些位置"，顺序重要，计数用排列数。

两个常用 EGF：

- $\langle 1, 1, 1, \dots \rangle$ 的 EGF：$e^x = \sum_{n \ge 0} \frac{x^n}{n!}$
- $\langle 1, p, p^2, \dots \rangle$ 的 EGF：$e^{px} = \sum_{n \ge 0} p^n \frac{x^n}{n!}$

### 排列数的 EGF 

有 $n$ 类物品，第 $i$ 类选了 $b_i$ 个，总个数 $m = \sum b_i$。如果顺序重要，排列数是：

$$
\frac{m!}{b_1! b_2! \cdots b_n!}
$$

把第 $i$ 类写成 EGF 的截断：

$$
1 + \frac{x}{1!} + \frac{x^2}{2!} + \cdots + \frac{x^{a_i}}{a_i!}
$$

乘起来后，$x^m$ 项是：

$$
\frac{x^m}{m!} \sum_{b_1+\cdots+b_n=m,\; b_i \le a_i} \frac{m!}{b_1! b_2! \cdots b_n!}
$$

$\frac{m!}{b_1!\cdots b_n!}$ 恰好就是这种选法的排列数。所以 $x^m/m!$ 的系数就是总排列数；习惯上直接读系数后再乘回 $m!$。

### 例 5：HDU 1521 — 排列数模型

有 $n$ 类物品，第 $i$ 类最多选 $a_i$ 个，问恰好选 $m$ 个的排列方案数。

```cpp title="HDU 1521"
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

代码里 `dp[used] / fac[take]` 就是在做 EGF 的卷积——每一项按 $x^{take} / (take)!$ 的系数贡献，最后乘回 $m!$ 得到真正的排列数。

### 例 6：错排问题

$n$ 个元素的排列，每个元素都不在原来位置，方案数记为 $D_n$。

递推式：$D_0 = 1,\; D_n = (n-1)(D_{n-1} + D_{n-2})\;(n \ge 2)$。

设 EGF $D(x) = \sum_{n \ge 0} D_n \frac{x^n}{n!}$。从递推式出发（$(n-1)$ 在 EGF 下对应求导与移位的组合），可导出封闭形式：

$$
D(x) = \frac{e^{-x}}{1-x}
$$

展开 $e^{-x} = \sum_{k \ge 0} \frac{(-1)^k}{k!} x^k$，$\frac{1}{1-x} = \sum_{j \ge 0} x^j$，做卷积：

$$
D_n = n! \sum_{k=0}^n \frac{(-1)^k}{k!}
$$

取整后就是 $D_n = \left\lfloor \frac{n!}{e} + \frac{1}{2} \right\rfloor$。一旦得到 $D(x) = e^{-x}/(1-x)$，通项就只是一次卷积展开——这就是 EGF 的典型用法。

## 生成函数、DP 与多项式

同一类计数问题，三种视角可以互相翻译。以「$n$ 种物品，第 $i$ 种有 $a_i$ 个，重量为 $w_i$，求装满容量 $m$ 的方案数」为例：

**生成函数视角**：

$$
\prod_{i=1}^n \left( 1 + x^{w_i} + x^{2w_i} + \cdots + x^{a_i w_i} \right)
$$

答案：$x^m$ 的系数。这是**建模层**——把问题翻译成代数对象。

**DP 视角**：

`dp[j]` 表示当前凑出容量 $j$ 的方案数。加入第 $i$ 种物品时：

```cpp
for (int j = m; j >= 0; --j)
    for (int k = 1; k <= a[i] && j + k * w[i] <= m; ++k)
        dp[j + k * w[i]] += dp[j];
```

这是**实现层**——直接模拟多项式乘法，复杂度 $O(nm \cdot \text{avg}(a_i))$。

**多项式视角**：

当 $m$ 很大（比如 $10^5$），朴素 DP 不够时，用 NTT 把多项式乘法的 $O(n^2)$ 降到 $O(n \log n)$。配合分治 / 启发式合并，可以把若干个小多项式的连乘加速。

这是**高效运算层**——不改变建模，只改变"怎么让计算机算得更快"。

三者的分工线：

- **生成函数**把问题装进系数，告诉你"指数是什么、系数是什么、括号该写成什么样"；
- **DP** 在规模较小时直接模拟多项式乘法，是最简单的落地方式；
- **多项式算法**（FFT/NTT/FPS）在规模大时把卷积从 $O(n^2)$ 加速到 $O(n \log n)$。

所以很多生成函数题的解题路径是：先建出生成函数 → 用小规模 DP 验证建模正确 → 如果数据大，再上 NTT。

%% ## OGF 与 EGF 的选择

| 问题特征 | 用 |
|---|---|
| 只关心"总共选了几个 / 总和是多少"，顺序无关 | OGF |
| 每类物品选几个可以直接填进多项式指数 | OGF |
| 顺序重要，元素有标号 | EGF |
| 结果里天然出现 $\frac{n!}{\prod b_i!}$ | EGF |
| 递推式包含组合数系数 | EGF |

容易踩的坑：

- 指数到底记录"个数"还是"权值"，不要混；
- 题目若有限制"至多 $a_i$ 个"，括号必须是有限项，不能直接写 $\frac{1}{1-x}$；
- EGF 卷积后通常要乘回 $m!$ 才是真正的排列数。 %%

## 参考

- [蒋炎岩：生成函数——函数与数列之间的桥梁](https://www.bilibili.com/video/BV16X4y1N74M/)
- [OI-Wiki：生成函数](https://oi-wiki.org/math/gen-func/)
