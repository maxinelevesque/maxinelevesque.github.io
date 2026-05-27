# maxine.science

Personal site for Maxine Levesque. Built with Astro, deployed to GitHub Pages.

## Setup

```bash
# Clone and install
git clone <your-repo>
cd maxine-science
npm install

# Dev server (localhost:4321)
npm run dev

# Build for production
npm run build
```

## Adding content

### Solo writing

Drop a markdown file in `src/content/writing/`:

```markdown
---
title: "Your Title"
subtitle: "Optional subtitle"
date: "May 2026"
category: article        # article | fiction | note
readTime: "12 min"
formerName: "Max Collard" # optional — shows as "Maxine Levesque, as Max Collard"
system: 3                 # 0–12, picks the background dynamical system
---

Your content here. Standard markdown — paragraphs, emphasis, links, etc.

Paragraphs are rendered in book style: no spacing between them,
2em indent on continuation paragraphs, first paragraph flush left.
```

### Dialogues (co-written)

Drop a markdown file in `src/content/dialogues/`:

```markdown
---
title: "Deus ex Machina"
subtitle: "On semantic solitons and load-balancing."
date: "May 2026"
readTime: "18 min"
coauthor: "Claude"   # defaults to "Claude" if omitted
system: 7
---

Your content here. Gets the midnight/violet theme automatically.
```

### Dynamical systems index

| # | Name | Shape |
|---|------|-------|
| 0 | Double Pendulum | Long-exposure link traces |
| 1 | Lorenz Attractor | Butterfly wings |
| 2 | Rössler Attractor | Single-band spiral |
| 3 | Thomas Attractor | Organic tangled ribbons |
| 4 | Aizawa Attractor | Torus with spike |
| 5 | Halvorsen Attractor | Three-lobed symmetric |
| 6 | Chen Attractor | Wide double scroll |
| 7 | Clifford Attractor | Lacy trig-based swirls |
| 8 | Duffing Oscillator | Folding phase portrait |
| 9 | Hénon Map | Banana fractal layers |
| 10 | Sprott B | Minimal chaotic flow |
| 11 | Three-Body Problem | Triangle mesh traces |
| 12 | Logistic Bifurcation | Period-doubling cascade |

Each page gets one system. Every page load uses random initial conditions,
so the trace is never the same twice.

## Deploying

Push to `main`. The GitHub Actions workflow builds and deploys automatically.

**First-time setup:**
1. Go to repo Settings → Pages
2. Set Source to "GitHub Actions"
3. If using custom domain: your CNAME is already in `public/CNAME`
4. Push — it builds and deploys

## Math

KaTeX is loaded globally. In markdown, use:
- Inline: `$E = mc^2$`
- Display: `$$\lambda = \lim_{t \to \infty} \frac{1}{t} \ln \frac{\|\delta x(t)\|}{\|\delta x(0)\|}$$`

## Project structure

```
src/
  content/
    writing/        ← solo pieces (markdown)
    dialogues/      ← co-written pieces (markdown)
    config.ts       ← collection schemas
  layouts/
    Base.astro      ← HTML shell, fonts, KaTeX
    Writing.astro   ← burgundy theme
    Dialogue.astro  ← midnight theme
  pages/
    index.astro     ← homepage
    writing/[...slug].astro
    dialogues/[...slug].astro
  components/
    dynamical-systems.js  ← all 13 systems
  styles/
    global.css      ← design tokens, book typography
```
