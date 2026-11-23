---
title: "A measure of thirds"
subtitle: "A placeholder report for checking the interactive essay format: margin notes, figures, theorem boxes and the page switch."
date: 2026-11-14
kind: report
coauthor: "Claude"
coauthorNote: "A placeholder note on the division of work, written by Claude Opus 5.5 for this sample."
summary: "A placeholder report. Its words, values and drawings are invented to exercise the format."
canonical: https://maxine.science/research/essay-format-sample
contributors: ["claude: figures and placeholder text"]
readAloud: read-aloud.txt
---

*A placeholder for reviewing the reading format. All words, values, and drawings here are invented for this prototype.*

> **Abstract.** This sample explores how a page can make room for commentary, adjustable drawings, and statements of scope while preserving a simple reading column. Its three drawings show the same invented example at different widths.

## 1. Notes beside the argument

A page can keep its main thought in one column while letting a small observation sit alongside it.[^parts] The note belongs to this paragraph, even when the screen becomes too narrow for a second column.

Two nearby notes should remain separate and legible.[^nearby] A citation names its author in the text, as Euclid does here, and keeps the reference in a note.[^citation] On a narrow screen, follow a note number to its text, then use its return link to come back.

[^parts]: **A note on parts.** Three equal pieces make a whole. This is placeholder commentary, not a claim from either essay.
[^nearby]: This second note is deliberately close to the first. The layout reserves space for both notes, so their text cannot collide.
[^citation]: Euclid, [*Elements*](https://www.perseus.tufts.edu/hopper/text?doc=Perseus:text:1999.01.0086), Book I, Common Notion 5. The link sits on the title; no bare DOI or URL is printed.

## 2. Three ways to give a figure room

The filled length begins at $1/3$ of the whole. Drag the underlined number or use the slider. Arrow keys adjust by one twelfth. The caption records the initial state so that a static reader has the same starting point.

Every figure can show its values in lowest terms or in twelfths. The control below switches all of them at once; as you read on, it stays at the top of the window, and the address bar keeps the choice (`?notation=twelfths`).

<!-- page-switch -->

### In the text column

<!-- figure #thirds-centered component="fraction-bar" value="1/3" -->

![A horizontal bar divided into twelve equal cells. Four cells are filled, representing one third.](assets/fraction-bar.svg)

**Figure 1. In the column.** The drawing occupies the text column, with this caption in the right margin. Four of twelve equal cells are filled: $4/12 = 1/3$, leaving $2/3$ unfilled.

The main text continues at its usual width. The right margin carries the explanation without widening the reading column.

### Into the left margin · default

<!-- figure #thirds component="fraction-bar" value="1/3" -->

![A horizontal bar divided into twelve equal cells. Four cells are filled, representing one third.](assets/fraction-bar.svg)

**Figure 2. More room on the left.** The drawing extends into the left margin and ends at the text column’s right edge. This caption stays in the right margin. The same starting value is $1/3$; the remainder is $2/3$.

This is the default arrangement for a wide figure. On a thinner screen, both the drawing and its caption return to the normal column, with the caption below.

### Across the full width

<!-- figure #thirds-full component="fraction-bar" value="1/3" -->

![A horizontal bar divided into twelve equal cells. Four cells are filled, representing one third.](assets/fraction-bar.svg)

**Figure 3. Across both margins.** This drawing spans the full available essay width. Its caption sits below within the main text column. Four filled cells still represent one third of the whole.

## 3. A statement and its scope

> [!THEOREM] Equal parts
>
> If twelve equal cells represent one whole, filling four of them represents one third. This sample statement demonstrates the small-caps lead and the left rule.

> [!ESTABLISHED] What is established
>
> The starting value is exactly one third. The interactive calculation uses integer fractions; decimals are used only to place the SVG geometry.
>
> This disclosure demonstrates how an author can distinguish a statement from its scope. It carries no claims from the essays.

## 4. Displays, proofs and tables

Long expressions are displayed rather than set inline. Four twelfths reduce by their common factor,

$$
\frac{4}{12} = \frac{4 \div 4}{12 \div 4} = \frac{1}{3},
$$
and the paragraph continues after the display without a new indent, as in LaTeX. A blank line after a display starts a new paragraph instead.

A long term is displayed as code rather than squeezed into a line:

```text
S K K x  →  K x (K x)  →  x
```

That the remainder is always two thirds is [checked by machine for every twelfth](https://example.org/thirds/Thirds.lean#L12).[^lean] A statement with a dashed underline links to its proof.

| Filled | Lowest terms | Remainder |
|---|---|---|
| 3/12 | 1/4 | 3/4 |
| 4/12 | 1/3 | 2/3 |
| 6/12 | 1/2 | 1/2 |

A table too wide for the column takes room from the left margin, then from both.

| Twelfths | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Lowest terms | 0 | 1/12 | 1/6 | 1/4 | 1/3 | 5/12 | 1/2 | 7/12 | 2/3 | 3/4 | 5/6 | 11/12 | 1 |
| Remainder | 1 | 11/12 | 5/6 | 3/4 | 2/3 | 7/12 | 1/2 | 5/12 | 1/3 | 1/4 | 1/6 | 1/12 | 0 |

[^lean]: A statement set with a dashed underline, like this one, links to its machine-checked proof in Lean, at a fixed commit.

## 5. Related reading and a companion

A future sequence link can remain an ordinary link in Markdown: [Continue to the next piece](#a-placeholder-continuation). An approved semantic relationship could later generate the same navigation.

The [read-aloud companion](read-aloud.txt) is separately authored plain text.

## A placeholder continuation

This is only a destination for the sample link.
