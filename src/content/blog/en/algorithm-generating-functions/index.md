---
title: "My Intro to Generating Functions: Let Coefficients Be Answers"
description: Built from the original notes, restoring ordinary generating functions, exponential generating functions, modeling intuition, and several typical problems.
publishDate: 2024-09-13
tags:
  - Algorithm
  - Generating Functions
  - Combinatorics
  - DP
language: English
heroImageSrc: ../../../pic/jackson-simmer-ZxRHtPacwUY-unsplash.jpg
heroImageColor: " #d6ed9a "
---

> [!note] Note
> This article continues the "original notes + supplementary organization" approach. The original notes already had ordinary generating functions, exponential generating functions, and three problems; this time mainly completing the modeling main line, common formulas, and why we do it this way, to facilitate connecting to the polynomial article later.

## Coverage

- `Generating functions section from original notes`
- `Difference between ordinary generating functions / exponential generating functions`
- `Modeling organization for HDU 2152 / HDU 1085 / HDU 1521`
- `Relationship with DP, convolution, and polynomials`

## Remember the Core Idea First

The most useful aspect of generating functions isn't memorizing a bunch of expansions, but rather:

- The exponent records "how many things were chosen";
- The coefficient records "number of ways / weight / number of permutations";
- Multiplication combines "several independent choices" together.

So I prefer to understand it as a way of **putting counting problems into coefficients**.

If the following signals appear in a problem, you should usually think of generating functions:

- Each type of item can be chosen several times;
- Only care about "how many were chosen in total / what's the sum";
- When combining multiple independent choices, it's essentially convolution;
- Whether order matters directly determines whether to use ordinary or exponential generating functions.

## Ordinary Generating Functions

> The original notes called it "mother function", but I'll use the more common competitive programming term OGF here.

Form:

$$
F(x)=\sum_{n\ge 0} a_n x^n
$$

Where $x^n$ records "the scale is $n$", and coefficient $a_n$ records "number of ways / weight when scale is $n$".

### Three Basic Properties from Original Notes

- Addition/Subtraction:
$$
  F(x) \pm G(x)=\sum_{n\ge 0}(a_n \pm b_n)x^n
$$
- Multiplication:
$$
  F(x)G(x)=\sum_{n\ge 0}\left(\sum_{i=0}^n a_i b_{n-i}\right)x^n
$$
- So multiplication corresponds to convolution.

This is why generating functions are often paired with DP: many "first $i$ types of items making sum $j$" transitions are essentially multiplying the previous polynomial by "the choice formula this type of item can provide".

> [!note]- Collect common forms of ordinary generating functions
> These formulas will appear repeatedly:
>
> - An item can be chosen $0,1,2,\dots$ times:
> $$
>   1+x+x^2+\cdots = \frac{1}{1-x}
> $$
> - An item can be chosen at most $a$ times:
> $$
>   1+x+x^2+\cdots+x^a
> $$
> - An item's "weight / cost" is $w$, can be chosen $0,1,2,\dots$ times:
> $$
>   1+x^w+x^{2w}+\cdots = \frac{1}{1-x^w}
> $$
> - An item's "weight / cost" is $w$, can be chosen at most $a$ times:
> $$
>   1+x^w+x^{2w}+\cdots+x^{aw}
> $$
>
> When actually solving problems, the key isn't memorizing formulas, but first thinking clearly:
>
> - What exactly is the exponent recording;
> - What exactly is the coefficient recording;
> - What bracket should each type of item's choice space be written as.

### Understanding from Original Notes: Exponent is Count, Coefficient is Combination Number

I think this expression is very memorable:

- The exponent is "how many were chosen in total / what's the total weight";
- The coefficient is the number of ways to reach this exponent.

Therefore, multiset combination number problems are particularly suitable for directly writing OGF.

## Problem 1: HDU 2152 - Fruit

The problem can be compressed into one sentence:

- There are $n$ types of items;
- Type $i$ must choose $[l_i,r_i]$ items;
- Find the number of ways to choose $m$ items in total.

### Modeling

Let type $i$ actually choose $b_i$ items, then:

$$
0 \le l_i \le b_i \le r_i, \quad \sum_{i=1}^n b_i = m
$$

So type $i$ item contributes a polynomial:

$$
x^{l_i}+x^{l_i+1}+\cdots+x^{r_i}
$$

All ways correspond to:

$$
\prod_{i=1}^n \left(x^{l_i}+x^{l_i+1}+\cdots+x^{r_i}\right)
$$

What we want is the coefficient of $x^m$.

### Why This Problem is Completely Equivalent to DP

If writing DP, usually set:

- `dp[j]` represents the number of ways to make total $j$ when processing up to several types of items.

Adding type $i$ is equivalent to enumerating how many of this type to take, then convolving the coefficients in. This is the same as multiplying the current polynomial by
$\left(x^{l_i}+\cdots+x^{r_i}\right)$.

```cpp title="HDU 2152: Ordinary Generating Function Approach"
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
        cout << dp[m] << '\\n';
    }
    return 0;
}
```

## Problem 2: HDU 1085 - Holding Bin-Laden Captive!

The core modeling from original notes is:

- There are coins with denominations $1,2,5$;
- Type $i$ coin has $a_i$ pieces;
- Find the minimum denomination that cannot be made.

### Modeling

Three types of coins correspond to three terms:

$$
(1+x+x^2+\cdots+x^{a_1})
(1+x^2+x^4+\cdots+x^{2a_2})
(1+x^5+x^{10}+\cdots+x^{5a_3})
$$

After expansion:

- If coefficient of $x^s$ is non-zero, it means amount $s$ is reachable;
- The first position with zero coefficient is the answer.

This problem is very suitable for experiencing "the exponent isn't the count, but the target quantity". In the previous problem, the exponent recorded "how many items were chosen", here it records "the amount made".

```cpp title="HDU 1085: Look at First Position with Coefficient 0"
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
        cout << ans << '\\n';
    }
    return 0;
}
```

## Exponential Generating Functions

Form:

$$
F(x)=\sum_{n\ge 0} a_n \frac{x^n}{n!}
$$

From original notes, very well put:

- The EGF of $\langle 1,1,1,\dots \rangle$ is $e^x$;
- The EGF of $\langle 1,p,p^2,\dots \rangle$ is $e^{px}$.

### Why Divide by $n!$ Here

Because EGF is often used to handle **labeled / order matters** problems.

In OGF, convolution usually gives "add up the quantities" combination numbers;
In EGF, multiplication naturally brings out combination number coefficients:

$$
F(x)G(x)=\sum_{n\ge 0}\frac{x^n}{n!}\sum_{i=0}^n \binom{n}{i}a_i b_{n-i}
$$

The $\binom{n}{i}$ here is "from $n$ positions, allocate $i$ to the first part, the rest to the second part".

So it's very suitable for handling:

- Order matters;
- Elements are labeled;
- Permutation numbers naturally appear.

## Problem 3: HDU 1521 - Permutation Number Model

From original notes:

- There are $n$ types of items;
- Type $i$ can choose at most $a_i$ items;
- Find the number of permutation ways when choosing exactly $m$ items.

If type $i$ chooses $b_i$ items, then the total number of permutations is:

$$
\frac{m!}{b_1!b_2!\cdots b_n!}
$$

This is exactly the classic flavor of EGF: write each type as

$$
1+\frac{x}{1!}+\frac{x^2}{2!}+\cdots+\frac{x^{a_i}}{a_i!}
$$

After multiplying together, take the coefficient before $x^m$, then multiply back by $m!$.

```cpp title="HDU 1521: Exponential Generating Function Approach"
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

        cout << (long long)llround(dp[m] * fac[m]) << '\\n';
    }
    return 0;
}
```

## How to Distinguish Between Ordinary and Exponential Generating Functions

This is my most commonly used judgment criterion:

- **Don't look at order / look at total / look at combination numbers**: Think OGF first.
- **Look at order / look at permutation numbers / labeled**: Think EGF first.

More specifically:

| Problem Flavor | More Common Choice |
| --- | --- |
| Each type of item choose how many, total make how much | Ordinary generating function |
| Only care about "sum / count", order irrelevant | Ordinary generating function |
| Arrange into several positions, positions distinguished | Exponential generating function |
| Result naturally has $\frac{n!}{\prod c_i!}$ | Exponential generating function |

## What's the Relationship with DP and Polynomials

This part is best not separated.

### Relationship with DP

Many generating function problems, when implemented, are DP:

- `dp[j]` maintains the coefficient of the $j$-th term of the current polynomial;
- Adding a type of item is multiplying a bracket;
- So the transition is essentially convolution.

### Relationship with Polynomials

Generating functions lean more toward **modeling**:

- What is the exponent;
- What is the coefficient;
- What brackets should the problem be written as.

Polynomials lean more toward **computation**:

- How to multiply these coefficients faster;
- How to change from $O(n^2)$ convolution to $O(n\log n)$;
- How to do inverse, logarithm, exponent, square root.

So my understanding is:

- Generating functions tell you "why to put answers into coefficients";
- Polynomials tell you "how to efficiently calculate after putting them in".

## Common Pitfalls When Solving Problems

> [!note]- These pitfalls, I'm most likely to step on when solving problems
> - Whether the exponent is recording "count" or "weight", don't mix them up.
> - Don't randomly apply OGF / EGF just because the formulas look similar; whether order matters is the first judgment criterion.
> - If the problem has a constraint "at most $a_i$ items", the bracket must be finite terms, not directly written as $\frac{1}{1-x}$.
> - After multiplying EGF, don't forget to usually multiply back by $m!$ at the end.
> - Many problems are essentially generating function modeling + ordinary DP implementation, not necessarily needing to simplify the formula to the end.

## How I Would Learn This Part Now

If going through it again, I would follow this order:

1. First thoroughly understand "coefficients are answers";
2. Use OGF to do several multiset counting problems;
3. Use EGF to understand why permutation numbers naturally appear;
4. Then look at convolution and polynomials, connecting "modeling" and "computation".

## References

- [OI-Wiki: Generating Functions](https://oi-wiki.org/math/gen-func/)
- [Jiang Yanyan: Generating Functions](https://www.bilibili.com/video/BV1eB4y1u76k/)
