---
title: "Codeforces Solutions 1: Construction, Bit Operations, and Greedy"
description: Solutions from Jan-Jul 2024, focusing on construction, bit operations, and greedy problems from Codeforces.
publishDate: 2026-03-06
tags:
- Competitive Programming
- Solutions
- Codeforces
- Construction
- Bit Operations
- Greedy
language: English
heroImageSrc: ../../../pic/pawel-czerwinski-mv3APn9e7SU-unsplash.jpg
heroImageColor: " #0077b3 "
---
> [!note] Note
> This is revised to directly retain the original Codeforces solution content: keep the original draft for single problems, and for contest notes, only extract the problems you specifically marked in your bookmarks.

## Scope of Inclusion

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

You are given a positive integer $x$. Find any integer array $a_0, a_1, \ldots, a_{n-1}$ satisfying the following conditions:

- $1 \le n \le 32$,
- $a_i$ is $1$, $0$, or $-1$,
- $x = \displaystyle{\sum_{i=0}^{n - 1}{a_i \cdot 2^i}}$,
- There is no index $0 \le i \le n - 2$ such that both $a_{i} \neq 0$ and $a_{i + 1} \neq 0$.

It can be proven that under the constraints of the problem, a valid array always exists.

#### Solution
Bitwise operation

The main difficulty of this problem is noticing a transformation:

$$
2^i + 2^{i+1} = 2^{i+2} - 2^{i}
$$

If a certain bit $i$ of a number satisfies $(a_{i},a_{i+1})=(1,1)$, it does not meet the requirement and needs to be changed to $(a_{i},a_{i+1},a_{i+2})=(-1,0,1)$.

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

There is a variable and a constant. Perform the following operation $k$ times:

- Increase $x$ by $1$, then
- While the number $x$ is divisible by $y$, divide it by $y$.

Note that these two actions are performed sequentially within one operation.

For example, if the numbers are $x = 16$, $y = 3$, and $k = 2$, then after one operation, $x$ becomes $17$, and after another operation, $x$ becomes $2$, because after adding one, $x = 18$ is divisible by $3$ twice.

Given the initial values $x$, $y$, and $k$, Maxim wants to know the final value of $x$.

> No idea while solving.

If $x<y$: then it must be $x+1, x+2, \dots, y-1, (1,2,\dots,y-1)$ showing periodicity.

If $x\geq y$: try to reduce $x$ to be less than $y$.

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

The value of a Manhattan permutation is $\sum\limits_{i=1}^n\left|{p_{i}-i}\right|$, where $p$ is a permutation.

Given the Manhattan permutation value, construct this permutation.

#### Solution

>I always think of the correct idea every time, but just can't write it out, always feeling like something is missing...

Construction

First, discuss impossible cases:

- Obviously, if $k$ is odd, it's impossible.
- If $k$ is too large, exceeding the maximum possible value of this permutation, it's also impossible.

The maximum value comes from the difference between the permutations $1,2,3\dots,n$ and $n,n-1,\dots1$.

That is $\displaystyle \sum\limits_{i=1}^n\left|{n-2\times i+1}\right|=\sum\limits_{i=1}^{\lfloor{\frac{n+1}{2}}\rfloor}(n-2\times i+1)+\sum\limits_{i=\lfloor{\frac{n+1}{2}}\rfloor+1}^n(2\times i-n-1)$

After expansion and simplification, the maximum value is 

$$2\times\lfloor{\frac{n+1}{2}}\rfloor(n-\lfloor{\frac{n+1}{2}}\rfloor)$$

Now discuss how to construct when conditions are met:

When swapping $1$ and $n$, we can construct the value $2(n-1)$. Swapping $2$ and $n-1$ constructs $2(n-3)$, and so on... In total, we can construct:

$\displaystyle \sum\limits_{i=1}^n 2(n+1-2\times i)=\text{MAX}$ values. So this situation can definitely construct all possible values.

If $k<2(n-1)$: $1$ does not swap with $n$, but swaps with one of $n-1, n-2\dots$,
the constructible value is $v=2(n-3)-4k(k=0,1,2\dots)\cap v\geq 0$.

If $k\geq 2(n-1)$: $1$ swaps with $n$, proceed to the next round, the constructible value is $2(n-1)$.

