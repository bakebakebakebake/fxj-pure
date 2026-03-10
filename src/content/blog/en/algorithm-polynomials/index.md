---
title: "Why Polynomial Algorithms Matter in Competitive Programming"
description: From convolution, point-value representation, FFT/NTT to formal power series - understanding what this polynomial toolkit is really solving.
publishDate: 2024-09-15
tags:
  - Algorithm
  - Polynomial
  - FFT
  - NTT
  - Formal Power Series
language: English
heroImageSrc: ../../../pic/claudio-luiz-castro-_R95VMWyn7A-unsplash.jpg
heroImageColor: " #005fb8 "
---
> [!note] Explanation
> This is part of the "originally had too little local content, so rewriting by supplementing materials" section. The main storyline references the public materials of Jiang Yanyan and the polynomial directory of OI-Wiki, but the writing style tries to stick to the competition notes approach: first talk about when to think of it, then introduce the tool itself.

## Content Included

- `Why polynomials are worth learning`
- `Coefficient Representation / Point-value Representation / Interpolation`
- `Intuition for using FFT / NTT`
- `The position of Formal Power Series in competitions`
- `When to think about polynomials`

## Let's Address the Misconceptions First

Many people, upon first encountering polynomial algorithms, get intimidated by terms like:

- FFT
- NTT
- FWT
- Formal Power Series
- Polynomial Inversion / ln / exp / sqrt

Consequently, they easily misunderstand it as a "template zone."

However, if you only treat it as templates, two outcomes usually occur:

- You've seen the template, but still can't think of it when solving problems;
- You remember the operation names, but don't understand why convolution suddenly appears.

Now, I prefer to remember it this way:

- **Generating functions** are responsible for putting the problem into coefficients;
- **Polynomial algorithms** are responsible for efficiently processing these coefficients;
- The keyword that truly runs through them is only one: **convolution**.

## Polynomials are Not Just "Algorithms" First, They're a Container

After putting the sequence $a_0,a_1,\dots,a_n$ into

$$
A(x)=a_0+a_1x+\cdots+a_nx^n
$$

many operations originally scattered across sequences become unified algebraic operations.

### The Three Most Basic Operations

- Addition: adding term by term.
- Multiplication by a scalar: multiplying each term by a constant.
- Multiplication: convolution.

Multiplication is the most important:

$$
A(x)B(x)=\sum_{k\ge 0}\left(\sum_{i=0}^k a_i b_{k-i}\right)x^k
$$

That is, the coefficient of $x^k$ is exactly the sequence convolution:

$$
c_k = \sum_{i=0}^k a_i b_{k-i}
$$

So, whenever you see in a problem:

- Two independent contributions need to be combined;
- Counting the number of schemes based on "sum equals $k$";
- Each state is "convolved" from a whole segment of previous states;

Essentially, you are already very close to polynomial multiplication.

## Why Convolution is So Common

Convolution is not an exclusive term for polynomials; it appears frequently in competitions.

### Typical Scenarios

- Statistics of the distribution of sums of elements from two sets;
- Combining numbers of schemes;
- Correlation calculations in string matching;
- Batch transitions of a segment of DP;
- Generating function multiplication;
- The underlying core of formal power series operations.

Naive convolution is $O(n^2)$. It's sufficient for small scales, but once the length reaches $10^5$, you basically have to find a way to change the representation.

## Switching from Coefficient Representation to Point-value Representation

This is the most critical perspective shift in polynomials.

### Coefficient Representation

What we usually write is coefficient representation:

$$
A(x)=a_0+a_1x+\cdots+a_nx^n
$$

Advantages:

- Easy to model;
- Addition is very natural;
- Coefficients are the answer to the problem.

Disadvantages:

- Multiplication is too slow; naively it's $O(n^2)$.

### Point-value Representation

If you know the values of the polynomial at several points:

$$
(x_0, A(x_0)), (x_1, A(x_1)), \dots, (x_n, A(x_n))
$$

As long as there are enough points, this uniquely determines the polynomial of degree not exceeding $n$.

Then multiplication becomes very simple:

$$
C(x)=A(x)B(x) \Rightarrow C(x_i)=A(x_i)B(x_i)
$$

That is to say:

- In the coefficient domain, multiplication is hard;
- In the point-value domain, multiplication is just pointwise multiplication.

