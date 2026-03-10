---
title: "Nowcoder Solutions: Winter Contests, Weeklies, and Multi-School"
description: December 2023 to August 2024, primarily based on original solution records, covering bookmarked winter contests, weekly contests, and multi-school problems.
publishDate: 2026-03-06
tags:
  - Competitive Programming
  - Solution Collection
  - Nowcoder
  - DP
  - Graph Theory
  - Construction
language: English
heroImageSrc: ../../../pic/eugene-golovesov-dxp8NcWrqGM-unsplash.jpg
heroImageColor: " #9cbfe7 "
---
> [!note] Description  
> This document is only for integration, without changing the main content of each original problem; the main purpose is to consolidate the problem solutions scattered across different contest notes into one, and handle image and link compatibility along the way.  

## Scope of Inclusion  

- `Winter Break 2 - I/J`  
- `Winter Break 2 - D`  
- `Winter Break 3 - L/M`  
- `Winter Break 3 - G/H`  
- `Winter Break 5 - G/H`  
- `Nowcoder Multi-University Training 4 - H`  
- `Nowcoder Multi-University Training 4 - C`  
- `Nowcoder Weekly Contest 60 - D`  
- `Nowcoder Weekly Contest 60 - E`  
- `Nowcoder Weekly Contest 60 - F`  
- `Nowcoder Weekly Contest 51 - D`  
- `Nowcoder Weekly Contest 51 - E`  
- `Nowcoder Weekly Contest 51 - F`  
- `Nowcoder Weekly Contest 31 - E`  
- `Nowcoder Weekly Contest 52 - C`  
- `Nowcoder Weekly Contest 52 - E`  
- `Nowcoder Weekly Contest 52 - F`  
- `Nowcoder Weekly Contest 47 - D`  
- `Nowcoder Weekly Contest 47 - E`  
- `Nowcoder Weekly Contest 47 - F`  
- `Nowcoder Weekly Contest 35 - F/G`  
- `Nowcoder Weekly Contest 55 - E`  

## 2024 Nowcoder Winter Break Algorithm Basic Training Camp 2 - I/J Tokitsukaze and Short Path (plus)(minus)  
The only difference between plus and minus is the way the edge weight is calculated.  

Tokitsukaze has a complete graph G with n vertices, numbered 1 to n. The value of the vertex numbered i is $a_i$.  

A complete graph refers to a graph where there is exactly one undirected edge between every pair of vertices. For the undirected edge between vertex u and vertex v, the edge weight is calculated as follows:  

$if(u=v) w_{u,v}=0, otherwise, w_{u,v}=\mid a_{u}+a_{v}\mid\pm\mid a_{u}-a_{v}\mid$  

Define $dist (i, j$) as the shortest path distance from vertex $i$ to vertex $j$. Find $\sum\limits_{i=1}^ n\sum\limits_{j=1}^ ndist(i,j)$  

>Regarding the definition of the shortest path:  
>  
>Define a path from s to t as a sequence of several end-to-end edges such that the first edge starts at s and the last edge ends at t. Specifically, when s=t, the sequence can be empty.  
>  
>Define the length of a path from s to t as the sum of the edge weights on that path.  
>  
>Define the shortest path from s to t as the minimum length among all paths from s to t.  

At first glance, this seems like a graph theory problem, but it definitely won't be solved using graph theory methods.  

### Solution  

#### I (plus)  
According to the problem statement:  

- The shortest path must go through directly connected nodes; otherwise, the result will definitely be larger.  
- If `a[u]>a[v]`, then $w_{i,j}+=2\times a[u]$. Otherwise, $w_{i,j}+=2\times a[v]$.  

If the array is sorted, then `a[i]<=a[j]` always holds, and we only need to add `2*a[j]`.  

The form of the answer is:  
```python
for i (0, n - 1)
    for j (i + 1, n - 1)
        ans += 2 * a[j]
ans *= 2
```

- $1,2,3,4,\dots,n-1\to pre[n-1]-pre[0]$ 
- $2,3,4,\dots,n-1\to pre[n-1]-pre[1]$
- $3,4,\dots,n-1\to pre[n-1]-pre[2]$
- $n-1\to pre[n-1]-pre[n-2]$

```python
cnt = pre[n - 1]
for i (0, n - 2)
    ans += cnt - pre[i]
```

```cpp 
for(int i = 2, j = 1; i <= n; i ++, j ++)
    ans += w[i] * 2 * j;
```

```cpp 
void solve() {
    int n;
    cin >> n;
    vector<ll> a(n), pre(n);
    ll r1 = 0;
    for (int i = 0; i < n; i++) {
        cin >> a[i];
        r1 += a[i];
    }
    sort(a.begin(), a.end());
    pre[0] = a[0];
    for (int i = 1;i < n;i++) {
        pre[i] = pre[i - 1] + a[i];
    }

    ll ans = 0;
    for (int i = 1;i < n;i++) {
        ans += r1 - pre[i - 1];
    }
    cout << ans * 4 << '\n';
}
```

#### J (minus)  
The main problem is to find the shortest path. There are only two possibilities: `a[i-1] * 2 || 4 * a[0]`  

Brute force approach:  
```cpp
ll ans = 2 * a[0] * (n - 1);

for (int i = 1;i < n;i++) {
    for (int j = i + 1;j < n;j++) {
        ans += min(2 * a[i], 4 * a[0]);
    }
}
cout << ans * 2 << '\n';
```

Correct solution:  
```cpp
void solve() {
    int n;
    cin >> n;
    vector<ll> a(n);
    for (int i = 0;i < n;i++)
        cin >> a[i];

    sort(a.begin(), a.end());

    ll ans = 2 * a[0] * (n - 1);

    for (int i = 1;i < n;i++) {
        ans += min(2 * a[i], 4 * a[0]) * (n - i - 1);
    }
    cout << ans * 2 << '\n';
}
```

## 2024 Nowcoder Winter Break Algorithm Basic Training Camp 2 - D Tokitsukaze and Slash Draw  
Tokitsukaze's deck has $n(1\leq n\leq 5000)$ cards. She already knows that the card "One Shot Kill! Iai Draw" is the $k$-th card from the bottom of the deck. She selects $m(1\leq m\leq 1000)$ types of cards that can adjust the order of the cards in the deck. The effect of the $i$-th type of card is: take the top $a_i$ cards from the deck and put them at the bottom in order. This effect can be understood as: first take out one card, then put this card at the bottom, repeat this action $a_i$ times. To activate the effect of the $i$-th type of card, you need to pay a $\text{cost}$ of $b_i$.  

Tokitsukaze can perform operations such that each type of card can be activated an unlimited number of times. Can she make the card "One Shot Kill! Iai Draw" appear at the top of the deck? If yes, output the minimum $\text{cost}$ required. If not, output `-1`.  

### Solution  
`DP` | `dijkstra` (Congruence Shortest Path Model)  

$dp[x]=\min(dp[x],dp[(x+a_{i})\%n]+b_{i})$  

