---
title: "Codeforces Solutions 2: Prefix Sums, Strings, and Thought Transformation"
description: "Solutions from Dec 2023 to Jul 2024, covering prefix sums, strings, and transformation-oriented Codeforces problems."
publishDate: 2026-03-06
tags:
- competitive programming
- solution collection
- Codeforces
- prefix and
- string
- thought transformation
language: English
heroImageSrc: ../../../pic/salvatore-andrea-santacroce-AmKua5hKI38-unsplash.jpg
heroImageColor: " #9fd0cb "
---
> [!note] Explanation
> This set retains the original contest problem solution snippets, only reordered according to the current blog grouping, without rewriting your content in a uniform tone.

## Scope of Inclusion

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
Yaroslav is playing a computer game. In one of the levels, he encounters $n$ mushrooms arranged in a row. Each mushroom has its own toxicity level; the toxicity level of the $i$-th mushroom from the start is $a_i$. Yaroslav can choose two integers $1 \le l \le r \le n$, and then his character will eat the mushrooms in this segment one by one from left to right, i.e., mushrooms numbered $l, l+1, l+2, \ldots, r$.

The character's toxicity level is $g$, initially equal to $0$. The computer game is defined by a number $x$ -- the maximum toxicity level at any time. When eating a mushroom with toxicity level $k$, the following happens:

1.  The character's toxicity level increases by $k$.
2.  If $g \leq x$, the process continues; otherwise, $g$ becomes zero, and the process continues.

Yaroslav is interested in how many ways there are to choose the values of $l$ and $r$ such that the final value of $g$ is not zero. Help Yaroslav find this number!

### Solution
DP

> [!NOTE] New trick:
> 
> To directly compute the prefix sum of an array: `partial_sum(a.begin() + 1, a.end(), a.begin() + 1);`
> (For indices 1~n)

For index $l$, find the smallest subsequent index $k$ such that $a_{l}+a_{l+1}+\dots+a_{k}>x \to pre_{k}-pre_{l-1}>x$,

i.e., $a_{l}+a_{l+1}+\dots+a_{k-1}\leq x \to pre_{k-1}-pre_{l-1}\leq x$, then there are $k-l$ types meeting the requirement.

$\implies pre_{k}-pre_{l-1}\implies0$, at this point, the result from index $l$ to $k$ is $0$. If you continue eating, there might still be a result, which is $f_{k+1}$

$f_{i}$ represents the number of valid intervals with left boundary $i$.

DP transition equation: $f_{l}=(k-l)+f_{k+1}$
```cpp
#define int long long
void solve() {
    int n, x; cin >> n >> x;
    vector<int> a(n + 1);
    for (int i = 1; i <= n; i++) cin >> a[i];
    partial_sum(a.begin() + 1, a.end(), a.begin() + 1);
    vector<int> f(n + 2);
    for (int i = n - 1; i >= 0; i--) {
        int j = upper_bound(a.begin(), a.end(), a[i] + x) - a.begin();
        f[i] = f[j] + j - i - 1;
    }
    cout << accumulate(f.begin(), f.end(), 0ll) << '\n';
}
```

## CF 1994 Div.1+2 D - Funny Game
Vanya has a graph with $n$ vertices (numbered $1$ to $n$) and an array $a$ of $n$ integers; initially, the graph has no edges. Bored, Vanya decides to perform $n - 1$ operations to have some fun.

Operation number $x$ (operations are numbered sequentially starting from $1$) is as follows:

- Choose $2$ different numbers $1 \leq u,v \leq n$ such that $|a_u - a_v|$ is divisible by $x$.
- Add an undirected edge between vertices $u$ and $v$.

Help Vanya obtain a connected graph using $n - 1$ operations, or determine if it's impossible.

### Solution
Pigeonhole Principle

