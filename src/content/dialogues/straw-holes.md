---
title: "On the Number of Holes in a Common Drinking Straw"
subtitle: "A multi-theoretic census."
date: "May 16, 2026"
kind: dialogue
readTime: "30 min"
coauthor: "Claude"
summary: "A mock arXiv preprint that answers how many holes a drinking straw has by computing one topological invariant after another—homotopy, homology, K-theory, bordism, and more—each returning the same value: one."
system: 4
---

> *arXiv:2605.31831 [math.AT] · Preprint · v4 · 16 May 2026*
>
> M. R. Annulus[^1] — Department of Beverage Topology, Institute for Applied Pedantry

> **Abstract.** We settle, with what we concede is gratuitous machinery, the recurring popular question of how many holes are possessed by a standard drinking straw. The straw is homotopy equivalent to the circle; we therefore compute its homotopy groups, singular and de Rham cohomology rings, group (co)homology, complex and real K-theory, oriented bordism, stable homotopy, and an Alexander-dual linking invariant. For each theory we recall its definition and meaning, exhibit a short proof, and identify the resulting generator with the unique hole. Every invariant designed to count holes returns the same value, namely $1$. The two boundary circles occasionally mistaken for additional holes are demonstrated to be boundary, not topology.
>
> **Keywords.** drinking straw · homotopy type · Bott periodicity · Alexander duality · beverage cylinder · Möbius distinction.
>  
> **MSC 2020.** 55-02, 55N15, 55N20, 55Q10, 57R75.

## § 1. Introduction

It is a recurring scandal of online life that the question *how many holes does a drinking straw have?* excites passionate disagreement; cf. [CV94] for a sober metaphysical treatment of holes as such. The proposed answers are typically *one*, *two*, or, in moments of zeal, *zero*. We resolve the matter using essentially every tool a graduate algebraic topology course leaves lying around [Hat02].

The strategy is elementary. A straw is homeomorphic to the cylinder $S^1\times[0,1]$, which deformation retracts onto its core circle $S^1$. Every homotopy-invariant feature of the straw therefore agrees with that of $S^1$. We compute these invariants in a representative selection of (co)homology theories. In each section we (i) recall the definition of the theory and what it measures, (ii) state the result, (iii) cite a standard reference, (iv) give a short proof, and (v) identify the generator with the unique hole.

<figure>
<svg viewBox="0 0 360 200" xmlns="http://www.w3.org/2000/svg" aria-label="A cylinder representing a straw, with its core circle marked in red.">
    <ellipse cx="160" cy="36" rx="56" ry="13" fill="#fffdf6" stroke="#1a1410" stroke-width="1.3"/>
    <ellipse cx="160" cy="36" rx="47" ry="10" fill="#faf2e2" stroke="#1a1410" stroke-width="0.9"/>
    <line x1="104" y1="36" x2="104" y2="170" stroke="#1a1410" stroke-width="1.3"/>
    <line x1="216" y1="36" x2="216" y2="170" stroke="#1a1410" stroke-width="1.3"/>
    <path d="M 104 170 A 56 13 0 0 0 216 170" fill="none" stroke="#1a1410" stroke-width="1.3"/>
    <path d="M 104 170 A 56 13 0 0 1 216 170" fill="none" stroke="#b8ad8e" stroke-width="1" stroke-dasharray="3 3"/>
    <ellipse cx="160" cy="103" rx="56" ry="13" fill="none" stroke="#7a1f1f" stroke-width="1.7" stroke-dasharray="5 3"/>
    <path d="M 216 103 L 212 100 L 212 106 Z" fill="#7a1f1f"/>
    <line x1="220" y1="103" x2="248" y2="103" stroke="#7a1f1f" stroke-width="1"/>
    <text x="252" y="100" font-family="EB Garamond, Garamond, serif" font-style="italic" font-size="15" fill="#7a1f1f">γ</text>
    <text x="252" y="116" font-family="EB Garamond, Garamond, serif" font-size="11" fill="#6e6448">core circle</text>
  </svg>
</figure>

**Figure 1.** **Figure 1.** A straw $X \simeq S^1\times[0,1]$ with its core circle $\gamma$ (dashed) representing the generator of $H_1(X;\mathbb{Z})$.

## § 2. A multi-theoretic census

