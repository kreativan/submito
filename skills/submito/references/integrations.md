# submito integrations

submito never bundles or auto-loads third-party scripts. Add them to the page yourself. submito waits for scripts that load `async`, logs a `console.error` if one never appears, and keeps the form working.

## Cloudflare Turnstile

Explicit rendering by submito (recommended):

```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>
<div id="captcha"></div> <!-- inside the form; plain element, NOT class="cf-turnstile" -->
```

```js
submito.newForm({
  form: '#contact',
  turnstile: { siteKey: 'SITE_KEY', container: '#captcha', theme: 'auto', action: 'contact' },
});
```

- Without `container`, a `<div class="submito-turnstile">` is inserted before the submit button.
- Extra keys are passed to `turnstile.render()` (`theme`, `size`, `action`, `appearance`, `execution`, …).
- Existing implicit widget (`<div class="cf-turnstile" data-sitekey>` inside the form): use `turnstile: true`.
- On submit: the token is read (an expired one is refreshed). With no token yet, submito waits 3 s (30 s and triggers `execute()` when `execution: 'execute'`), else returns an error response "Please complete the security check." The token is sent as `cf-turnstile-response`, and the widget resets after each request.
- Test site keys (any domain): `1x00000000000000000000AA` pass, `2x00000000000000000000AB` fail, `3x00000000000000000000FF` interactive. Test secret: `1x0000000000000000000000000000000AA`.
- **Verify** at `https://challenges.cloudflare.com/turnstile/v0/siteverify` (see server.md).

## Google reCAPTCHA v3

```html
<script src="https://www.google.com/recaptcha/api.js?render=SITE_KEY"></script>
```

```js
recaptcha: 'SITE_KEY'
// or
recaptcha: { siteKey: 'SITE_KEY', action: 'contact', field: 'recaptcha_response', enterprise: false }
```

- A fresh token is requested on every submit (after validation, before `submito:before`) and sent as `recaptcha_response`.
- If `grecaptcha` is not loaded within about 5 s, or Google fails: no request, and an error response with `captcha_error`.
- `enterprise: true` uses `grecaptcha.enterprise` (load `enterprise.js`).
- v2 checkbox: no option needed. Its `g-recaptcha-response` field is inside the form and is sent automatically; call `grecaptcha.reset()` on `submito:after`.
- **Verify** at `https://www.google.com/recaptcha/api/siteverify`: check `success`, `action` and `score` ≥ about 0.5.

## Math captcha

```html
<label>Are you human? <input name="numb_captcha" required /></label>
```

No option. submito sets a `3 + 7 = ?` placeholder, adds hidden `num1` / `num2`, validates the sum (key `captcha`) and regenerates on reset. A weak deterrent only (the answer is in the DOM). The server can re-check `num1 + num2 == numb_captcha`.

## intl-tel-input

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@29.5.5/dist/css/intlTelInput.css" />
<script src="https://cdn.jsdelivr.net/npm/intl-tel-input@29.5.5/dist/js/intlTelInput.min.js"></script>
<input id="phone" name="phone" type="tel" autocomplete="tel" />
```

```js
iti: { input: '#phone', country: 'US' }   // or iti: true → first input[type="tel"]
```

| Key | Default | Notes |
|-----|---------|-------|
| `input` | first `input[type="tel"]` | element / id / selector |
| `country` | — | ISO2 shortcut for `initialCountry` |
| `countryField` | `'country'` | `false` to omit |
| `phoneCodeField` | `'phone_code'` | dial digits, no `+`; `false` to omit |
| `validate` | `true` | non-empty numbers must pass `isValidNumber()` (key `phone`) |
| other keys | — | passed to `intlTelInput()` (`separateDialCode`, `onlyCountries`, …) |

- Submitted: the phone `name` → E.164 (`+15551234567`), `country=us`, `phone_code=1`. The visible input is unchanged, and no hidden inputs are created.
- The utils module is loaded on demand from jsDelivr, matching the loaded version (unless you use `intlTelInputWithUtils` or pass `loadUtils`).
- An instance the page already created is reused and not destroyed.
- Error messages go below the whole `.iti` widget.

## SweetAlert2

```html
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
```

```js
responseType: 'swal',
swal: { confirmButtonColor: '#4f46e5' },            // merged into every Swal.fire()
// toasts: swal: { toast: true, position: 'top-end', timer: 4000, showConfirmButton: false }
```

The popup uses `icon` success/error, i18n `title`, the message as `text` (never `html`) and i18n `ok` for the button. A missing `Swal` falls back to the built-in dialog.

## Built-in dialog (`responseType: 'dialog'`, default)

A native modal `<dialog class="submito-dialog submito-dialog--success|--error">`. It closes with OK, Esc or a backdrop click, uses `role="alertdialog"` for errors, and sets all text with `textContent`.

Theme it with CSS variables:

```css
:root {
  --submito-accent: #4f46e5;  --submito-accent-fg: #fff;
  --submito-success: #16a34a; --submito-error: #dc2626;
  --submito-bg: #fff; --submito-fg: #111827; --submito-muted: #4b5563;
  --submito-radius: 14px; --submito-font: inherit; --submito-backdrop: rgb(15 23 42 / .45);
}
```

Classes: `__panel`, `__icon`, `__title`, `__message`, `__list`, `__actions`, `__button`. The injected styles use `:where()` (zero specificity). Under a strict CSP, provide your own styles. Any element with `id="submito-styles"` stops the injection.
