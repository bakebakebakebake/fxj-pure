---
title: "AtCoder Solutions 1: Number Theory, Binary Search, and Representation"
description: March-June 2024, primarily based on original solution records, including ABC 340 F, 341 D, 346 D/E/F, 356 D/E/F.
publishDate: 2026-03-06
tags:
  - Competitive Programming
  - Solution Collection
  - AtCoder
  - Number Theory
  - Binary Search
  - State Representation
language: English
heroImageSrc: ../../../pic/nir-himi-uBst6NH7l9c-unsplash.jpg
heroImageColor: " #654c32 "
---
> [!note] Note
> 
> This article is based on the original AtCoder problem solutions in Obsidian, with only the addition of section divisions, scope of coverage, and minimal cleanup required for site compatibility; the problem statements, solution approaches, code, and original remarks are preserved as much as possible.

## Scope of Coverage

- `ABC 340 F`
- `ABC 341 D`
- `ABC 346 D`
- `ABC 346 E`
- `ABC 346 F`
- `ABC 356 D`
- `ABC 356 E`
- `ABC 356 F`

## ABC 340 F - S = 1

Given integers $X$ and $Y$ (where $x, y$ are not both $0$).  
Find a pair of integers $(A, B)$ that satisfies all the following conditions. If none exists, output `-1`.

- $-10^{18} \leq A, B \leq 10^{18}$
- The area of the triangle with vertices at points $(0, 0)$, $(X, Y)$, and $(A, B)$ on the $xy$-plane is $1$.

### Solution

It is easy to derive: The equation of the line formed by points $(X,Y)$ and $(A,B)$ is: $(Y-B)x-(X-A)y+BX-AY=0$

Then the distance to $(0,0)$ is: $\frac{\mid BX-AY\mid}{\sqrt{ (x-a)^2+(y-b)^2 }}$

Thus the area of the triangle: $\frac{\mid BX-AY\mid}{2}=1$

$\to\mid BX-AY\mid=2$

Let $g = \gcd(X, Y)$. (Note: $\gcd(a, b)$ is defined as the greatest common divisor of $\vert a \vert$ and $\vert b \vert$.)

> The extended Euclidean algorithm takes an integer pair $(a, b)$ as input and finds an integer pair $(x, y)$ such that $ax + by = \pm \mathrm{gcd}(a, b)$, with time complexity $\mathrm{O}(\log \min(|a|, |b|))$. (Here, the integer pair $(x, y)$ is guaranteed to satisfy $\max(|x|, |y|) \leq \max(|a|, |b|)$.)

By taking $(Y, -X)$ as input to the extended Euclidean algorithm, we can obtain a pair $(c, d)$ and find a feasible integer solution set for $\mid cY-dY\mid=g$.

Multiply $(c,d)$ by $\frac{2}{g} \to \mid AY-BY\mid=2$, where $g\leq 2$ (ensuring $\frac{2}{g}$ is an integer).

```cpp
pair<ll, ll> extgcd(ll a, ll b) {
    if (!b) return {1, 0};
    ll x, y;
    tie(y, x) = extgcd(b, a % b);
    y -= a / b * x;
    return {x, y};
}
void solve() {
    ll x, y;cin >> x >> y;
    if (abs(__gcd(x, y)) > 2) {
        cout << "-1\n";return;
    }
    auto [c, d] = extgcd(y, -x);
    c *= 2 / abs(__gcd(x, y)), d *= 2 / abs(__gcd(x, y));
    cout << c << " " << d << '\n';
}
```

## ABC 341 D - Only one of two

Given $n,m,k$ ($1\leq n\neq m\leq 10^8$, $1\leq k\leq 10^{10}$), array $a$ consists of multiples of $n$ and multiples of $m$, excluding multiples of $n\times m$. Find $a[k]$.

```cpp
#define int long long
void solve() {
    int N, M, K;
    cin >> N >> M >> K;
    int low = 1, high = 1e18, ans = -1;

    while (low <= high) {
        int mid = (high + low) / 2;
        // lcm(a,b)=(a / __gcd(a, b)) * b
        int count = mid / N + mid / M - 2 * (mid / ((N / __gcd(N, M)) * M));
        if (count >= K) {
            ans = mid;
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }
    cout << ans << '\n';
}
```

### Solution

<span style="color:#92d050">Binary Search</span>

The count of numbers divisible by either $N$ or $M$ but not both is $\lfloor \frac{X}{N}\rfloor+\lfloor \frac{X}{M}\rfloor-2\times \lfloor \frac{X}{L}\rfloor$.

Official solution:

> Let $L$ be the least common multiple of $N$ and $M$.  
> Then, below a positive integer $X$, the number of integers divisible by both $N$ and $M$ is $\lfloor \frac{X}{L}\rfloor$. Therefore, between $1$ and $X$, the number of integers divisible by either $N$ or $M$ but not both is $\lfloor \frac{X}{N}\rfloor+\lfloor \frac{X}{M}\rfloor-2\times \lfloor \frac{X}{L}\rfloor$.
> 
> Moreover, since this count is monotonically increasing with respect to $X$, the condition "the answer is required to be below $X$" is equivalent to "there are at least $K$ numbers between $1$ and $X$ that are divisible by either $N$ or $M$ but not both", i.e., $\lfloor \frac{X}{N}\rfloor+\lfloor \frac{X}{M}\rfloor-2\times \lfloor \frac{X}{L}\rfloor\geq K$.
> 
> Therefore, this problem can be solved using binary search. Within the constraints of this problem, the answer will never exceed $2\times 10^{18}$, so the search range can be set from $0$ to $2\times 10^{18}$.
> 
> The proof that the answer is less than or equal to $2\times 10^{18}$ is as follows: Without loss of generality, assume $N < M$. Let the greatest common divisor of $N$ and $M$ be $g$, $N=ng$, $M=mg$ ($1\leq n < m$, $n$, $m$ are integers). Then
> $$
> \left\lfloor \frac{X}{N}\right\rfloor+\left\lfloor \frac{X}{M}\right\rfloor-2\times \left\lfloor \frac{X}{L}\right\rfloor>\frac{X}{N}+\frac{X}{M}-\frac{2X}{L}-2=\frac{(m+n-2)X}{gnm}-2
> $$
> When $X=2\times 10^{18}$, under the problem constraints we have $\frac{m+n-2}{n}\geq 1$, $\frac{X}{gm}\geq 2\times 10^{10}$, therefore
> $$
> \frac{X}{N}+\frac{X}{M}-\frac{2X}{L}-2=\frac{(m+n-2)X}{gnm}-2\geq 2\times 10^{10}-2
> $$
> Thus, under the problem constraints, there are at least $2\times 10^{10}-2$ qualifying numbers below $X$, and in particular at least $K$ qualifying numbers. Actually, under the current constraints, with $N=5\times 10^{7}$, $M=10^{8}$, $K=10^{10}$, the answer is $10^{18}-5\times 10^{7}$.
> 
> Specifically, first set $L=0, R=2\times 10^{18}$, then as long as $R-L\geq 2$, repeat the following steps:
> 
> 1. Set $X=\lfloor \frac{L+R}{2}\rfloor$.
> 2. Determine if $\lfloor \frac{X}{N}\rfloor+\lfloor \frac{X}{M}\rfloor-2\times \lfloor \frac{X}{L}\rfloor\geq K$, if true, set $R=X$, otherwise set $L=X$.
> 
> The resulting $R$ is the answer.
> 
> For a fixed $X$, the complexity of checking $\lfloor \frac{X}{N}\rfloor+\lfloor \frac{X}{M}\rfloor-2\times \lfloor \frac{X}{L}\rfloor\geq K$ is $O(1)$, and the number of iterations is at most $60$, making it very efficient. Therefore, this problem can be well solved using binary search.

## ABC 346 D - Gomamayo Sequence

You are given a string $S$ of length $N$ consisting of `0` and `1`.

A string $T$ of length $N$ consisting of `0` and `1` is a **good string** if and only if it satisfies the following condition:

- There is exactly one integer $i$ such that $1 \leq i \leq N - 1$ and the $i$-th and $(i+1)$-th characters of $T$ are the same.

For each $i = 1,2,\ldots, N$, you can choose whether to perform the following operation once:

- If the $i$-th character of $S$ is "0", replace it with "1", and vice versa. If you perform this operation, the cost is $C_{i}$.

Find the minimum total cost required to make $S$ a good string.

### Solution

Prefix-Suffix Sum

It can be seen that except for the positions $i,i+1$ which are the same, all other bits form an alternating `01` string. Consider two cases: $1010\dots00|11\dots1010\dots$ and $0101...00|11\dots0101\dots$. Process the prefix and suffix separately. Then the answer at this point is $pre[i][0]+suf[i+1][0]$ or $pre[i][1]+suf[i+1][1]$ (respectively representing the cost required when bits $i,i+1$ are both 0 or both 1, and all other bits form an alternating `01` string). Take the minimum value.