The same logic applies later, making it easy to know that all reasonable values can be constructed.

> [!example]
> 
> For example:
> $n=5,k=6$. If 1 swaps with 5, we can construct $2(n-1)=8>6$, so 1 swaps with $n-1=4$ $(1,4)-(4,1)$, yielding 6.
> 
> $n=5,k=10$. If 1 swaps with 5, we can construct $2(n-1)=8<10$, so 1 and 5 need to swap, leaving 2.
> In the next round, if 2 swaps with 4, we can construct $2(n-3)=4>2$, so no swap; choose the previous values $n-2, n-3\dots$. It turns out swapping 2 and 3 constructs exactly 2, yielding 2.

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

Given an array $a$ of size $n$

For array $b$: $b_i = GCD(a_i, a_{i + 1})$, $1 \le i \le n - 1$.

Determine if it is possible to remove exactly one number from array $a$ so that the sequence $b$ becomes non-decreasing (i.e., $b_i \le b_{i+1}$ always holds true).

> [!example]
> For example, suppose Khristina has an array $a$ = [ $20, 6, 12, 3, 48, 36$ ]. If she removes $a_4 = 3$ from it and calculates the GCD sequence $b$, she gets:
> 
> - $b_1 = GCD(20, 6) = 2$
> - $b_2 = GCD(6, 12) = 6$
> - $b_3 = GCD(12, 48) = 12$
> - $b_4 = GCD(48, 36) = 12$
> 
> The resulting GCD sequence $b$ = \[ $2,6,12,12$ \] is non-decreasing because $b_1 \le b_2 \le b_3 \le b_4$ .
> 

>No idea.

Main idea:

If it is already non-decreasing, then simply deleting the last element ensures it still holds, so it must satisfy the condition.

If it does not satisfy initially, there must be at least one position where $g_{i-1}>g_{i}$. Determine in turn whether deleting one of $i-1, i, i+1$ from the original array makes it satisfy the condition. As long as one of them does, it's possible.

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
You are facing the final boss in your favorite video game. The enemy has health $h$. Your character has $n$ attacks. The $i$-th attack deals $a_i$ damage to the enemy but has a cooldown of $c_i$ turns, meaning if the current turn is $x$, the next time this attack can be used is turn $x + c_i$. Each turn, you can use all attacks that are currently not on cooldown, **once each**. If all attacks are on cooldown, you do nothing this turn and skip to the next turn.

Initially, all attacks are not on cooldown. How many turns does it take to defeat the boss?

Obviously, using skills whenever available is optimal. Directly binary search for the minimum number of turns needed to calculate (in this problem $h\leq 2\times 10^5$, so direct simulation is possible. If $h\leq 10^9$, binary search is definitely needed.)

Time complexity $n\log n$

>Note: In this problem, the maximum data during calculation can reach $(2\times10^5)^2\times \frac{l+r}{2}\leq 4\times 10^{23}$, which will overflow `{c++}long long`. You can use `{c++}int128` or simply proceed to the next round if the calculation result exceeds $h$.
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
Let $D(n)$ denote the sum of digits of $n$. How many integers $n$ with $10^{l} \leq n < 10^{r}$ satisfy $D(k \cdot n) = k \cdot D(n)$? Output the answer modulo $10^9+7$.

When $k\geq 10$, $D(k\cdot n)\neq 10\cdot D(n)$ always holds, so there is no solution.

When $k\in[1,9]$, if for each digit $b_{i}$ of $n$, $k\cdot b_{i}<10$, then it is a valid solution.

> [!example]- For example, with k=2:
> 
> This requires counting the numbers $n\in [10^l,10^r)$ where each digit $\leq 4$.
> 
> If $n$ has $l+1$ digits (i.e., same magnitude as $10^l$), the first digit has 4 choices, and the other digits each have 5 choices, so the number of solutions is $4\times5^{l}$.
> 
> Similarly, for $l+2$ digits, the number is $4\times 5^{l+1}$.
> 
> And so on, for $r$ digits, the number is $4\times 5^{r-1}$.
> 
> The total number is: $4\times 5^l+4\times 5^{l+1}\times \dots \times4\times 5^{r-1}=5^r-5^l$