Throughout, $X$ denotes a fixed straw.

**Definition.** A *straw* is a topological space $X$ homeomorphic to $S^1\times[0,1]$. The boundary circles $S^1\times\{0\}$ and $S^1\times\{1\}$ are called the *mouth* and the *foot*; the open subset $S^1\times(0,1)$ is the *bore*.

The projection $S^1\times[0,1]\to S^1$ is a deformation retraction, so $X\simeq S^1$. This single fact will do almost all of the work below.

### § 2.1. Homotopy groups

The homotopy groups $\pi_n(X,x_0)$ are defined as based-homotopy classes of maps $(S^n,*)\to(X,x_0)$, with group structure given by concatenation of loops (for $n=1$) or by stacking on cubical faces (for $n\geq 2$). They are the finest classical invariants we shall consider: $\pi_n$ records precisely which $n$-spheres can be mapped into $X$ up to deformation.

The circle is the prototypical Eilenberg–MacLane space $K(\mathbb{Z},1)$; the standard reference is Hatcher [Hat02, Thm 1.7 & §4.1]:

$$
\begin{aligned}
 \pi_1(X) &= \mathbb{Z}, \\
 \pi_n(X) &= 0 \quad (n \neq 1).
 \end{aligned}
$$

*Sketch.* The map $p\colon\mathbb{R}\to S^1,\ t\mapsto e^{2\pi i t}$ is the universal covering, with fibre $\mathbb{Z}$. The path-lifting property gives a unique lift $\widetilde\ell$ of each loop $\ell\colon[0,1]\to S^1$ with $\widetilde\ell(0)=0$, and the difference $\widetilde\ell(1)-\widetilde\ell(0)\in\mathbb{Z}$ — the *winding number* — depends only on the homotopy class of $\ell$. The resulting map $\pi_1(S^1)\to\mathbb{Z}$ is a bijection.

For $n\geq 2$, the covering map induces an isomorphism $\pi_n(\mathbb{R})\xrightarrow{\sim}\pi_n(S^1)$, and $\pi_n(\mathbb{R})=0$ because $\mathbb{R}$ is contractible. Hence $\pi_1$ has a single free generator (the loop $\gamma$ winding once through the bore) and all higher $\pi_n$ vanish — one hole's worth of loops. ∎

### § 2.2. Singular homology

Singular homology is built from *chains*: formal $\mathbb{Z}$-linear combinations of continuous maps $\Delta^n\to X$, quotiented by the relation $\partial^2=0$. The resulting groups $H_n(X;\mathbb{Z})$ measure $n$-cycles that fail to bound — informally, $n$-dimensional voids that $X$ is unable to fill in.

With integer coefficients, see [Hat02, Ex. 2.23]:

$$
\begin{aligned}
 H_0(X;\mathbb{Z}) &= \mathbb{Z}, \\
 H_1(X;\mathbb{Z}) &= \mathbb{Z}, \\
 H_n(X;\mathbb{Z}) &= 0 \quad (n \geq 2).
 \end{aligned}
$$

*Sketch.* Equip $S^1$ with the minimal CW structure: one $0$-cell $e^0$ and one $1$-cell $e^1$ with both endpoints attached to $e^0$. The cellular chain complex is

$$
0\longrightarrow \mathbb{Z}\langle e^1\rangle \xrightarrow{\;\partial\;} \mathbb{Z}\langle e^0\rangle\longrightarrow 0,
$$

and $\partial e^1=e^0-e^0=0$ since the two attaching endpoints cancel with opposite orientations. The homology of this complex is $\mathbb{Z}$ in degrees $0$ and $1$ and zero elsewhere. The single $\mathbb{Z}$ in degree one is generated by the fundamental class $[\gamma]$ of the core circle — the unique non-bounding $1$-cycle — and this is the hole. ∎

**Remark.** The mouth and foot cobound the cylinder and are therefore homologous in $X$. They contribute jointly to the single generator of $H_1$, not separately. This is the principal source of the popular two-hole heresy.

### § 2.3. Cohomology ring

Cohomology is the dual construction to homology: *cochains* are $\mathbb{Z}$-linear functions on chains, and the coboundary is the formal adjoint of $\partial$. The *cup product* $\smile$ then makes $H^*(X;\mathbb{Z})$ into a graded-commutative ring, whose multiplicative structure records how lower-dimensional cohomology classes assemble into higher-dimensional ones.

