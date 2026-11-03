---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: ["index.html"]
---

# Surface: portfolio home (index.html / src/App.tsx)

Mode: Experience (portfolio). Audience: recruiters and team leads, skimming in seconds. Action: download CV, email/Telegram, open GitHub. Proof: EpiQ, NomadCodes, LexiSpark (~100 users), Online Judge, 1st and 3rd hackathon places. EN default + RU toggle. Constraints: no fabricated photos/claims; Online Judge repo URL pending.

## Direction contract

THESIS: The portfolio is a terminal session you can drive: a TUI of bordered panes, keyboard hotkeys and a live three.js object rendered in ASCII. It refuses the category default of a scrolling hero + card grid + skill bubbles.

OWN-WORLD: Warm charcoal ground, phosphor-amber as the single working accent, dim sage for secondary, rust for status. Box-drawing borders with pane titles cut into the top rule, inverted title on the active pane. Martian Mono display, Geist Mono body. Key-hint buttons [C] cv. Tree, git-log graph and htop-row listings as the content grammar.

STORY: Visitor sees who/what in the status bar and hero, scans proof via git-log experience and process-table projects, then hits [C] for CV or copies email.

FIRST VIEWPORT: status bar top; left 55% name (huge, scramble-in), role, two-line summary, key-hint actions; right 45% ASCII-rendered rotating 3D knot, drag/cursor reactive, inside a pane titled `render.ts`.

FORM: Terminal/TUI, user-chosen (pick card, my rank 1). seed: none (unavailable) — roll ran via concept-seed key f2db7b57…; user chose the pick card over the assigned direction.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