The answer is $\displaystyle {\lceil{\frac{10}{k}}\rceil}^r-{\lceil{\frac{10}{k}}\rceil}^l \bmod 10^9+7$.
```cpp
constexpr int mod = 1e9 + 7;
void solve() {
    cout << (qpow((10 + k - 1) / k, r) - qpow((10 + k - 1) / k, l) + mod) % mod << '\n';
}
```

## CF 1985 Div.4 H - Maximize the Largest Component
Given an $n\times m(n\times m\leq 10^6)$ grid. You can start from any `#` cell and move to other `#` cells in four directions (up, down, left, right), forming several connected components.

`{c++}easy version:` You can change an entire row or an entire column to `#`.

`{c++}hard version:` You can change one entire row and one entire column to `#`.

Find the maximum possible size of the largest connected component.

### Solution

#### easy version
My idea: First find all connected components, then enumerate $n$ rows and $m$ columns to see which case yields the maximum when filled.

Code:
```cpp fold title:"TLE Code"
int dx[] = {0,0,1,-1}, dy[] = {1,-1,0,0};
void solve() {
    int n, m;cin >> n >> m;
    vector<string> s(n + 1);
    for (int i = 1;i <= n;i++) {
        cin >> s[i];s[i] = ' ' + s[i];
    }

    map<pair<int, int>, pair<int, int>>vis;
    int cnt = 0;//Which connected component

    auto bfs = [&](int sx, int sy) {
        int sum = 0;//Size of connected component
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

>When there are too many `#`, it will TLE.

