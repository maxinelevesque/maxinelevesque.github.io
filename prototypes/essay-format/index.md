# A measure of thirds

*A placeholder for reviewing the reading format. All words, values, and drawings here are invented for this prototype.*

> **Abstract.** This sample explores how a page can make room for commentary, adjustable drawings, and statements of scope while preserving a simple reading column. Its three drawings show the same invented example at different widths.

## 1. Notes beside the argument

A page can keep its main thought in one column while letting a small observation sit alongside it.[^parts] The note belongs to this paragraph, even when the screen becomes too narrow for a second column.

Two nearby notes should remain separate and legible.[^nearby] A citation can travel with the note rather than interrupting the sentence.[^citation] Follow a note number to its text, then use its return link to come back.

[^parts]: **A note on parts.** Three equal pieces make a whole. This is placeholder commentary, not a claim from either essay.
[^nearby]: This second note is deliberately close to the first. The layout reserves space for both notes, so their text cannot collide.
[^citation]: A citation may include a complete reference: Euclid, *Elements*, Book I, Common Notion 5. This demonstrates citation typography only.

## 2. Three ways to give a figure room

The filled length begins at $1/3$ of the whole. Drag the underlined number or use the slider. Arrow keys adjust by one twelfth. The caption records the initial state so that a static reader has the same starting point.

### In the text column

::figure{#thirds-centered component="fraction-bar" value="1/3"}

![A horizontal bar divided into twelve equal cells. Four cells are filled, representing one third.](/prototypes/assets/fraction-bar.svg)

**Figure 1. In the column.** The drawing occupies the text column, with this caption in the right margin. Four of twelve equal cells are filled: $4/12 = 1/3$, leaving $2/3$ unfilled.

The main text continues at its usual width. The right margin carries the explanation without widening the reading column.

### Into the left margin · default

::figure{#thirds component="fraction-bar" value="1/3"}

![A horizontal bar divided into twelve equal cells. Four cells are filled, representing one third.](/prototypes/assets/fraction-bar.svg)

**Figure 2. More room on the left.** The drawing extends into the left margin and ends at the text column’s right edge. This caption stays in the right margin. The same starting value is $1/3$; the remainder is $2/3$.

This is the default arrangement for a wide figure. On a thinner screen, both the drawing and its caption return to the normal column, with the caption below.

### Across the full width

::figure{#thirds-full component="fraction-bar" value="1/3"}

![A horizontal bar divided into twelve equal cells. Four cells are filled, representing one third.](/prototypes/assets/fraction-bar.svg)

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

## 4. Related reading and a companion

A future sequence link can remain an ordinary link in Markdown: [Continue to the next piece](#a-placeholder-continuation). An approved semantic relationship could later generate the same navigation.

The [read-aloud companion](/prototypes/assets/read-aloud.txt) is separately authored plain text. A reader can also open the [portable Markdown sample](/prototypes/assets/reader.md), which contains ordinary notes, the static figure, and readable blockquotes.

## A placeholder continuation

This is only a destination for the sample link. No essay has been imported or published.
