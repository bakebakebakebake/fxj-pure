---
title: "From Convolution to Inversion: What Mobius Inversion Does"
description: Based on original number theory notes, covering Dirichlet convolution, Möbius function, inversion techniques, and common identities.
publishDate: 2024-09-13
tags:
  - Algorithm
  - Number Theory
  - Möbius Inversion
  - Dirichlet Convolution
  - Multiplicative Functions
language: English
heroImageSrc: ../../../pic/franco-debartolo-v3E6teZ_KUM-unsplash.jpg
heroImageColor: "#8d6540"
---
> [!note] Note
> This article continues with the approach of "prioritizing the original notes, supplementing the structure without forcibly altering the content." Your original part already includes the definition of convolution, the Möbius function, and the inversion formula. This time, the main goal is to smoothly connect the relationships between them: why convolution appears, why μ is introduced, and how to approach the inversion when you see it.

## Contents

- `Dirichlet Convolution`
- `Möbius Function`
- `Möbius Inversion`
- `Common Convolution Relations and Problem-Solving Entry Points`

## First, the Conclusion: What This Article Aims to Solve

At this point, a certain structure often appears in number theory problems:

- What you really want to find is some function $g(n)$;
- But the problem initially gives you $f(n)$, which is often the result of "accumulating $g$ over all its divisors";
- That is, a formula similar to
  $$
  f(n)=\sum_{d\mid n} g(d)
  $$

The most natural question then is:

- Given the "accumulated quantity," how do we deduce the original function?

This is precisely what Möbius inversion does. It's not a technique that appears out of thin air; it involves first writing the "summation over divisors" as a convolution, and then using $\mu * 1 = \epsilon$ to eliminate the $1$.

<!--steps-->

1.  **Identify the structure first**: Look at the summation in the problem. Is it expanding over "divisors/multiples"? For example, forms like <code>{"\sum_{d|n}"}</code> or <code>{"\sum_{d|\gcd(i,j)}"}</code>.
2.  **Write the expression as a convolution**: If it can be written as <code>f = g * 1</code>, <code>f = g * id</code>, etc., you are already very close to inversion.
3.  **Find the inverse function**: The most commonly used is <code>{"\mu * 1 = \epsilon"}</code>. By convolving both sides with <code>{"\mu"}</code>, the original function can be extracted.

## Dirichlet Convolution

In the form of a Dirichlet generating function:

$$
F(x)=\sum_{n=1}^{\infty} \frac{a_n}{n^x}
$$

Multiplication operation:

$$
F(x)G(x)=\sum_{n=1}^{\infty} \frac{1}{n^x}\sum_{d\mid n} a_d b_{\frac{n}{d}}
$$

This has the same flavor as "multiplication corresponds to convolution" in ordinary generating functions, except that ordinary convolution sums over "indices adding up," while here it sums over "factorization of the index."

> [!NOTE]
>  
> **Multiplicative function**: $f(1)=1$, and when $\gcd(a,b)=1$, $f(ab)=f(a)f(b)$.
>
> Both Euler's totient function and the Möbius function are multiplicative functions.
>
> For Euler's totient function, we have the property: $\displaystyle \sum_{d|n}\varphi(d)=n$.
>
> For the Möbius function, we have the property: $\displaystyle \sum_{d|n}\mu(d)=[n=1]$.
>
> For the relationship between the two: $\displaystyle \sum_{d|n}\mu(d) \frac{n}{d}=\varphi(n)$.

Define Dirichlet convolution:

$$
(f * g)(n)=\sum_{d\mid n} f(d)g\left(\frac{n}{d}\right)=\sum_{d\mid n} f\left(\frac{n}{d}\right)g(d)
$$

> It satisfies commutativity, associativity, and distributivity.

Three commonly used functions:

- Unit function: $\epsilon(n)=[n=1]$
- Constant function: $1(n)=1$
- Identity function: $id(n)=n$