First, connect all cells containing `#` in the entire grid into connected components using DSU, then proceed with the same idea as before.
```cpp title:"jiangly-Code" ref:https://codeforces.com/contest/1985/submission/265264217
// Template organization - DSU
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
**This is the easy version of the problem. The only difference is that in this version, the flowers are specified by enumeration**.

A girl is preparing for a birthday and wants to buy the most beautiful bouquet. There are $n$ types of flowers in the shop, each characterized by the number of petals. A flower with $k$ petals costs $k$ coins. The girl decides that the difference in the number of petals between any two flowers in the bouquet cannot exceed 1. At the same time, the girl wants the bouquet to have as many petals as possible. Unfortunately, she only has $m$ coins and cannot spend more. What is the maximum total number of petals she can put together in a bouquet?

This is such a pity! Had the idea in a second, two pointers (sliding window), just missed the details.

#### Method 1: Sliding Window
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

#### Method 2: Official Solution

> [!NOTE]- Official Solution
> 
> First, we can aggregate the count of flowers with $x$ petals as $c_{x}$ (e.g., sort the array, then create an array of pairs $(x, c_{x})$, where $c_{x}$ is the length of the segment where elements equal $x$).
> 
> Note that $\sum_{x} c_{x} = n$. Also note that for each $x$, the number of flowers needed does not exceed $\left\lfloor\frac{m}{x}\right\rfloor$ (otherwise the total petals would exceed $m$).
> 
> Then we iterate over all $x$. Suppose we want to combine a bouquet with $x$ and $x + 1$ petals. We can brute force the number of flowers with $x$ petals in $O(c_{x})$. If we have $0 \le k_1 \le min(c_{x}, \left\lfloor\frac{m}{x}\right\rfloor)$ flowers with $x$ petals, then we have $k_1 * x$ petals. There are $m - k_1 * x$ coins left to buy flowers with $x + 1$ petals. We can buy at most $k_2 = min(c_{x + 1}, \left\lfloor\frac{m - k_1 * x}{x + 1}\right\rfloor)$ flowers with $x + 1$ petals. So we need to find the maximum of all these $k_1 * x + k_2 * (x + 1)$.
> 
> The total complexity of finding the maximum is $O(\sum_{x} c_{x}) = O(n)$, and the total complexity of sorting is $O(n \log n)$.

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
**This is the hard version of the problem. The only difference is that in this version, instead of listing the petal count of each flower, the petal count and the quantity of flowers in the store are given for all types of flowers.

A girl is preparing for a birthday and wants to buy the most beautiful bouquet. There are $n$ different types of flowers in the shop, each characterized by the number of petals and the quantity available. A flower with $k$ petals costs $k$ coins. The girl decides that the difference in the number of petals between any two flowers in the bouquet cannot exceed 1. At the same time, the girl wants the bouquet to have as many petals as possible. Unfortunately, she only has $m$ coins and cannot spend more. What is the maximum total number of petals she can put together in a bouquet?

### Solution

Overall, the approach is similar to B1, but brute force is no longer feasible.

First, try to fill with as many $x$ as possible, and give the remainder to $x+1$ until it can't hold any more. After this, if there are still coins left in $m$, it might be possible to replace some $x$ with $x+1$, which yields a net gain of 1 in the answer. If no more replacements are possible, then $(x,x+1)$ is optimal here.

Conditions for replacing $x$ with $x+1$:

- There are still some $x$ left.
- There are still some $x+1$ left in reserve.
- There are still coins left.

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
ikrpprpp found an array $a$ consisting of integers. He wants to make $a$ non-decreasing. To do this, he can perform a just operation on any index $1 \le i \le n$, replacing $a_i$ with $a_i ^ 2$ (the element at position $i$ and its square).

What is the minimum number of just actions needed to make the array non-decreasing?

### Solution

#### Method 1: Normal approach:

When $a_{i-1}>a_{i}$: This indicates that the requirement is not met at this point. We need to (calculate) $cur$ times so that $a_{i-1}\leq a_{i}$ holds, then the requirement is satisfied.

When $a_{i-1}\ll a_{i}$, i.e., at least $a_{i-1}^2\leq a_{i}$: At this time, $a_{i}$ is divided into two cases: (First calculate how many operations are needed until $a_{i-1}\geq a_{i}$)

Let the virtual maximum value when reaching $a_{i}$ be $tmp$.

- $a_{i}$ is very large, so that $a_{i-1}$ originally needed $lst$ operations, but here $a_{i-1}$ needs to reach $a_{i}$ requiring operations >= $lst$. Then $a_{i}$ naturally does not need operations $\implies a_{i}\geq tmp \to \text{don't do op}$.
- $a_{i}$ is large, but not so large that no operation is needed, i.e., $a_{i}\geq a_{i-1}^2$, $a_{i-1}$ originally needed $lst$ operations, here it needs < $lst$ operations, so subtracting gives the number of operations needed for $a_{i}$ $\implies a_{i-1}^2\leq a_{i}<tmp\to \text{do op and not do much op}$.
- $a_{i}$ is not large enough, i.e., $a_{i-1}\leq a_{i}<a_{i-1}^2$, $a_{i-1}$ originally needed $lst$ operations, here no operations are needed, so $a_{i}$ needs $lst$ operations, meaning the same number of operations as $a_{i-1}$. $\implies a_{i-1}\leq a_{i}<a_{i-1}^2<tmp\to \text{do op and do the same op}$.

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

#### Method 2: Floating point approach:

>This approach is also the EDU approach for this Round

If we take the logarithm of the array, i.e., $a_{i}:=\ln a_{i}$, then $a_{i}^2\leftrightarrow2\ln a_{i}$. When the number of operations is large, $a_{i}=2^k\ln a_{i}$, and $2^k$ can be very large in magnitude, impossible to store with floating point numbers.

If $a_{i}:=\ln \ln a_{i}$, then $a_{i}^2\leftrightarrow\ln2+\ln \ln a_{i}$, which can be easily stored even with a large number of operations.

Since $\ln \ln1$ is undefined, handle the case where $a_{i}=1$ first.

After that, we just need to see how many $\ln2$ differences there are between $a_{i-1}$ and $a_{i}$. That is $\displaystyle \lceil{\frac{{\ln \ln a_{i-1}-\ln \ln a_{i}}}{\ln2}}\rceil$.

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
You are given a positive integer $n$. Find the longest sequence of positive integers $a=[a_1,a_2,\ldots,a_k]$ satisfying the following conditions:

- $a_i\le n$.
- The array $a$ is strictly increasing.
- $a_i\ \text{OR}\,a_{i-1}=n$

The difficulty of this problem is the same as B.

Simply remove one binary bit that is 1 each time. So the number of methods is $\text{popcount(n)}+1$ (including itself).

Pitfalls:

- `__builtin_popcount()` parameter is `unsigned int`, not applicable for long long.
- When the data range exceeds int, always use `1ll<<i`; form a habit.
- Need to handle the case where there is only one binary bit that is 1 specially, because removing that bit would result in 0, but the problem requires positive integers. It needs to be removed.

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
You are a monster killer who wants to kill a group of monsters. These monsters are located on a tree with $n$ vertices. On vertex $i$ ( $1\le i\le n$ ), there is a monster with attack power $a_i$. You need to fight the monsters for $10^{100}$ rounds.

In each round, the following happens in sequence:

1. All alive monsters attack you. Your health decreases by the sum of the attack powers of all alive monsters.
2. You select some (possibly all, possibly none) monsters and kill them. Once killed, a monster cannot attack anymore.

There is a constraint: In one round, you cannot kill two monsters that are directly connected by an edge.

If you choose the monsters to attack optimally, what is the minimum total damage taken after all rounds?

### Solution

If this problem only had one round, it would essentially be the maximum weight independent set of the tree. That is, the "prom without a boss" problem.

Tree DP

$dp_{i,j}$ represents that in the subtree rooted at $i$, node $i$ is deleted at the $j$-th time. In a certain subtree (with $n$ vertices), it takes at most $\log n$ times to delete this subtree completely.

$\displaystyle dp_{u,i}=\sum\limits_{v\in son(u)}\min_{i\neq j}dp_{v,j}+i\times a_{u}$.
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
$x\in[0,r]$ find $\min(\mid(a\oplus x)-(b\oplus x)\mid)$.

### Solution
Greedy

Official Solution:

Let's consider the bit representation of numbers $a$, $b$, $x$. Look at any two bits of $a$ and $b$ at the same position.

1. If they are the same, then regardless of what $x$ is at that position, the number $|({a \oplus x}) - ({b \oplus x})|$ will be 0 at this position. Therefore, it is advantageous to set this bit to 0 (since we want $x\leq r$, and the answer does not depend on the bit).

2. If the bits of $a$ and $b$ at the same position are different, then at this position, there will be a 1 in either $a \oplus x$ or $b \oplus x$, depending on what $x$ is at this position.

Assume $a$ < $b$, if not, we swap them. Then at the highest position where the bits differ, $a$ has a 0 and $b$ has a 1.

When bits differ, there are 2 choices:

- Either set a 1 in $x$ at this position (then at this bit $a \oplus x=1,b\oplus x=0$)
- Or set a 0 in $x$ at this position (then at this bit $a \oplus x=0, b\oplus x=1$).

Suppose we set a 0 in $x$, then $a \oplus x$ will definitely be less than $b \oplus x$ (because at the highest differing bit: $a \oplus x=0, b\oplus x=1$). Therefore, it is advantageous to set a 1 in $a \oplus x$ at all subsequent positions, as this will make their difference smaller.

Therefore, we can traverse positions in descending order. If the bits differ, set a 1 in $a \oplus x$ at that position (if doing so does not make $x$ exceed $r$).

The second case (when we set a 1 at the first differing bit) is analyzed similarly, but actually not needed, as the answer won't be smaller, and $x$ will become larger.

Time complexity: $O(\log 10^{18})$ per test case.

Code

I didn't understand at first why the answer could be output directly as $b-a$ later, but later I found it could be simpler.
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
        if ((a & (1LL << i)) != (b & (1LL << i)))//Bits at the same position differ
        {
            if (cn)//The first highest differing position
                cn = 0;
            else
            {
                if (!(a & (1LL << i)) && x + (1LL << i) <= r)
                {
                    x += (1ll << i);//Set x to 1 at this bit
                    a ^= (1ll << i);
                    b ^= (1ll << i);
                }
            }
        }
    }
    cout << b - a << '\n';
}
```