Operations need to be performed in reverse order (doesn't affect the answer): Start from operation number $n-1$ (decreasing subsequently), need to find $x | \left|{a_{u}-a_{v}}\right|$, i.e., $a_{u}\equiv a_{v}\pmod x$.

According to the pigeonhole principle, it is always possible to find two points $u,v$ satisfying the requirement in each operation.

```cpp
void solve() {
    int n; cin >> n;
    vector<int> a(n), p(n);
    iota(p.begin(), p.end(), 0);
    vector<pair<int, int>> ans;
    for (auto& i : a) cin >> i;
    for (int i = n - 1; i >= 1; i--) {
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
    for (auto [x, y] : ans) cout << x + 1 << " " << y + 1 << "\n";
}
```

## CF 1994 Div.1+2 E - Wooden Game
There is a forest consisting of $k$ rooted trees. Lumberjack Timofey wants to cut down the entire forest using the following operation:

- Choose any vertex's subtree in any one of the trees and remove it from the tree.

Timofey loves bitwise operations, so he wants the [bitwise OR](https://en.wikipedia.org/wiki/Bitwise_operation#OR) of the sizes of the removed subtrees to be as large as possible. Please help him find the maximum possible result.

### Solution
The trees given in this problem are useless; only the vertex counts $a_{i}$ are useful.

For a certain tree, let the sizes of subtrees removed each time be $d_{1},d_{2},\dots,d_{t}$. It's easy to see: $\sum\limits_{i=1} d_{i}=n$, and $d_{1}|d_{2}|\dots|d_{t}\leq n$.

> If there is no subtree of size $k$, you can remove nodes from the subtree one by one to construct $k$.

Therefore, for this tree, all answers in $[1,n]$ can be constructed.

For a certain tree, if the $k$-th bit of $n$ is 1, then $2^k$ can be directly constructed. If the answer already has this part, then $2^k-1$ can be constructed, thus ensuring optimality.

> Very clever!

```cpp
void solve() {
    int k; cin >> k;
    vector<int> a(k);
    for (int i = 0; i < k; i++) {
        cin >> a[i];
        for (int j = 0; j < a[i] - 1; j++) {
            int x; cin >> x;
        }
    }
    sort(a.rbegin(), a.rend());
    int ans = 0;
    for (auto x : a) {
        for (int i = __lg(x); i >= 0; i--) {
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
Pelican Town consists of $n$ houses connected by $m$ bidirectional roads. On some roads, there are NPCs standing. Farmer Bubba needs to walk along each road with an NPC and talk to them.

Help the farmer find a route with the following properties:

- The route starts at a house, follows roads, and ends at the same house.
- Each road can be traversed at most once.
- All roads containing NPCs must be traversed, while roads without NPCs don't have to be.

It is guaranteed that one can reach any other house from any other house by walking only on roads with NPCs.

### Solution
Eulerian Graph

Similar problem: [F - Perils in Parallel](https://atcoder.jp/contests/abc155/tasks/abc155_f)

The problem means this graph is the complete set of `NPC edges` plus a subset of `non-NPC edges` (i.e., delete some non-NPC edges), find an Eulerian circuit of this graph.

>The condition for having an Eulerian graph is that the degree of every vertex is even.

>For deleting a specific edge, you can use the technique in the code: `g[u].push(i), edge[i]=u^v->int to=edge[i]^u`.

For this problem, you might need to delete some edges from the graph composed of non-NPC edges to do the Eulerian circuit. If the degree of every vertex in the graph is even, then an Eulerian circuit definitely exists; otherwise, it definitely doesn't exist.

Construct a graph from the non-NPC edges. Process this graph. If all vertex degrees can be made even, then proceed to find the Eulerian circuit.

>If there is an odd number of vertices with odd degree, it's impossible to make all degrees even by deleting edges. During the search, if a certain vertex has an odd degree, you need to delete an edge between this vertex and its connected vertex.

```cpp
void solve() {
    int n, m; cin >> n >> m;
    vector<vector<int>> g(n + 1), blk(n + 1);
    vector<int> edge(m + 1);
    for (int i = 1; i <= m; i++) {
        int u, v, is; cin >> u >> v >> is;
        g[u].push_back(i);
        g[v].push_back(i);
        edge[i] = u ^ v;
        if (!is) {
            blk[u].push_back(i);
            blk[v].push_back(i);
        }
    }
    vector<int> deg(n + 1);
    for (int i = 1; i <= n; i++) deg[i] = g[i].size() & 1;
    vector<int> del(m + 1), vis(n + 1);
    auto dfs = [&](auto self, int u)->void {
        vis[u] = 1;
        for (auto x : blk[u]) {
            int to = edge[x] ^ u;
            if (vis[to]) continue;
            self(self, to);
            if (deg[to]) {
                del[x] = 1;
                deg[to] ^= 1;
                deg[u] ^= 1;
            }
        }
    };
    int ok = 1;
    for (int i = 1; i <= n; i++) {
        if (vis[i]) continue;
        dfs(dfs, i);
        ok &= !deg[i];
    }
    if (!ok) {
        cout << "NO\n"; return;
    }
    cout << "YES\n";
    cout << m - accumulate(del.begin() + 1, del.end(), 0) << '\n';
    auto euler = [&](auto self, int u) ->void {
        while (g[u].size()) {
            int x = g[u].back(); g[u].pop_back();
            int to = edge[x] ^ u;
            if (del[x]) continue;
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
Given two integers $n$ and $x$, find the number of triples ($a,b,c$) of positive integers such that $ab + ac + bc \le n$ and $a + b + c \le x$.

>Note that $(a,b,c) \neq (b,a,c)$ means order matters and $a,b,c > 0$.

### Solution
> This problem is simple; I overcomplicated it, always thinking the complexity was not right hh.

Knowing $a, b$, calculate the maximum $c$ that satisfies the conditions, so the number of types is added by $c$.

```cpp
for i i <= n i++
    for j i * j <= n j++
```

Number of operations: $n+\frac{n}{2}+\frac{n}{3}+\dots+\frac{n}{n}$ times.

> [!NOTE] $\text{proof for}$ $n\log n$:
> 
> The original expression can be written as: $\displaystyle n\left( 1+\frac{1}{2}+\frac{1}{3}+\dots+\frac{1}{n} \right)$
> 
> Where $A=1+\frac{1}{2}+\frac{1}{3}+\dots+\frac{1}{n}$ is a harmonic series.
> 
> $A=\ln(n+1)+\gamma,\gamma \approx 0.5772156649$ , i.e., $A\in O(\log n)$
> 
> Then the original expression $\in O(n\log n)$

```cpp
void solve() {
    int n, x; cin >> n >> x;
    int sum = 0;
    for (int a = 1; a <= min(x - 2, n); a++) {
        for (int b = 1; a * b < n && a + b < x; b++) {
            sum += min((n - a * b) / (a + b), x - a - b);
        }
    }
    cout << sum << "\n";
}
```

## CF 1996 Div.3 E - Decode
To get your "waifu" favorite character, you desperately hack into the game's source code. After days of effort, you finally find the binary string encoding the game's gacha system. To decode it, you must first solve the following problem.

You are given a binary string $s$ of length $n$. For every pair of integers $(l, r)$ $(1 \leq l \leq r \leq n)$, you need to count how many pairs of integers $(x, y)$ $(l \leq x \leq y \leq r)$ such that the number of $\mathtt{0}$s equals the number of $\mathtt{1}$s in the substring $s_xs_{x+1}...s_y$.

Output the sum of these counts over all possible $(l, r)$ modulo $10^9+7$.

### Solution

When encountering problems requiring equality like this, it's somewhat similar to Niuke Weekly Contest 52-F.

If $s_{i}=0$, set $pre_{i}=-1$, otherwise set it to 1. This way, for an interval $[l,r]$, directly check if $pre_{r}-pre_{l-1}$ is 0, i.e., $pre_{r}=pre_{l-1}$.

The problem becomes: For all intervals $[l,r]$, count the sum of the number of pairs $(x,y)$ satisfying $pre_{y}=pre_{x-1}$.

If for an interval $[l,r]$ the number of 0s equals the number of 1s, i.e., $pre_{r}=pre_{l-1}$, then there are $l\times (n-r+1)$ ways.

> That is, any left endpoint in $[1,l]$ can be chosen, and any right endpoint in $[r,n]$ can be chosen.

That is:
```cpp
for (int l = 1; l <= n; l++) {
    for (int r = l; r <= n; r++) {
        if (pre[r] == pre[l - 1]) {
            ans += l * (n - r + 1); ans %= mod;
        }
    }
}
```

Using a DP-like idea, by enumerating $r$, accumulate the sum of $l$ each time.

$f_{i}$ represents the sum of indices $j$ in $[0,i-1]$ that satisfy $pre_{i}=pre_{j}$, i.e., $f_{i}=\sum\limits_{j=0}^{i-1}(j+1)\times[pre_{i}=pre_{j}]$.
```cpp
#define int long long
constexpr int mod = 1e9 + 7;
void solve() {
    string s; cin >> s; int n = s.size();
    vector<int> pre(n + 1);
    for (int i = 0; i < n; i++) {
        pre[i + 1] = pre[i] + (s[i] == '0' ? -1 : 1);
    }
    vector<int> f(2 * n + 1);
    int ans = 0;
    for (int i = 0; i <= n; i++) {
        int t = pre[i] + n;
        ans += f[t] * (n - i + 1); ans %= mod;
        f[t] += i + 1; f[t] %= mod;
    }
    cout << ans << '\n';
}
```

## CF 1907 Div.3 D - Jumping Through Segments

Find the minimum movement distance $k$ such that after each move, you can stay within the target interval $[l, r]$.

$$
\text{example 1 }\boxed{\begin{aligned}&5\\&1 &5\\&3 &4\\&5 &6\\&8 &10\\&0 &1\end{aligned}}\to \min(k) \text{ is }8-1=7.
$$

$$
\text{example 2 }\boxed{\begin{aligned}&3\\&3 &8\\&10 &18\\&6 &11\end{aligned}}\min(k)\text{ is } \frac{10}{2}=5
$$

In $\text{example 2}$ the player can take the following actions:

-   Move from point $0$ to point $5$ ($3 \le 5 \le 8$);
-   Move from point $5$ to point $10$ ($10 \le 10 \le 18$);
-   Move from point $10$ to point $7$ ($6 \le 7 \le 11$).
Note that for the last step, the player can choose not to move and still complete the level.

Perform a binary search between $[1,10^{9}]$ until finding the optimal $k$.
`check` function:
Used to check if, given a length $k$, there exists a way to cover all segments.
- Initialize `ll` and `rr` to 0, representing the left and right boundaries of the current coverage interval.
- For each segment $[a, b]$:
   a. Calculate the left boundary of the new coverage interval as `max (ll - k, a)`, indicating moving as far left as possible while ensuring coverage.
   b. Calculate the right boundary of the new coverage interval as `min (rr + k, b)`, indicating moving as far right as possible while ensuring coverage.
   c. If the left boundary of the new coverage interval is greater than the right boundary, return `false`, indicating it's impossible to cover all segments.
- If all segments are traversed successfully and can be covered, return `true`, indicating there exists a way to cover all segments within length $k$.
The role of the `check` function is crucial, but proving its correctness remains a question for me.

Binary search: $\text{I still haven't figured it out}$
![](../../solutions-codeforces-2/Pasted%20image%2020231213195628.png)
Changing the 2D `vector<vector<int>>` to `vector<array<int, 2>>` saves a lot of space.
```cpp
#include<bits/stdc++.h>
using namespace std;
bool check(int k, vector<array<int, 2>> &seg)
{
    int ll = 0, rr = 0;
    for (auto [a,b] : seg)
    {
        ll = max(ll - k, a), rr = min(rr + k, b);
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

Given $n$, find the number of triples satisfying $a+b+c=n \cap f(a)+f(b)+f(c)=f(n)$. $f(x)$ represents the sum of digits of $x$.

n | 0 | 1 | 2 | 3| 4|5|6|7|8|9
-- | -- | -- | --| --| -- | --| --| --| --| --
ans |1 | 3 | 6|10| 15|21 |28 |36 |45 |55 |

For $n\geq 10$, $ans(n)=\prod ans(\text{digit of }n)$.

`int x=n%10, ans *= (x + 1) * (x + 2) / 2, n/=10;`
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
            ans *= a[n % 10], n /= 10; // ans *= (x + 1) * (x + 2) / 2, n/=10; //written by jiangly
        cout << ans << '\n';
    }
}
```

## CF 1907 Div.3 F - Shift and Reverse

Given an integer array $a_1,a_2,\ldots,a_n$. You can perform two types of operations on this array:

-   Shift: Move the last element of the array to the first position, and shift all other elements to the right, so you get the array $a_n,a_1,a_2,\ldots,a_{n-1}$.
-   Reverse: Reverse the entire array, so you get $a_n,a_{n-1},\ldots,a_1$.
Your task is to sort the array in non-decreasing order using the minimum number of operations. If impossible, output `-1`.

Let's **write the array out twice**, then calculate the increasing and decreasing parts of the array. This way, we can find all possible moves that can sort the array.
>down: non-increasing
- If starting from position `st`, the array `a[st]` to `a[st + n - 1]` is non-increasing, then we only need to move this sequence segment to the front of the array, and then **reverse** the entire array. The number of shifts is `st + 1`, and the number of reverses is `1`. Since each shift moves the last element to the first, the minimum number of operations for this part is `min(st + 1, n - st + 1)`, representing shifting left or right. Then reverse once, so the total number of operations is `st + 1` or `n - st + 1`.
>up: non-decreasing
- If starting from position `st`, the array `a[st]` to `a[st + n - 1]` is non-decreasing, we only need to move this sequence segment to the front of the array. The number of shifts is `st + 1`. However, since each shift moves the last element to the first, we need to reverse once. Thus, the total number of operations is `st + 2`. Another scenario is that we can still choose to shift in the other direction, i.e., push the `n - st` elements from the end backward, then reverse once, the number of operations is `n - st + 1`. But considering that the position `st` is definitely non-decreasing, it can be directly shifted to the front of the queue, then reverse the entire array, the number of operations is `n - st`. So the minimum number of operations for this part is `min(st + 2, n - st)`.
Thus, we get the minimum number of operations that can make the entire array non-decreasing starting from each position. Taking the minimum among all cases gives the answer.
```cpp
//core：
when down:
ans = min({ans, st + 1, n - st + 1});
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
        if (is_sorted(a.begin(), a.begin() + n))// special case
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
                ans = min(ans, min(st + 1, n - st + 1));
        }
        for (int i = 0; i < n; i++) // up
        {
            int st = i, cnt = 1;
            while (i <= 2 * n - 1 && a[i] <= a[i + 1])
                i++, cnt++;
            if (cnt >= n)
                ans = min(ans, min(st + 2, n - st));//(if(!st)ans=0;)<->(special case)
        }
        if (ans == INT_MAX)
            cout << "-1" << '\n';
        else
            cout << ans << '\n';
    }
}
```

## CF 1921 Div.3 F - Sum of Progression
You are given an array $a$ of $n$ numbers. There are also $q$ queries of the form $s, d, k$.

For each query $q$, find $\{\sum\limits_{i=1}^k a_{s+d(i-1)}\times i\}$.

For each test case, the input is in the form:

```text title="input shape"
n q
a1 a2 ... an
s1 d1 k1
s2 d2 k2
...
sq dq kq
```

### Solution
<span style="color:#c00000">Square Root Decomposition</span>

Set a threshold: $$w=\sqrt{ n }$$

When $d>w$, just do it brute force (because the number of operations is very small at this point).

When $d\leq w$, open arrays to compute prefix sums. (Let $s,d$ represent $i,j$ respectively)

- Array $f$ records the prefix sum of $\lfloor{\frac{s}{d}}\rfloor\times a_{s+\lambda \times d}$, recording $a_{s}\times \lfloor{\frac{s}{d}}\rfloor + a_{s+d}\times\lfloor{\frac{s+d}{d}}\rfloor+\dots$
- Array $g$ records the prefix sum of $a_{s+\lambda \times d}$, recording $a_{s}+a_{s+d}+\dots$
- Difference $\left( \frac{s}{d}-1 \right)g = a_{s}\times\left( \frac{s}{d}-1 \right)+a_{s+d}\times\left( \frac{s}{d}-2 \right)+\dots$
- $\leftrightarrow$ $\text{ans}=f-\left( \frac{s}{d}-1 \right)g = a_{s}\times1 + a_{s+d}\times 2 + \dots + a_{s+(k-1)d}\times k = \text{target}$
- $\leftrightarrow \text{ans=}\textcolor{green}{f[s+d\times(k-1)][d]-f[s-d][d]} - (\textcolor{grey}{g[s+d\times(k-1)][d]-g[s-d][d]})\times\left( \frac{s}{d}-1 \right)$

The handling method might be more than one...

```cpp
int n,q,a[100010];
ll f[100010][350],g[100010][350];//index step d
(ios::sync_with_stdio(false), cin.tie(nullptr);)//must turn off sync, otherwise TLE
void solve()
{
    cin >> n >> q;
    int value = sqrt(n);
    for (int i = 1; i <= n; i++)
        cin >> a[i];
    for (int d = 1; d <= value; d++){
        for (int i = 1; i <= n; i++){
            f[i][d] = ((i - d > 0) ? f[i - d][d] : 0ll) + 1ll * a[i] * (i / d); //((i - 1) / d + 1); The gray part can also work
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
Isaac begins his training. There are $n$ tracks available for use, and the $i$-th track ($1 \le i \le n$) consists of $a_i$ equal-length sections.

Given an integer $u$ ($1 \le u \le 10^9$), completing each section increases Isaac's ability by a specific value, described as follows:

- Completing the $1$-st section increases Isaac's ability by $u$.
- Completing the $2$-nd section increases Isaac's ability by $u-1$.
- Completing the $3$-rd section increases Isaac's ability by $u-2$.
- $\ldots$
- Completing the $k$-th section ($k \ge 1$) increases Isaac's ability by $u+1-k$. The value $u+1-k$ can be negative, meaning completing additional sections can decrease Isaac's ability.

You are also given an integer $l$. You must choose an integer $r$ such that $l \le r \le n$ and Isaac completes **all** sections of tracks $l, l+1, \dots, r$ (i.e., a total of $\sum_{i=l}^r a_i$ sections).

Answer the following question: What is the best $r$ you can choose to maximize Isaac's ability increase?

If there are multiple $r$ that maximize Isaac's ability increase, choose the **smallest** $r$.

To increase the difficulty, you need to answer $q$ queries for different values of $l$ and $u$.

### Solution
<span style="color:#92d050">Binary Search/Ternary Search</span>

Ternary search template problem

Since the gain for this problem is: when $\text{pre[r]-pre[l-1]}\leq u(+)>u(-)$, the gain curve first rises then falls. Just find the $r$ corresponding to the highest point.
```cpp
#define int long long
void solve() {
    int n; cin >> n; vector<int> a(n + 1), pre(n + 1); for (int i = 1; i <= n; i++) cin >> a[i];
    for (int i = 1; i <= n; i++) pre[i] = pre[i - 1] + a[i];
    int q; cin >> q;
    auto f = [&](int l, int r, int u) {// sum of first n terms of arithmetic progression u, u-1, u-2... u+1-k
        return (u + u + 1 - pre[r] + pre[l - 1]) * (pre[r] - pre[l - 1]) / 2;
    };
    while (q--) {
        int L, u; cin >> L >> u;
        int l = L, r = n;
        while (l < r) {
            int lmid = l + (r - l) / 3;
            int rmid = r - (r - l) / 3;
            if (f(L, lmid, u) < f(L, rmid, u)) l = lmid + 1;
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
Rudolf and Bernard decided to play a game with their friends. $n$ people stand in a circle and start throwing a ball to each other. They are numbered from $1$ to $n$ in clockwise order.

Let's call a transition the movement of a ball from one person to their neighbor. The transition can be made clockwise or counterclockwise.

Initially, the ball is with the player number $x$ (players are numbered clockwise). At the $i$-th step, the person in possession of the ball throws it at a distance of $r_i$ ($1 \le r_i \le n - 1$) either clockwise or counterclockwise. For example, if there are $7$ players, and the $2$-nd player in possession throws the ball a distance of $5$, then the ball will be caught by either the $7$-th player (throwing clockwise) or the $4$-th player (throwing counterclockwise). An illustration of this example is shown below.

Due to rain, the game was interrupted after $m$ throws. When the rain stopped, everyone gathered again to continue the game. However, no one remembered who had the ball. As a result, Bernard remembered the distance and the **direction (clockwise or counterclockwise)** for each of the $m$ throws.

Rudolf asks you to help him and, based on Bernard's information, calculate the number of players who could have the ball after $m$ throws.

### Solution
<span style="color:#92d050">DP/Thinking</span>

Although this problem didn't use dp, DP needs focused practice!

Jiangly's approach for this problem is great: update the reachable positions in each step into a `d` array, then assign all reachable positions from the `d` array to the `dp` array. This way, the `dp` array holds all reachable final positions.
```cpp
void solve() {
    int n, m, x; cin >> n >> m >> x; x--;
    vector<int> dp(n); dp[x] = 1;
    for (int i = 0; i < m; i++) {
        int d; char ch; cin >> d >> ch;
        vector<int> g(n);
        for (int j = 0; j < n; j++) {
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
    for (int i = 0; i < n; i++) {
        if (dp[i]) cout << i + 1 << ' ';
    }
    cout << '\n';
}
```

## CF 1941 Div.3 F - Rudolf and Imbalance
Given arrays $a, d, f$ of lengths $n, m, k$ respectively. $a$ is sorted in ascending order. You can take one number from array $d$ and one from array $f$ and insert them into array $a$, then sort it in ascending order.

Find the minimum possible value of the maximum difference between consecutive elements $\max(a_{i}-a_{i-1})$ after this operation.

### Solution
<span style="color:#92d050">Binary Search + Two Pointers</span>

Since only one operation is allowed, it must target the position with the largest gap $a_{i}-a_{i-1}$. The second largest gap will not be operated on, so the answer after the operation must be at least the original second largest $(a_{i}-a_{i-1})$.

First, find the index $i$ corresponding to $\max(a_{i}-a_{i-1})$ in the sequence.

For $\max(a_{i}-a_{i-1})$, we always want to "neutralize" this maximum gap. The best case is that the chosen numbers from arrays $d$ and $f$ sum to exactly $\lfloor{\frac{{a_{i-1}+a_{i}}}{2}}\rfloor$. Even if we can't achieve that exact value, we should get as close as possible.

Find the maximum and second maximum values as backup, then perform binary search. The binary search will yield two values $l, r$ at the exit; compare them and take the minimum.

```cpp
#define int long long
void solve() {
    int n, m, k; cin >> n >> m >> k;
    vector<int> a(n), b(m), c(k);
    for (int i = 0; i < n; i++) cin >> a[i];
    for (int i = 0; i < m; i++) cin >> b[i];
    for (int i = 0; i < k; i++) cin >> c[i];
    sort(b.begin(), b.end());
    sort(c.begin(), c.end());
    int ma = 0, p = -1;
    for (int i = 1; i < n; i++) {
        if (a[i] - a[i - 1] > ma) {
            ma = a[i] - a[i - 1];
            p = i;
        }
    }
    int ans = ma;
    ma = 0;
    for (int i = 1; i < n; i++) {
        if (i != p && a[i] - a[i - 1] > ma) {
            ma = a[i] - a[i - 1];
        }
    }

    int t = (a[p] + a[p - 1]) >> 1;
    for (int i = 0; i < m; i++) {
        int l = 0, r = k - 1;
        while (l + 1 < r) {
            int mid = (l + r) >> 1;
            if (b[i] + c[mid] <= t) {
                l = mid;
            } else {
                r = mid;
            }
        }
        ans = min(ans, max({ma, abs(b[i] + c[l] - a[p - 1]), abs(b[i] + c[l] - a[p])}));
        ans = min(ans, max({ma, abs(b[i] + c[r] - a[p - 1]), abs(b[i] + c[r] - a[p])}));
    }
    cout << ans << '\n';
}
```

## CF 1968 Div.3 F - Equal XOR Segments
An array is called interesting if it can be divided into $x_1,\dots,x_m$ arrays.

Specifically, it can be divided into $k > 1$ parts, such that the [bitwise XOR](http://tiny.cc/xor_wiki_eng) of the values in each part is equal.

More formally, you must split array $x$ into $k$ contiguous segments, and each element of $x$ must belong to exactly $1$ segment. Let $y_1,\dots,y_k$ be the XOR of the elements in each part. Then we must have $y_1=y_2=\dots=y_k$.

For example, if $x = [1, 1, 2, 3, 0]$, you can split it as follows: $[\color{blue}1], [\color{green}1], [\color{red}2, \color{red}3, \color{red}0]$. Indeed, $\color{blue}1=\color{green}1=\color{red}2 \oplus \color{red}3\oplus \color{red}0$.

You are given an array $a_1,\dots,a_n$. Your task is to answer $q$ queries:

- For a fixed $l$, $r$, determine if the subarray $a_l,a_{l+1},\dots,a_r$ is interesting.

### Solution
Bitwise operations

Properties of $\oplus$: If there is an odd number of intervals with equal XOR sum, then the XOR of all of them equals the XOR of each individual interval.

In this problem, if there are three or more intervals with equal XOR sum, these three intervals can be merged into one interval, and the XOR sum will be the same as before.

Since the problem requires $k>1$, the range for $k$ is only $k=2 \text{ or } k=3$. If $k>3$, it can always be reduced to $k\leq 3$ using the method above.

Let $s_{i}$ be the prefix XOR sum.

When $k=2$, the interval can be divided into two parts with equal XOR sum $[l,m],[m+1,r]$. Then $s_{m}\oplus s_{l-1}=s_{m+1}\oplus s_{r} \implies s_{l-1}=s_{r}$.

When $k=3$, divide the interval into $[l,t],[t+1,m],[m+1,r]$. Then $s_{t}\oplus s_{l-1}=s_{m}\oplus s_{t}$ and $s_{m}\oplus s_{t}=s_{r}\oplus s_{m}$.

$\implies$ $s_{m}=s_{l-1}$ and $s_{r}=s_{t}$ $(t<m)$

To satisfy this condition, we need $t$ as small as possible and $m$ as large as possible, **provided the values are equal**. Let $t$ be the smallest index $\geq l$, and $m$ be the largest index $< r$.

> I got this reversed here: `lower_bound` gives the first element >= value, `upper_bound` gives the first element > value.

```cpp
void solve() {
    int n, q; cin >> n >> q; vector<int> a(n + 1), s(n + 1);
    map<int, vector<int>> mp;
    mp[0].push_back(0);
    for (int i = 1; i <= n; i++) {
        cin >> a[i]; s[i] = s[i - 1] ^ a[i];
        mp[s[i]].push_back(i);
    }

    while (q--) {
        int l, r; cin >> l >> r;
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
Complete the positions where $a_{i}=-1$, so that for every integer $i$ from $1$ to $n - 1$, either $a_i = \left\lfloor\frac{a_{i + 1}}{2}\right\rfloor$ or $a_{i + 1} = \left\lfloor\frac{a_i}{2}\right\rfloor$ holds. If there is no solution, output $-1$.

This problem can be considered a large simulation or a thinking problem.

### jiangly's Approach:

First, fill in the $-1$s at both ends. For the middle blocks, each block is defined by indices $i, j$ representing that the interval $[i+1, j-1]$ is all $-1$. Fill from both ends towards the middle. If upon reaching the middle, two adjacent numbers don't satisfy the condition, output $-1$. Otherwise, continue to the next block.
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

### Official Editorial:
Consider each transformation as a move on a complete binary tree. This becomes a shortest path problem.

The path from $x$ to $y$ is $x \to \text{LCA}(x,y) \to y$. Let the number of $-1$s between them be $m$. If the number of nodes passed on the path is $l$, then if $l>m$ or the parity of $l$ and $m$ is different, there's no solution. Otherwise, first fill the initial empty spaces, then cycle between the two numbers.

Code:
Similarly, fill the beginning and end first, then handle each block separately.

First, calculate the path between the two ends of this block. Process according to the idea.

The `path` function performs operations on a full binary tree:
```cpp
auto path = [](int x, int y)->vector<int> {
    vector<int> l, r;
    while (__lg(x) > __lg(y)) {
        l.push_back(x); x >>= 1;
    }
    while (__lg(y) > __lg(x)) {
        r.push_back(y); y >>= 1;
    }
    while (x != y) {
        l.push_back(x);
        r.push_back(y);
        x >>= 1; y >>= 1;
    }
    l.push_back(x);
    reverse(r.begin(), r.end());
    for (auto x : r) l.push_back(x);
    return l;
};
```

```cpp
void solve() {
    int n; cin >> n;
    vector<int> a(n + 1), v;
    int s = 0, e = 0;
    for (int i = 1; i <= n; i++) {
        cin >> a[i];
        if (a[i] != -1) {
            if (!s) s = i;
            e = i;
            v.push_back(i);
        }
    }
    if (count(a.begin(), a.end(), -1) == n) {
        for (int i = 1; i <= n; i++) {
            cout << i % 2 + 1 << " \n"[i == n];
        }
        return;
    }
    for (int i = s - 1; i >= 1; i--) {
        a[i] = (a[i + 1] == 1) ? 2 : a[i + 1] / 2;
    }
    for (int i = e + 1; i <= n; i++) {
        a[i] = (a[i - 1] == 1) ? 2 : a[i - 1] / 2;
    }

    for (int i = 1; i < v.size(); i++) {
        int l = v[i - 1], r = v[i];
        vector<int> p = path(a[l], a[r]);
        if ((p.size() & 1) != ((r - l + 1) & 1) || r - l + 1 < p.size()) {
            cout << "-1\n"; return;
        }
        for (int j = 0; j < p.size(); j++) {
            a[l + j] = p[j];
        }
        for (int j = l + p.size(), o = 1; j <= r; j++, o ^= 1) {
            a[j] = (o ? a[j - 1] * 2 : a[j - 1] / 2);
        }
    }

    for (int i = 1; i <= n; i++) {
        cout << a[i] << " \n"[i == n];
    }
}
```

## CF 1981 Div.2 D - Turtle and Multiplication
Given an integer $n$ ($2\leq n\leq 10^6$), construct a sequence of integers $a_1, a_2, \ldots, a_n$ satisfying the following conditions:

- For all $1 \le i \le n$, $1 \le a_i \le 3 \cdot 10^5$.
- For all $1 \le i < j \le n - 1$, $a_i \cdot a_{i + 1} \ne a_j \cdot a_{j + 1}$.

Among all such sequences, Turtle asks for the one with the **minimum** number of **distinct** elements.

### Solution
Eulerian Path / Hierholzer's Algorithm

> Need to learn Eulerian graph相关知识, Note: This part is relatively niche.

Eulerian graph problem

To make $a_{i}\cdot a_{i+1}\neq a_{j}\cdot a_{j+1}$, simply take all $a_{i}$ as primes. This way, we just need $(a_{i},a_{i+1})$ and $(a_{j},a_{j+1})$ to be different (i.e., traversing distinct edges).

Treat $(a_{i},a_{i+1})$ as an edge in a graph. The problem then becomes finding an undirected complete graph (plus self-loops $(a_{i}=a_{i+1})$) with the minimum number of vertices, such that this graph has a path traversing $(n-1)$ edges without repeating edges.

If the number of vertices in the complete graph is $m$. (Here the number of vertices is determined, need to maximize the number of edges)

- If $m$ is odd, then the degree of each vertex is even, so an Eulerian path definitely exists, and the path length is $\frac{m(m+1)}{2}$.

- If $m$ is even, then the degree of each vertex is odd. At this point, we need to delete some edges to ensure at least an Eulerian trail exists. At most, only two vertices can have odd degree, so at least $\frac{m}{2}-1$ edges must be deleted. The path length becomes $\frac{m(m+1)}{2} - \frac{m}{2} + 1 = \frac{m^2}{2} + 1$.

When $n=10^6$, $m\approx1415$, and the $m$-th prime is $11807 \leq 3\times10^5$, satisfying the requirement.

Thus, we only need to determine the minimum $m$, and then run an Eulerian trail.

For the minimum $m$, satisfying:
$$
\begin{cases}
 m \equiv 1 \pmod{2}, \quad \frac{(m-1)m}{2} < n-1 \le \frac{m(m+1)}{2}, \\
 m \equiv 0 \pmod{2}, \quad \frac{(m-1)^2}{2} + 1 < n-1 \le \frac{m^2}{2} + 1.
\end{cases}
$$

Code:
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

A sieve is needed here;
Template organization

## CF 1937 Div.2 D - Pinball
There is a one-dimensional grid of length $n$. The $i$-th cell of the grid contains a character $s_i$, which is either '<' or '>'.

When a pinball is placed on one of the cells, it moves according to the following rules:

- If the pinball is on the $i$-th cell and $s_i$ is '<', the pinball moves one cell to the left in the next second. If $s_i$ is '>', it moves one cell to the right.
- After the pinball moves, the character $s_i$ is reversed (i.e., if $s_i$ was originally '<', it becomes '>', and vice versa).
- The pinball stops moving when it leaves the grid: either from the left boundary or the right boundary.

You need to answer $n$ **independent** queries. In the $i$-th query, the pinball is placed on the $i$-th cell. Note that we always place a pinball on the initial grid.

For each query, calculate how many seconds it takes for the pinball to leave the grid. It can be proven that the pinball will always leave the grid in a finite number of steps.

### Solution

Original: [Problem - E - Codeforces](https://mirror.codeforces.com/contest/733/problem/E)

[Codeforces Round 930 (Div. 2) A\~D - Zhihu](https://zhuanlan.zhihu.com/p/684942870)

Need to record the indices of `>` and prefix sums of counts, as well as indices of `<` and suffix sums of counts.

Only the `>` on the left and `<` on the right can make `s[i]` reverse; if not, it goes out directly.

When `s[i]=='>'`:

- If $cnt_{1}[i-1]=cnt_{2}[i+1]$, then the answer is $i+2\times(suf[i+1]-pre[i-1])$.
- If $cnt_{1}[i-1]>cnt_{2}[i+1]$, then the pinball at position $i$ will definitely exit from the right. The path is fully traversed only when the left count exceeds the right count by 1. In other cases, some paths are not traversed, so the excess part needs to be subtracted. When fully traversed, the answer is $i+n+1+2\times(suf[i+1]-pre[i-1])$. When there is an excess part, the answer is $i+n+1+2\times(suf[i+1]-(pre[i-1]-pre[pos_{1}[cnt_{1}[i-1]-cnt_{2}[i+1]-2]]))$.
- If $cnt_{1}[i-1]<cnt_{2}[i+1]$, then the pinball at position $i$ will definitely exit from the left. Some excess parts on the right are not traversed at all, so they need to be subtracted. The answer is $i+2\times(suf[i+1]-(pre[i-1]-pre[pos_{1}[cnt_{1}[i-1]-cnt_{2}[i+1]-1]]))$.

When `s[i]=='<'`, the analysis is analogous.

```cpp
#define int long long
void solve() {
    int n; cin >> n; string s; cin >> s; s = ' ' + s;
    vector<int> pre(n + 2), suf(n + 2), pos1, pos2, cnt1(n + 2), cnt2(n + 2), ans(n + 1);
    for (int i = 1; i <= n; i++) {
        if (s[i] == '>') {
            pre[i] = i; cnt1[i] = 1;
        } else {
            suf[i] = i; cnt2[i] = 1;
        }
    }
    for (int i = 1; i <= n; i++) {
        cnt1[i] += cnt1[i - 1];
        pre[i] += pre[i - 1];
        if (s[i] == '>') pos1.push_back(i);
    }
    for (int i = n; i >= 1; i--) {
        cnt2[i] += cnt2[i + 1];
        suf[i] += suf[i + 1];
        if (s[i] == '<') pos2.push_back(i);
    }
    for (int i = 1; i <= n; i++) {
        if (s[i] == '<') {
            if (cnt1[i - 1] > cnt2[i + 1]) { // exits to the right
                int num2 = suf[i + 1], num1 = 0;
                if (cnt1[i - 1] == cnt2[i + 1] + 1) {
                    num1 = pre[i - 1];
                } else {
                    num1 = pre[i - 1] - pre[pos1[cnt1[i - 1] - cnt2[i + 1] - 2]];
                }
                ans[i] = i + n + 1 + 2 * (num2 - num1);
            } else if (cnt1[i - 1] < cnt2[i + 1]) { // exits to the left
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
    for (int i = 1; i <= n; i++) {
        cout << ans[i] << " \n"[i == n];
    }
}
```
