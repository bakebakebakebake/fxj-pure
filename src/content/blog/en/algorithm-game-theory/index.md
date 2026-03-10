---
title: "A Framework for Judging Game Theory in Contests"
description: Based on original game theory notes, supplementing the judgment framework, Bash/Nim, Misere games, Fibonacci game, Wythoff's game, and SG function.
publishDate: 2024-08-29
tags:
  - Algorithm
  - Game Theory
  - Nim
  - SG Function
language: English
heroImageSrc: ../../../pic/amanda-jones-P787-xixGio-unsplash.jpg
heroImageColor: " #730102 "
---

> [!note] Note
> This article continues following the original notes, without rewriting it into an "encyclopedia-style overview". The original content already covers Bash, Nim, Misere games, Fibonacci game, Wythoff's game, and SG function. This time, the main focus is to supplement "how to judge when encountering problems" into a more practical main thread.

## Content Covered

- `Original Game Theory Notes`
- `Entry Points for Problem Solving`
- `Conclusions and Notations for Several Common Models`

## My Current Judgment Order

Game theory problems are most likely to cause panic because the problem statements are often elaborate. However, the truly common entry points for most competitive programming problems are actually just a few:

<!--steps-->

1. First, determine if it's an impartial combinatorial game: Are the operations available to both sides completely symmetric? Will states repeat? Does the player who cannot move lose? Only if all these conditions are met is it worth going down the Nim / SG path.
2. Then see if it can be directly classified into a classic model: Bash, Nim, Misere Nim, Wythoff, Fibonacci game—these all have ready-made conclusions. If you can directly identify them, don't force yourself to derive them again.
3. If there are multiple independent sub-games, lean towards the SG theorem: Break the whole into several non-interfering parts, and in the end, it's often just XOR.
4. If the conclusion is not obvious, create a table to look for patterns: Many SG problems are not pure templates in the end, but rather calculate values in a small range first, then observe whether there's a period or simple expression.

## Original Game Theory Organization

Tutorials:

- [Algorithm Lecture 095 [Essential] Detailed Explanation of Game Theory Problems - Part 1](https://www.bilibili.com/video/BV1T5411i7Gg/?vd_source=cb670d82714ee9baee22c33ef083884d)
- [Algorithm Lecture 096 [Essential] Detailed Explanation of Game Theory Problems - Part 2](https://www.bilibili.com/video/BV1N94y1T7Mb/?vd_source=cb670d82714ee9baee22c33ef083884d)

Resources:

- [Games on arbitrary graphs - cp-algorithms](https://cp-algorithms.com/game_theory/games_on_graphs.html)
- [Brief Discussion on Algorithms—Game Theory - Wolfycz](https://www.cnblogs.com/Wolfycz/p/8430991.html)

### Concepts

#### Impartial Combinatorial Game

The game has two participants who take turns making decisions, and both know the complete information of the game;

The set of decisions that any player can make in a certain state is only related to the current state, not to the player;

The same state in the game cannot be reached multiple times. The game ends when a player cannot act, and the game must end in a finite number of steps without a draw.

#### Partizan Game

A Partizan Game differs from an impartial combinatorial game in that: in a Partizan Game, the set of decisions a player can make in a certain state is related to the player. Most board games are not impartial combinatorial games, such as chess, Chinese chess, Go, Gomoku, etc. (because both sides cannot use the opponent's pieces).

#### Misere Game

A Misere Game follows traditional game rules, but the winner is the first player who cannot act. Taking the Nim game as an example, in normal Nim, the player who takes the last stone wins, while in Misere Nim, the player who takes the last stone loses.

> [!note]- Why must we first determine if it's an impartial combinatorial game?
> Because the Nim and SG theorems that follow all hold by default in a very standard environment:
>
> - The operations available to both sides are completely symmetric;
> - The game will not loop infinitely;
> - Game state information is completely public;
> - The side that cannot act loses.
>
> If the problem itself doesn't satisfy these conditions, such as the two sides having different available actions, or there being a draw, or states going back and forth repeatedly, then don't directly apply SG.

## Bash Game

There are $n$ stones in total. Two people take turns taking stones, and each time they can take $1$ to $m$ stones. The side that has no stones to take loses.

Practice: [P4018 Roy&October Stone Taking](https://www.luogu.com.cn/problem/P4018)

The core conclusion of this model is:

- If $n \bmod (m+1)=0$, then the first player must lose;
- Otherwise, the first player must win.

The reason is also straightforward:

- The second player can always make the total number taken by both players in this round equal to $m+1$;
- This way, the situation will stably return to a multiple of $m+1$.

So these types of problems usually just wrap some narrative around the original model. It's enough to truly identify the shell of "taking $1\sim m$ items each time".

## Nim Game

$n$ piles of items, each pile has $a_i$ items. Two players take turns removing any number of items from any pile, but cannot take nothing.

The person who takes the last item wins.

Define Nim sum:

$$
a_1 \oplus a_2 \oplus a_3 \oplus \dots \oplus a_n
$$

If the Nim sum is $0$, then the second player wins; if not $0$, then the first player wins.

> That is, Nim sum $\ne 0$ is a winning state, Nim sum $=0$ is a losing state.
>
> - $0 \to \ne 0$: Once stones are taken, the parity of certain bits in binary will definitely change;
> - $\ne 0 \to 0$: You can always find a way to take stones that smooths out the highest bit, thus changing the situation back to an XOR sum of $0$.

Template problem: [P2197 [Template] Nim Game](https://www.luogu.com.cn/problem/P2197)

### My Notation for Nim

Don't just memorize it as "non-zero XOR sum means first player wins". A better way to remember it is:

- A situation with XOR sum of $0$ is a balanced state;
- Once you move it, this balance will definitely be broken;
- As long as the current state is not balanced, the first player can always pull it back to a balanced state through operations.

So when solving problems, what you really need to find is: Can the problem be transformed into several piles, where each step only changes one pile, and finally combines into an "overall XOR" model.

## Misere Game

Whoever takes the last item first loses. Everything else is the same as Nim.

> If all numbers are $1$, then win based on parity; otherwise, still judge by Nim sum: if Nim sum $\ne 0$, then the first player wins; if Nim sum $=0$, then the second player wins.

The most error-prone point here is:

- Don't copy the conclusion of normal Nim as is;
- What really needs special judgment is the end state near "all piles have only 1 left".

## Fibonacci Game (Fibonacci Game + Zeckendorf's Theorem)

[P6487 [COCI2010-2011#4] HRPA](https://www.luogu.com.cn/problem/P6487)

There are $n$ stones. Two players set the following rules for the game: guaranteed $2 \le n \le 10^{15}$.

- Mirko takes first, then Slavko takes, then Mirko takes again, and the two take turns taking stones, and so on;
- Mirko can take any number of stones on the first take;
- After that, each time at least one stone must be taken, and at most twice the number taken last time;
- The player who takes the last stone wins.

Both sides take stones with optimal strategy. Mirko wants to know how many stones he must take at least on the first take to win in the end.

> Zeckendorf's theorem: Any non-Fibonacci number can definitely be split into several non-adjacent Fibonacci numbers.
>
> If $n$ is a Fibonacci number, then the first player must lose and must take all directly.
>
> If $n$ is not a Fibonacci number, then the answer is the smallest term in the Zeckendorf representation.

```cpp title="Fibonacci Game"
ll fi[85];
void solve() {
    int n;cin >> n;
    fi[1] = 1;fi[2] = 1;
    for (int i = 3;i <= 80;i++)fi[i] = fi[i - 1] + fi[i - 2];
    while (n) {
        auto x = upper_bound(fi, fi + 80, n);
        if (*--x == n) {
            cout << n << '\n';return;
        }
        n -= *x;
    }
}
```

What should be remembered here is not the proof details, but:

- The losing states of this problem happen to fall on Fibonacci numbers;
- Non-Fibonacci numbers can use Zeckendorf representation to find how much to take the first time.

## Wythoff's Game

[P2252 [SHOI2002] Stone Taking Game / Wythoff's Game](https://www.luogu.com.cn/problem/P2252)

There are two piles of stones, any number, can be different. The game starts with two people taking turns taking stones.

There are two ways to take each time:

- You can take any number of stones from any pile;
- You can take the same number of stones from both piles at the same time.

The one who takes all the stones wins. Now given the initial number of stones in the two piles, is the first player the winner or the loser?

> Conclusion: Let the two piles of stones be $(a,b)$ and $a \le b$, if
> $$
> a = \lfloor (b-a)\varphi \rfloor
> $$
> where $\varphi = \frac{1+\sqrt 5}{2}$ is the golden ratio, then the first player must lose; otherwise, the first player must win.

In the original notes, it's recorded as "`small != (large-small) × golden ratio` then first player wins". When solving problems, it's actually judging whether the current situation falls on this cold position sequence.

## SG Function

The SG function (Sprague-Grundy function), the following is the method for solving the SG return value, commonly known as the mex process.

- The final losing point is $A$, stipulated $SG(A)=0$;
- Suppose the state point is $B$, then $SG(B)$ equals "check the SG values of all successor nodes of $B$, the smallest natural number that has not appeared";
- If $SG(B) \ne 0$, then state $B$ is a winning state; if $SG(B)=0$, then state $B$ is a losing state.

### SG Theorem

If an ICG game (total) consists of several independent ICG sub-games (part 1, part 2, part 3...), then:

$$
SG_{\text{total}} = SG_1 \oplus SG_2 \oplus SG_3 \oplus \cdots
$$

Any ICG game is like this. The correctness proof and the XOR idea of Nim game are the same.

### When Should You Think of SG

- The problem is not standard Nim;
- But each situation can go to several next situations;
- Multiple sub-situations are independent of each other;
- You only need to judge first player / second player win or lose, not necessarily require a specific plan.

At this time, it's very suitable to:

1. First define the state;
2. Enumerate which successor states each state can transition to;
3. Use mex to calculate SG;
4. Finally XOR multiple sub-games together.

> [!note]- Things I most often remind myself when doing SG problems
> - `SG = 0` is a losing state, `SG != 0` is a winning state.
> - Don't rush to draw a large graph, many problems can actually first create a small table to look for patterns.
> - If there are multiple independent parts in the problem, don't judge win or lose separately, XOR them in the end.
> - Once the problem doesn't satisfy the conditions of an impartial combinatorial game, don't mechanically apply SG.

## How to Remember This Article

If I could only leave one sentence, I would leave this judgment chain:

- If you can directly identify it as a classic model, prioritize identification;
- If you can't identify it, but the states are independent and the rules are symmetric, go towards SG;
- When SG can't be done, first create a table to look for patterns;
- The goal of the entire process is not to memorize formulas, but to quickly distinguish which type of game this problem belongs to.
