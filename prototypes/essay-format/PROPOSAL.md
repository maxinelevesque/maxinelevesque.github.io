# Interactive essay format — approved demo and source proposal

> **2026-11-23: adopted.** The format is now in production for research reports, with figure markers as HTML comments (`<!-- figure #id component="…" -->`) instead of `::figure{…}`, and figure code run from a pinned `writing` commit. The current contract is in `SPEC.md` ("Interactive essay format"); this directory now holds the sample report used by `scripts/build-essay-sample.mjs`. The proposal below is kept as the record of the approval.

The placeholder [piece](index.md) demonstrates the proposed semantic elements below. These are proposals, not adopted source conventions. No essay text has been copied or publicly deployed, and `writing` has not been changed. Its existing sibling checkout was used read-only; its pre-existing commit ahead of `origin/main` was left alone.

**2026-11-15 — demo design approved by Maxine.** The agreed treatment uses the current site's typography and palette; independently flowing margin notes on wide screens and bottom footnotes on mobile; three figure layouts, with expansion left as the default; right-margin captions starting slightly lower and captions below figures given more space; consistent figure label sizes; a left rule for theorems; and very subtle background boxes for abstracts and “What is established.” The disclosure triangle is centered on its small-cap label, with the original horizontal spacing restored. The implementation is saved on `prototype/interactive-essay-format`, and the private demo remains available for reference. Source/schema adoption and essay publication remain the separate decisions described below.

**2026-11-14 update:** at Maxine's request, the working private tailnet demo now reuses the actual `Writing.astro` layout: burgundy, EB Garamond, the existing article header, book typography, and animation. The earlier Newsreader/palette study was a candidate treatment, not the current site style. That separate register remains undecided. Hosting details are kept locally in the gitignored `HOSTING.md`.

The latest visual revision uses the same very faint background for abstracts and “What is established,” without rules around either. Figures use more vertical space instead of separator rules. A full-width figure's caption returns to the main reading column below it. Interactive labels use regular HTML at a consistent text size, while the drawing adapts to the available width; the static image carries its values through alt text and the ordinary Markdown caption. Existing `> **Abstract.**` blocks receive the abstract treatment through the site's renderer, with no source or schema change. Ordinary quotations retain their existing appearance.

1. **Column notes: use ordinary Markdown footnotes.** Write `A sentence.[^parts]` and define `[^parts]: A note, optionally with a citation.` Per Maxine's preference, narrow screens collect all notes at the bottom of the article with the footnotes, rather than inserting them after paragraphs. Numbered references and return links connect the text and notes. On wide screens, the site moves the same notes into the margin beside their first referring paragraph; resizing restores them to the bottom. The right margin flows independently of the prose: long notes continue beside later paragraphs without pushing down the next section. Notes and margin captions share collision avoidance, including keeping clear of full-width figures. Without JavaScript, readers get ordinary bottom footnotes. The atproto Markdown retains ordinary footnotes. Recommend numbered notes initially; unnumbered notes would be a separate authorial choice, not a silently inferred convention. **Sample:** section 1 and the “Notes and footnotes” section on mobile, including two close notes and a citation.

2. **Interactive figures: a directive followed by a complete ordinary fallback.**

   ```md
   ::figure{#thirds component="fraction-bar" value="1/3"}

   ![Four of twelve equal cells are filled.](assets/thirds.svg)

   **Figure 1. Equal parts.** Four twelfths equals one third; two thirds remains.
   ```

   Recommend trusted code in the site's `src/components/essays/<slug>/`; source values, captions, alt text, and static assets belong with the piece in `writing/pieces/<slug>/`. Each sample uses reduced BigInt fractions, a draggable number, keyboard controls, a slider, and reset. A script failure retains the image and caption. Arbitrary source JavaScript is never executed. Unknown components or missing fallbacks should fail validation. Larger numerical inputs could use a separately approved per-piece data file with rational strings. **Sample:** section 2 compares three layouts requested by Maxine: text-column width with a right-margin caption; expansion into the left margin with a right-margin caption (the default); and full width across both margins with its caption below. All three become normal column width with captions below on thinner screens. These choices live in the site's local [presentation sidecar](presentation.json), not in the semantic Markdown or `writing` schema. “Static starting image” opens each fallback.

3. **Containers: prefer a blockquote convention for portability.**

   ```md
   > [!THEOREM] Equal parts
   >
   > A placeholder statement.

   > [!ESTABLISHED] What is established
   >
   > A placeholder statement of scope.
   ```

   Render the first as a small-caps lead with a left rule, the second as native `<details>`. Export both as readable, expanded blockquotes. Alternative: `:::theorem{lead="Equal parts"}` / `:::established`; this is more explicit but requires directive-aware conversion everywhere. Recommend the blockquote form unless richer nesting is needed. The prototype intentionally supports only this small proposed grammar. **Sample:** section 3, with build-time KaTeX in the surrounding text and caption.

4. **Approve semantic additions in `writing` before implementation.** Keep `kind: essay`. Candidate fields: `sequel: next-piece-slug` and `readAloud: read-aloud.txt`; candidate asset convention: `pieces/<slug>/assets/`. Recommend one sequel edge and derive the reverse link. Require a published target, no self-links/cycles, contained relative asset paths, supported file types, complete fallbacks, and existing companion files. A companion is authored text, not an automatically stripped transcript or an audio file. Plain body links remain sufficient if Maxine declines new fields. **Sample:** section 4 renders a continuation link and the separately authored `.txt` companion without adopting any field.

5. **Presentation: keep the current site treatment for the working demo.** The demo now uses EB Garamond, the burgundy register, the existing column and article header, and its animated background. Wider figures and lining figure numerals are additions within that layout. An opt-in Newsreader/light-dark `longform` treatment is still an alternative for Maxine to decide. If adopted, prefer a new site-only `layout: "longform"` in `presentation.json`, retaining its current `register: writing|dialogue`, because the current generator binds register to authorship. A third register would require consciously separating those concepts. **Sample:** the hosted demo itself, with a link to the current site copy for comparison. The production presentation sidecar and page layouts remain unchanged; the branch now includes the requested shared abstract styling.

After approval, extend `writing`'s validator and publisher together with the site generator. Today the publisher copies body Markdown verbatim and its plain-text conversion drops image alt text. The approved exporter must remove site directives, retain footnotes, absolutize asset URLs against the canonical URL, preserve alt text/captions/values, expand disclosures, and produce real plain text. The sample's `reader.md` demonstrates only the Markdown projection. The document lexicon permits typed `content` and a separate plain `textContent`; this does not guarantee that every reader implements footnotes or math ([official schema](https://standard.site/docs/lexicons/document)). Do not invent unregistered sequel/audio lexicon fields.

The essay thread continues to own prose and scientific values. Once Maxine chooses the format, send its approved contract through Maxine before any conversion. Publication remains a separate decision.

## Run the sample locally

```sh
node scripts/check-essay-format.mjs
WRITING_SRC=../writing node scripts/build-essay-sample.mjs
npm run preview -- --host 127.0.0.1
# Open http://127.0.0.1:4321/research/essay-format-sample
```
