---
title: Configuration
description: Every option accepted by submito.newForm().
---

# Configuration

```js
const form = submito.newForm(options);
```

`newForm` returns a form instance (see [Events & instance API](/events)). It returns `null` and logs a `console.error` when the form or endpoint cannot be found. If you call it again for the same form, the previous instance is destroyed first.

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `form` | `string \| HTMLFormElement` | — | **Required.** The form element, its id (`'contact'`), or a selector (`'#contact'`). |
| `url` | `string` | form `action` | Endpoint passed to `fetch`. Relative URLs resolve against the page. |
| `method` | `string` | form `method`, else `'POST'` | HTTP method. `GET` / `HEAD` send fields as a query string with no body. |
| `submitButton` | `string \| Element \| Element[]` | — | Extra trigger(s), e.g. a button outside the form. These are disabled during requests, like the form's own submit buttons. |
| `indicator` | `string \| Element` | — | Loading element, shown while a request is running. |
| `data` | `object \| (form) => object` | — | Extra fields added on every submit. A function runs per submit and may be `async`. |
| `headers` | `object \| Headers \| (form) => object` | — | Extra request headers, merged over `Accept: application/json`. |
| `responseType` | `'dialog' \| 'swal' \| 'none'` | `'dialog'` | Built-in popup for responses. See [Response UI](/response-ui). |
| `liveValidation` | `boolean` | `true` | Validate while the user types. `false` validates on submit only. |
| `resetOnSuccess` | `boolean` | `true` | Reset the form after a successful response (built-in UI only). |
| `messages` | `object` | — | Override built-in strings, e.g. `{ required: 'Required' }`. See [Internationalization](/internationalization). |
| `swal` | `object` | — | Extra SweetAlert2 options when `responseType: 'swal'`. |
| `recaptcha` | `string \| object` | — | reCAPTCHA v3 site key or `{ siteKey, action, field, enterprise }`. See [reCAPTCHA](/recaptcha). |
| `turnstile` | `true \| object` | — | Cloudflare Turnstile. See [Turnstile](/turnstile). |
| `iti` | `true \| object` | — | intl-tel-input phone field. See [Phone numbers](/intl-tel-input). |
| `callback` | `(response, form) => void` | — | Replaces the built-in response UI. Can be `async`. |

The [math captcha](/math-captcha) needs no option: add an input named `numb_captcha`.

## Full example

```js
submito.newForm({
  form: '#contact-form',
  url: '/api/contact',
  method: 'POST',
  indicator: '#sending',
  data: () => ({ page: location.pathname }),
  headers: () => ({ 'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content }),
  responseType: 'dialog',
  messages: { success: 'Thanks! We will reply within a day.' },
  turnstile: { siteKey: 'YOUR_TURNSTILE_SITE_KEY' },
  iti: { input: '#phone', country: 'US' },
});
```

## `data`: extra fields

```js
// Same values on every submit
data: { source: 'homepage', campaign: 'spring' }

// Computed per submit (may return a Promise)
data: (form) => ({ submitted_at: new Date().toISOString() })
```

- Values **replace** form fields with the same name.
- Arrays become repeated entries (`tags: ['a', 'b']` → `tags=a&tags=b`).
- Plain objects are sent as JSON strings. `File` / `Blob` values are sent as files.
- `null` / `undefined` values are skipped.

For one-off changes you can also edit `event.detail.formData` in a [`submito:before`](/events) listener.

## `headers`

```js
headers: { 'X-Requested-With': 'XMLHttpRequest' }
```

submito always sends `Accept: application/json` (frameworks such as Laravel use it to return JSON validation errors). Do not set `Content-Type` yourself: the browser adds the multipart boundary.

## `submitButton`

You usually do not need it. Every submit button of the form already works, including Enter in a text field and buttons outside the form linked with `form="id"`. Use it for elements that are not submit buttons:

```html
<form id="newsletter" action="/api/newsletter">…</form>
<a href="#" id="subscribe-link">Subscribe</a>
```

```js
submito.newForm({ form: '#newsletter', submitButton: '#subscribe-link' });
```

## `indicator`

```html
<span id="sending" class="hidden">Sending…</span>
```

While a request runs, submito removes the hiding marker the element already uses: the `hidden` class (Tailwind), `uk-hidden` (UIkit) or `d-none` (Bootstrap). It adds the marker back afterwards. If the element has none of these, the `hidden` attribute is used, and the element is hidden on init.

The submit buttons are disabled for the same period, and the form gets `aria-busy="true"`. Everything is restored when the request ends, including after errors and cancelled submits. A second submit while one is running is ignored.
