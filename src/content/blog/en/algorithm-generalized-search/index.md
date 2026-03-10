---
title: "Search Is Not Brute Force: DFS, BFS, and DP"
description: Built from original search problem sets and solution notes, organizing DFS, BFS, pruning, shortest paths, and state-space search.
publishDate: 2024-04-04
tags:
  - Algorithm
  - Search
  - DFS
  - BFS
language: English
heroImageSrc: ../../../pic/susan-q-yin-Ctaj_HCqW84-unsplash.jpg
heroImageColor: " #88736b "
---

> [!note] Note
> This article is based directly on your original search notes, without compressing them into an overview-style short article; only the heading hierarchy, links, and images have been adapted for the site.

## Included Content

- `Search Problem-Solving Overview`

## Original Search Problem Sets and Solution Organization

- [【Algorithm 1-7】Search - Problem Set - Luogu | Computer Science Education New Ecosystem](https://www.luogu.com.cn/training/112#problems)
- [CM's Search - Problem Set - Luogu | Computer Science Education New Ecosystem](https://www.luogu.com.cn/training/10560#information)

### Problem Set 1:

#### [P1219 Eight Queens Checker Challenge](https://www.luogu.com.cn/problem/P1219)
DFS
```cpp
void solve() {
    int n;cin >> n;
    int sum = 0;
    array<int, 15> ans = {};
    vector<array<int, 30>> check(3);
    auto dfs = [&](auto self, int x)->void {
        if (x > n) {
            sum++;
            if (sum > 3)return;
            for (int i = 1;i <= n;i++)cout << ans[i] << " \n"[i == n];return;
        }
        for (int i = 1;i <= n;i++) {
            if (!check[0][i] && !check[1][x + i] && !check[2][x + n - i]) {
                ans[x] = i;
                check[0][i] = 1;
                check[1][x + i] = 1;
                check[2][x + n - i] = 1;
                self(self, x + 1);
                check[0][i] = 0;
                check[1][x + i] = 0;
                check[2][x + n - i] = 0;
            }
        }
        };
    dfs(dfs, 1);
    cout << sum << '\n';
}
```

#### [P2392 kkksc03 Cramming Before the Exam](https://www.luogu.com.cn/problem/P2392)
DFS/DP
```cpp
void solve() {
    int l[4] = {};
    for (int i = 0;i < 4;i++) {
        cin >> l[i];
    }
    vector<vector<int>> a(4);
    for (int i = 0;i < 4;i++) {
        for (int j = 0;j < l[i];j++) {
            int x;cin >> x;a[i].push_back(x);
        }
    }
    int sum = 0;
    for (int i = 0;i < 4;i++) {
        int mi = 1e9, left = 0, right = 0;
        auto dfs = [&](auto self, int x) ->void {
            if (x >= a[i].size()) {
                mi = min(max(left, right), mi);return;
            }
            left += a[i][x];
            self(self, x + 1);
            left -= a[i][x];
            right += a[i][x];
            self(self, x + 1);
            right -= a[i][x];
            };
        dfs(dfs, 0);
        sum += mi;
    }
    cout << sum << '\n';
}
```

#### [P1443 Knight's Traversal](https://www.luogu.com.cn/problem/P1443)
BFS
```cpp
int dx[] = {1, -1, 1, -1, 2, 2, -2, -2};
int dy[] = {2, 2, -2, -2, -1, 1, -1, 1};
void solve() {
    int n, m, x, y;cin >> n >> m >> x >> y;
    vector<vector<int>> dis(n + 1, vector<int>(m + 1, -1));
    queue<pair<int, int>> q;
    q.push({x,y});
    dis[x][y] = 0;
    while (q.size()) {
        auto [a, b] = q.front();q.pop();
        for (int i = 0;i < 8;i++) {
            int cx = a + dx[i], cy = b + dy[i];
            if (cx<1 || cy<1 || cx>n || cy>m)continue;
            if (dis[cx][cy] != -1)continue;
            dis[cx][cy] = dis[a][b] + 1;
            q.push({cx,cy});
        }
    }
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= m;j++) {
            cout << left << setw(4) << dis[i][j] << " \n"[j == m];
        }
    }
}
```

#### [P1135 Strange Elevator](https://www.luogu.com.cn/problem/P1135)
DFS/BFS

```cpp DFS_TLE
void solve() {
    int n, a, b;cin >> n >> a >> b;vector<int> p(n + 1);
    for (int i = 1;i <= n;i++) {
        cin >> p[i];
    }
    int ans = 1e9;
    vector<bool> ok(n + 1);
    auto dfs = [&](auto self, int x, int cnt) -> void {
        if (cnt >= ans)return;
        if (x == b) {
            ans = min(ans, cnt);
            return;
        }
        if (x + p[x] <= n && !ok[x + p[x]]) {
            ok[x] = 1;
            self(self, x + p[x], cnt + 1);
            ok[x] = 0;
        }
        if (x - p[x] >= 1 && !ok[x - p[x]]) {
            ok[x] = 1;
            self(self, x - p[x], cnt + 1);
            ok[x] = 0;
        }
        };
    dfs(dfs, a, 0);
    if (ans == 1e9)ans = -1;
    cout << ans << '\n';
}
```

```cpp BFS
void solve() {
    int n, a, b;cin >> n >> a >> b;
    vector<ll> p(n + 1), dis(n + 1, -1);
    for (int i = 1;i <= n;i++)cin >> p[i];

    queue<int> q;q.push(a);dis[a] = 0;
    while (q.size()) {
        auto x = q.front();q.pop();
        if (!p[x])continue;
        if (x - p[x] >= 1) {
            if (dis[x - p[x]] != -1)goto next;
            dis[x - p[x]] = dis[x] + 1;q.push(x - p[x]);
        }
        next:
        if (x + p[x] <= n) {
            if (dis[x + p[x]] != -1)continue;
            dis[x + p[x]] = dis[x] + 1;q.push(x + p[x]);
        }
    }
    cout << dis[b] << ' ';
}
```

#### P2895 Meteor Shower S
BFS

```cpp
int dx[] = {1,-1,0,0};
int dy[] = {0,0,1,-1};
int p[310][310], dis[310][310];
void solve() {
    int m;cin >> m;
    for (int i = 0;i < 310;i++) {
        for (int j = 0;j < 310;j++) {
            p[i][j] = 1010;
        }
    }
    for (int i = 1;i <= m;i++) {
        int x, y, t;cin >> x >> y >> t;
        p[x][y] = min(t, p[x][y]);
        p[x + 1][y] = min(t, p[x + 1][y]);
        p[x][y + 1] = min(t, p[x][y + 1]);
        if (x - 1 >= 0)
            p[x - 1][y] = min(t, p[x - 1][y]);
        if (y - 1 >= 0)
            p[x][y - 1] = min(t, p[x][y - 1]);
    }
    queue <pair<int, int>> q;q.push({0,0});
    while (q.size()) {
        auto [x, y] = q.front();q.pop();
        for (int i = 0;i < 4;i++) {
            int a = x + dx[i], b = y + dy[i];
            if (a < 0 || b < 0)continue;
            if (dis[a][b])continue;
            if (dis[x][y] + 1 >= p[a][b])continue;//If this place can no longer be entered
            dis[a][b] = dis[x][y] + 1;
            q.push({a,b});
            if (p[a][b] == 1010) {
                cout << dis[a][b] << "\n";return;
            }
        }
    }
    cout << "-1\n";
}
```

#### [P1036 Selecting Numbers](https://www.luogu.com.cn/problem/P1036)
DFS-<span style="color:#ffc000">A somewhat confusing search</span>

```cpp
void solve() {
    int n, k;cin >> n >> k;vector<int>a(n);
    for (int i = 0;i < n;i++)cin >> a[i];
    int ans = 0;
    auto dfs = [&](auto self, int x, int sum, int sx)->void {
        if (x == k) {
            if (isPrime(sum))ans++;return;
        }
        for (int i = sx;i < n;i++)self(self, x + 1, sum + a[i], i + 1);
        };
    dfs(dfs, 0, 0, 0);
    cout << ans << '\n';
}
```

#### [P2036 PERKET](https://www.luogu.com.cn/problem/P2036)
```cpp
void solve() {
    int n;cin >> n;vector<int> a(n + 1), b(n + 1), vis(n + 1);
    for (int i = 1;i <= n;i++)cin >> a[i] >> b[i];
    int ans = 1e9;
    /*------------1----------------*/
    auto dfs = [&](auto self, int x)->void {
        if (x > n) {
            int s = 1, k = 0;
            for (int i = 1;i <= n;i++) {
                if (vis[i] == 1) {
                    s *= a[i];k += b[i];ans = min(ans, abs(s - k));//This ensures that selecting none cannot enter
                }
            }
            return;
        }
        vis[x] = 1;//Select
        self(self, x + 1);
        vis[x] = 0;
        vis[x] = 2;//Don't select
        self(self, x + 1);
        vis[x] = 0;
        };
    dfs(dfs, 0);
    /*------------2----------------*/
    auto dfs = [&](auto self, int x, int s, int k)->void {
        if (x > n) {
            if (s == 1 && k == 0)return;//Must add at least one ingredient, cannot select none
            ans = min(ans, abs(s - k));return;
        }
        self(self, x + 1, s * a[x], k + b[x]);//Select
        self(self, x + 1, s, k);//Don't select
        };
    dfs(dfs, 1, 1, 0);
    cout << ans << '\n';
}
```

#### [P1433 Eating Cheese](https://www.luogu.com.cn/problem/P1433)
DFS+State Compression

State Compression DP

<span style="color:#ffc000">(Don't understand, will come back after learning DP)</span>

```cpp
void solve() {
    int n;cin >> n;
    vector<array<double, 33000>> f(16);
    vector<int> vis(16);
    vector<pair<double, double>> p(16);
    auto dis = [&](int x, int y) {
        return sqrt((p[x].first - p[y].first) * (p[x].first - p[y].first) + (p[x].second - p[y].second) * (p[x].second - p[y].second));
        };
    for (int i = 1;i <= n;i++)cin >> p[i].first >> p[i].second;
    double ans = DBL_MAX;
    auto dfs = [&](auto self, int step, int x, int mark, double s) ->void {
        if (s > ans)return;
        if (step == n) {
            ans = min(ans, s);return;
        }
        for (int i = 1;i <= n;i++) {
            if (vis[i])continue;
            int m = mark + (1 << (i - 1));
            if (f[i][m] != 0 && f[i][m] <= s + dis(i, x))continue;
            vis[i] = 1;
            f[i][m] = s + dis(i, x);
            self(self, step + 1, i, m, f[i][m]);
            vis[i] = 0;
        }
        };
    dfs(dfs, 0, 0, 0, 0);
    cout << fixed << setprecision(2) << ans << '\n';
}
```

#### P1605 Maze
DFS

```cpp
void solve() {
    int n, m, t;cin >> n >> m >> t;
    vector<vector<int>> vis(n + 1, vector<int>(m + 1));
    int x1, y1, x2, y2;cin >> x1 >> y1 >> x2 >> y2;
    for (int i = 1;i <= t;i++) {
        int x, y;cin >> x >> y;vis[x][y] = 1;
    }
    int ans = 0;
    auto dfs = [&](auto self, int x, int y)->void {
        if (x == x2 && y == y2) {
            ans++;return;
        }
        for (int i = 0;i < 4;i++) {
            int a = x + dx[i], b = y + dy[i];
            if (a<1 || b<1 || a>n || b>m)continue;
            if (vis[a][b])continue;
            vis[a][b] = 1;
            self(self, a, b);
            vis[a][b] = 0;
        }
        };
    vis[x1][y1] = 1;
    dfs(dfs, x1, y1);
    cout << ans << '\n';
}
```

#### [P1101 Word Square](https://www.luogu.com.cn/problem/P1101)

```cpp
int dx[] = {0,0,1,-1,1,1,-1,-1};
int dy[] = {1,-1,0,0,1,-1,1,-1};
int vis[110][110];
void solve() {
    int n;string s[n];cin >> n;
    for (int i = 0;i < n;i++)cin >> s[i];
    string tar = "yizhong";
    auto find = [&](int x, int y) {
        for (int i = 0;i < 8;i++) {
            int step = 0;
            int a = x + dx[i], b = y + dy[i];
            if (a < 0 || b < 0 || a >= n || b >= n)continue;
            while (step < 6 && s[a][b] == tar[step + 1]) {
                a += dx[i]; b += dy[i];step++;
            }
            if (step == 6) {
                for (int j = 0;j < n;j++) {
                    for (int k = 0;k < n;k++) {
                        if (j == x && k == y) {
                            for (int p = 0;p < 7;p++) {
                                vis[j][k] = 1;j += dx[i], k += dy[i];
                            }
                            return;
                        }
                    }
                }
            }
        }
        };
    for (int i = 0;i < n;i++) {
        for (int j = 0;j < n;j++) {
            if (s[i][j] == 'y') {
                find(i, j);
            }
        }
    }
    for (int i = 0;i < n;i++) {
        for (int j = 0;j < n;j++) {
            if (vis[i][j]) {
                cout << s[i][j];
            } else {
                cout << '*';
            }
        }
        cout << '\n';
    }
}
```

#### [P2404 Natural Number Splitting Problem](https://www.luogu.com.cn/problem/P2404)
DFS
```cpp
int n;vector<int> a(10, 1);
void dfs(int m, int x) {
    for (int i = a[x - 1];i <= m;i++) {
        a[x] = i;m -= i;
        if (!m) {
            if (x == 1)return;
            for (int i = 1;i <= x - 1;i++) {
                cout << a[i] << "+";
            }
            cout << a[x] << '\n';
        } else dfs(m, x + 1);
        m += i;
    }
}
void solve() {
    cin >> n;
    dfs(n, 1);
}
```

#### [P1596 Lake Counting S](https://www.luogu.com.cn/problem/P1596)
DFS

```cpp
string s[110];
int n, m, vis[110][110];
int dx[] = {0,0,1,-1,1,1,-1,-1};
int dy[] = {1,-1,0,0,1,-1,1,-1};
void dfs(int x, int y) {
    for (int i = 0;i < 8;i++) {
        int a = x + dx[i], b = y + dy[i];
        if (a<1 || b<1 || a>n || b>m)continue;
        if (vis[a][b])continue;
        if (s[a][b] == '.')continue;
        vis[a][b] = 1;
        dfs(a, b);
    }
}
void solve() {
    cin >> n >> m;
    for (int i = 1;i <= n;i++) {
        string ss;cin >> ss;ss = ' ' + ss;s[i] = ss;
    }
    int cnt = 0;
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= m;j++) {
            if (s[i][j] == 'W' && !vis[i][j]) {
                vis[i][j] = 1;
                dfs(i, j);
                cnt++;
            }
        }
    }
    cout << cnt << '\n';
}
```

#### [P1162 Fill Color](https://www.luogu.com.cn/problem/P1162)
DFS/BFS

```cpp DFS
int n, s[35][35], vis[35][35], op[35][35];bool ok;
int dx[] = {1,-1,0,0};
int dy[] = {0,0,1,-1};
void dfs(int x, int y) {
    for (int i = 0;i < 4;i++) {
        int a = x + dx[i], b = y + dy[i];
        if (a<1 || b<1 || a>n || b>n) {
            ok = false;continue;
        }
        if (s[a][b])continue;
        if (vis[a][b])continue;
        vis[a][b] = 1;
        op[a][b] = 1;
        dfs(a, b);
    }
}
void solve() {
    cin >> n;
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= n;j++) {
            cin >> s[i][j];
        }
    }
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= n;j++) {
            if (!s[i][j] && !vis[i][j]) {
                ok = true;
                for (int k = 1;k <= n;k++) {
                    for (int p = 1;p <= n;p++) {
                        op[k][p] = 0;
                    }
                }
                vis[i][j] = 1;op[i][j] = 1;
                dfs(i, j);
                if (ok) {
                    for (int k = 1;k <= n;k++) {
                        for (int p = 1;p <= n;p++) {
                            if (op[k][p]) {
                                s[k][p] = 2;
                            }
                        }
                    }
                }
            }
        }
    }
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= n;j++) {
            cout << s[i][j] << " \n"[j == n];
        }
    }
}
```

BFS Method 1: Since the problem states there is only one ring, just scan the outer perimeter once.
```cpp
void solve() {
    cin >> n;
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= n;j++) {
            cin >> s[i][j];
        }
    }
    auto bfs = [&](int i, int j) ->void {
        if (s[i][j])return;
        queue<pair<int, int>>q;
        q.push({i,j});vis[i][j] = 1;
        while (q.size()) {
            auto [x, y] = q.front();q.pop();
            for (int i = 0;i < 4;i++) {
                int a = x + dx[i], b = y + dy[i];
                if (a<1 || b<1 || a>n || b>n)continue;
                if (vis[a][b])continue;
                if (s[a][b])continue;
                vis[a][b] = 1;
                q.push({a,b});
            }
        }
        };

    for (int i = 1;i <= n;i++) {
        bfs(1, i);bfs(i, 1);bfs(n, i);bfs(i, n);
    }

    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= m;j++) {
            if (!s[i][j] && !vis[i][j]) {
                s[i][j] = 2;
            }
            cout << s[i][j] << " \n"[j == n];
        }
    }
}
```

BFS Method 2: The idea here is the same as Method 1, but it's more concise by constructing an outer ring, and scanning the outer ring once simplifies the code.

```cpp
void solve() {
    cin >> n;
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= n;j++) {
            cin >> s[i][j];
        }
    }
    queue<pair<int, int>>q;
    q.push({1,1});vis[1][1] = 1;
    while (q.size()) {
        auto [x, y] = q.front();q.pop();
        for (int i = 0;i < 4;i++) {
            int a = x + dx[i], b = y + dy[i];
            if (a<0 || b<0 || a>n + 1 || b>n + 1)continue;
            if (vis[a][b])continue;
            if (s[a][b])continue;
            vis[a][b] = 1;
            q.push({a,b});
        }
    }

    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= n;j++) {
            if (!s[i][j] && !vis[i][j]) {
                s[i][j] = 2;
            }
            cout << s[i][j] << " \n"[j == n];
        }
    }
}
```

#### [P1032 String Transformation](https://www.luogu.com.cn/problem/P1032)
DFS / String (KMP $\dots$)

<span style="color:#ffc000">Correct solution -> Bidirectional BFS</span>

HACK:
```cpp
abaaaba abcdaba
a b
b d
d e
e f
f g
g c
```

```cpp
a aaaaa
a a112233445566778899
778899 a
112233 a
445 a
566 a
55 a
```

If using DFS, both of these test cases will cause string explosion and will definitely TLE, only passing with special handling.
```cpp Wrong solution
void solve() {
    int vis[20] = {};
    string aa, bb, a, b, x, y;cin >> aa >> bb;
    vector<string> op1, op2;
    if (aa.size() == bb.size()) {
        for (int i = 0;i < aa.size();i++) {
            if (aa[i] != bb[i]) {
                a.push_back(aa[i]);b.push_back(bb[i]);
            }
        }
    } else {
        a = aa;b = bb;
    }
    while (cin >> x >> y) {
        op1.push_back(x);
        op2.push_back(y);
    }
    int ans = 1e9;
    auto dfs = [&](auto self, int cnt)->void {
        if (cnt > 20) {
            cout << "NO ANSWER!" << '\n';exit(0);
        }
        if (a == b) {
            ans = min(ans, cnt);return;
        }
        for (int i = 0;i < a.size();i++) {
            for (int j = i;j < a.size();j++) {
                for (int k = 0;k < op1.size();k++) {
                    if (a.substr(i, j - i + 1) == op1[k] && !vis[k]) {
                        if (j - i + 1 == a.size()) {
                            vis[k] = 1;
                        }
                        string ss(a.begin() + i, a.begin() + j + 1);
                        a.replace(a.begin() + i, a.begin() + j + 1, op2[k]);
                        self(self, cnt + 1);
                        a.replace(a.begin() + i, a.begin() + j + 1 + op2.size() - op1.size(), ss);
                    }
                }
            }
        }
        };
    dfs(dfs, 0);
    if (ans > 10) {
        cout << "NO ANSWER!" << '\n';return;
    }
    cout << ans << '\n';
}
```

Correct solution: Bidirectional BFS:

Can be simplified to one segment in BFS.
```cpp
void solve() {
    string a, b, s1, s2;cin >> a >> b;
    vector<string> op1, op2;
    while (cin >> s1 >> s2) {
        op1.push_back(s1);
        op2.push_back(s2);
    }
    queue<string> qa, qb;unordered_map <string, int> ma, mb;
    qa.push(a), qb.push(b);ma[a] = 0, mb[b] = 0;
    int ans;
    auto bfs = [&](bool x)->int {
        if (!x) {
            int m = qa.size();
            while (m--) {
                auto s = qa.front();qa.pop();
                for (int i = 0;i < op1.size();i++) {
                    for (int j = 0;j + op1[i].size() - 1 < s.size();j++) {
                        if (s.substr(j, op1[i].size()) == op1[i]) {
                            string ss = s.substr(0, j) + op2[i] + s.substr(j + op1[i].size());
                            if (ma.count(ss))continue;
                            if (mb.count(ss))return ma[s] + mb[ss] + 1;
                            ma[ss] = ma[s] + 1;
                            qa.push(ss);
                        }
                    }
                }
            }
        } else {
            int m = qb.size();
            while (m--) {
                auto s = qb.front();qb.pop();
                for (int i = 0;i < op2.size();i++) {
                    for (int j = 0;j + op2[i].size() - 1 < s.size();j++) {
                        if (s.substr(j, op2[i].size()) == op2[i]) {
                            string ss = s.substr(0, j) + op1[i] + s.substr(j + op2[i].size());
                            if (mb.count(ss))continue;
                            if (ma.count(ss))return mb[s] + ma[ss] + 1;
                            mb[ss] = mb[s] + 1;
                            qb.push(ss);
                        }
                    }
                }
            }
        }
        return 11;
        };
    for (int i = 1;i <= 10;i++) {
        if (qa.size() <= qb.size()) {
            ans = bfs(0);
        } else {
            ans = bfs(1);
        }
        if (ans <= 10) {
            cout << ans << '\n';return;
        }
    }
    cout << "NO ANSWER!" << '\n';
}
```

#### P 1825 Corn Maze S
BFS but tricky

```cpp
char s[310][310];
int dis[310][310];
int dx[] = {0,0,1,-1};
int dy[] = {1,-1,0,0};
void solve() {
    int n, m;cin >> n >> m;
    int sx, sy, ex, ey;
    map<char, vector<pair<int, int>>>mp;
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= m;j++) {
            cin >> s[i][j];
            if (s[i][j] == '@') sx = i, sy = j;
            if (s[i][j] == '=') ex = i, ey = j;
            if (isupper(s[i][j])) {
                mp[s[i][j]].push_back({i,j});
            }
            dis[i][j] = -1;
        }
    }
    queue<pair<int, int>>q;
    q.push({sx,sy});dis[sx][sy] = 0;
    while (q.size()) {
        auto [x, y] = q.front();q.pop();
        if (x == ex && y == ey) {
            cout << dis[x][y] << '\n';return;
        }
        for (int i = 0;i < 4;i++) {
            int a = x + dx[i], b = y + dy[i];
            if (a<1 || b<1 || a>n || b>m || s[a][b] == '#')continue;
            if (dis[a][b] == -1 || isupper(s[a][b])) {
                if (isupper(s[a][b])) {
                    auto find = [&]()->pair<int, int> {
                        for (auto [j, k] : mp[s[a][b]]) {
                            if (j != a || k != b) {
                                return {j,k};
                            }
                        }
                        };
                    auto [j, k] = find();
                    if (dis[j][k] == -1) {
                        dis[j][k] = dis[x][y] + 1;
                    }
                    q.push({j,k});
                } else { // if (dis[a][b] == -1)
                    dis[a][b] = dis[x][y] + 1;
                    q.push({a,b});
                }
            }
        }
    }
}
```

### Problem Set 2:

#### [P1157 Combination Output](https://www.luogu.com.cn/problem/P1157)
DFS
```cpp
void solve() {
    int n, r;cin >> n >> r;
    vector<int> a(r + 1);
    auto dfs = [&](auto self, int x)->void {
        if (x > r) {
            for (int i = 1;i <= r;i++) {
                cout << setw(3) << a[i];
            }
            cout << '\n';
            return;
        }
        for (int i = a[x - 1] + 1;i <= n;i++) {
            a[x] = i;
            self(self, x + 1);
        }
        };
    dfs(dfs, 1);
}
```

#### [P1706 Full Permutation Problem](https://www.luogu.com.cn/problem/P1706)
DFS
```cpp next_permutation
void solve() {
    int n;cin >> n;vector<int>a(n + 1);
    for (int i = 1;i <= n;i++)a[i] = i, cout << setw(5) << a[i]; cout << '\n';
    while (next_permutation(a.begin() + 1, a.end())) {
        for (int i = 1;i <= n;i++)cout << setw(5) << a[i]; cout << '\n';
    }
}
```

```cpp DFS
void solve() {
    int n;cin >> n;vector<int>a(n + 1), vis(n + 1);
    auto dfs = [&](auto self, int x) ->void {
        if (x > n) {
            for (int i = 1;i <= n;i++)cout << setw(5) << a[i];cout << '\n';return;
        }
        for (int i = 1;i <= n;i++) {
            if (!vis[i]) {
                a[x] = i;
                vis[i] = 1;
                self(self, x + 1);
                vis[i] = 0;
            }
        }
        };
    dfs(dfs, 1);
}
```

#### [P1256 Display Image](https://www.luogu.com.cn/problem/P1256)
BFS
```cpp
int dis[200][200], vis[200][200];
int dx[] = {0,0,1,-1};
int dy[] = {1,-1,0,0};
void solve() {
    int n, m;cin >> n >> m;
    string s[n + 1];
    for (int i = 1;i <= n;i++) {
        string ss;cin >> ss;ss = ' ' + ss;s[i] = ss;
    }
    queue<pair<int, int>> q;
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= m;j++) {
            if (s[i][j] == '1') {
                vis[i][j] = 1;
                q.push({i,j});
            }
        }
    }
    while (q.size()) {
        auto [a, b] = q.front();q.pop();
        for (int i = 0;i < 4;i++) {
            int cx = a + dx[i], cy = b + dy[i];
            if (cx<1 || cy<1 || cx>n || cy>m || vis[cx][cy])continue;
            vis[cx][cy] = 1;
            dis[cx][cy] = dis[a][b] + 1;
            q.push({cx,cy});
        }
    }
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= m;j++) {
            cout << dis[i][j] << " \n"[j == m];
        }
    }
}
```

#### [P1683 Getting Started](https://www.luogu.com.cn/problem/P1683)
DFS/BFS

```cpp
char s[25][25];
bool vis[25][25];
int dx[] = {1, -1, 0, 0}, dy[] = {0, 0, 1, -1};
void solve() {
    int m, n;cin >> m >> n;
    int sx, sy;
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= m;j++) {
            cin >> s[i][j];
            if (s[i][j] == '@')sx = i, sy = j;
        }
    }
    queue<pair<int, int>> q;vis[sx][sy] = 1;q.push({sx,sy});
    while (q.size()) {
        auto [x, y] = q.front();q.pop();
        for (int i = 0;i < 4;i++) {
            int a = x + dx[i], b = y + dy[i];
            if (a<1 || b<1 || a>n || b>m || s[a][b] == '#' || vis[a][b])continue;
            vis[a][b] = 1;
            q.push({a,b});
        }
    }
    int cnt = 0;
    for (int i = 1;i <= n;i++) {
        cnt += count(vis[i] + 1, vis[i] + 1 + m, 1);
    }
    cout << cnt << '\n';
}
```

#### [P1454 Aurora on Christmas Eve](https://www.luogu.com.cn/problem/P1454)
DFS/BFS

```cpp
char s[110][110];
int vis[110][110];
int dx[] = {1, -1, 0, 0,1,1,-1,-1,2,-2,0,0};
int dy[] = {0, 0, 1, -1,1,-1,1,-1,0,0,2,-2};
void solve() {
    int n, m;cin >> n >> m;
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= m;j++) {
            cin >> s[i][j];
        }
    }
    auto bfs = [&](int sx, int sy) {
        queue<pair<int, int>> q;vis[sx][sy] = 1;q.push({sx,sy});
        while (q.size()) {
            auto [x, y] = q.front();q.pop();
            for (int i = 0;i < 12;i++) {
                int a = x + dx[i], b = y + dy[i];
                if (a<1 || b<1 || a>n || b>m || vis[a][b] || s[a][b] == '-')continue;
                vis[a][b] = 1;
                q.push({a,b});
            }
        }
        };
    int cnt = 0;
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= m;j++) {
            if (s[i][j] == '#' && !vis[i][j]) {
                bfs(i, j);cnt++;
            }
        }
    }
    cout << cnt << '\n';
}
```

#### [P2802 Going Home](https://www.luogu.com.cn/problem/P2802)
BFS

To ensure the shortest time, points with mice can only be visited once, while to avoid death as much as possible, normal points may be visited multiple times.
```cpp
int s[15][15], dis[15][15];
int dx[] = {0,0,1,-1};
int dy[] = {1,-1,0,0};
void solve() {
    int n, m;cin >> n >> m;
    int sx, sy, ex, ey;
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= m;j++) {
            cin >> s[i][j];
            if (s[i][j] == 2)sx = i, sy = j;
            if (s[i][j] == 3)ex = i, ey = j;
        }
    }
    queue<array<int, 4>>q;q.push({sx,sy,0,6});
    while (q.size()) {
        auto [x, y, step, hp] = q.front();q.pop();
        if (x == ex && y == ey) {
            cout << step << '\n';exit(0);
        }
        if (hp <= 1)continue;
        for (int i = 0;i < 4;i++) {
            int a = x + dx[i], b = y + dy[i];
            if (a<1 || b<1 || a>n || b>m || !s[a][b])continue;
            if (s[a][b] == 1 || s[a][b] == 3) {
                if (dis[a][b] < hp - 1) {
                    dis[a][b] = hp - 1;
                    q.push({a,b,step + 1,hp - 1});
                }
            }
            if (s[a][b] == 4) {
                if (!dis[a][b]) {
                    dis[a][b] = 1;
                    q.push({a,b,step + 1,6});
                }
            }
        }
    }
    cout << "-1\n";
}
```

#### [P6566 Stargazing](https://www.luogu.com.cn/problem/P6566)
BFS

```cpp
char s[1510][1510];
int vis[1510][1510];
int dx[] = {0,0,1,-1,1,1,-1,-1};
int dy[] = {1,-1,0,0,1,-1,1,-1};
void solve() {
    int n, m;cin >> n >> m;
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= m;j++) {
            cin >> s[i][j];
        }
    }
    map<int, int> mp;
    int cntvis = 0;
    auto bfs = [&](int sx, int sy) {
        queue<pair<int, int>>q;q.push({sx,sy});vis[sx][sy] = 1;cntvis++;
        while (q.size()) {
            auto [x, y] = q.front();q.pop();
            for (int i = 0;i < 8;i++) {
                int a = x + dx[i], b = y + dy[i];
                if (a<1 || b<1 || a>n || b>m || vis[a][b] || s[a][b] == '.')continue;
                vis[a][b] = 1;cntvis++;
                q.push({a,b});
            }
        }
        };
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= m;j++) {
            if (s[i][j] == '*' && !vis[i][j]) {
                int cnt = cntvis;
                bfs(i, j);
                mp[cntvis - cnt]++;
            }
        }
    }
    int ans = 0;
    for (auto [x, y] : mp) {
        ans = max(ans, x * y);
    }
    cout << mp.size() << " " << ans << '\n';
}
```

#### [P1746 Leaving Zhongshan Road](https://www.luogu.com.cn/problem/P1746)
BFS/Bidirectional BFS

Starting from both the start and end points simultaneously, mark the start point's path as 1 and the end point's path as 2. Once they meet, it's the shortest path.
```cpp Bidirectional BFS
char s[1010][1010];
int vis[1010][1010], dis[1010][1010], dx[] = {0,0,1,-1}, dy[] = {1,-1,0,0};
void solve() {
    int n;cin >> n;
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= n;j++) {
            cin >> s[i][j];
        }
    }
    int x1, y1, x2, y2;cin >> x1 >> y1 >> x2 >> y2;
    queue<pair<int, int>>q;
    q.push({x1,y1});q.push({x2,y2});vis[x1][y1] = 1;vis[x2][y2] = 2;
    while (q.size()) {
        auto [x, y] = q.front();q.pop();
        for (int i = 0;i < 4;i++) {
            int a = x + dx[i], b = y + dy[i];
            if (a<1 || b<1 || a>n || b>n || s[a][b] == '1')continue;
            if (vis[a][b] + vis[x][y] == 3) {
                cout << dis[a][b] + dis[x][y] + 1 << '\n';exit(0);
            }
            if (vis[a][b])continue;
            vis[a][b] = vis[x][y];
            dis[a][b] = dis[x][y] + 1;
            q.push({a,b});
        }
    }
}
```

#### [P2080 Improving Relationships](https://www.luogu.com.cn/problem/P2080)
DFS

Barely passed with 900ms
```cpp
void solve() {
    int n, v;cin >> n >> v;
    vector<pair<int, int>> a(n + 1);
    for (int i = 1;i <= n;i++) {
        int x, y;cin >> x >> y;
        a[i] = {x + y,x - y};
    }
    int ans = 1e9;
    auto dfs = [&](auto self, int x, int sum, int m)->void {
        if (sum >= v) {
            ans = min(ans, abs(m));
            if (!ans)return;
        }
        if (x >= n)return;
        self(self, x + 1, sum + a[x + 1].first, m + a[x + 1].second);
        self(self, x + 1, sum, m);
        };
    dfs(dfs, 0, 0, 0);
    if (ans == 1e9)ans = -1;
    cout << ans << '\n';
}
```

#### [P5635 The Best in the World](https://www.luogu.com.cn/problem/P5635)
Memoization Search

```cpp
int mod;short f[10010][10010];
int dfs(int x, int y) {
    if (f[x][y] == -1)return -1;
    if (f[x][y])return f[x][y];
    f[x][y] = -1;
    if (!x)return f[x][y] = 1;
    if (!y)return f[x][y] = 2;
    int num = (x + y) % mod;
    return f[x][y] = dfs(num, (num % mod + y) % mod);
}
void solve() {
    int x, y;cin >> x >> y;
    int ans = dfs(x, y);
    if (ans == -1)cout << "error\n";
    else cout << ans << '\n';
}
```
Or pass with a strange method.
```cpp
void solve() {
    int x, y;cin >> x >> y;
    int i = 1;
    while (x && y && i <= 10000) {
        x = (x + y) % mod;
        if (!x) {
            cout << "1\n";return;
        }
        y = (x + y) % mod;i++;
        if (!y) {
            cout << "2\n";return;
        }
    }
    cout << "error\n";
}
```

#### [P1332 Blood Vanguard](https://www.luogu.com.cn/problem/P1332)
BFS

```cpp
int vis[510][510], dis[510][510], dx[] = {1,-1,0,0}, dy[] = {0,0,1,-1};
void solve() {
    int n, m;cin >> n >> m;
    int a, b;cin >> a >> b;
    vector<pair<int, int>> t(b + 1);
    queue<pair<int, int>>q;
    for (int i = 1;i <= a;i++) {
        int x, y;cin >> x >> y;q.push({x,y});vis[x][y] = 1;
    }
    while (q.size()) {
        auto [x, y] = q.front();q.pop();

        for (int i = 0;i < 4;i++) {
            int cx = x + dx[i], cy = y + dy[i];
            if (cx<1 || cx>n || cy<1 || cy>m || vis[cx][cy])continue;
            vis[cx][cy] = 1;
            dis[cx][cy] = dis[x][y] + 1;
            q.push({cx,cy});
        }
    }
    for (int i = 1;i <= b;i++) {
        int x, y;cin >> x >> y;cout << dis[x][y] << '\n';
    }
}
```

#### [P1747 Strange Game](https://www.luogu.com.cn/problem/P1747)
BFS

```cpp
int dx[] = {1, -1, 1, -1, 2, 2, -2, -2,2,2,-2,-2};
int dy[] = {2, 2, -2, -2, -1, 1, -1, 1,2,-2,2,-2};
void solve() {
    int x1, y1;cin >> x1 >> y1;int x2, y2;cin >> x2 >> y2;

    auto bfs = [&](int n, int m) {
        int vis[50][50] = {}, dis[50][50] = {};
        queue<pair<int, int>>q;q.push({n,m});vis[n][m] = 1;
        while (q.size()) {
            auto [x, y] = q.front();q.pop();
            if (x == 1 && y == 1) {
                cout << dis[x][y] << '\n';break;
            }
            for (int i = 0;i < 12;i++) {
                int cx = x + dx[i], cy = y + dy[i];
                if (cx < 1 || cx>45 || cy < 1 || cy>45 || vis[cx][cy])continue;
                vis[cx][cy] = 1;
                dis[cx][cy] = dis[x][y] + 1;
                q.push({cx,cy});
            }
        }
        };
    bfs(x1, y1);
    bfs(x2, y2);
}
```

#### [P2919 Guarding the Farm S](https://www.luogu.com.cn/problem/P2919)
BFS/DFS

The special thing about this problem is that you need to search from large to small. You can use a heap.
```cpp
int s[710][710], vis[710][710];
array<int, 3> a[710 * 710];
int dx[] = {0,0,-1,1,1,1,-1,-1};
int dy[] = {1,-1,0,0,1,-1,1,-1};
void solve() {
    int n, m;cin >> n >> m;
    int cnt = 0;
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= m;j++) {
            cin >> s[i][j];
            a[++cnt][2] = s[i][j];
            a[cnt][0] = i, a[cnt][1] = j;
        }
    }
    sort(a + 1, a + 1 + cnt, [&](auto x, auto y) {
        return x[2] > y[2];
        });
    auto bfs = [&](int cx, int cy) {
        queue<pair<int, int>>q;q.push({cx,cy});vis[cx][cy] = 1;
        while (q.size()) {
            auto [x, y] = q.front();q.pop();
            for (int i = 0;i < 8;i++) {
                int a = x + dx[i], b = y + dy[i];
                if (a<1 || b<1 || a>n || b>m || vis[a][b])continue;
                if (s[a][b] > s[x][y]) continue;
                vis[a][b] = 1;q.push({a,b});
            }
        }
        };
    int ans = 0;
    for (int i = 1;i <= cnt;i++) {
        int x = a[i][0], y = a[i][1];
        if (vis[x][y])continue;
        bfs(x, y);ans++;
    }
    cout << ans << '\n';
}
```

#### [P2385 Bronze Lilypad Pond B](https://www.luogu.com.cn/problem/P2385)
BFS
```cpp
int a[35][35], vis[35][35], dis[35][35];
void solve() {
    int n, m, m1, m2;cin >> n >> m >> m1 >> m2;
    int dx[] = {m1,-m1,m2,-m2,m1,-m1,m2,-m2};
    int dy[] = {m2,m2,m1,m1,-m2,-m2,-m1,-m1};
    int sx, sy, ex, ey;
    for (int i = 1;i <= n;i++) {
        for (int j = 1;j <= m;j++) {
            cin >> a[i][j];
            if (a[i][j] == 3)sx = i, sy = j;
            if (a[i][j] == 4)ex = i, ey = j;
        }
    }
    queue<pair<int, int>>q;q.push({sx,sy});vis[sx][sy] = 1;
    while (q.size()) {
        auto [x, y] = q.front();q.pop();
        if (x == ex && y == ey) {
            cout << dis[x][y] << '\n';return;
        }
        for (int i = 0;i < 8;i++) {
            int cx = x + dx[i], cy = y + dy[i];
            if (cx<1 || cy<1 || cx>n || cy>m || vis[cx][cy] || a[cx][cy] == 0 || a[cx][cy] == 2)continue;
            vis[cx][cy] = 1;dis[cx][cy] = dis[x][y] + 1;
            q.push({cx,cy});
        }
    }
}
```

#### [P1790 Rectangle Splitting](https://www.luogu.com.cn/problem/P1790)
Similar problems:

- [P1817 Chessboard Coloring](https://www.luogu.com.cn/problem/P1817)
- [P4537 Rectangle](https://www.luogu.com.cn/problem/P4537)

The main approach for this type of rectangle splitting problem is usually: enumerate how to make the first cut, split the current state into two smaller subproblems, and then use memoization search for deduplication. The difficulty is not in the search itself, but in how to compress the "current rectangle's boundaries, color/obstacle state, whether it's legal to continue cutting" into a state that won't explode.

The remaining problems don't have much significance to solve.