So the whole idea behind FFT / NTT is simply:

1. Coefficient representation $\to$ Point-value representation;
2. Pointwise multiplication;
3. Point-value representation $\to$ Coefficient representation.

## Why Interpolation is Important

The feasibility of this process essentially relies on one fact:

- A polynomial of degree not exceeding $n$ is uniquely determined by its values at $n+1$ distinct points.

This has two implications in competitions:

- When doing FFT / NTT, you need to interpolate back from the "point-value representation";
- Many problems themselves can be solved by "first finding values at a few points, then interpolating the overall expression", which is the line of Lagrange interpolation.

So polynomials aren't just about "accelerating multiplication"; they also provide a very practical way of thinking:

- An object might have completely different computational complexities under different representations.

> [!note]- Comparing the most common representations of polynomials
> - **Coefficient Representation**: Convenient for modeling, slow multiplication.
> - **Point-value Representation**: Fast multiplication, requires interpolation for recovery.
> - **Lagrange Interpolation**: When only a few point values are known, directly find the value at a specific point or recover the overall polynomial.
> - **Formal Power Series Representation**: Generalizes "finite-degree polynomials" to "infinite series where only the first few terms matter".

## What FFT Actually Does

FFT is not a new operation; it's a fast way to compute the DFT (Discrete Fourier Transform).

### Intuitive Understanding

If you directly evaluate a polynomial at several points, the complexity is still high. The brilliance of FFT lies in:

- Choosing a very special set of points, namely the roots of unity;
- Leveraging their symmetry to split a large problem into two smaller ones;
- Recursively / iteratively completing the evaluation and inverse transformation.

The most classic splitting method separates even and odd terms:

$$
A(x)=A_{even}(x^2)+xA_{odd}(x^2)
$$

When evaluating at the roots of unity, many points appear in pairs, and the recursive structure emerges naturally.

### Why Complexity Drops to $O(n\log n)$

- Each level halves the size;
- There are $\log n$ levels;
- Each level performs a linear number of "butterfly operations".

Thus, the total complexity is $O(n\log n)$.

### Practical Issues with FFT

FFT is often performed in the complex domain, which can lead to issues in competitions:

- Precision errors;
- Rounding problems;
- Stability issues when coefficients become too large.

Therefore, for convolution in a modular context, NTT is more commonly used.

## NTT: Moving FFT into a Finite Field

The core idea of NTT is the same as FFT, but it replaces the complex roots of unity with primitive roots in a modular sense.

### Why 998244353 is So Common

Because it satisfies:

$$
998244353 = 119 \times 2^{23} + 1
$$

This means it supports a root-of-unity structure of length $2^k$ (where $k \le 23$), making it very suitable for NTT.

### My Focus Points When Using NTT in Problems

- Whether the modulus is of the form $c\cdot 2^k + 1$;
- Whether a primitive root exists;
- The transform length must be padded to a power of 2;
- The roots for the forward and inverse transforms must be distinguished;
- Remember to multiply by the modular inverse of the length at the end of the inverse transform.

### A Commonly Used NTT Skeleton

```cpp title="Convolution skeleton under 998244353"
#include <bits/stdc++.h>
using namespace std;

constexpr int MOD = 998244353;
constexpr int G = 3;

long long qpow(long long a, long long b) {
    long long res = 1;
    while (b) {
        if (b & 1) res = res * a % MOD;
        a = a * a % MOD;
        b >>= 1;
    }
    return res;
}

void ntt(vector<int>& a, bool invert) {
    int n = (int)a.size();
    for (int i = 1, j = 0; i < n; ++i) {
        int bit = n >> 1;
        for (; j & bit; bit >>= 1) j ^= bit;
        j ^= bit;
        if (i < j) swap(a[i], a[j]);
    }

    for (int len = 2; len <= n; len <<= 1) {
        long long wn = qpow(G, (MOD - 1) / len);
        if (invert) wn = qpow(wn, MOD - 2);
        for (int i = 0; i < n; i += len) {
            long long w = 1;
            for (int j = 0; j < len / 2; ++j) {
                int u = a[i + j];
                int v = (int)(w * a[i + j + len / 2] % MOD);
                a[i + j] = u + v < MOD ? u + v : u + v - MOD;
                a[i + j + len / 2] = u - v >= 0 ? u - v : u - v + MOD;
                w = w * wn % MOD;
            }
        }
    }

    if (invert) {
        long long inv_n = qpow(n, MOD - 2);
        for (int& x : a) x = (int)(x * inv_n % MOD);
    }
}

vector<int> convolution(vector<int> a, vector<int> b) {
    int need = (int)a.size() + (int)b.size() - 1;
    int n = 1;
    while (n < need) n <<= 1;
    a.resize(n);
    b.resize(n);

    ntt(a, false);
    ntt(b, false);
    for (int i = 0; i < n; ++i) a[i] = (long long)a[i] * b[i] % MOD;
    ntt(a, true);

    a.resize(need);
    return a;
}
```

