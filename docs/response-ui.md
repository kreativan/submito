---
title: Response UI
description: The built-in dialog, SweetAlert2, or no popup at all, and how to theme the dialog.
---

# Response UI

Unless you pass a `callback`, submito handles the response for you:

| Response | What happens |
|----------|--------------|
| Success | Popup with the server message (or a default), then `form.reset()` |
| Error with field errors | Messages next to the fields, first one focused. Popup only if there is also a message or an unmatched error |
| Any other error | Popup with the message (network failures and non-JSON errors get a localized default) |

`responseType` picks the popup:

| `responseType` | Popup |
|----------------|-------|
| `'dialog'` (default) | Built-in native `<dialog>`, no dependency |
| `'swal'` | [SweetAlert2](/sweetalert2). Falls back to the dialog if `window.Swal` is missing |
| `'none'` | No popup. Inline field errors and reset still happen |

Client-side validation failures never open a popup. The inline messages explain them.

## The built-in dialog

```js
submito.newForm({ form: '#contact' }); // responseType: 'dialog' is the default
```

- A single `<dialog class="submito-dialog">` is created on first use and reused.
- It opens as a modal: focus moves to its OK button, and it closes with OK, <kbd>Esc</kbd>, or a click on the backdrop. Focus then returns to where it was.
- Error dialogs use `role="alertdialog"`. The title and message are wired up with `aria-labelledby` / `aria-describedby`.
- All text is set with `textContent`, so server messages can never inject HTML.
- Titles and the button label come from the [i18n strings](/internationalization) `success_title`, `error_title` and `ok`.

### Theming

The dialog styles are injected once as `<style id="submito-styles">`. Every selector is wrapped in `:where()` (zero specificity), so any rule you write wins. The quickest way to theme it is with CSS variables:

```css
:root {
  --submito-accent: #4f46e5;     /* OK button */
  --submito-accent-fg: #fff;
  --submito-success: #16a34a;    /* success icon */
  --submito-error: #dc2626;      /* error icon */
  --submito-bg: #fff;
  --submito-fg: #111827;
  --submito-muted: #4b5563;      /* message text */
  --submito-radius: 14px;
  --submito-font: inherit;
  --submito-backdrop: rgb(15 23 42 / 0.45);
}
```

Dark mode example:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --submito-bg: #1f2937;
    --submito-fg: #f9fafb;
    --submito-muted: #d1d5db;
    --submito-accent: #f9fafb;
    --submito-accent-fg: #111827;
  }
}
```

For deeper changes, style the classes directly:

| Class | Element |
|-------|---------|
| `.submito-dialog` | the `<dialog>` (plus `--success` / `--error` modifier) |
| `.submito-dialog__panel` | inner wrapper with the padding |
| `.submito-dialog__icon` | round icon |
| `.submito-dialog__title` | `<h2>` |
| `.submito-dialog__message` | first message |
| `.submito-dialog__list` | extra messages (`<ul>`) |
| `.submito-dialog__actions` / `__button` | OK button row / button |

### Strict Content Security Policy

If your CSP blocks inline styles, the injected `<style>` is ignored and the dialog falls back to the browser's default `<dialog>` look. In that case, ship your own styles for the classes above. Any element with `id="submito-styles"` (for example your own `<link id="submito-styles" rel="stylesheet" …>`) stops submito from injecting.

## Skip the popup for one response

The `submito:success` and `submito:error` events are cancelable. Calling `preventDefault()` skips the built-in UI (popup, inline errors and reset) for that response only:

```js
document.querySelector('#contact').addEventListener('submito:success', (event) => {
  if (event.detail.response.data?.redirect) {
    event.preventDefault();
    location.assign(event.detail.response.data.redirect);
  }
});
```

## Your own UI

Pass `callback` to take over completely. See [Events & instance API](/events#callback).