As a graded ring, after [Hat02, Ex. 3.13],

$$
H^*(X;\mathbb{Z}) \;\cong\; \mathbb{Z}[\alpha]\big/(\alpha^2),
$$

the exterior algebra on a one-dimensional generator $\alpha$.

*Sketch.* Since $H_*(X;\mathbb{Z})$ is free, the Universal Coefficient Theorem gives $H^n(X;\mathbb{Z})\cong\mathrm{Hom}(H_n(X;\mathbb{Z}),\mathbb{Z})$, so $H^0=H^1=\mathbb{Z}$ and $H^n=0$ for $n\geq 2$. For the ring structure, the cup product $\smile\colon H^1\otimes H^1\to H^2$ lands in the zero group, hence $\alpha\cup\alpha=0$ for any $\alpha\in H^1$. Therefore $H^*$ is generated by the single class $\alpha$ dual to $[\gamma]$, with $\alpha^2=0$ — one generator, one hole, no further structure. ∎

### § 2.4. de Rham cohomology

For a smooth manifold $M$, de Rham cohomology is the quotient $H^k_{\mathrm{dR}}(M)=\{\text{closed }k\text{-forms}\}/\{\text{exact }k\text{-forms}\}$. It measures the obstruction to a closed differential form being globally exact, and by the de Rham theorem agrees with singular cohomology over $\mathbb{R}$.

Working on the smooth open straw $S^1\times\mathbb{R}$, after [BT82, §I.4],

$$
\begin{aligned}
 H^0_{\mathrm{dR}}(X) &= \mathbb{R}, \\
 H^1_{\mathrm{dR}}(X) &= \mathbb{R}\cdot[d\theta].
 \end{aligned}
$$

*Sketch.* The angular one-form $d\theta$ is globally well-defined on $S^1\cong\mathbb{R}/2\pi\mathbb{Z}$ even though $\theta$ is only a local coordinate, and it is closed because every $1$-form on a $1$-manifold is. It is *not* exact: if $d\theta=df$ for some smooth $f$, then by the fundamental theorem of calculus $\oint_\gamma d\theta=0$, contradicting the explicit computation $\oint_\gamma d\theta=2\pi$.

By the de Rham theorem, $H^*_{\mathrm{dR}}(X;\mathbb{R})\cong H^*(X;\mathbb{R})$, so $H^1_{\mathrm{dR}}$ has rank one and must be generated by $[d\theta]$. The class $[d\theta]$ is precisely the obstruction to a closed $1$-form on the straw being exact, and this obstruction *is* the hole. ∎

### § 2.5. Group (co)homology

The (co)homology of a discrete group $G$ may be defined either as the derived functors of the $G$-invariants functor on $G$-modules or, equivalently, as the singular (co)homology of the classifying space $BG=K(G,1)$. It records intrinsic algebraic data about $G$ — extensions, characteristic classes, central extensions — in topological form.

The circle is the classifying space $B\mathbb{Z}=K(\mathbb{Z},1)$ [Bro82, Ch. II], hence

$$
\begin{aligned}
 H_*(X;\mathbb{Z}) &= H_*(\mathbb{Z};\mathbb{Z}), \\
 H^*(X;\mathbb{Z}) &= H^*(\mathbb{Z};\mathbb{Z}).
 \end{aligned}
$$

*Sketch.* The group $\mathbb{Z}$ admits the short free resolution

$$
0\longrightarrow \mathbb{Z}[\mathbb{Z}] \xrightarrow{\,t-1\,} \mathbb{Z}[\mathbb{Z}] \xrightarrow{\;\varepsilon\;} \mathbb{Z}\longrightarrow 0
$$

as $\mathbb{Z}[\mathbb{Z}]=\mathbb{Z}[t,t^{-1}]$-modules, where $\varepsilon$ is the augmentation. Applying $-\otimes_{\mathbb{Z}[\mathbb{Z}]}\mathbb{Z}$ collapses $t-1$ to the zero map, leaving $\mathbb{Z}\xrightarrow{0}\mathbb{Z}$ and so $H_0(\mathbb{Z};\mathbb{Z})=H_1(\mathbb{Z};\mathbb{Z})=\mathbb{Z}$, $H_n=0$ otherwise. Equivalently, $S^1=B\mathbb{Z}$, so the group (co)homology of $\mathbb{Z}$ is, by definition, the (co)homology of $S^1$. The hole of the straw is the rank-one freeness of the integers as a group. ∎