```cpp
#define int long long
void solve() {
    int n;cin >> n;string s;cin >> s;vector<int> a(n + 1);s = ' ' + s;
    for (int i = 1;i <= n;i++)cin >> a[i];
    vector<array<int, 2>> f(n + 2), g(n + 2);
    for (int i = 1;i <= n;i++) {
        f[i][0] = f[i - 1][1] + (s[i] == '0' ? 0 : a[i]);
        f[i][1] = f[i - 1][0] + (s[i] == '1' ? 0 : a[i]);
    }
    int ans = 1e18;
    for (int i = n;i >= 2;i--) {
        g[i][0] = g[i + 1][1] + (s[i] == '0' ? 0 : a[i]);
        g[i][1] = g[i + 1][0] + (s[i] == '1' ? 0 : a[i]);
        ans = min(ans, f[i - 1][0] + g[i][0]);
        ans = min(ans, f[i - 1][1] + g[i][1]);
    }
    cout << ans << '\n';
}
```

## ABC 346 E - Paint

There is a grid with $H$ rows and $W$ columns. Initially, all cells are painted with color $0$.

You will perform the following operations in order for $i = 1, 2, \ldots, M$.

- If $T_{i} = 1$, repaint **all** cells in the $A_{i}$-th **row** with color $X_{i}$.
- If $T_{i} = 2$, repaint **all** cells in the $A_{i}$-th **column** with color $X_{i}$.

After all operations are completed, for each color $i$ present in the grid, find the number of cells painted with color $i$.

### Solution

Reverse Thinking

Traverse from back to front, which avoids complex discussions, and later operations are guaranteed to be final without worrying about being overwritten.

```cpp
#define int long long
void solve() {
    int n, m, q;cin >> n >> m >> q;
    vector<int> t(q + 1), a(q + 1), x(q + 1), visn(n + 1), vism(m + 1);
    for (int i = 1;i <= q;i++) {
        cin >> t[i] >> a[i] >> x[i];
    }
    int n1 = n, m1 = m;
    vector<int> cnt(2e5 + 1);
    for (int i = q;i >= 1;i--) {
        if (t[i] == 1) {
            if (!visn[a[i]]) {
                n1--;
                visn[a[i]] = 1;
                cnt[x[i]] += m1;
            }
        } else {
            if (!vism[a[i]]) {
                m1--;
                vism[a[i]] = 1;
                cnt[x[i]] += n1;
            }
        }
    }
    cnt[0] += n1 * m1;
    vector<pair<int, int>> ans;
    for (int i = 0;i <= 2e5;i++) {
        if (cnt[i]) {
            ans.push_back({i,cnt[i]});
        }
    }
    cout << ans.size() << '\n';
    for (auto [x, y] : ans)cout << x << " " << y << '\n';
}
```

## ABC 346 F - SSttrriinngg in StringString

For a string $X$ of length $n$, let $f(X,k)$ denote the string obtained by repeating the string $X$ $k$ times, and $g(X,k)$ denote the string obtained by repeating the first character, second character, ..., up to the $n$-th character of $X$ $k$ times each.

For example, if $X=$ `abc`, then $f(X,2)=$ `abcabc`, $g(X,3)=$ `aaabbbccc`. Also, for any string $X$, $f(X,0)$ and $g(X,0)$ are both empty strings.

Given a positive integer $N$ and strings $S$ and $T$. Find the largest non-negative integer $k$ such that $g(T,k)$ is a (not necessarily contiguous) subsequence of $f(S,N)$.

> $g(T,0)$ is always a subsequence of $f(S,N)$.

$(n\leq 10^{12}, 1\leq \mid s\mid, \mid t\mid \leq 10^5 )$

### Solution

Binary Search + Greedy