[D\_Bilibili\_bilibili](https://www.bilibili.com/video/BV1Hm411Q7Ta?p=5&vd_source=cb670d82714ee9baee22c33ef083884d)  

$mn_{i}$ represents, under the condition of `mod n`, the minimum $\text{cost}$ to move the target card up by $i$ steps.  

(Didn't quite understand $\dots$)  
```cpp 
const int maxn = 3e5 + 10;
int a[maxn], b[maxn];
ll mn[maxn], dp[5010][5010];
void solve() {
    int n, m, k;
    cin >> n >> m >> k;

    for (int i = 1; i <= n; i++) {
        mn[i] = 1e18;
    }

    for (int i = 1; i <= m; i++) {
        cin >> a[i] >> b[i];
        for (int j = 1; j <= n; j++) {
            int nxt = j * a[i] % n; // Indicates that multiples of a[i] can be flipped
            if (!nxt) nxt = n; // Can be commented out?
            mn[nxt] = min(mn[nxt], 1ll * j * b[i]); // Represents the cost when it's a multiple of a[i]
        }
    }

    for (int i = 1; i <= n; i++) {
        if (i == k) {
            dp[0][i] = 0;
        } else {
            dp[0][i] = 1e18;
        }
    }

    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) {
            dp[i][j] = dp[i - 1][j];
        }

        for (int j = 1; j <= n; j++) {
            int nxt = (j + i) % n;
            if (!nxt) nxt = n;
            dp[i][nxt] = min(dp[i][nxt], dp[i - 1][j] + mn[i]);
        }
    }

    if (dp[n][n] == 1e18) {
        cout << -1 << '\n';
    } else {
        cout << dp[n][n] << '\n';
    }
}
```

[【Continuously Updated】2024 Nowcoder Winter Break Algorithm Basic Training Camp 2 Problem Solutions | JorbanS - Zhihu](https://zhuanlan.zhihu.com/p/681575077)  
```cpp 
 int n, m, k, a[N], b[N];
 ll f[N];
 
 ll solve() {
     cin >> n >> m >> k;
     for (int i = 0; i < m; i ++) cin >> a[i] >> b[i];
     memset(f, -1, sizeof f);
     f[k - 1] = 0;
     queue<int> q;
     q.push(k - 1);
     while (!q.empty()) {
         auto u = q.front();
         q.pop();
         for (int i = 0; i < m; i ++) {
             int v = (u + a[i]) % n;
             if (f[v] != -1 && f[v] <= f[u] + b[i]) continue;
             f[v] = f[u] + b[i];
             q.push(v);
         }
     }
     return f[n - 1];
 }
```

[D\_Bilibili\_bilibili](https://www.bilibili.com/video/BV1Hm411Q7Ta?p=5&vd_source=cb670d82714ee9baee22c33ef083884d)  

$dp[x]=\min(dp[x],dp[(x+a_{i})\%n]+b_{i})$  

```cpp
void solve() {
    int n, m, k;
    cin >> n >> m >> k;
    vector<ll> a(m+1), b(m+1), d(n+1, INTMAX_MAX);
    vector<bool> vis(n+1, 0);
    for (int i = 1;i <= m;i++)cin >> a[i] >> b[i];
    priority_queue<pair<ll, ll>> q;
    q.push({ 0,0 });
    d[0] = 0;
    while (q.size()) {
        ll u = q.top().second; q.pop();
        if (vis[u])continue;
        vis[u] = true;
        for (int i = 1;i <= m;i++) {
            ll v = (u + a[i]) % n;
            if (d[v] > d[u] + b[i]) {
                d[v] = d[u] + b[i];
                if (!vis[v])q.push({ -d[v], v });
            }
        }
    }
    if (d[n - k] == INTMAX_MAX)d[n - k] = -1;
    cout << d[n - k] << '\n';
}
```

## 2024 Nowcoder Winter Break Algorithm Basic Training Camp 3 - L/M Zhinai's 36 Multiples (easy)(normal)  
Define the operation $f$ as concatenating two positive integers literally from left to right.  

Zhinai now has a positive integer array $a$ of size $N$, with the $i$-th element being $a_i$. He wants to select two positive integers and concatenate them (front to back) so that the concatenated number is a multiple of $36$. How many feasible schemes does Zhinai have?  

>She wants to know how many ordered pairs $(i, j)(i≠j)$ satisfy that $f (a_i, a_j)$ is a multiple of $36$.  

- `easy`: $1\leq N\leq 1000,1\leq a_{i}\leq 10$  
- `normal`: $1\leq N\leq 10^5,1\leq a_{i}\leq 10^{18}$  

###  $\text{easy:}$  
Method 1: Brute force enumeration  

`stoi`: i.e., `string to int`  
```cpp 
void solve() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0;i < n;i++) {
        cin >> a[i];
    }
    int cnt = 0;
    for (int i = 0;i < n;i++) {
        for (int j = 0;j < n;j++) {
            if (i != j) {
                string s = to_string(a[i]) + to_string(a[j]);
                int num = stoi(s);
                if (num % 36 == 0) {
                    cnt++;
                }
            }
        }
    }
    cout << cnt << '\n';
}
```

Method 2: Just count 36, 72, 108.  
```cpp 
void solve() {
    int n, x;
    cin >> n;
    vector<int> a(11);
    for (int i = 1;i <= n;++i) {
        cin >> x;
        a[x]++;
    }
    cout << a[3] * a[6] + a[7] * a[2] + a[10] * a[8] << '\n';
}
```

###  $\text{normal:}$  
Method 1: Consider that 36 is actually a multiple of 4 and a multiple of 9.  

- A multiple of 4 only needs the last two digits to be divisible by 4.  
- A multiple of 9 only needs the sum of all digits to be divisible by 9.  

If we continue with this idea, it essentially involves counting whether "it can form a multiple of 4" and "the digit sum can form a multiple of 9" separately, and then doing case analysis; however, for this problem, the bucket counting method that follows is more straightforward and suitable for code implementation.  

Method 2: Based on the property of modulus, the result of summing two numbers modulo 36 is actually the sum of each part modulo 36, then modulo 36 again.  

That is, $(a+b)\%36=(a\%36+b\%36)\%36$.  

So we can directly use buckets to count the remainder of each number modulo 36. Also, 36 has a special property: $10^k\ \%36=28(k\geq 2)$, so we only need to know if it's a 10-digit number.  

$f(j,i)=j\times10^k+i$ (where $k$ is the number of digits in $i$)  

If $k\geq 2(i\geq 10), j\times10^k\%36=j\times28$  
If $k=1(i<10), j\times10^k\%36=j\times10$  

$f(j,i)$ is `(j * (i < 10LL ? 10LL : 28LL) + i)`. Here, $j$ is the result of `a[i]` $\text{mod 36}$, $i$ is `a[i]`, and $sum[i]$ represents the count of numbers where $a[i]\%36$ yields the same result (proving that these numbers differ by multiples of 36, which does not affect the result; they cancel out in $f(j,i)\%36$, allowing them to be added together to reduce complexity).  

For each element in `a[i]`, iterate through $f(j, a[i])$. If it is divisible by 36, add it.  

```cpp 
void solve() {
    int n;
    ll ans = 0;
    cin >> n;
    vector<ll> a(n);
    for (int i = 0; i < n; ++i) {
        cin >> a[i];
    }

    auto calc = [&]() {
        ll ans = 0;
        vector<ll> sum(36, 0);
        for (auto i : a) {
            for (int j = 0; j < 36; ++j) {
                if ((j * (i < 10LL ? 10LL : 28LL) + i) % 36 == 0) {
                    ans += sum[j];
                }
            }
            sum[i % 36]++;
        }
        return ans;
    };

    ans += calc();
    reverse(a.begin(), a.end());
    ans += calc();
    cout << ans << '\n';
}
```

>I didn't quite understand the code. My main idea was to preprocess the $sum[i]$ array, and then in a double loop, ensure that the indices corresponding to the double loop are not the same (i.e., cannot concatenate with itself), so there would be no need to reverse the array and do it again.  
>
```cpp 
void solve() {
    int n;
    ll ans = 0;
    cin >> n;
    vector<ll> a(n);
    for (int i = 0; i < n; ++i) {
        cin >> a[i];
    }

    vector<ll> sum(36, 0);
    for (auto i : a) {
        sum[i % 36]++;
    }
    for (auto i : a) {
        --sum[i % 36];
        for (int j = 0; j < 36; ++j) {
            if ((j * (i < 10LL ? 10LL : 28LL) + i) % 36 == 0) {
                ans += sum[j];
            }
        }
        ++sum[i % 36];
    }

    cout << ans << '\n';
}
```

## 2024 Nowcoder Winter Break Algorithm Basic Training Camp 3 - G/H Zhinai's Comparison Function (easy)(normal)  
$cmp(x,y)$:  

-  $x<y, cmp (x, y)=1$ 
- $x\geq y, cmp(x,y)=0$  

There are integer variables $a_{1}, a_{2}, a_{3}$. Given $N$ sets of $cmp(a_{x}, a_{y})$ values, determine if there is a contradiction.  

- `easy`: $1\leq N\leq 2$  
- `normal`: $1\leq N\leq 50$  

### $\text{easy:}$  

```cpp
void solve() {
    int n; cin >> n;
    bool ok = true;
    int xx, yy, zz, x, y, z;
    for (int i = 1;i <= n;i++) {
        cin >> x >> y >> z;
        if (i == 1) {
            xx = x, yy = y, zz = z;
        }
        if (x == y && z) {
            ok = false;
        }
    }
    if (n == 2) {
        if (xx == x && yy == y && zz != z) {
            ok = false;
        }
        if (xx == y && yy == x && zz == z) {
            if (z == 1) {
                ok = false;
            }
        }
    }
    if (ok) {
        cout << "Yes\n";
    } else {
        cout << "No\n";
    }
}
```

### $\text{normal:}$  
Enumerate $a_{1}, a_{2}, a_{3} (1, 2, 3)$. If there exists a case where $z=1 \&\& a[x] \geq a[y] \mid \mid z=0 \&\& a[x] < a[y]$, then a contradiction occurs.  

If a condition that satisfies the requirements is found, it exists.  

The code feels very simple, it's just that I didn't think of it myself.  
```cpp
int i, j, k, n, m, t, a[1005];
vector<tuple<int, int, int> > v;
bool fuck() {
    for (auto [x, y, w] : v) {
        if (w == 1) {
            if (a[x] < a[y])continue;
            else return 0;
        } else {
            if (a[x] >= a[y])continue;
            else return 0;
        }
    }
    return 1;
}
void solve() {
    int n;
    cin >> n;
    while (n--) {
        cin >> i >> j >> k;
        v.push_back({ i,j,k });
    }
    int res = 0;
    for (i = 1;i <= 3;i++)
        for (j = 1;j <= 3;j++)
            for (k = 1;k <= 3;k++) {
                a[1] = i; a[2] = j; a[3] = k;
                int ans = 0;
                res |= fuck();
            }
    if (res)cout << "Yes\n";
    else cout << "No\n";
    v.clear();
}
```

## 2024 Nowcoder Winter Break Algorithm Basic Training Camp 5 - G/H sakiko's Permutation Construction  
sakiko wants to construct a permutation $p$ of length $n$, such that for every $p_i+i (1≤i≤n)(1\leq n\leq 10^6)$ is a prime number.  

### Solution  
<span style="color:#92d050">Network Flow / Pattern Finding</span>  

>Found: If $n=4:$ $p:4,3,2,1$, then $p_{i}+i$ is $5,5,5,5$, each term being $n+1$  

For $n$, if $\text{isPrime(n+1)}$, then $p:\{n,n-1,\dots,2,1\}$ $p_{i}+i:\{n+1(n)\}$  

For $n$, if $\text{isPrime(n+2)}$, then $p:\{1,n,n-1,\dots,3,2\}$ $p_{i}+i:\{2,n+2(n-1)\}$  

>Found: If $n=8:$ $11-3=8$ $p:\{2,1,8,7,6,5,4,3\}$ $p_{i}+i=\{3,3,11(6)\}$  
>  
>If $n=7:11-(5-1)=7 \ p:\{1,3,2,7,6,5,4\}$ $p_{i}+i:\{2,5,5,11(4)\}$  

For even $n:$ $(n+m)-(m)=n$ If we can ensure that $(n+m)(m)$ are both prime, then we can construct $p:\{m-1,m-2,\dots 1,n,n-1,\dots,m\}$ $p_{i}+i:\{m(m-1),(n+m)(n-m+1)\}$  

For odd $n:$ $(n+m)-(m-1)=n$ If we can ensure that $(n+m)(m)$ are both prime, then we can construct $p:\{1,m-2,m-3,\dots,2,n,n-1,\dots n-m+1\}$ $p_{i}+i:\{2,(m)(m-2),(n+m)(n-m+1)\}$  

```cpp
void solve() {
    int n;cin >> n;
    auto check = [&](int x) {
        for (int i = 2;i * i <= x;i++)
            if (x % i == 0)
                return 0;
        return 1;
    };
    int a = 1;
    if (n % 2) {
        cout << "1 ";a++;
    }
    for (int i = a;i <= n;i++) {
        if (check(i + a) && check(i + 1 + n)) {
            for (int j = i;j >= a;j--)
                cout << j << " ";
            for (int j = n;j > i;j--)
                cout << j << " ";
            cout << '\n';
            return;
        }
    }
    for (int i = n;i >= 1;i--)cout << i << " \n"[i == 1];
}
```

## 2024 Nowcoder Multi-University Training 4 - H Yet Another Origami Problem  
Fried Chicken hates origami problems! Problems that others can solve easily (like CF 1966 E and HDU 6822), he always fails to solve. However, today Fried Chicken is the problem setter! It's his turn to give the contestants a very difficult origami problem!  

Given an array $\textstyle a$ of length $\textstyle n$, you can perform the following operations any number of times (possibly zero):  

Select an index $\textstyle p$, and then perform one of the following two operations:  

1. For all $\textstyle i$ such that $\textstyle a_i \leq a_p$, let $\textstyle a_i \gets a_i + 2(a_p - a_i)$.  
2. For all $\textstyle i$ such that $\textstyle a_i \geq a_p$, let $\textstyle a_i \gets a_i - 2(a_i - a_p)$.  

Now, you want to minimize the range of the array through these operations. Recall that the range of an array is the difference between the maximum and minimum elements in the array.  

Each operation on two numbers essentially does not change the difference between the two numbers. Each time, operate with the second largest and the largest numbers, each time making the largest number move forward, until finally only two numbers remain. The difference between these two numbers is the answer.  

Directly take the GCD of all the differences of the sorted array.  

As for the proof...  

```cpp
#define int long long
void solve() {
    int n;cin >> n;
    vector<int> a(n + 1), suf(n);
    for (int i = 1;i <= n;i++)cin >> a[i];
    sort(a.begin() + 1, a.end());
    if (n <= 2) {
        if (n == 1) {
            cout << "0\n";return;
        } else {
            cout << abs(a[1] - a[0]) << '\n';return;
        }
    }
    for (int i = 1;i < n;i++)suf[i] = a[i + 1] - a[i];
    int g = suf[1];
    for (int i = 2;i < n;i++) {
        g = __gcd(g, suf[i]);
    }
    cout << g << '\n';
}
```

## 2024 Nowcoder Multi-University Training 4 - C Sort 4  
Given a permutation $\textstyle ^\dagger$ of length $\textstyle n$. In one operation, you can select **no more than 4** elements from the permutation and swap their positions arbitrarily. What is the minimum number of operations required to sort the permutation in ascending order?  

According to the problem statement, we know that in each position that is not yet restored, there must be a cycle.  

That is, in this permutation, there are several cycles, each independent of the others.  

For these cycles, some can be concatenated, some cycles are larger and require multiple operations, and each operation requires 4 moves to restore 3 elements.  

```cpp
void solve() {
    int n;cin >> n;
    vector<int> p(n + 1);
    vector<int> a(n + 1);
    for (int i = 1;i <= n;i++) {
        cin >> a[i];p[a[i]] = i;
    }
    vector<int>vis(n + 1), ans;
    int cnt = 0;

    auto dfs = [&](auto self, int x, int y)->void {
        if (vis[x]) {
            return;
        }
        cnt++;vis[x] = 1;
        self(self, y, p[y]);
        };
    for (int i = 1;i <= n;i++)if (p[i] == i)vis[i] = 1;
    for (int i = 1;i <= n;i++) {
        if (!vis[a[i]]) {
            cnt = 0;
            dfs(dfs, a[i], p[a[i]]);
            ans.push_back(cnt);
        }
    }
    int res = 0;
    int c[4] = {};
    for (auto x : ans) {
        res += x / 3;x %= 3;
        c[x]++;
    }
    cout << c[3] + (c[2] + 1) / 2 + res << '\n';
}
```

## Nowcoder Weekly Contest 60 - D We Are So Awesome  
Today, $n$ children are gathered together bragging. Each of them has a certain number of little stars in their hands. For convenience, we represent them as $a_1, a_2, \dots, a_n$.  
Little Waipo bragged, "If we pick a few from among us, the total number of little stars in our hands can represent any positive integer within $n$!"  
Little Xiaolong thinks Little Waipo is wrong, but he is a child and cannot calculate.  

So Little Xiaolong comes to you for help. He wants you to find the smallest integer that proves Little Waipo is wrong.  

### Solution  

DP approach  

bitset optimized 01 knapsack (almost the same as the problem in swpuOj)  

Time complexity: $O\left( \frac{n^2}{w} \right)\approx1.5e8$ barely passes  
```cpp
void solve() {
    int n;cin >> n;
    vector<int> a(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i];
    bitset<100010> b;

    b[0] = 1;
    for (int i = 1;i <= n;i++) {
        b |= (b << a[i]);
    }
    for (int i = 1;i <= n;i++) {
        if (!b[i]) {
            cout << i << '\n';return;
        }
    }
    cout << "Cool!\n";
}
```

If we can already form any number in $[1,x]$, what condition must the next number $a_{i}$ satisfy to be able to form any number in $[1,x+a_i]$?  

Condition: $a_{i}\leq x+1$. When $a_{i}> x+1$, the number $x+1$ cannot be formed. Otherwise, $a_{i}$ can definitely form the numbers in the interval $[x+1,x+a_{i}]$ together with the previous numbers.  
```cpp
void solve() {
    int n;cin >> n;
    vector<int> a(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i];
    sort(a.begin() + 1, a.end());
    int x = 0;
    for (int i = 1;i <= n;i++) {
        if (a[i] > x + 1 && x < n) {
            cout << x + 1 << '\n';return;
        }
        x += a[i];
    }
    cout << "Cool!\n";
}
```

## Nowcoder Weekly Contest 60 - E Shuttle Run  

$\,\,\,\,\,\,\,\,\,$ It's PE class! Today's activity is the shuttle run. The straight track can be considered a number line. There are $n$ points on the track. The teacher placed two poles at points $1$ and $n$, called the left pole and the right pole, as the turning points for the shuttle run.  
$\,\,\,\,\,\,\,\,\,$The teacher stipulated that a total of $m$ laps must be run today. We consider that starting from one pole and ending at the other pole counts as one lap. Obviously, a total of $m-1$ turns need to be made. $\sf Zaoly$ suddenly discovered that the poles are movable, so he had a bold idea —  
$\,\,\,\,\,\,\,\,\,\,\,\,\,\,\bullet\,$ After each run to the right pole and turning back, he must push the right pole to the left for a certain distance (greater than $0$), but still ensure that the right pole is at an integer point and to the right of the left pole (cannot coincide with the left pole);  
$\,\,\,\,\,\,\,\,\,\,\,\,\,\,\bullet\,$ After each run to the left pole and turning back, he must push the left pole to the right for a certain distance (greater than $0$), but still ensure that the left pole is at an integer point and to the left of the right pole (cannot coincide with the right pole);  
$\,\,\,\,\,\,\,\,\,$Now, given the values of integers $n$ and $m$, how many different pushing methods does $\sf Zaoly$ have? Since the answer may be very large, please output the answer modulo $(10^9+7)$. Note that the pole must be pushed at every turn. If it is impossible to push at a certain turn, then that round of pushing is invalid.  

### Solution  

Actually, it means that in $m-1$ turns, each time you must push at least 1, and the total cannot exceed $n-2$, i.e., $\in[m-1,n-2]$.  

> 1931 (925div3): Review of Combinatorics  

>Equivalent to having $x(m-1\leq x\leq n-2)$ balls placed into $m-1$ boxes (each box must have at least one ball). That is, $C(x-1,m-2)$  

So the answer is $\displaystyle C(n-3,m-2)+C(n-2,m-2)+\dots+C(m-2,m-2)=\sum_{i=m-1}^{n-2}C(i-1,m-2)$  

The time complexity is $O(Tn\log n)$, which is too high. So we need another way to solve it.  

Introduce $a_{m}$, representing how many "balls" are not used. So we have:  

$x_{1}+x_{2}+\dots+x_{m-1}+x_{m}=n-2, x_{i}\geq 1\cap x_{m}\geq 0$  

So:  

$(x_{1}-1)+(x_{2}-1)+\dots+(x_{m-1}-1)+x_{m}=n-2, x_{i}\geq 0$  

$\implies x_{1}+x_{2}+\dots+x_{m}=n-2-m+1, x_{i}\geq 0$  

That is, there are $n-m-1$ balls to be placed into $m$ boxes (boxes can be empty). How many ways?  

$\to C(n-2-m-1 +m-1,m-1)=C(n-2,m-1)$  

$\implies C(n-2,m-1)$  

Time complexity $O(T\log n)$  

> [!NOTE]- Proof that $\displaystyle \sum_{i=m-1}^{n-2}C(i-1,m-2)=C(n-2,m-1)$ holds
> 
> Considering the properties of combinatorial numbers, we know:
> 
> $$\binom{i}{j} = \binom{i-1}{j} + \binom{i-1}{j-1}$$
> 
> Using this property, treating the original equation as an accumulation, it is equivalent to:
> 
> $$\sum_{i=m-1}^{n-2} \binom{i-1}{m-2} = \sum_{i=m-1}^{n-2} \binom{i-1}{i-m+1}$$
> 
> Thus, this sum can be recombined and gradually simplified using Pascal's identity to:
> 
> $$\sum_{i=m-1}^{n-2} \binom{i-1}{m-2} = \binom{n-2}{m-1}$$
> 
> This is a given combinatorial property. From a combinatorial perspective, the combinatorial number on the right, $\binom{n-2}{m-1}$, represents the number of ways to choose $m-1$ elements from $n-2$ elements. The left-hand side, gradually accumulating up to this upper limit, reflects the selection of a specific point as the beginning of the remaining choices, achieving the arrangement that satisfies the conditions through accumulation.
> 
> In summary, this equation holds.

```cpp
void solve() {
    int n, m;cin >> n >> m;
    cout << C(n - 2, m - 1) << '\n';
}
```

## Nowcoder Weekly Contest 60 - F Stuttering  
$\sf Zaoly$ wants to say a sentence. This sentence has $n$ words. He wants to say them one by one. Unfortunately, $\sf Zaoly$ stutters:  
When saying the $1$st word, the probability that the next word to say advances to the $2$nd word is $\frac {a_1} {a_1 + b_1}$, and the probability that it remains the $1$st word is $\frac {b_1} {a_1 + b_1}$.  
When saying the $i$th ($2 \leq i \leq {n - 1}$) word, the probability that the next word to say advances to the $i + 1$st word is $\frac {a_i^2} {a_i^2 + 2 a_i \cdot b_i + b_i^2}$, the probability that it remains the $i$th word is $\frac {2 a_i \cdot b_i} {a_i^2 + 2 a_i \cdot b_i + b_i^2}$, and the probability that it retreats to the $i - 1$st word is $\frac {b_i^2} {a_i^2 + 2 a_i \cdot b_i + b_i^2}$.  

When saying the $n$th word, the speech ends and stops.  

Until the speech ends, what is the expected total number of words $\sf Zaoly$ says?  

### Solution  

Let $e_{u,u+1}$ represent the expected number of steps to go from $u\to u+1$. According to the problem statement: (let the three probabilities be $p_{1i,2i,3i}$)  

$e_{u,u+1}=p_{1u}\times e_{u+1,u+1}+p_{2u}\times e_{u,u+1}+p_{3u}\times e_{u-1,u+1}+1$  

We have $e_{u-1,u+1}=e_{u-1,u}+e_{u,u+1}$. Substituting gives: ($e_{u,u}=0$)  

$\displaystyle \implies e_{u,u+1}=\frac{1+p_{3u}\times e_{u-1,u}}{p_{1u}}\to\frac{b_{i}^2\times e_{i-1,i}+(a_{i}+b_{i})^2}{a_{i}^2}$  

Let $e_{i,i+1}\to e_{i}$ represent the expected number of steps to go from $i\to i+1$.  

$e_{0}=1, e_{1}= \frac{a_{1}+b_{1}}{a_{1}}$  

$\displaystyle e_{i}=\frac{b_{i}^2\times e_{i-1}+(a_{i}+b_{i})^2}{a_{i}^2}$  

```cpp
void solve() {
    int n;cin >> n;
    vector<int> p(n), q(n), e(n);
    for (int i = 1;i < n;i++)cin >> p[i];
    for (int i = 1;i < n;i++)cin >> q[i];
    e[0] = 1;e[1] = (p[1] + q[1]) * inv(p[1]) % mod;
    for (int i = 2;i < n;i++) {
        e[i] = (q[i] * q[i] % mod * e[i - 1] % mod + (p[i] + q[i]) * (p[i] + q[i]) % mod) % mod * inv(p[i]) % mod * inv(p[i]) % mod;
    }
    int ans = 0;
    for (int i = 0;i < n;i++) {
        ans += e[i];ans %= mod;
    }
    cout << ans << '\n';
}
```

Official solution:

> [!NOTE]
> 
> Let $f_{i}$ represent the expectation starting from the $i$-th word to finish the sentence.
> 
> $f_{1}= \frac{a_{1}}{a_{1}+b_{1}}f_{2}+ \frac{b_{1}}{a_{1}+b_{1}}f_{1}+1\to f_{1}=f_{2}+ \frac{a_{1}+b_{1}}{a_{1}}$
> 
> $P=1,Q=\frac{a_{1}+b_{1}}{a_{1}}\to f_{1}=Pf_{2}+Q$
> 
> > $f_{2}=\frac{a^2}{(a+b)^2}f_{3}+\frac{2ab}{(a+b)^2}f_{2}+\frac{b^2}{(a+b)^2}f_{1}+1\to (a+b)^2f_{2}=a^2f_{3}+b^2\left( f_{2}+\frac{a_{1}+b_{1}}{a_{1}} \right)+(a+b)^2$
> > 
> > $f_{2}=f_{3}+\frac{b_{2}^2}{a_{2}^2}\times \frac{a_{1}+b_{1}}{a_{1}}+\frac{(a_{2}+b_{2})^2}{a_{2}^2}$
> 
> $(a_{i}+b_{i})^2f_{i}=a_{i}^2f_{i+1}+b_{i}^2f_{i-1}+(a_{i}+b_{i})^2$. At this point, $f_{i-1}=Pf_{i}+Q$ has already been obtained, so the formula for $f_{i}$ can be found.
> 
> So we can directly derive the general formula for $f_{i}$:
> 
> $\displaystyle f_{i}=\frac{a^2f_{i+1}+ Qb^2+(a+b)^2}{a^2+b^2-b^2P}$ where $(P,Q)$ is obtained from the previous term. Then for this term, $P'=\frac{a^2}{a^2+b^2-b^2P}, Q'=\frac{Qb^2+(a+b)^2}{a^2+b^2-b^2P}$
> 
> 
> After processing all $P_{i}, Q_{i}$, recurse according to the formula $f_{i-1}=P_{i-1}f_{i}+Q_{i-1}$.

```cpp
#define int long long
constexpr int mod = 1e9 + 7;
void solve() {
    int n;cin >> n;
    vector<int> p(n), q(n);
    for (int i = 1;i < n;i++)cin >> p[i];
    for (int i = 1;i < n;i++)cin >> q[i];
    int P = 1, Q = (p[1] + q[1]) * inv(p[1]) % mod;
    p[1] = P, q[1] = Q;
    for (int i = 2;i < n;i++) {
        int a = p[i], b = q[i];
        int mu = (((a * a % mod + b * b % mod) % mod - b * b % mod * P % mod) + mod) % mod;
        P = a * a % mod * inv(mu) % mod;
        Q = (Q * b % mod * b % mod + (a + b) * (a + b) % mod) % mod * inv(mu) % mod;
        p[i] = P, q[i] = Q;
    }
    vector<int> f(n + 1);
    f[n] = 1;
    for (int i = n - 1;i >= 1;i--) {
        f[i] = p[i] * f[i + 1] % mod + q[i];f[i] %= mod;
    }
    cout << f[1] << '\n';
}
```

## Nowcoder Weekly Contest 51 - D Little Red's gcd  
Given two positive integers $a, b$, output their greatest common divisor $\gcd(a, b)$.  

$1\leq a \leq 10^{10^6}$.  
$1\leq b \leq 10^9$.  

### Solution  
Large number modulo  

Find the gcd of a large number and an int  

It's easy: gcd (a, b)=gcd (b, a%b)  

**That is**, find x=a%b, ans=gcd (b, x) $x\in[0,b)$  

Using the property: The result of taking the product of multiple consecutive factors modulo p equals the result of taking each factor modulo p, multiplying them, and then taking modulo p again.  

That is: $(a\times b)\%p=(a\%p\times b\%p)\%p$  

From this property, a can be divided into several blocks, assuming each split is 9 digits $\implies a_{0}\times10^9\times a_{1}\times10^{18}\times \dots$ (but this seems unnecessary...)  

>Just calculate digit by digit.  

Then $a \bmod b=\sum a_{i}\bmod b$  

```cpp
#define int long long
void solve() {
    string a;int b;cin >> a >> b;
    vector<int> ans;
    for (int i = 0;i < a.size();i += 9) {
        string s = a.substr(i, 9);
        ans.push_back(stoi(s));
    }
    int x = 0;
    for (auto m : ans) {
        x *= qpow(10, to_string(m).size(), b);x += m;x %= b;
    }
    cout << __gcd(x, b) << '\n';
}
```
$\implies$
$ans = (a[0]\times 10^{n-1} \mod b + a[1]\times 10^{n-2} \mod b + ... + a[i]\times 10^{n-i-1} \mod b)$  

```cpp
#define int long long
void solve() {
    string a;int b;cin >> a >> b;
    int ans = 0;
    for (auto x : a) {
        ans = (ans * 10 + x - '0') % b;
    }
    cout << __gcd(ans, b) << '\n';
}
```

## Nowcoder Weekly Contest 51 - E Little Red Walking Through Matrix  
Given an $n \times n$ matrix, each element in the matrix is a positive integer. Little Red is currently at the top-left corner $(1,1)$. Each time, she can move from $(x, y)$ to $(x+1, y)$, $(x, y+1)$, $(x-1, y)$, or $(x, y-1)$, but cannot move outside the matrix. Little Red hopes to find a path to the bottom-right corner $(n,n)$. Define the path weight as the maximum value of the points passed along the path. Find the minimum path weight among all paths.  

### Solution  
BFS + Binary Search  

>There are many approaches: binary search, shortest path, union-find, but DP is not feasible.  

Once you think of binary search, it shouldn't be difficult! Time complexity $O(n^2\log n)$. If extended further, this problem can also be understood from the perspective of union-find or shortest path.  
```cpp
constexpr int dx[] = {1, -1, 0, 0};
constexpr int dy[] = {0, 0, 1, -1};
int n,g[505][505];
bool check(int mid) {
    if (g[0][0] > mid) return false;

    vector<vector<bool>>  vis(n, vector<bool>(n, false));
    queue<pair<int, int>> q;
    q.push({0, 0}); vis[0][0] = true;

    while (!q.empty()) {
        auto [x, y] = q.front();q.pop();
        if (x == n - 1 && y == n - 1) return true;
        for (int i = 0; i < 4; ++i) {
            int nx = x + dx[i], ny = y + dy[i];
            if (nx >= 0 && nx < n && ny >= 0 && ny < n && ! vis[nx][ny] && g[nx][ny] <= mid) {
                q.push({nx, ny});
                vis[nx][ny] = true;
            }
        }
    }
    return false;
}
int main() {
    cin >> n;
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < n; ++j) {
            cin >> g[i][j];
        }
    }

    int l = INT_MAX, r = INT_MIN;
    for (int i = 0; i < n; ++i) {
        for (int j = 0; j < n; ++j) {
            l = min(l, g[i][j]);
            r = max(r, g[i][j]);
        }
    }
    
    while (l < r) {
        int mid = l + r >> 1;
        if (check(mid)) r = mid;
        else l = mid + 1;
    }
    cout << l << '\n';
}
```

Union-Find approach: Merge in order of increasing weight until (0,0) and (n-1, m-1) are connected.

## Nowcoder Weekly Contest 51 - F Little Red's Array  
Little Red has an array containing $n$ numbers $a_i$.  
Little Red has $q$ queries. For each query, given an interval $[l,r]$, find the maximum absolute value of the sum of a contiguous subarray within the interval. That is, find $x,y$ such that $l \leq x \leq y \leq r$, maximizing $\mathrm{abs}(a[x]+a[x+1]+.....+a[y])$.  

### Solution  
Segment Tree / Mo's Algorithm / Sparse Table  

Information needed for the segment tree:  
1. Interval sum (sum), maximum subarray sum starting from the left endpoint (lmax), maximum subarray sum ending at the right endpoint (rmax), and maximum subarray sum within the interval (mmax).  
2. Maximum and minimum values  

The problem actually hints: $\mathrm{abs}(a[x]+a[x+1]+.....+a[y])$ is a contiguous segment, i.e., $pre[y]-pre[x-1]$. The maximum value minus the minimum value of prefix sums within the interval $[l,r]$ is the answer. So we need to maintain the maximum and minimum values within the interval.  

>After changing i=1 to i=0, it passed? I don't understand.  
```cpp
#define int long long
int f1[500010][30], f2[500010][30];
void solve() {
    int n;cin >> n;
    vector<int> a(n + 1), pre(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i];
    for (int i = 1;i <= n;i++)pre[i] = pre[i - 1] + a[i];

    for (int i = 1;i <= n;i++)f1[i][0] = pre[i], f2[i][0] = f1[i][0];

    for (int j = 1;j <= 30;j++) {
        for (int i = 0;i + (1 << j) - 1 <= n;i++) { // After changing i=1 to i=0, it passed?
            f1[i][j] = max(f1[i][j - 1], f1[i + (1 << (j - 1))][j - 1]);
            f2[i][j] = min(f2[i][j - 1], f2[i + (1 << (j - 1))][j - 1]);
        }
    }
    int q;cin >> q;
    while (q--) {
        int l, r;cin >> l >> r;l--;
        int k = __lg(r - l + 1);
        cout << max(f1[l][k], f1[r - (1 << k) + 1][k]) - min(f2[l][k], f2[r - (1 << k) + 1][k]) << '\n';
    }
}
```

If this problem were modified slightly: removing the absolute value, it becomes [245. Can You Answer These Questions? - AcWing](https://www.acwing.com/problem/content/246/)

## Nowcoder Weekly Contest 31 - E Little Red's Subset Negation  
Little Red has an array. She plans to select several elements and multiply them by -1 so that the sum of all elements is 0. Little Red wants to know the minimum number of elements she needs to select.  

### Solution.  
<span style="color:#92d050">DP</span>  

```cpp bitset
#define N 40000
int i, j, k, n, m, t, res = -1;
bitset<80005> f[205];

int main() {
    ios::sync_with_stdio(0);
    f[0][N] = 1;
    cin >> n;
    for (i = 1;i <= n;i++) {
        cin >> k;
        for (j = n;j >= 0;j--) {
            if (k >= 0) {
                f[j] >>= k;
                if (j) f[j] |= (f[j - 1] << k);
            } else {
                f[j] <<= -k;
                if (j) f[j] |= (f[j - 1] >> -k);
            }
        }
    }
    for (i = 0;i <= n;i++)
        if (f[i][N]) {
        res = i; break;
    }
    cout << res;
}
```

If ndp does not store the value of $c + x$, set it to `y`. If it already exists, update it to `min (ndp[c + x], y)`.  

The same method is used for $c - x$, setting it to `y + 1` or updating it to `min (ndp[c - x], y + 1)`.  

For each piece of input data, it must be added to or subtracted from the numbers in the array.  

`dp[i][j] = min (dp[i - 1][j + arr[i]], dp[i - 1][j - arr[j]] + 1)`  

```cpp
int main() {
    map<int, int> dp;
    int n;
    cin >> n;
    dp[0] = 0;
    for (int i = 1; i <= n; i++) {
        int x;
        cin >> x;
        map<int, int> ndp;
        for (auto [c, y] : dp) {
            if (!ndp.count(c + x)) ndp[c + x] = y;
            else ndp[c + x] = min(ndp[c + x], y);
            if (!ndp.count(c - x)) ndp[c - x] = y + 1;
            else ndp[c - x] = min(ndp[c - x], y + 1);
        }
        dp = ndp;
    }
    if (!dp.count(0)) cout << -1;
    else cout << dp[0];
}
```

`x + y = s`  
`x - y = 0` $\to y=\frac{s}{2}$  
Select the minimum number of elements from the set to exactly sum to $S/2$. When implemented, it's a 0/1 knapsack problem of "minimum number of items to pick to achieve a specific sum": the state records the minimum number of picks to reach a certain sum, and finally check if we can transition to $S/2$.  

## Nowcoder Weekly Contest 52 - C Little Red's Number Pair Elimination  
Little Red has an array $a$ of length $n$, where the value at the $i$-th position is $a_i$. She wants to reduce the length of the array as much as possible in the following ways.  

- When $len(a)>1$ and there exists a pair $(i,j)$ satisfying $i<j$ and $a_i + a_j \leq 0$, then $a_i$ and $a_j$ can be eliminated.  
- When $len(a)>1$ and there exists a pair $(i,j)$ satisfying $i<j$ and $a_i \oplus a_j \leq 0$, then $a_i$ and $a_j$ can be eliminated.  

Please output the minimized length of the array.  

Classify based on $a_{i}$ being +/-/0.  

From the given conditions:  

$a_{i}+a_{j}\leq 0$:  
$\implies$

- $(\leq0,\leq0)$
- $(>0,<0)$

$a_{i}\oplus a_{j}\leq 0$:  
$\implies$

- $a_i=a_{j}$
- $(\geq0,<0)$

In summary: Only when $a_{i}\geq 0\cap a_{j}\geq 0\cap a_{i}\neq a_{j}$ do the conditions for elimination not hold.  

Greedy idea: Positive numbers are not conducive to calculating the answer, so try to eliminate positive numbers first, i.e., first eliminate pairs where $a_{i}=a_{j}>0$.  
```cpp
#define int long long
void solve() {
    int n;cin >> n;
    int pos = 0, neg = 0, z = 0;
    map<int, int>mp;
    for (int i = 1;i <= n;i++) {
        int x;cin >> x;
        if (x == 0) {
            z++;
        } else if (x > 0) {
            pos++;mp[x]++;
            if (mp[x] == 2) {
                pos -= 2, mp[x] = 0;
            } 
        } else {
            neg++;
        }
    }
    if (pos <= neg) {
        cout << (neg - pos + z) % 2 << '\n';
    } else {
        cout << pos - neg + z << '\n';
    }
}
```

## Nowcoder Weekly Contest 52 - E Little Red Adding Edges to the Graph  
Little Red has an undirected graph with $n$ nodes and $m$ edges. The weight of each node is $a_i$.  
Little Red now wants to add edges to connect the graph. The cost of each connection is the maximum element value of the newly formed connected block. Little Red wants to know the minimum total cost required to make the graph connected.  

This problem turned out to be the simplest...  

Following the idea of condensation, the weight of each block is $w_{j}=\max(a_{i}), a_{i}\in Block$.  

Then it's easy to see that the answer is $\sum w_{i}-\min(w_{i})$.  

```cpp
#define int long long
void solve() {
    int n, m;cin >> n >> m;
    vector<int> a(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i];
    vector<vector<int>> g(n + 1);
    for (int i = 1;i <= m;i++) {
        int u, v;cin >> u >> v;
        g[u].push_back(v);
        g[v].push_back(u);
    }
    vector<int> vis(n + 1);
    int sum = 0, mi = 1e18;

    for (int i = 1;i <= n;i++) {
        if (!vis[i]) {
            int mx = a[i];
            queue<int>q;vis[i] = 1;q.push(i);
            while (q.size()) {
                int u = q.front();q.pop();
                for (auto v : g[u]) {
                    if (vis[v])continue;
                    vis[v] = 1;
                    mx = max(mx, a[v]);
                    q.push(v);
                }
            }
            mi = min(mi, mx);
            sum += mx;
        }
    }
    cout << sum - mi << '\n';
}
```

## Nowcoder Weekly Contest 52 - F Little Red's Bracket String  
Little Red has a string containing only '(' , ')' and '?'. Little Red wants to know how many ways there are to replace '?' with '(' or ')' such that there exists a cyclic shift making the string a valid bracket sequence.  

Assume a cyclic shift of a string $s$ of length $n$ is $s[k:n] + s[1:k)$. Then, if string $s$ is a valid bracket sequence, $s[k:n] + s[1:k)$ is also a valid bracket sequence.  

### Solution  

Refer to the solution by Little Brother Xue: [Problem Solution | Little Red's Bracket String_Nowcoder Blog](https://blog.nowcoder.net/n/1d8f5a27daee4b8f9eaee4999e339bfe) -> Concrete Mathematics P301  

New knowledge: Raney's Lemma: If $\displaystyle \sum\limits_{i=1}^mx_{i}=1$, then among all its cyclic shifts, exactly one satisfies that all prefix sums are positive.  

This tells us that as long as the sequence sum is 0, it is valid.  

```cpp
constexpr int mod = 1e9 + 7;
void solve() {
    int n;cin >> n;
    string s;cin >> s;
    if (n & 1) {
        cout << "0\n";return;
    }
    int x = 0, y = 0;
    for (auto c : s) {
        if (c == '(') x++;
        else if (c == ')') y++;
    }
    cout << C(n - x - y, n / 2 - x) << '\n';
}
```

## Nowcoder Weekly Contest 47 - D Cute Numbers  
Mengmeng likes "cute numbers", which need to satisfy the following two conditions:  
1. The number modulo $3$ is not $0$.  
2. The last digit of the number is not $3$.  
Please tell him what the $n$-th cute number is.  

If we know a value $x$, we can calculate how many numbers before $x$ are excluded.  

The number of excluded numbers: $\lfloor{\frac{x}{3}}\rfloor+\lfloor{\frac{x-3}{10}}\rfloor-\lfloor{\frac{x-3}{30}}\rfloor$  

Then it satisfies: $n+\lfloor{\frac{x}{3}}\rfloor+\lfloor{\frac{x-3}{10}}\rfloor-\lfloor{\frac{x-3}{30}}\rfloor=x$  

Directly enumerating the answer will definitely time out, but since **the answer is monotonic** (the larger the number, the larger the answer), binary search can be used.  

```cpp
#define int long long
void solve() {
    int n;cin >> n;
    int l = 1, r = 1e14;
    while (l < r) {
        int mid = l + r >> 1;
        int x = mid - mid / 3 - (mid - 3) / 10 + (mid - 3) / 30;
        if (x >= n) {
            r = mid;
        } else {
            l = mid + 1;
        }
    }
    cout << l << "\n";
}
```

## Nowcoder Weekly Contest 47 - E Qianqian's Calculator  
Qianqian has a calculator that displays all leading zeros when showing numbers.  
On this calculator, 0-9 are displayed as:  
![](https://uploadfiles.nowcoder.com/images/20240612/0_1718201015082/3B10E49DCF39E70AEEE9ED31FF6EA778)  
That is, when the calculator display has 10 digits, displaying the number 123456 would show as "0000123456".  
Qianqian noticed that sometimes the number displayed on the calculator is an axially symmetric figure, such as "80808"  
![](https://uploadfiles.nowcoder.com/images/20240612/0_1718201028497/F051744115F6A43C1EDBDECBCE97C866)  
("80808" can have a horizontal axis of symmetry, or a vertical axis of symmetry. And some numbers might be symmetric only about the horizontal or only about the vertical axis, but such numbers are still considered axially symmetric.)  

Question: If the calculator displays numbers with $n(1\leq n\leq 10^9)$ digits, how many different axially symmetric figures can it display?  

### Solution  

Since $n\leq 10^9$, it's usually solved in $O(logn)/O(1)$.  

Inclusion-Exclusion: **Horizontal Symmetry + Vertical Symmetry − (Horizontal and Vertical Symmetry)**  

Horizontal Symmetry: $0,1,3,8$ can be arbitrarily combined (they are horizontally symmetric), i.e., $4^n$.  
Vertical Symmetry: There are four possibilities: $(2,5),(0,0),(8,8),(5,2)$. They can only be placed with central symmetry.  

>Note: $(1,1)$ cannot be placed; in the calculator display, it is right-aligned and not symmetric.  

If $n$ is odd, the middle position can only be $0$ or $8$, so the answer is $4^{n/2}\times2$. If even, it is $4^{n/2}$. Simplified, odd and even can be combined into $2^n$.  

Need to subtract the double-counted part that is both horizontally and vertically symmetric. Only $(0,0),(8,8)$ are double-counted when placed arbitrarily. This part is $2^{\lceil{n/2}\rceil}$.  

The answer is $\displaystyle 4^n+2^n-2^{\lceil{\frac{n}{2}}\rceil}$, solved in $O(1)$.  

```cpp
void solve() {
    int n;cin >> n;
    cout << (qpow(4, n) + qpow(2, n) + mod - qpow(2, (n + 1) / 2)) % mod;
}
```

## Nowcoder Weekly Contest 47 - F Huahua's Map  
The map of City A is an $n \times m$ grid. The character '#' represents an obstacle, and '.' represents open space. Huahua lives at the top-left corner $(1,1)$, and Huahua's friend Mengmeng lives at the bottom-right corner $(n,m)$. Huahua wants to go to Mengmeng's house.  
If Huahua walks on open space, there is no cost. But if he wants to walk on an obstacle point, he needs to destroy that obstacle first. He can move in four adjacent directions each time, i.e., from $(x,y)$ to $(x+1,y)$, $(x-1,y)$, $(x,y+1)$, $(x,y-1)$.  
Huahua can spend a cost of $C_i$ to destroy all obstacles in the $i$-th column.  
Please calculate the minimum cost for Huahua to go to Mengmeng's house.  

Data range: $1\leq n,m\leq 100,1\leq c_{i}\leq 10^5$  

### Solution  
Digit DP / Shortest Path (dijkstra)  

Shortest path approach: Each time you need to go to a place containing `#`, the cost for that column is the same. Add all points in that column and their costs to the graph.  

#### Method 1:  

`{c++}dp[i][j]` is the minimum cost to reach point $(i+1,j+1)$. The answer is `{c++}dp[n - 1][m - 1]`.  

Time complexity: $O(n^3+n^2\log n^2)$. Will time out if $n,m\leq 1000$.  

>A max heap can also be used, just add a sign when inserting.  
```cpp
void solve() {
    int n, m; cin >> n >> m;

    vector<string> g(n);
    for (int i = 0; i < n; i++) cin >> g[i];

    vector<int> cost(m);
    for (int i = 0; i < m; i++) cin >> cost[i];

    vector<vector<int>> dp(n, vector<int>(m, INT_MAX));
    priority_queue<tuple<int, int, int>, vector<tuple<int, int, int>>, greater<tuple<int, int, int>>> pq;

    if (g[0][0] == '.') {
        pq.push({0,0,0});
        dp[0][0] = 0;
    } else {
        for (int i = 0; i < n; i++) {
            pq.push({cost[0], i,0});
            dp[i][0] = cost[0];
        }
    }

    while (!pq.empty()) {
        auto [c, x, y] = pq.top();pq.pop();
        if (c > dp[x][y]) continue;

        const int dx[] = {0, 0, 1, -1}, dy[] = {1, -1, 0, 0};
        for (int i = 0;i < 4;i++) {
            int cx = x + dx[i], cy = y + dy[i];
            if (cx < 0 || cx >= n || cy < 0 || cy >= m) continue;
            if (g[cx][cy] == '.') {
                if (dp[cx][cy] > c) {
                    dp[cx][cy] = c;
                    pq.push({dp[cx][cy], cx, cy});
                }
            } else {
                for (int j = 0; j < n; j++) {
                    if (dp[j][cy] > c + cost[cy]) {
                        dp[j][cy] = c + cost[cy];
                        pq.push({dp[j][cy], j, cy});
                    }
                }
            }

        }
    }
    cout << dp[n - 1][m - 1] << '\n';
}
```

#### Method 2:  

See: [Nowcoder Weekly Contest Round 47 Problem Solving Report | Ke Scholar \_Nowcoder Blog](https://blog.nowcoder.net/n/ad8632f0439546e6a3771ff324a7509c)  

Time complexity is $O(n^2\log n^2)$. It also passes when $n,m\leq 1000$.  

```cpp 
void solve() {
    int n, m;
    cin >> n >> m;
    vector<string> g(n);
    for (auto& s : g) cin >> s;

    vector<int> cost(m);
    for (auto& x : cost) cin >> x;

    vector<vector<int>> dp(n + 1, vector<int>(m, INT_MAX));
    priority_queue<tuple<int, int, int>, vector<tuple<int, int, int>>, greater<tuple<int, int, int>>> pq;

    if (g[0][0] == '.') {
        pq.emplace(0, 0, 0);
        dp[0][0] = 0;
    } else {
        pq.emplace(cost[0], n, 0);
        dp[n][0] = cost[0];
    }

    while (!pq.empty()) {
        auto [c, y, x] = pq.top();
        pq.pop();
        if (c > dp[y][x]) {
            continue;
        }

        if (y == n) {
            for (int i = 0; i < n; i++) {
                if (dp[i][x] > c) {
                    dp[i][x] = c;
                    pq.emplace(dp[i][x], i, x);
                }
            }
        } else {
            vector<pair<int, int>> dir = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};
            for (auto& [dy, dx] : dir) {
                int ty = y + dy, tx = x + dx;
                if (0 <= ty && ty < n && 0 <= tx && tx < m) {
                    if (g[ty][tx] == '.' && dp[ty][tx] > c) {
                        dp[ty][tx] = c;
                        pq.emplace(dp[ty][tx], ty, tx);
                    }
                }
            }
            for (int dx = -1; dx <= 1; dx++) {
                int tx = x + dx;
                if (0 <= tx && tx < m) {
                    if (dp[n][tx] > c + cost[tx]) {
                        dp[n][tx] = c + cost[tx];
                        pq.emplace(dp[n][tx], n, tx);
                    }
                }
            }
        }
    }
    cout << dp[n - 1][m - 1] << endl;
}
```

## Nowcoder Weekly Contest 35 - F/G Little Red's Subsequence Weight Sum  
>Little Red defines the weight of an array as: the number of factors of the product of all elements in the array. For example, the weight of $[1,2,3]$ is 4.

Now Little Red has an array. She wants to find the sum of the weights of all non-empty subsequences of the array. Can you help her? Since the answer may be too large, output it modulo $10^9+7$.

>Define a subsequence of an array as: selecting several elements from left to right (not necessarily consecutively) to form an array. For example, subsequences of $[1,2,3,2]$ include $[2,2]$, etc. Therefore, an array of size $n$ has exactly $2^n -1$ subsequences.

$1\leq a_{i}\leq 3$

- $(1\leq n\leq 1000)$
- $(1\leq n\leq 10^5)$

### Solution
<span style="color:#92d050">Yang Hui's Triangle for Combinations / Inverse Elements / Number Theory</span>

$C(n,m)=\frac{n!}{(n-m)!\times m!}$

Let $n_{1}, n_{2}, n_{3}$ be the counts of $1,2,3$ respectively, then:

- $n_{1}=2^{n_{1}}$
- $n_{2}=\sum\limits_{i=0}^{n_{2}}(i+1)\times C(n_{2},i)$
- $n_{3}=\sum\limits_{i=0}^{n_{3}}(i+1)\times C(n_{3},i)$

$\text{ans=}n_{1}\times n_{2}\times n_{3}-1$

```cpp F
void solve() {
    int n;cin >> n;
    vector<vector<ll>> c(n + 1, vector<ll>(n + 1));
    for (int i = 0;i <= n;i++) {
        for (int j = 0;j <= i;j++) {
            if (j == 0 || j == i)c[i][j] = 1;
            else c[i][j] = (c[i - 1][j] + c[i - 1][j - 1]) % mod;
        }
    }
    array<int, 4> num = {};
    ll t = 1;
    for (int i = 1;i <= n;i++) {
        int x;cin >> x;
        num[x]++;
    }
    ll ans = 0;
    for (int i = 1;i <= num[1];i++) {
        t = (2 * t) % mod;
    }
    for (int i = 0;i <= num[2];i++) {
        for (int j = 0;j <= num[3];j++) {
            ans += c[num[2]][i] * c[num[3]][j] % mod * (i + 1) % mod * (j + 1) % mod * t % mod;
            ans %= mod;
        }
    }
    cout << (ans + mod - 1) % mod << '\n';
}
```

```cpp G
const int mod = 1e9 + 7;
vector<ll> fact(1e5 + 1);
ll c(int n, int m) {
    return fact[n] * (qpow(fact[n - m], mod - 2)) % mod * (qpow(fact[m], mod - 2)) % mod;
}
void solve() {
    int n;cin >> n;
    fact[0] = 1;
    for (int i = 1;i <= n;i++)fact[i] = fact[i - 1] * i % mod;
    
    array<int, 4> num = {};
    for (int i = 0;i < n;i++) {
        int x;cin >> x;num[x]++;
    }
    ll t = qpow(2, num[1]);
    ll ans = 0, c2 = 0, c3 = 0;
    for (int i = 0;i <= num[2];i++) {
        c2 += c(num[2], i) * (i + 1) % mod;
        c2 %= mod;
    }
    for (int i = 0;i <= num[3];i++) {
        c3 += c(num[3], i) * (i + 1) % mod;
        c3 %= mod;
    }
    cout << (c2 % mod * c3 % mod * t % mod - 1 + mod) % mod << '\n';
}
```

## Nowcoder Weekly Contest 55 - E Little Red's Sequence Product 2.0  
For an integer sequence $\{b_1,b_2,\dots,b_m\}$ of length $m$, define $f_i = b_1 \times b_2 \times \cdots \times b_i$, i.e., the product of the first $i$ terms. The weight of this sequence is the number of digits among $f_1, f_2, \dots, f_m$ whose units digit is $6$.  

Little Red has an integer sequence $\{a_1,a_2,\dots,a_n\}$ of length $n$. She wants to know the sum of the weights of all $2^n-1$ non-empty subsequences of this sequence.  

### Solution  
DP  

$f_{i,j}$ represents the number of schemes among the first $i$ numbers that end with $j$.  

Let $f_{i,j}$ be the current state, and $f_{i-1,j}$ be the previous state, then:  

The current state must include the previous state, i.e., $f_{i,j}=f_{i-1,j}+\dots$  

The current number is $a_{i}$, then $f_{i,j\times a_{i}\%10}$ means that after adding the current number, it ends with $j\times a_{i}\%10$. Therefore:  

$f_{i,j\times a_{i}\%10}=f_{i-1,j}+\dots$  

When adding the current number, if it ends with 6, the requirement is met. Suppose this subsequence is $\{1,\dots,i\}$. Then all sequences with larger indices can include this subsequence. There are $n-i$ of them, and each can be chosen or not, giving $2^{n-i}$ ways.  
```cpp
#define int long long
constexpr int mod = 1e9 + 7;
void solve() {
    int n;cin >> n;
    vector<int> a(n + 1);
    for (int i = 1;i <= n;i++) {
        cin >> a[i];a[i] %= 10;
    }
    vector<array<int, 10>> f(n + 1); // Represents the number of schemes among the first i numbers ending with j
    f[0][1] = 1;
    int ans = 0;
    for (int i = 1;i <= n;i++) {
        for (int j = 0;j < 10;j++) {
            if (j * a[i] % 10 == 6) {
                ans += f[i - 1][j] * qpow(2, n - i) % mod;ans %= mod;
            }
            f[i][j] += f[i - 1][j];f[i][j] %= mod;
            f[i][j * a[i] % 10] += f[i - 1][j];f[i][j * a[i] % 10] %= mod;
        }
    }
    cout << ans << '\n';
}
```

>F's computational geometry hints that I should start learning computational geometry!