### § 2.6. Complex K-theory

Complex K-theory $K^*(X)$ is built from the Grothendieck group of stable isomorphism classes of complex vector bundles on $X$, extended to a $\mathbb{Z}/2$-graded cohomology theory by Bott periodicity ($K^{n+2}\cong K^n$). It records the same broad type of information as ordinary cohomology, but with linear data over $X$ in place of cycles, and is closer to the differential geometry of the space.

After [Ati67, §1.4] and [Bot59],

$$
\begin{aligned}
 K^0(X) &= \mathbb{Z}, \\
 \widetilde K^{\,0}(X) &= 0, \\
 K^1(X) &= \mathbb{Z}.
 \end{aligned}
$$

*Sketch.* A complex vector bundle on $S^1$ is determined by its clutching function, an element of $\pi_0\, GL_n(\mathbb{C})$; since $GL_n(\mathbb{C})$ deformation-retracts onto $U(n)$ and $\pi_0\,U(n)=0$ for all $n$, every complex bundle on $S^1$ is trivial. Hence $\widetilde K^{\,0}(X)=0$ and $K^0(X)=\mathbb{Z}$ records rank only.

For the odd part, $K^1(X)=[X,U]_*=\pi_1(U)=\mathbb{Z}$ by the Bott periodicity theorem [Bot59]; the generator is the clutching function $z\mapsto z$, which represents the same loop as the core circle $\gamma$. The single $\mathbb{Z}$ in $K^1$ is the hole, this time recorded as a one-parameter family of inequivalent automorphisms over the bore. ∎

### § 2.7. Real K-theory; or, the Möbius distinction

Real K-theory $KO^*(X)$ is the analogue of complex K-theory using real rather than complex vector bundles, with Bott periodicity of order $8$ rather than $2$. The richer periodicity makes $KO$ sensitive to orientation, spin structure, and other real-geometric features that are invisible to either ordinary cohomology or complex K-theory.

After [Hus94, §16] and [Bot59],

$$
\widetilde{KO}^{\,0}(X) \;=\; \mathbb{Z}/2,
$$

generated by the Möbius line bundle.

*Sketch.* Real $n$-plane bundles on $S^1$ are classified by their clutching function $S^0\to O(n)$, i.e. by $\pi_0\, O(n)=\mathbb{Z}/2$ — the orientation component. The trivial element gives the trivial bundle; the nontrivial element gives the (rank-$n$) Möbius bundle. Stabilising in $n$ yields $\widetilde{KO}^{\,0}(S^1)=\mathbb{Z}/2$. Equivalently, by Bott periodicity for $KO$ (period $8$, with $\pi_*KO=\mathbb{Z},\mathbb{Z}/2,\mathbb{Z}/2,0,\mathbb{Z},0,0,0$), one has $\widetilde{KO}^{\,0}(S^1)=KO^{-1}(\mathrm{pt})=\pi_1(KO)=\mathbb{Z}/2$.

The group is cyclic on one generator: the same hole, but with strictly more information attached than complex K-theory or singular cohomology can carry. In particular, the straw and the Möbius strip — homotopy-equivalent and so indistinguishable to $H_*$ and $K^*$ — represent the trivial and nontrivial classes respectively, certifying the cylinder under consideration as a bona fide untwisted straw. ∎

### § 2.8. Oriented bordism

Oriented bordism $\Omega_n^{SO}(X)$ consists of equivalence classes of maps $f\colon M^n\to X$ from closed oriented $n$-manifolds, where $f_0\sim f_1$ iff they jointly extend over an oriented $(n{+}1)$-manifold-with-boundary mapping to $X$. It is a generalised homology theory whose cycles are honest manifolds rather than formal sums of simplices.

The coefficients vanish, $\Omega_1^{SO}(\mathrm{pt})=0$ [Sto68, Ch. VI], but the Atiyah–Hirzebruch spectral sequence yields

