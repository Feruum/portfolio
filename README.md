# Madi Talgat — portfolio

The default homepage is the light portfolio. A blue and pink trail follows the pointer across the page. Moving over the first screen turns the ASCII knot. Sweep through it to push its links, click to scatter them, or drag to spin it. On phones, tap to scatter or swipe horizontally on the knot to turn it. The knot also responds to Enter or Space when focused. Hover, focus, or tap a skill to see its logo and description. The original dark terminal portfolio is available at `/classic.html`.

The moon button in the top right switches the homepage to its black palette. The new theme spreads from the click, or from the button center when using a keyboard. The choice is saved locally. Reduced-motion mode switches instantly.

```sh
bun install
bun run dev       # http://localhost:5173
bun test          # sculpture interactions and framing
bun run build     # both editions in dist/
bun run preview   # serve the production build
```

- The light edition lives in [v2](v2/). It also runs on any static HTTP server.
- The dark edition uses [src](src/) and [classic.html](classic.html). Its EN/RU content is in [src/data.ts](src/data.ts).
- The precomputed [ASCII logos](v2/skill-logos.js) ship with the site. Brand marks come from [Simple Icons](https://simpleicons.org/) and [Elysia](https://elysiajs.com/assets/elysia.svg). Five unbranded skills use original pictograms.
- The [ticker logos](v2/logos/) also include the official [Judge0](https://judge0.com/) and [Ultralytics YOLO](https://www.ultralytics.com/brand) marks.