We have: $f * \epsilon = f$, but $f * 1 \ne f$.

Common convolution relations:

- $\displaystyle \sum_{d\mid n}\mu(d)=[n=1] \leftrightarrow \mu * 1 = \epsilon$
- $\displaystyle \sum_{d\mid n}\varphi(d)=n \leftrightarrow \varphi * 1 = id$
- $\displaystyle \sum_{d\mid n}\mu(d) \frac{n}{d}=\varphi(n) \leftrightarrow \mu * id = \varphi$

### Why It Resembles Ordinary Convolution

If we denote ordinary convolution as:

$$
c_n=\sum_{i=0}^n a_i b_{n-i}
$$

Then Dirichlet convolution simply replaces "summation splitting" with "divisor splitting":

$$
c_n=\sum_{d\mid n} a_d b_{n/d}
$$

So the most important thing to remember in this entire line of thought is not the names, but:

- As long as the problem's structure involves "a number being contributed to by all its divisors," you should think of Dirichlet convolution;
- Once it can be written as a convolution, many equations suddenly become much more structured.

> [!note]- It's best to memorize these three convolution relations so you recognize them on sight
> 1. $\mu * 1 = \epsilon$
>    - This is the core of Möbius inversion.
> 2. $\varphi * 1 = id$
>    - Because $\sum_{d|n}\varphi(d)=n$.
> 3. $\mu * id = \varphi$
>    - This can be directly derived from the first two relations and often appears when dealing with sums involving `lcm/gcd`.
>
> When actually solving a problem, before rushing to apply inversion, first ask yourself: can this be rewritten as one of these standard convolution relations?

## The Möbius Function

Derived from Euler's totient function.

Definition of the Möbius function. Let $n$ be a composite number, and $p_1$ be the smallest prime factor of $n$.

$$
n'=\frac{n}{p_1}
$$

We have:

$$
\mu(n)=
\begin{cases}
0 & n' \bmod p_1 = 0 \\
-\mu(n') & \text{otherwise}
\end{cases}
$$

If $n$ is prime, then $\mu(n)=-1$.

That is:

$$
\mu(n)=
\begin{cases}
1 & n=1 \\
0 & \text{contains a squared prime factor} \\
(-1)^s & s=\text{number of distinct prime factors}
\end{cases}
$$

These three cases can be understood directly as:

- $n=1$: the defined value is $1$;
- As soon as a square factor appears, $\mu(n)=0$;
- If it's square-free, only the parity of the number of distinct prime factors matters.

### Why μ Becomes the Protagonist of Inversion

Because it exactly satisfies:

$$
\sum_{d\mid n} \mu(d) = [n=1]
$$

In convolution language, this is:

$$
\mu * 1 = \epsilon
$$

And $\epsilon$ acts as the "identity element" in convolution.

So whenever you see an expression that can be written as

$$
f = g * 1
$$

you can immediately convolve both sides with $\mu$:

$$
\mu * f = \mu * g * 1 = g * (\mu * 1) = g * \epsilon = g
$$

This step is essentially the essence of Möbius inversion.

## Möbius Inversion

> [!NOTE]+ Prerequisites
> 
> Define Dirichlet convolution:
>
> $$
> (f * g)(n)=\sum_{d\mid n} f(d)g\left(\frac{n}{d}\right)=\sum_{d\mid n} f\left(\frac{n}{d}\right)g(d)
> $$
>
> It satisfies commutativity, associativity, and distributivity.
>
> Three commonly used functions:
>
> - Unit function: $\epsilon(n)=[n=1]$
> - Constant function: $1(n)=1$
> - Identity function: $id(n)=n$
>
> We have: $f * \epsilon = f$, $f * 1 \ne f$.
>
> Common convolution relations:
>
> - $\displaystyle \sum_{d\mid n}\mu(d)=[n=1]\leftrightarrow \mu * 1 = \epsilon$
> - $\displaystyle \sum_{d\mid n}\varphi(d)=n\leftrightarrow \varphi * 1 = id$
> - $\displaystyle \sum_{d\mid n}\mu(d) \frac{n}{d}=\varphi(n)\leftrightarrow \mu * id = \varphi$

### Inversion Formula

$$
f(n)=\sum_{d\mid n} g(d)
\leftrightarrow
g(n)=\sum_{d\mid n} \mu(d) f\left(\frac{n}{d}\right)
$$

> When $f(n)$ and $g(n)$ are both multiplicative functions, $f(n)$ is called the Möbius transform of $g(n)$, and $g(n)$ is called the inverse Möbius transform of $f(n)$.

### Where Does This Formula Actually Come From?

If

$$
f = g * 1
$$

Then convolving both sides on the left with $\mu$:

$$
\mu * f = \mu * g * 1 = g * (\mu * 1) = g * \epsilon = g
$$

Writing this back in summation form, we get:

$$
g(n)=\sum_{d\mid n} \mu(d) f\left(\frac{n}{d}\right)
$$

So now I prefer to understand inversion as:

- First, write the "accumulation over divisors" as a convolution;
- Then, use $\mu$ to eliminate the $1$ that was convolved in.

### Common Entry Points When Solving Problems

<!--steps-->

1.  **Rewrite into the "standard divisor sum"**: Try to organize the expression in the problem into the form <code>{"f(n)=\sum_{d|n} g(d)"}</code> or <code>f=g*1</code>.
2.  **Decide whether to invert directly or continue simplifying**: Many problems don't end with simply applying the inversion formula; they often require combining it with techniques like division blocking, linear sieves, and prefix sums.
3.  **See which function is needed in the final answer**: If the result ends up involving <code>μ</code>, <code>φ</code>, or prefix sums of multiplicative functions, you'll usually need to proceed further with sieving methods and division blocking.

## A Feeling for the Most Common Routine

For example, given

$$
F(n)=\sum_{d\mid n} G(d)
$$

If you want to find $G(n)$, it's a direct inversion:

$$
G(n)=\sum_{d\mid n} \mu(d)F\left(\frac{n}{d}\right)
$$

However, if the problem is phrased as a sum over multiples, like

$$
F(n)=\sum_{k\ge 1} G(kn)
$$

it can often be transformed through substitution into a form of "counting over divisors/multiples," and then you can consider whether to apply inversion.

So when actually solving a problem, don't just stare at the formula's literal form. First, see if the core structure involves "divisor contributions being mixed together."

## Practice Problems

- [P1829 Crash's Digital Table / JZPTAB](https://www.luogu.com.cn/problem/P1829)
  - Find $\displaystyle \sum_{i=1}^n\sum_{j=1}^m \operatorname{lcm}(i,j) \bmod 20101009$
- [P2522 [HAOI 2011] Problem b](https://www.luogu.com.cn/problem/P2522)
  - Find $\displaystyle \sum_{i=x}^n\sum_{j=y}^m [\gcd(i,j)=k]$
- [LCMSUM](https://vjudge.net/problem/SPOJ-LCMSUM)
  - Find $\displaystyle \sum_{i=1}^n \operatorname{lcm}(i,n)$
- [LibreOJ 2185](https://loj.ac/problem/2185)
  - Find $\displaystyle \sum_{i=1}^n\sum_{j=1}^m d(i,j)$

The common point of these problems is:

- They all eventually involve enumeration over divisors;
- Inversion itself is often not the endpoint, but an intermediate step to "untangle the relationships";
- After untangling, they usually require combining with linear sieves, prefix sums of multiplicative functions, or division blocking.

## How to Remember This Article in the End

I now condense this line of thought into one sentence:

- Ordinary convolution handles "summation over indices";
- Dirichlet convolution handles "splitting by divisors";
- Möbius inversion is the process of "reconstructing the original quantity that was mixed together by summing over its divisors."