$$
\Omega_1^{SO}(X) \;=\; \mathbb{Z}.
$$

*Sketch.* The Atiyah–Hirzebruch spectral sequence for the generalised homology theory $\Omega_*^{SO}$ has $E^2_{p,q}=H_p(X;\Omega_q^{SO}(\mathrm{pt}))\Rightarrow\Omega_{p+q}^{SO}(X)$ [Sto68, Ch. VI], [MS74, App. A]. With $\Omega_0^{SO}=\mathbb{Z}$ and $\Omega_1^{SO}=0$, the relevant entries are $E^2_{1,0}=H_1(S^1;\mathbb{Z})=\mathbb{Z}$ and $E^2_{0,1}=0$; no differentials are possible into or out of these positions in total degree $\leq 1$, so $\Omega_1^{SO}(X)=\mathbb{Z}$.

A geometric representative for the generator is the inclusion $\gamma\colon S^1\hookrightarrow X$ of the core circle; the bordism class of a map $f\colon M^1\to S^1$ from a closed oriented $1$-manifold is detected by its total degree, $\Omega_1^{SO}(S^1)\xrightarrow{\sim}\mathbb{Z}$. The single $\mathbb{Z}$ is the hole, this time witnessed by oriented manifolds mapping into the bore. ∎

### § 2.9. Stable homotopy

Stable homotopy is the homology theory associated to the sphere spectrum, defined by $\widetilde\pi_n^{\,s}(X)=\mathrm{colim}_k\, \pi_{n+k}(\Sigma^k X)$ — homotopy classes of maps, stabilised under suspension. It is the *universal* generalised homology theory: every other homology theory receives a unique natural transformation from it.

After [Ada74, §2] and [Rav86, Ch. 1],

$$
\widetilde\pi_n^{\,s}(X) \;\cong\; \pi_{n-1}^{\,s},
$$

so the stable invariants of a straw are a degree shift of the stable stems:

$$
\begin{aligned}
 &\mathbb{Z}, \;\mathbb{Z}/2, \;\mathbb{Z}/2, \;\mathbb{Z}/24, \\
 &0, \;0, \;\mathbb{Z}/2, \;\mathbb{Z}/240, \;\ldots
 \end{aligned}
$$

*Sketch.* The suspension isomorphism $\widetilde\pi_n^{\,s}(\Sigma Y)\cong\widetilde\pi_{n-1}^{\,s}(Y)$ is the defining shift property of the sphere spectrum [Ada74, §3]. Since $S^1\cong \Sigma S^0$, we obtain $\widetilde\pi_n^{\,s}(S^1)\cong\widetilde\pi_{n-1}^{\,s}(S^0)=\pi_{n-1}^{\,s}$, the $(n{-}1)$th stable stem. The first values are classical computations via the Adams spectral sequence and the $J$-homomorphism: $\pi_0^s=\mathbb{Z}$ (degree), $\pi_1^s=\mathbb{Z}/2\langle\eta\rangle$, $\pi_2^s=\mathbb{Z}/2\langle\eta^2\rangle$, $\pi_3^s=\mathbb{Z}/24\langle\nu\rangle$, $\pi_4^s=\pi_5^s=0$, $\pi_6^s=\mathbb{Z}/2\langle\nu^2\rangle$, $\pi_7^s=\mathbb{Z}/240\langle\sigma\rangle$ [Rav86, §1.1].

The hole shows up cleanly in degree $1$: $\widetilde\pi_1^{\,s}(X)=\pi_0^s=\mathbb{Z}$, generated by the inclusion of $\gamma$. Every other class is a fact about the geometry of exotic spheres which, by an accident of stable algebra, also pertains to the straw. ∎

### § 2.10. Alexander duality, and why the hands agree

Alexander duality is not itself a (co)homology theory but a *theorem* relating the homology of a compact, locally contractible subspace $K\subset S^n$ to the cohomology of its complement: $\widetilde H_i(S^n\!\setminus\! K)\cong\widetilde H^{n-i-1}(K)$. The pairing is implemented geometrically by the linking number, which counts how many times a cycle in the complement winds around a cycle in $K$.

Embed the core $\gamma\colon S^1 \hookrightarrow S^3$. By Alexander duality [Hat02, Thm 3.44], [Mun84, §74],