> [!NOTE]- Official Solution
> 
> Fix $k$ and consider how to determine whether $g(T,k)$ is a subsequence of $f(S,N)$.
> 
> Let $s$ be the length of $S$, $t$ be the length of $T$, and $X[: i]$ denote the first $i$ characters of string $X$. Each character in $T$ must also appear in $S$ (otherwise the answer is clearly 0).
> 
> Let us sequentially find the following values in the order of $i=1,2,\ldots, t$:
> 
> - $\mathrm{iter}_i$: the smallest $j$ such that $g(T[: i],k)$ is a subsequence of $f(S,N)[: j]$.
> 
> Finally, by comparing $\mathrm{iter}_t$ with $N\times s$, we obtain the answer. Finding $\mathrm{iter}_{i+1}$ from $\mathrm{iter}_i$ is equivalent to finding the position of the $k$-th occurrence of the $(i+1)$-th character of $T$ after the ($\mathrm{iter}_i+1$)-th character (inclusive) of $f(S,N)$. Therefore, this problem reduces to handling the following query $k$ times:
> 
> - $\mathrm{query}(a,b,c)$: Given positive integers $a$, $b$, and a character $c$, find the position of the $b$-th occurrence of character $c$ after the $a$-th character (inclusive) of $f(S,N)$.
> 
> Assume $c$ appears $\mathrm{cnt}_c$ times in $S$. If $a$ is greater than $s$, reduce it to the case $a\leq s$ by $\mathrm{query}(a,b,c)=\mathrm{query}(a-s,b,c)+s$. If $b$ is greater than $\mathrm{cnt}_c$, reduce it to the case $b\leq \mathrm{cnt}_c$ by $\mathrm{query}(a,b,c)=\mathrm{query}(a+s,b-\mathrm{cnt}_c,c)$.
> 
> Therefore, we only need to handle queries satisfying $a\leq s$, $b\leq \mathrm{cnt}_c$. If these conditions are satisfied, the answer to $\mathrm{query}(a,b,c)$ is no greater than $2s$. By precomputing for each character its occurrence positions in $f(S,2)$, queries can be handled quickly.
> 
> Thus, including the initial binary search for $k$, the problem can be solved in a total time of $O(s\sigma+t\log Ns)$ or $O(s+\sigma+t\log s\log Ns)$ (where $\sigma$ is the size of the alphabet).

During implementation, the positions of each character in `S + S` are preprocessed, so each `query(a,b,c)` can locate the answer after a constant number of jumps; the binary search decision is then grounded accordingly.

$a[i][j]$ represents the count of each letter in the first $i$ characters of the string.

The reason for $x-1$ is that when it's exactly divisible, it would carry over to the next digit, and at that point $z$ would record the position of the corresponding character in the next cycle. However, we actually need to record the last position of that letter in the previous cycle.

```cpp OMG_wc 
#include <bits/stdc++.h>
using namespace std;
using LL = long long;
const int INF = 0x3f3f3f3f;
const LL mod = 1e9 + 7;
const int N = 200005;

char s[N], t[N];
int a[N][26];
vector<int> b[26];
int main() {
    LL n;
    scanf("%lld%s%s", &n, s + 1, t + 1);
    int m = strlen(s + 1);
    for (int i = 1; i <= m; i++) {
        for (int j = 0; j < 26; j++) a[i][j] = a[i - 1][j];
        a[i][s[i] - 'a']++;
        b[s[i] - 'a'].push_back(i);
    }
    LL l = 1, r = 1e17 + 500;
    while (l < r) {
        LL mid = l + r >> 1;
        LL k = 0, z = 0;
        int ok = 0;
        for (int i = 1; t[i] && k < n; i++) {
            int c = a[m][t[i] - 'a'];// The count of this letter in the s string <-> int c = b[t[i] - 'a'].size();
            if (c == 0) {// If this character does not exist, end immediately (this mid as an answer does not meet the requirement, the answer should be smaller)
                k = n;break;
            }
            LL x = a[z][t[i] - 'a'] + mid;
            k += (x - 1) / c;
            x = (x - 1) % c + 1;
            z = b[t[i] - 'a'][x - 1];// Record the subscript in the last cycle that meets the condition
        }
        if (k >= n)
        // If the number of cycles has already exceeded n before finishing traversing the t string, it proves that the requirement cannot be met. The goal of this binary search is to find the first index where k >= n
            r = mid;
        else
            l = mid + 1;
    }
    printf("%lld\n", l - 1);
    return 0;
}
```

## ABC 356 D - Masked Popcount

Given integers $N$ and $M$, compute the sum $\displaystyle \sum_{k=0}^{N}$ $\rm{popcount}$ $(k \mathbin{\&} M)$ modulo $998244353$.

Bitwise operation:
Based on the property of $\&$, $\text{popcount}$ increases only when both bits are 1, so we only need to enumerate the bits where $M$ is 1.

In the interval $[0,n]$, if we look at the $i$-th bit, we find that it alternates with $2^n$ zeros and $2^n$ ones (i.e., the period is $2^{i+1}$). We can first calculate how many periods $n$ covers, and then how many ones are covered in the last incomplete period.

It's easy to calculate: For the $i$-th bit: $\displaystyle \text{ans=}\lfloor{\frac{n}{2^{i+1}}}\rfloor\times 2^i+\max(0,(n \bmod 2^{i+1})-2^i)$.

$n+1$ is used because when calculating the count here, 0 is included, so one less is counted later, which needs to be added back.

