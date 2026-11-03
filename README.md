# Madi Talgat — portfolio

The default homepage is the light portfolio with an interactive ASCII sculpture and technology logos in the Skills tooltips. Hover, focus, or tap a skill to see its mark and description. The original dark terminal portfolio is available at `/classic.html`.

```sh
bun install
bun run dev       # http://localhost:5173
bun run build     # both editions in dist/
bun run preview   # serve the production build
```

- The light edition lives in [v2](v2/). It also runs on any static HTTP server.
- The dark edition uses [src](src/) and [classic.html](classic.html). Its EN/RU content is in [src/data.ts](src/data.ts).
- The precomputed [ASCII logos](v2/skill-logos.js) ship with the site. Brand marks come from [Simple Icons](https://simpleicons.org/) and [Elysia](https://elysiajs.com/assets/elysia.svg). Five unbranded skills use original pictograms.
- The [ticker logos](v2/logos/) also include the official [Judge0](https://judge0.com/) and [Ultralytics YOLO](https://www.ultralytics.com/brand) marks.
