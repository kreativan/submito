---
title: Events & instance API
description: submito events dispatched on each form, the callback option, and instance methods.
---

# Events & instance API

## Events

Every event is a `CustomEvent` dispatched **on the form element**. Events bubble, so you can listen on the form itself or once on `document` (where `event.target` is the form).

| Event | When | `event.detail` | Cancelable |
|-------|------|----------------|------------|
| `submito:invalid` | Client validation failed. No request was sent | `{ errors: [{ name, message, field }], instance }` | No |
| `submito:before` | Right before `fetch`, after captcha tokens and phone formatting were added | `{ formData, instance }` | **Yes**: `preventDefault()` cancels the request |
| `submito:success` | A successful response arrived | `{ response, formData, instance }` | **Yes**: skips the built-in UI for this response |
| `submito:error` | An error response, network failure or captcha failure | `{ response, formData, instance }` | **Yes**: skips the built-in UI for this response |
| `submito:after` | Everything is done and the buttons and indicator are restored | `{ response, formData, instance }` | No |

Order for one submit: `before` → `success` or `error` → `callback` or built-in UI → `after`.

`success` / `error` fire whether or not you use `callback`. `after` does not fire when validation fails (`invalid` fires instead) or when `before` is cancelled.

### What the user submitted

`formData` is the `FormData` object `submito:before` received, so it holds exactly what was sent: the form fields, your `data` values, the E.164 phone number with `country` / `phone_code`, and captcha tokens. It survives the reset that follows a successful submit, so prefer it over reading the form in `after`.

On a captcha failure the request is never sent, and `formData` is what would have been sent (without the token). It is `null` only if building the payload itself failed, for example when your `data()` function throws.

```js
form.addEventListener('submito:success', (event) => {
  const { formData, response } = event.detail;
  console.log(`Thanks, ${formData.get('name')}!`, response.message);
});
```

### Add fields right before sending

```js
const form = document.querySelector('#contact');

form.addEventListener('submito:before', (event) => {
  event.detail.formData.set('timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);
});
```

### Ask for confirmation

```js
form.addEventListener('submito:before', (event) => {
  if (!confirm('Send this message?')) event.preventDefault();
});
```

### Analytics for every form on the page

```js
document.addEventListener('submito:after', (event) => {
  analytics.track('form_submit', {
    form: event.target.id,
    success: event.detail.response.success,
    topic: event.detail.formData?.get('topic'),
  });
});
```

### Framework-style listeners

Event names are lowercase, so they work with attribute-based listeners, for example Alpine.js:

```html
<form id="contact" x-on:submito:success="sent = true">…</form>
```

## Callback

`callback(response, form)` replaces the built-in response UI: no popup, no inline server errors, no reset. The events still fire, and it may return a Promise.

```js
submito.newForm({
  form: '#contact',
  async callback(response, form) {
    if (response.success) {
      form.form.replaceWith(thankYouMessage(response.message));
      return;
    }
    const unmatched = form.showErrors(response.errors);
    showBanner([response.message, ...unmatched].filter(Boolean).join(' '));
  },
});
```

Client validation failures never reach the callback. They are always shown inline (listen for `submito:invalid` if you need to react).

## Instance API

`newForm()` returns an instance:

| Member | Description |
|--------|-------------|
| `form` | The `HTMLFormElement` |
| `options` | The resolved options |
| `busy` | `true` while a request is running |
| `submit(submitter?)` | Validate and send, as if the user submitted. Resolves with the response object, or `null` if invalid, cancelled or already busy |
| `validate()` | Validate all fields and show messages. Returns `true` when valid |
| `showErrors(errors)` | Show errors inline. Accepts any [error shape](/server-responses#errors). Returns the messages that matched no field |
| `clearErrors()` | Remove all inline errors |
| `reset()` | `form.reset()` plus clearing errors, a new math captcha question, and a fresh Turnstile widget |
| `destroy()` | Remove listeners, integration widgets and error markup. Use it when a form leaves the page |

```js
const form = submito.newForm({ form: '#wizard', responseType: 'none' });

const response = await form.submit();
if (response?.success) goToStep(3);
```

A `<button type="reset">` or a call to `form.form.reset()` resets submito's state too.