## Polynomials Can Do More Than Just "Multiply"

If you only understand it as convolution acceleration at this point, your perspective is still a bit narrow.

In competitions, polynomials usually lead directly to Formal Power Series (FPS).

### What Can Formal Power Series Do

If we treat

$$
A(x)=a_0+a_1x+a_2x^2+\cdots
$$

as an infinite series where we only care about the first few terms, we can define:

- Derivatives;
- Integrals;
- Inverse;
- Logarithm;
- Exponential;
- Square root.

These operations sound very "algebraic," but in competitions, they often correspond to:

- Batch solving complex recurrences;
- Encapsulating combinatorial structures;
- Unified processing interfaces for a class of problems.

### Why They All Come Back to Convolution

Because these advanced operations ultimately boil down to:

- Several polynomial multiplications;
- Newton's method;
- Derivatives / integrals combined with convolution.

So the real foundation is still convolution. If the FFT / NTT step isn't solid, the subsequent FPS operations won't hold up either.

## When to Think About Polynomials

This is the most important section for me.

### Signal 1: Existence of a "Large Convolution"

When you've already formulated the problem as

$$
c_k = \sum_{i=0}^k a_i b_{k-i}
$$

and the naive complexity is clearly too slow, polynomial multiplication is the primary candidate.

### Signal 2: Many States Need Unified Shifting / Combining

Some DP problems aren't difficult because of individual states, but because "each layer requires convolving the entire sequence."

If you pack the state sequence into a polynomial, the problem suddenly becomes much more structured.

### Signal 3: The Problem Hints at "Counting Distributions by Value Across a Whole Segment"

For example:

- Distribution of sums of two arrays;
- Distribution of sums after multiple choices;
- Counting matching contributions based on offset;
- A class of counting formulas requires finding all coefficients in bulk.

### Signal 4: Generating Functions Have Already Appeared

If the previous step of modeling has already led you to write a generating function, and you find that "the bottleneck is multiplication being too slow," then you've essentially arrived at the doorstep of polynomials.

## Don't Reverse the Learning Order

The order I find more effective now is:

1. First, understand convolution;
2. Then, understand the switch between coefficient representation and point-value representation;
3. Then, learn FFT / NTT;
4. Finally, delve into Formal Power Series.

If you start by memorizing "polynomial ln/exp/sqrt templates," the experience is usually terrible because you won't know what you're actually calculating.

> [!note]- The most common pitfalls when doing NTT
> - Not padding the length to a power of two.
> - Mismatch between modulus and primitive root.
> - Forgetting to multiply by $n^{-1}$ in the inverse transform.
> - Index out of bounds, especially in the step `need = a.size() + b.size() - 1`.
> - Poor modular normalization when coefficients might be negative.
> - The problem actually only needed naive convolution, but NTT was forced upon it, complicating the implementation unnecessarily.

## How I Would Characterize This Area

Polynomials are not a "show-off template library." They are more like a unified interface:

- You first turn the problem into coefficients;
- Then you turn operations on coefficients into algebraic operations;
- Finally, you use FFT / NTT / FPS to accelerate.

If you just memorize templates, you'll easily forget them;
If you first understand "why it becomes a convolution," many problems will naturally reveal their polynomial nature.

## References

