---
title: Getting started
description: Load submito and bind your first AJAX form.
---

# Getting started

Submito binds an existing HTML form to `fetch`. You keep your markup and CSS. submito validates the fields, sends the form as `FormData`, and shows the server's reply. It runs in the browser only.

## 1. Load the library

### Script tag

```html
<script src="https://cdn.jsdelivr.net/npm/submito/dist/submito.min.js"></script>
```

This exposes `window.submito`. You can also self-host the files from `dist/` after `npm run build`. `submito.js` is the readable build and `submito.min.js` is the minified one.

### npm

```bash
npm install submito
```

```js
import submito from 'submito';
```

TypeScript types are included, so editors autocomplete every option, event and response field.

:::tip Using an AI coding agent?
Run `npx submito skill` to give Claude Code, Cursor or Codex the submito skill. See [AI & agents](/ai).
:::

## 2. Write a normal form

```html
<form id="contact-form" action="/api/contact" method="post">
  <label>
    Name
    <input name="name" required autocomplete="name" />
  </label>

  <label>
    Email
    <input name="email" type="email" required autocomplete="email" />
  </label>

  <label>
    Message
    <textarea name="message" required minlength="10"></textarea>
  </label>

  <button type="submit">Send</button>
  <span id="sending" hidden>Sending…</span>
</form>
```

- Every field you want to send needs a `name`.
- Use normal HTML constraints (`required`, `type="email"`, `minlength`…). submito reads them, so you do not configure rules twice.
- `action` and `method` on the form are used as defaults. The form also still works without JavaScript.

## 3. Bind it

```js
submito.newForm({
  form: '#contact-form',
  indicator: '#sending',
});
```

That is all. On submit, submito:

1. Validates every field and shows inline errors (no request is sent if something is invalid).
2. Disables the submit button, shows `#sending`, and sets `aria-busy` on the form.
3. Sends `FormData` to `action` with `Accept: application/json`.
4. Reads the JSON reply. On success it shows a dialog and resets the form. On error it shows server field errors inline and the message in a dialog.

`form` accepts an element, an id (`'contact-form'`), or a selector (`'#contact-form'`). If the form is missing, or there is no `url` / `action`, `newForm` logs a `console.error` and returns `null`.

## 4. Return JSON from your server

```json
{ "status": "success", "message": "Thanks, we will get back to you soon." }
```

```json
{
  "status": "error",
  "message": "Please fix the highlighted fields.",
  "errors": [{ "name": "email", "message": "This email is already registered." }]
}
```

The HTTP status code counts too: any 4xx or 5xx response is treated as an error. See [Server responses](/server-responses) for every accepted shape, including Laravel and WordPress.

## Handle the response yourself

Pass `callback` to replace the built-in UI. Events still fire.

```js
submito.newForm({
  form: '#contact-form',
  callback(response, form) {
    if (response.success) {
      showToast(response.message);
      form.reset();
    } else {
      form.showErrors(response.errors);
    }
  },
});
```

## Next

- [Configuration](/configuration): every option
- [Validation](/validation): rules, live validation, custom messages
- [Response UI](/response-ui): dialog, SweetAlert2 or none
- [Events & instance API](/events): hooks for CSRF tokens, analytics, cancelling
- [Playground](/playground/): try everything live
