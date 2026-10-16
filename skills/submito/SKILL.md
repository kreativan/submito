---
name: submito
description: >-
  Wire HTML forms to AJAX submission with the submito vanilla JS library
  (submito.newForm). Use when adding or fixing browser forms that post via
  fetch/FormData with live validation, the built-in response dialog or
  SweetAlert2, math captcha, Google reCAPTCHA v3, Cloudflare Turnstile,
  intl-tel-input phone fields, submito:* form events, or the JSON
  success/error response contract on the server. Also use when migrating
  from formsub. Not for developing the submito library itself.
license: MIT
metadata:
  audience: consumers
  library: submito
  standard: agentskills.io
---

# submito (consumer guide)

This skill teaches the agent how to **use** submito in an app: binding existing HTML forms to `fetch` with validation and response UI. Follow the app's existing stack and styling. Do not use this skill to change submito's own source.

```js
import submito from 'submito';            // or window.submito via <script>
const form = submito.newForm({ form: '#contact' });
```

## When this applies

- Contact, signup, newsletter, upload or checkout forms posting to an endpoint
- Choosing options, markup, validation messages, events or response JSON for submito
- Adding Turnstile, reCAPTCHA, the math captcha, intl-tel-input or SweetAlert2 to a submito form
- Writing the server endpoint that a submito form calls
- Migrating `formsub.newForm` code (see [references/api.md#migrating-from-formsub](references/api.md#migrating-from-formsub))

Not for: React/Vue form state libraries, SSR code paths without `document`, or editing submito itself.

## Workflow

1. **Load submito**: `npm install submito` + `import submito from 'submito'`, or `<script src="https://cdn.jsdelivr.net/npm/submito/dist/submito.min.js">`.
2. **Write normal HTML**: a `<form>` with `action` (or pass `url`), a `name` on every field, native constraints (`required`, `type="email"`, `minlength`, `pattern` + `title`, `min`/`max`), and a submit button.
3. **Bind after the form exists**: `submito.newForm({ form: '#id', ... })`. Call `destroy()` when the form is removed (SPA).
4. **Return JSON** from the endpoint: `{ status: 'success', message }`, or HTTP 422 with `{ message, errors: [{ name, message }] }`. See [references/server.md](references/server.md).
5. **Style the hooks**: `.error-message`, the `.error` wrapper, `[aria-invalid="true"]`, `form[aria-busy="true"]`, and the dialog CSS variables `--submito-*`.

### Minimal example

```html
<form id="contact" action="/api/contact" method="post">
  <label>Email <input name="email" type="email" required autocomplete="email" /></label>
  <label>Message <textarea name="message" required minlength="10"></textarea></label>
  <button type="submit">Send</button>
  <span id="sending" hidden>Sending…</span>
</form>

<script type="module">
  import submito from 'submito';
  submito.newForm({ form: '#contact', indicator: '#sending' });
</script>
```

This already gives you live validation, a disabled button with the indicator during the request, the built-in success/error dialog, server field errors inline, and a reset on success.

## Decision guide

| Need | Do this |
|------|---------|
| Default UX | Nothing extra: `responseType: 'dialog'` is the default |
| No popups, inline errors only | `responseType: 'none'` |
| SweetAlert2 | Load `Swal`, `responseType: 'swal'`, optional `swal: {…}` |
| Fully custom UI | `callback(response, form)`; use `form.showErrors(response.errors)` / `form.reset()` |
| Skip built-in UI for one reply (e.g. redirect) | `submito:success` listener → `event.preventDefault()` |
| Extra / computed fields | `data: { … }` or `data: (form) => ({ … })` |
| CSRF | Keep the framework's hidden token input, or `headers: () => ({ 'X-CSRF-Token': … })` |
| Cancel or confirm before sending | `submito:before` listener → `event.preventDefault()` |
| Analytics on all forms | `document.addEventListener('submito:after', …)` (`event.target` is the form) |
| Bot protection | Turnstile `turnstile: { siteKey }` or reCAPTCHA v3 `recaptcha: 'SITE_KEY'`, **verified server-side** |
| Cheap spam speed bump | `<input name="numb_captcha" required>` |
| International phone | Load intl-tel-input; `iti: { input: '#phone', country: 'US' }` |
| Custom error placement | `<span data-submito-error="fieldname"></span>` inside the form |
| Custom wording / language | `<html lang="…">` + `messages: { required: '…' }` |
| Multi-step / programmatic | `form.validate()`, `await form.submit()` |

## Hard rules for generated code

- Browser-only: never import submito where `document` does not exist (SSR, Node scripts).
- Do **not** set `Content-Type` on requests (FormData sets the multipart boundary), and do not add `novalidate` yourself (submito sets it).
- Third-party integrations are **globals you load yourself** (`intlTelInput`, `Swal`, `grecaptcha`, `turnstile`). Never `npm install` them for submito's sake unless the app bundles them on purpose.
- Captcha tokens are worthless until the **server verifies** them with the secret key. Never put secret keys in front-end code or commit them.
- Client validation is UX. **Always re-validate on the server.**
- Never render `response.message`, `response.errors` or `response.data` with `innerHTML` or Swal `html`. Use `textContent` / Swal `text`.
- Only use documented options, events and instance methods ([references/api.md](references/api.md)). Do not invent APIs.
- Events are on the **form element** (they bubble). Do not listen on `window` for `formsub:*` names; those are gone.

## References (read only what the task needs)

- Options, response object, events, instance API, markup hooks, i18n keys, migration from formsub → [references/api.md](references/api.md)
- Turnstile, reCAPTCHA, math captcha, intl-tel-input, SweetAlert2, dialog theming → [references/integrations.md](references/integrations.md)
- Server endpoints (Express, PHP, Laravel, WordPress) + captcha verification → [references/server.md](references/server.md)
- Exact types (when installed from npm): `node_modules/submito/types/index.d.ts`. It is the source of truth if a reference and your memory disagree.
- Full docs in one file: `/llms-full.txt` on the submito docs site

## Checklist before finishing

- [ ] The form exists in the DOM before `newForm`, and `url` or `action` is set
- [ ] Every submitted field has a `name`, and constraints are in HTML (not duplicated in JS)
- [ ] The endpoint returns JSON matching the contract; field error names match input `name`s
- [ ] Integration scripts are loaded and captcha tokens are verified on the server
- [ ] Error / busy styles exist (`.error-message`, `[aria-invalid="true"]`, the indicator)
- [ ] Custom callback / event code renders server text with `textContent` only
- [ ] SPA: `destroy()` is called when the form unmounts