- [OI-Wiki: Polynomial](https://oi-wiki.org/math/poly/)
- [OI-Wiki: Introduction to Polynomials](https://oi-wiki.org/math/poly/intro/)
- [Jiang Yanyan: Polynomial](https://www.bilibili.com/video/BV1PK4y1x7V4/)

## Practical Problem Solutions

### Problem 1: Large Number Multiplication (Basic FFT Application)

**Problem Description**:
Given two non-negative integers A and B, find the result of A × B.
- Constraints: The number of digits in A and B does not exceed 10^5.

**Idea Analysis**:

**Naive Approach**: Simulate vertical multiplication, time complexity O(n²)

**Optimization Idea**:
- Treat each digit of the number as a coefficient of a polynomial
- For example: 123 = 1×10² + 2×10¹ + 3×10⁰ corresponds to the polynomial 1x² + 2x + 3
- Multiplication of two numbers = Multiplication of two polynomials = Convolution
- Use FFT to accelerate convolution, time complexity O(n log n)

**Complete Code**:
```cpp
#include <bits/stdc++.h>
using namespace std;

const double PI = acos(-1.0);

struct Complex {
    double r, i;
    Complex(double r = 0, double i = 0) : r(r), i(i) {}
    Complex operator+(const Complex& b) const {
        return Complex(r + b.r, i + b.i);
    }
    Complex operator-(const Complex& b) const {
        return Complex(r - b.r, i - b.i);
    }
    Complex operator*(const Complex& b) const {
        return Complex(r * b.r - i * b.i, r * b.i + i * b.r);
    }
};

void FFT(vector<Complex>& a, int n, int inv) {
    if (n == 1) return;

    for (int i = 0, j = 0; i < n; i++) {
        if (i > j) swap(a[i], a[j]);
        for (int k = n >> 1; (j ^= k) < k; k >>= 1);
    }

    for (int len = 2; len <= n; len <<= 1) {
        Complex wn(cos(2 * PI / len), inv * sin(2 * PI / len));
        for (int i = 0; i < n; i += len) {
            Complex w(1, 0);
            for (int j = 0; j < len / 2; j++) {
                Complex u = a[i + j];
                Complex v = w * a[i + j + len / 2];
                a[i + j] = u + v;
                a[i + j + len / 2] = u - v;
                w = w * wn;
            }
        }
    }

    if (inv == -1) {
        for (int i = 0; i < n; i++) a[i].r /= n;
    }
}

string multiply(string num1, string num2) {
    int n1 = num1.size(), n2 = num2.size();
    int n = 1;
    while (n < n1 + n2) n <<= 1;

    vector<Complex> a(n), b(n);
    for (int i = 0; i < n1; i++) a[i].r = num1[n1 - 1 - i] - '0';
    for (int i = 0; i < n2; i++) b[i].r = num2[n2 - 1 - i] - '0';

    FFT(a, n, 1);
    FFT(b, n, 1);

    for (int i = 0; i < n; i++) a[i] = a[i] * b[i];

    FFT(a, n, -1);

    vector<int> result(n);
    for (int i = 0; i < n; i++) result[i] = (int)(a[i].r + 0.5);

    for (int i = 0; i < n - 1; i++) {
        result[i + 1] += result[i] / 10;
        result[i] %= 10;
    }

    int pos = n - 1;
    while (pos > 0 && result[pos] == 0) pos--;

    string ans;
    for (int i = pos; i >= 0; i--) ans += char(result[i] + '0');
    return ans;
}
```

**Performance Comparison**:
- Naive: O(10^10) - Timeout
- FFT: O(10^5 log 10^5) ≈ 0.5 seconds

**Pitfalls Encountered**:
1. Forgetting bit-reversal permutation
2. Forgetting to divide by n in the inverse transform
3. Array out-of-bounds during carry handling

### Problem 2: Polynomial Inversion (Luogu P4238)

**Problem Description**:
Given a polynomial f(x), find g(x) such that f(x)g(x) ≡ 1 (mod x^n).

**Idea**: Newton's Method + Doubling
- Recurrence formula: g(x) = 2g₀(x) - f(x)g₀²(x)
- Complexity: T(n) = T(n/2) + O(n log n) = O(n log n)

**Pitfall**: The primitive root for modulus 998244353 is 3.

### Problem 3: Generating Function Counting

**Problem**: There are n types of items. The i-th type has a[i] items, and its weight is i. Find the number of schemes to exactly fill a capacity of m.

**Modeling**:
- Generating function for the i-th item: 1 + x^i + x^(2i) + ... + x^(a[i]×i)
- Answer = Coefficient of x^m in the product of all generating functions

**Optimization**: NTT accelerates polynomial multiplication
- Naive DP: O(nm²) - Timeout
- Generating function + NTT: O(nm log m) - Accepted