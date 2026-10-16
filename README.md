# Submito

Vanilla JavaScript AJAX forms for plain HTML. One call to `submito.newForm()` binds an existing `<form>` to `fetch`. It adds live validation from your HTML attributes, a built-in response dialog, captchas (math, reCAPTCHA v3, Cloudflare Turnstile), international phone input and form events. There are no framework or runtime dependencies.

> Work in progress (`0.0.0`): the API may change before `0.1.0`.

## Add it to your project

**npm**

```bash
npm install submito
```

```js
import submito from 'submito';
```

**Script tag**

```html
<script src="https://cdn.jsdelivr.net/npm/submito/dist/submito.min.js"></script>
```

This exposes `window.submito`.

## Use it

```html
<form id="contact" action="/api/contact" method="post">
  <input name="email" type="email" required />
  <textarea name="message" required minlength="10"></textarea>
  <button>Send</button>
</form>

<script>
  submito.newForm({ form: '#contact' });
</script>
```

Your endpoint returns JSON, for example `{ "status": "success", "message": "Thanks!" }`.

## Docs & playground

- **Documentation:** [Getting started](docs/getting-started.md) · [Configuration](docs/configuration.md) · [Server responses](docs/server-responses.md) · [Events & instance API](docs/events.md) · [all pages](docs/)
- **AI agents:** `npx submito skill` installs the agent skill for Claude Code, Cursor and Codex. The docs site also serves `/llms.txt` and `/llms-full.txt`. See [AI & agents](docs/ai.md) and [Agent skill](docs/agent-skill.md).
- **Playground:** [`playground/`](playground/). Run `npm install && npm run dev`, then open [localhost:5173/playground/](http://localhost:5173/playground/). The docs are served at the root of the same address.

## Development

Requires Node.js 22.12 or newer.

```bash
npm install
```

| Command | What it does |
|---------|--------------|
| `npm run dev` | Docs site at [localhost:5173](http://localhost:5173/) with the playground at `/playground/`, using live source from `src/` |
| `npm run play` | Playground only (Vite dev server, opens the browser) |
| `npm run build` | Library build into `dist/`: `submito.mjs` (ESM), `submito.js` (IIFE), and minified `.min` versions |
| `npm run docs:build` | Static docs site with the playground and `src/` into `docs/.vitepress/dist`. Cloudflare Pages runs this on every push to GitHub; the Docker image serves the same folder |
| `npm run preview` | Serve the built docs site locally (run `docs:build` first) |
| `npm run publish` | Release to npm: logs you in through the browser if needed, checks the version is new, builds, publishes. Add `patch` / `minor` / `major` to bump first (`npm run publish patch`), or `-- --dry-run` to see the package contents without uploading |
| `npm run docs:dev` | Same as `npm run dev` |
| `npm run docs:preview` | Same as `npm run preview` |

Contributor and agent guidelines are in [AGENTS.md](AGENTS.md).

## License

MIT