```cpp
#define int long long
constexpr int mod = 998244353;
void solve() {
    int n, m;cin >> n >> m;
    int sum = 0;
    n++;
    for (int i = 0;i <= __lg(m);i++) {
        if ((m >> i) & 1) {
            int x = n / (1ll << (i + 1));
            int y = n % (1ll << (i + 1));
            sum = (sum + x * (1ll << i) + max(y - (1ll << i), 0ll)) % mod;
        }
    }
    cout << sum << '\n';
}
```

## ABC 356 E - Max/Min

Given array $A$, compute: $\displaystyle \sum\limits_{i=1}^{N}\sum\limits_{j=i+1}^{N} \lfloor{\frac{\max(A_{i},A_{j})}{\min(A_{i},A_{j})}}\rfloor$

When the count of identical numbers is $x$, the contribution is $\frac{x(x-1)}{2}$.

When two numbers are different, for $x$, when $y\in[kx,(k+1)x-1]$, the contribution is $k$.

First, use an array $c_{i}$ to represent how many times $i$ appears in array $a$. Use $s_{i}$ to represent the prefix sum of $c_{i}$. $s_{r}-s_{l-1}$ represents the count of numbers in the interval $[l,r]$.

For each $x\in[1,M]$, enumerate multiples of $x$, look at the interval $[kx,(k+1)x-1]$, i.e., $V=s_{(k+1)x-1}-s_{kx-1}$. For this case: $V\times k\times c_{x}$.

jiangly:

```cpp
void solve() {
    int n;cin >> n;
    vector<int> a(n);
    for (int i = 0; i < n; i++) {
        cin >> a[i];
    }
    const int M = *max_element(a.begin(), a.end());

    vector<int> c(M + 1);
    for (auto x : a) {
        c[x]++;
    }

    vector<int> s(M + 1);
    for (int i = 1; i <= M; i++) {
        s[i] = s[i - 1] + c[i];
    }

    int ans = 0;
    for (int x = 1; x <= M; x++) {
        ans += c[x] * (c[x] - 1) / 2;
        for (int y = x; y <= M; y += x) {
            int v = s[min(y + x - 1, M)] - s[max(x, y - 1)];
            ans += c[x] * v * (y / x);
        }
    }
    cout << ans << "\n";
}
```

## ABC 356 F - Distance Component Size Query

You are given an integer $K$. For an initially empty set $S$, process the following $Q$ queries of two types in order:

- `1 x`: Given an integer $x$. If $x$ is in $S$, remove $x$ from $S$. Otherwise, add $x$ to $S$.
- `2 x`: Given an integer $x$ that is in $S$. Consider a graph whose vertices are the numbers in $S$, and an edge exists between two numbers if and only if their absolute difference is at most $K$. Print the number of vertices in the connected component containing $x$.

Balanced tree from \_pbds

The main idea is to maintain two sets: one records the current set of elements, and the other records the set after compression.

> Compression means compressing each connected block into the largest number in that block.

Thus, when querying the size of the connected component containing $x$, it is the position of this connected block in the first set minus the position of the previous connected block in the first set.

```cpp
ordered_set<int> s1;set<int> s2;  // s1 is the set of all points; s2 compresses each connected block into its largest point
// (s1 requires rank, so PBDS must be used; s2 can be an ordinary set)

void solve() {
    ll q, k;cin >> q >> k;
    // Inserting a few sentinels here is for convenience in problem-solving, so prev and next on boundaries can be unified
    s1.insert(-4e18), s1.insert(4e18);
    s2.insert(-4e18), s2.insert(4e18);
    while (q--) {
        ll op, x;cin >> op >> x;
        if (op == 1) {
            if (s1.find(x) == s1.end()) {
                auto it = s1.insert(x).first;
                ll w1 = *prev(it), w2 = *next(it);  // Numbers adjacent to x on left and right
                if (x - w1 <= k) s2.erase(w1);
                if (w2 - x <= k)
                    ;  // No need to insert x into s2
                else
                    s2.insert(x);
            } else {
                auto it = s1.find(x);
                ll w1 = *prev(it), w2 = *next(it);  // Numbers adjacent to x on left and right
                s1.erase(x), s2.erase(x);           // It doesn't matter if x wasn't in s2
                if (w2 - w1 > k) s2.insert(w1);     // Let w1 revive (it doesn't matter if it was already active)
            }
        } else {
            auto it = s2.lower_bound(x);  // Find the largest point in the connected block containing x
            cout << s1.order_of_key(*it) - s1.order_of_key(*prev(it)) << '\n';
        }
    }
}
```