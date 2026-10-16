# submito API reference (consumers)

## `submito.newForm(options)`

Returns a form instance, or `null` (with a `console.error`) if the form is not found, or if neither `url` nor the form's `action` is set. Calling it again on the same form destroys the previous instance.

| Option | Type | Default | Notes |
|--------|------|---------|-------|
| `form` | `string \| HTMLFormElement` | — | **Required.** Element, id (`'contact'`) or selector (`'#contact'`) |
| `url` | `string` | form `action` | Endpoint |
| `method` | `string` | form `method`, else `'POST'` | GET/HEAD → fields in the query string, no body |
| `submitButton` | `string \| Element \| Element[]` | — | Extra triggers (non-submit elements, buttons outside the form). Native submit buttons + Enter work without it |
| `indicator` | `string \| Element` | — | Shown while sending. Toggles the existing `hidden` / `uk-hidden` / `d-none` class, else the `hidden` attribute (hidden on init) |
| `data` | `object \| (form) => object \| Promise<object>` | — | Extra fields per submit. Replace same-named fields; arrays → repeated entries; plain objects → JSON string; `null`/`undefined` skipped |
| `headers` | `object \| Headers \| (form) => object` | — | Merged over `Accept: application/json`. Never set `Content-Type` |
| `responseType` | `'dialog' \| 'swal' \| 'none'` | `'dialog'` | Built-in popup |
| `liveValidation` | `boolean` | `true` | `false` = validate on submit only |
| `resetOnSuccess` | `boolean` | `true` | Built-in UI only |
| `messages` | `object` | — | Override i18n strings for this form |
| `swal` | `object` | — | Merged into `Swal.fire()` (`html` is ignored) |
| `recaptcha` | `string \| { siteKey, action='submit', field='recaptcha_response', enterprise=false }` | — | reCAPTCHA v3 |
| `turnstile` | `true \| { siteKey?, container?, field='cf-turnstile-response', ...renderParams }` | — | `true` = existing `.cf-turnstile` widget in the form |
| `iti` | `true \| { input?, country?, countryField='country', phoneCodeField='phone_code', validate=true, ...itiOptions }` | — | intl-tel-input |
| `callback` | `(response, form) => void \| Promise` | — | Replaces the built-in response UI. Events still fire |

## Response object

Passed to `callback`, the `success`/`error`/`after` events, and returned by `form.submit()`:

```js
{
  success: boolean,   // HTTP 2xx && body does not signal error
  status: number,     // HTTP status; 0 = no response (network / captcha failure)
  message: string,    // message | msg | error | data.message ('' if none)
  errors: [{ name: string|null, message: string }],
  data: any,          // parsed JSON, raw text, or null
}
```

Body signal order: `success` boolean → `status` → `code` (`'success'`, `'ok'`, 2xx → success; `'error'`, `'fail'`, `'failed'`, `'invalid'`, ≥ 400 → error) → a non-empty `error` / `errors`. With no signal, the HTTP status decides.

Accepted `errors` shapes (the server may use any of them):

- `[{ name|field|path|param, message|error|msg }]`
- `{ email: ['Taken'] }` / `{ email: 'Taken' }` (Laravel / Rails / Django)
- `['General message']`
- Also read from `data.errors` (WordPress `wp_send_json_error`)

Field matching: `name` attribute, then `name[]`, then `a.b` → `a[b]`. Unmatched errors go to the popup.

## Built-in response UI (no `callback`)

- **Success:** popup with the message (or i18n `success`), then `form.reset()` if `resetOnSuccess`.
- **Error:** field errors inline and the first one focused; a popup with the message plus unmatched errors. A response with only matched field errors and no message gets no popup. Network / non-JSON errors get a localized default.
- Client validation failures: inline only, never a popup, never the callback.

## Events (on the form element, `bubbles: true`)

| Event | When | `event.detail` | Cancelable |
|-------|------|----------------|------------|
| `submito:invalid` | Client validation failed (no request) | `{ errors: [{ name, message, field }], instance }` | No |
| `submito:before` | Before `fetch`, after `data`, phone formatting and captcha tokens | `{ formData, instance }` | Yes: cancels the request |
| `submito:success` | Successful response | `{ response, formData, instance }` | Yes: skips the built-in UI |
| `submito:error` | Error response, network or captcha failure | `{ response, formData, instance }` | Yes: skips the built-in UI |
| `submito:after` | Done, buttons and indicator restored | `{ response, formData, instance }` | No |

`formData` in `success`/`error`/`after` is the same object `before` received: exactly what was sent (fields + `data` + E.164 phone + captcha tokens). It is still available after the success reset. It is `null` only if building the payload failed.

Order: `before` → `success`|`error` → callback or built-in UI → `after`. `after` is skipped when validation fails or `before` is cancelled. Listen on the form, or on `document` (`event.target` is the form).

```js
const el = document.querySelector('#contact');
el.addEventListener('submito:before', (e) => e.detail.formData.set('tz', Intl.DateTimeFormat().resolvedOptions().timeZone));
el.addEventListener('submito:success', (e) => {
  const url = e.detail.response.data?.redirect;
  if (url) { e.preventDefault(); location.assign(url); }
});
```

## Instance API

| Member | Description |
|--------|-------------|
| `form` | The `HTMLFormElement` |
| `options` | Resolved options |
| `busy` | `true` while a request runs (extra submits are ignored) |
| `submit(submitter?)` | Validate + send → `Promise<response \| null>` (null = invalid, cancelled or busy) |
| `validate()` | Show errors, focus the first invalid field → `boolean` |
| `showErrors(errors)` | Show any error shape inline → `string[]` of unmatched messages |
| `clearErrors()` | Remove inline errors |
| `reset()` | `form.reset()` + clear errors, new math captcha question, Turnstile reset |
| `destroy()` | Remove listeners, widgets and error markup |

## Validation

Rules come from the HTML: `required` (whitespace = empty), `type="email"` (incl. `multiple`), `type="url"`, number `badInput`, `minlength`, `maxlength`, `min`, `max`, `step`, `pattern` (message = `title` attribute if set), `setCustomValidity()` (shown as-is), intl-tel-input validity, and `numb_captcha`. Disabled, readonly, hidden and unnamed fields are skipped.

Live mode: a field is checked when the user commits it (`change`: leaves a changed text field, picks an option, toggles a box), then on every keystroke. After a submit attempt, all fields update while typing. A form `reset` clears everything.

## Markup hooks

| Hook | Meaning |
|------|---------|
| `<span class="error-message">` | Created in the field's parent (skips `.iti`; groups of radios/checkboxes in their own labels → the group container) |
| `.error` | Added to that parent while invalid |
| `aria-invalid="true"`, `aria-describedby` | On invalid controls |
| `[data-submito-error="name"]` | Your own message slot inside the form (text set and cleared, element never removed) |
| `novalidate` | Set on the form by `newForm`, restored by `destroy` |
| `aria-busy="true"` | On the form while sending |
| `.submito-dialog…` | Built-in dialog classes (see integrations.md) |

## i18n

Language = closest `lang` attribute (form → `<html>`); `de-AT` → `de`; unknown → `en`. Built in: `en`, `bg`, `de`, `es`, `fr`, `sr` (Latin). Override with `messages`.

Keys: `required`, `email`, `url`, `number`, `minlength` (`{min}`), `maxlength` (`{max}`), `min` (`{min}`), `max` (`{max}`), `pattern`, `invalid`, `phone`, `captcha`, `captcha_required`, `captcha_error`, `success_title`, `success`, `error_title`, `error`, `network`, `ok`.