$$
\widetilde H_1\big(S^3\setminus S^1\big) \;\cong\; \widetilde H^{\,1}(S^1) \;=\; \mathbb{Z},
$$

and the linking pairing

$$
H_1(X) \;\otimes\; H_1(S^3\!\setminus\!X) \;\longrightarrow\; \mathbb{Z}
$$

is the identity.

*Sketch.* For a compact, locally contractible $K\subset S^n$, Alexander duality asserts $\widetilde H_i(S^n\!\setminus\! K;\mathbb{Z})\cong\widetilde H^{n-i-1}(K;\mathbb{Z})$ [Hat02, Thm 3.44]. Taking $K=S^1$ and $n=3$, $i=1$, gives $\widetilde H_1(S^3\setminus S^1)\cong\widetilde H^{\,1}(S^1)=\mathbb{Z}$. The duality is implemented by the linking-number pairing $\mathrm{lk}\colon H_1(K)\otimes H_1(S^3\setminus K)\to\mathbb{Z}$, which with one generator on each side is the identity matrix.

Translated to the kitchen: there is exactly one independent way to thread a closed loop through the straw, and its threading is detected by the linking number with the core circle $\gamma$. This is the invariant one computes physically by passing a piece of string through the bore — fingers and Alexander agree. ∎

## § 3. Conclusion

**Theorem (Main Theorem).** Every (co)homological invariant designed to count holes returns the same value when evaluated on a drinking straw, namely $\;1\;$.

The two-hole interpretation conflates *boundary* with *topology*: the straw has two boundary circles, but they cobound the cylinder and represent a single class in $H_1$. The zero-hole interpretation conflates contractibility with embeddedness in $\mathbb{R}^3$, an error we do not dignify further. We rest.

***Funding** Unfunded. The corresponding author paid for the straw out of pocket.*

***Data availability** The straw used in this study is available from the corresponding author upon reasonable request and a self-addressed envelope.*

***Competing interests** The author drinks primarily through straws.*

***Acknowledgements** The original question was posed in a moot on the Bluesky social network [TKB26]; the author thanks the moot for the prompt and acknowledges that no part of this work is, strictly speaking, necessary.*

## References

- **[Ada74]** J. F. Adams. *Stable Homotopy and Generalised Homology*. Chicago Lectures in Mathematics. University of Chicago Press, 1974.
- **[Ati67]** M. F. Atiyah. *K-Theory*. W. A. Benjamin, New York, 1967.
- **[Bot59]** R. Bott. The stable homotopy of the classical groups. *Ann. of Math.* (2) **70** (1959), 313–337.
- **[BT82]** R. Bott and L. W. Tu. *Differential Forms in Algebraic Topology*. Graduate Texts in Mathematics **82**. Springer, 1982.
- **[Bro82]** K. S. Brown. *Cohomology of Groups*. Graduate Texts in Mathematics **87**. Springer, 1982.
- **[CV94]** R. Casati and A. C. Varzi. *Holes and Other Superficialities*. MIT Press, Cambridge, MA, 1994.
- **[Hat02]** A. Hatcher. *Algebraic Topology*. Cambridge University Press, 2002.
- **[Hus94]** D. Husemoller. *Fibre Bundles*. Graduate Texts in Mathematics **20**. Springer, 3rd ed., 1994.
- **[MS74]** J. W. Milnor and J. D. Stasheff. *Characteristic Classes*. Annals of Mathematics Studies **76**. Princeton University Press, 1974.
- **[Mun84]** J. R. Munkres. *Elements of Algebraic Topology*. Addison–Wesley, Menlo Park, CA, 1984.
- **[Rav86]** D. C. Ravenel. *Complex Cobordism and the Stable Homotopy Groups of Spheres*. Pure and Applied Mathematics **121**. Academic Press, 1986.
- **[Sto68]** R. E. Stong. *Notes on Cobordism Theory*. Mathematical Notes. Princeton University Press, 1968.
- **[TKB26]** T. Kellogg *et al.* (The Moot of Bluesky). How many holes does a straw have? Bluesky Social, 2026. bsky.app/profile/timkellogg.me/post/3mlwoaj4hes2z

[^1]: Correspondence to annulus@beverage-topology.example. The author is grateful to the editor for accepting the only paper they have ever written that begins with a straw.