After all, it's the same as my idea. The final answer is the sum of bits (excluding the highest one) among the differing bits from high to low between $a$ and $b$ ($a<b$) where $a$ has 0 and $x\leq r$.

>Suppose we set a 0 in $x$, then $a \oplus x$ will definitely be less than $b \oplus x$ (because at the highest differing bit: $a \oplus x=0, b\oplus x=1$). Therefore, it is advantageous to set a 1 in $a \oplus x$ at all subsequent positions, as this will make their difference smaller.
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
You have an array $a$ consisting of $n$ integers.

You need to perform $k$ operations on it. One operation is to select any contiguous subarray of array $a$ (possibly empty) and insert the sum of that subarray anywhere in the array.

Your task is to find the maximum possible sum of the array after $k$ such operations.

Since this number can be very large, output the answer modulo $10^9 + 7$.

At a glance, the answer is $2^k\times res-res+sum$, but how to find the maximum sum of a subarray ($res$) [P1115 Maximum Subarray Sum - Luogu](https://www.luogu.com.cn/problem/P1115).

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

As long as the previous cumulative sum is greater than 0, adding subsequent values will always increase it; otherwise, reset the value to 0. This way, the maximum subarray sum can be found.
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
Given a binary tree with $n$ vertices and $n-1$ edges, find the maximum possible size of the **smallest connected component** among the components formed after deleting $k$ edges.

### Solution
Binary Search

A very classic problem: Binary search model: maximize the minimum
The usual way to write the check function is: use DFS to count how many components of size at least `mid` can be cut from each subtree; if a subtree reaches the threshold, treat it as a cuttable component count and return `0` upwards, otherwise pass the subtree size up to the parent. Finally, check if the number of cuttable components is at least `k+1` to complete the binary search.

> [!NOTE]- Find the depth corresponding to each node in the tree: (BFS)
> ```cpp
> queue< int >q;vector< int > dis(n + 1), vis(n + 1);
> q.push(1);vis[1] = 1;
> while (q.size()) {
>     int now = q.front();q.pop();
>     for (auto i : g[now]) {
>         if (vis[i])continue;
>         vis[i] = 1;
>         dis[i] = dis[now] + 1;
>         q.push(i);
>     }
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
Given an array $a$ of length $n$ and a number $x$, divide the array into $k$ segments, requiring that the XOR of each segment is $\leq x$, i.e., $(a_{l_1} \oplus a_{l_1 + 1} \oplus \ldots \oplus a_{r_1}) | (a_{l_2} \oplus a_{l_2 + 1} \oplus \ldots \oplus a_{r_2}) | \ldots | (a_{l_k} \oplus a_{l_k + 1} \oplus \ldots \oplus a_{r_k}) \le x$.

Find the maximum $k$. If it does not exist, output $-1$.

### Solution
Bitwise operation + Thinking

[Codeforces Round 936(A-E explanation)\_Bilibili](https://www.bilibili.com/video/BV1wJ4m1777P/?spm_id_from=333.337.search-card.all.click&vd_source=cb670d82714ee9baee22c33ef083884d)

Enumerate from high bits to low bits.

If the bit of $x$ is 1:

- If the answer's bit is 0 (the number of bits that are 1 in $a_{i}$ is even), then no splits are allowed in $[i,j)$ (where $bit(a_{i}=1,a_{j}=1)$), but splits are allowed everywhere else (because no matter how you split, it will be smaller than $x$). After traversal, update the answer.
- If the answer's bit is 1, then splitting doesn't affect the answer regardless.

If the bit of $x$ is 0:

- If the answer's bit is 0, then no splits are allowed in $[i,j)$ (here "no splits" means that for subsequent bits, you also cannot split $[i,j)$). Once split, this bit becomes 1.
- If the answer's bit is 1, then the answer obtained is larger than $x$, which does not meet the requirement. Output the currently stored answer.

```cpp
void solve() {
    int n, x;cin >> n >> x;
    vector<int> a(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i];
    vector<int> flag(n + 1, 1);
    int ans = -1;
    for (int i = 30;i >= 0;i--) {
        int cnt = 0;//Number of groups that can be split
        if (x & (1 << i)) {//Current bit of x is 1
            int ok = 1;
            for (int j = 1;j <= n;j++) {
                if (a[j] & (1 << i))ok ^= 1;//If the current position is 1, then no splits after until encountering another 1
                if (ok && flag[j])cnt++;
            }
            if (ok) {//If the count of 1s is even, the answer can be updated
                ans = max(ans, cnt);
            }
        } else {//Current bit of x is 0
            int ok = 1;
            for (int j = 1;j <= n;j++) {
                if (a[j] & (1 << i))ok ^= 1;
                if (!ok)flag[j] = 0;
            }
            if (!ok) {//If odd count, return the answer directly
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