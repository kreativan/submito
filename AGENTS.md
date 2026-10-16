# AGENTS.md

Guidance for AI coding agents and humans working **in this repository** (developing submito).

## Consumer agent skills (ignore here)

`skills/submito/` is a distributable **[Agent Skills](https://agentskills.io/)** package for **apps that use submito**. It is not for editing this library.

- Follow **this file** when changing `src/`, builds, docs or the playground.
- Do **not** treat `skills/submito/` as instructions for developing submito.
- Project skill dirs (`.cursor/skills/`, `.claude/skills/`, `.agents/skills/`) are gitignored so local installs stay inactive here.
- To ship the skill into an app: `skills/INSTALL.md`, `skills/install.sh`, `skills/install.ps1`.

## What this project is

**submito** is a small, dependency-free **browser** library that binds an existing HTML form to `fetch`. It covers validation, loading state, captchas, phone input, response UI and events. It is not a React/Vue form library and not an SSR package.

Public surface:

```js
import submito from 'submito'; // or window.submito
const form = submito.newForm(options); // SubmitoForm instance, or null on setup failure
```

The instance API is `form`, `options`, `busy`, `submit()`, `validate()`, `showErrors()`, `clearErrors()`, `reset()` and `destroy()`. Status is early WIP (`0.0.0`).

## Quick commands

```bash
npm install
npm run dev         # VitePress docs at / + playground at /playground
npm run play        # playground only (Vite, HMR)
npm run build       # dist/: submito(.min).mjs + submito(.min).js (IIFE)
npm run docs:build  # static site → docs/.vitepress/dist (Docker / Dokploy)
npm run publish     # release to npm (maintainers only; `patch|minor|major` bumps, `-- --dry-run` previews)
```

There is no automated test suite. After behavior changes, run `npm run build` and exercise the affected flows in the playground. Use the "Server answers" select to cover success, field errors, a Laravel errors object, a 400, an HTML 500, a network failure and a slow reply, and the "Response UI" switch for `dialog` / `swal` / `none` / `callback`.

## Repository map

| Path | Role |
|------|------|
| `src/index.js` | Sole public export; sets `window.submito` |
| `src/form.js` | `newForm()`, `SubmitoForm`: options, listeners, live validation, submit pipeline, built-in response flow |
| `src/validation.js` | `isValidatable`, `checkField` (HTML constraint API → `{ key, params }` / string / null) |
| `src/field-errors.js` | Inline error DOM: placement, `.error` / `.error-message`, `aria-invalid`, `aria-describedby`, `[data-submito-error]` |
| `src/response.js` | `parseResponse`, `successSignal`, `pickMessage`, `normalizeErrors`, `errorResponse` |
| `src/feedback.js` | `notify()`: routes to dialog / swal / none |
| `src/dialog.js` | Built-in `<dialog>` + injected `<style id="submito-styles">` |
| `src/i18n.js` | `STRINGS` dictionaries (`en`, `bg`, `de`, `es`, `fr`, `sr`), `langOf`, `translate` |
| `src/utils.js` | `resolveElement(s)`, `emit`, `waitFor`, `SubmitoError`, `logError` |
| `src/integrations/` | `numb-captcha.js`, `recaptcha.js`, `turnstile.js`, `intl-tel-input.js`, `swal.js` |
| `playground/` | Manual demo (not tests). `mock.js` wraps `window.fetch` for `/api/submit` |
| `docs/` | VitePress 2 site. `.vitepress/submito-site.js` serves `/playground`, `/src` and `/skills/submito` in dev, generates `/llms.txt`, `/llms-full.txt` and `/<page>.md` from the sidebar, and writes all of it into the build |
| `types/index.d.ts` | Hand-written public TypeScript types (options, instance, response, `submito:*` event map). Shipped via `types` / `exports.types` |
| `bin/submito.js` | Node CLI shipped in the package: `npx submito skill` copies `skills/submito/` into a project's `.claude` / `.cursor` / `.agents` skill folders |
| `scripts/publish.js` | `npm run publish`: login + version checks, optional bump, `npm publish` (build runs in `prepublishOnly`). Exits immediately when npm re-runs it as the `publish` lifecycle hook. Not shipped |

The npm package is whitelisted by `files` in `package.json`: `dist/`, `types/`, `bin/` and `skills/submito/`, plus the README and package.json (npm adds those itself). Check with `npm run publish -- --dry-run` before adding anything. Never ship `src/`, `docs/`, `playground/` or the repo-only install scripts.
| `vite.config.js` | Library build (`es` + `iife`, target es2022) and `npm run play` |
| Cloudflare Pages | Main hosting via the GitHub integration: build command `npm run docs:build`, output `docs/.vitepress/dist`. `docs/public/_headers` sets text MIME types for `.md`, `.yaml` and `llms*.txt` |
| `Dockerfile`, `nginx.conf` | Alternative static image (Dokploy) serving the same build. Keep its MIME rules in sync with `_headers` |
| `skills/submito/` | Consumer agent skill, shipped in the npm package and published on the docs site. Keep it in sync with the public API |

Do not add a second public entry point without updating `package.json` `exports` and `docs/getting-started.md`.

## Architecture

### Integrations (add-ons)

Each integration is a factory `(context, config) => addon | null`, created in the `SubmitoForm` constructor. `context` is `{ form, t, submitters }`. An addon may implement:

| Hook | Called | Used by |
|------|--------|---------|
| `rule(field)` | During validation of every field; return `null`, a message string, or `{ key, params }` | numb captcha, iti |
| `prepare(formData)` | After `data` is merged, before `submito:before`; may be async. Throw `SubmitoError(message)` to abort with a user-facing error | iti (E.164), reCAPTCHA, Turnstile |
| `afterSubmit()` | In `finally` of every submit | Turnstile (single-use token) |
| `reset()` | On the form's `reset` event | numb captcha, Turnstile |
| `destroy()` | `instance.destroy()` | Turnstile, iti |

Order matters: iti runs first so captcha `prepare` and `submito:before` see the final phone value. New integrations should follow this shape and stay **global-based**: never import the third-party library, read `window.X`, use `waitFor` if it may load `async`, and log with `logError` when it is missing.

### Submit pipeline invariants (`SubmitoForm#submit`)

1. Ignore the call while `busy` (double-submit guard).
2. Validate all fields first. On failure: show errors inline, focus the first invalid field, emit `submito:invalid`, return `null`. No request, no callback, no popup.
3. Snapshot `new FormData(form, submitter)` **before** `#setBusy(true)`, because disabled buttons (the submitter) are excluded from FormData.
4. `#setBusy(true)`: disable submit buttons that were enabled, show the indicator, set `aria-busy`. It **must** be undone in `finally`, including cancelled and failed paths.
5. Build the payload (drop empty file entries, merge `data`), then run addon `prepare` hooks.
6. Emit `submito:before` (cancelable) with `{ formData, instance }`. A cancel returns `null` without a request.
7. `fetch` with `Accept: application/json` merged with `headers`. GET/HEAD put string fields into the query string and send **no body**.
8. Never assume JSON: `parseResponse` reads text, tries `JSON.parse`, and never throws. Network failures and `SubmitoError`s become `errorResponse(message)` with `status: 0`.
9. Emit `submito:success` / `submito:error` (cancelable) with `{ response, formData, instance }`. If `options.callback` is a function, call it (awaited, errors logged); otherwise run the built-in flow unless the event was cancelled.
10. `finally`: addon `afterSubmit`, `#setBusy(false)`. Then emit `submito:after` with the same `{ response, formData, instance }`.

### Events

- Dispatched with `emit(form, name, detail, cancelable)`, which creates a `CustomEvent('submito:<name>', { bubbles: true })` **on the form element**, never on `window`.
- Names are lowercase (`invalid`, `before`, `success`, `error`, `after`), so they work as HTML attributes in Alpine and similar tools.
- Every `detail` includes `instance`. `before`, `success`, `error` and `after` also carry `formData`: the one payload object built by `#request` (so listeners see exactly what was sent, even after the success reset). It is `null` only when `#collect` threw.

### Response contract

The normalized response is `{ success, status, message, errors: [{ name, message }], data }`. `success = res.ok && successSignal(json) !== false`. If you change heuristics in `response.js`, update `docs/server-responses.md`, `skills/submito/references/api.md` and the playground scenarios together.

### Live validation

Listeners are delegated on the form (`input`, `change`, `countrychange`). A field is checked on `change` (a commit) and then on every `input` once it has been committed, has an error, or the form was submitted. The `reset` event clears errors and touched state. Fields are grouped by `name` (radio and checkbox groups share one message).

## Coding conventions

- **Plain ES modules** in `src/`, ES2022 (private `#fields` are fine). No TypeScript, no JSON imports, no bundler-only syntax. Raw `src/` is served to browsers on the docs site.
- Use **`.js` extensions** on relative imports.
- Keep the **runtime dependency list empty**. Optional integrations use globals (`Swal`, `grecaptcha`, `turnstile`, `intlTelInput`) and must tolerate them being missing.
- **Browser-only**: no Node APIs in `src/`. Node tooling lives in `bin/` and `docs/.vitepress/`, and never gets imported by `src/`.
- `bin/submito.js` has zero dependencies (Node ≥ 22 built-ins only). Keep its flags in sync with `skills/install.*` and `docs/agent-skill.md`.
- Prefer native platform features (`FormData`, constraint validation API, `<dialog>`, `CustomEvent`) over reimplementing them.
- Small functions, early returns. Use `logError()` (prefixes `[submito]`) for setup and integration failures; never throw from `newForm`.
- User-facing strings go through `translate` / `this.#t` with a key in **every** dictionary in `src/i18n.js`.
- Naming is **submito** everywhere: events `submito:*`, CSS classes `submito-*`, the `data-submito-error` attribute, and the `[submito]` log prefix.

## Security rules (non-negotiable)

- Never put response text, server errors or user input into the DOM via `innerHTML`, or into SweetAlert via `html`. Use `textContent` and Swal `text`. `swalAlert` drops an `html` key from user options.
- Static, trusted markup (the dialog skeleton and its SVG icon) is built with `createElement` / `createElementNS`.
- The math captcha is a weak deterrent. Do not describe it as security.
- Client validation is not a security boundary. Docs must keep telling users to validate and verify captcha tokens server-side.
- Never commit secrets or real site keys. The playground uses Cloudflare's public test key and a stubbed `grecaptcha`.

## Docs sync

Any change to options, events, the instance API, the response contract, i18n keys or CSS hooks must update **in the same change**:

1. the relevant `docs/*.md` pages (and the `sidebar` in `docs/.vitepress/config.js` for new pages, which also feeds `llms.txt`). The docs site is the API reference.
2. `types/index.d.ts`, for any option, instance member, response field, event or message key change. Type-check it (e.g. `npx -p typescript tsc --noEmit --strict` against a small usage file).
3. `skills/submito/` (SKILL.md + references)
4. this file, if architecture or conventions changed

`README.md` stays minimal on purpose: a short description, install / add-to-project, and links to the docs and playground. Only touch it when installation or the minimal example changes. Do not grow it into an API reference.

Do not document APIs that are not implemented. The docs site is VitePress 2 (`vitepress@next`). Do not reintroduce Astro Starlight.

## What to avoid

- Framework wrappers (React/Vue) unless explicitly requested.
- Adding SweetAlert2, reCAPTCHA, Turnstile or intl-tel-input as npm dependencies, or auto-loading their scripts (submito only fetches the intl-tel-input utils module, and only when `iti` is enabled without `loadUtils`).
- Expanding the public API beyond `submito.newForm` + instance methods without a clear need.
- Firing events on `window`, or reading options from globals.
- Force-push / destructive git commands unless the user asks.
- Large drive-by refactors unrelated to the task.

## Preferred change workflow

1. Read the relevant `src/` module(s) and the matching docs page.
2. Make the smallest correct change that keeps the pipeline invariants.
3. `npm run build`, then exercise the flow in the playground (all response UIs and the relevant server scenarios).
4. Update docs, types, skills and AGENTS.md as listed in [Docs sync](#docs-sync).

## Open gaps (do not "fix" casually)

Unless the user asks for them: generating types from source, automated tests, CI, request timeout / AbortController, built-in redirects, more locales, a LICENSE file on disk. Track these as explicit tasks, not drive-by additions.
