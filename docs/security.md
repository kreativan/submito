---
title: Security
description: What submito does for safety, and what your server still has to do.
---

# Security

submito is careful about how it puts text on the page. It does not replace server-side validation, authorization, CSRF protection or rate limiting.

## Messages are text, never HTML

Every message from validation or from your server is written with `textContent`: inline errors, the built-in dialog and the dialog list. With [SweetAlert2](/sweetalert2), messages are passed as `text`, and an `html` key in the `swal` option is dropped.

If you use `callback`, keep it that way: never put `response.message` or `response.data` into `innerHTML`.

## Client validation is not a boundary

Required fields, formats, the math captcha and phone checks all run in the browser and can be bypassed. Your endpoint must:

- validate every field again
- check authorization
- rate-limit and log abuse
- verify captcha tokens with the provider

## Captchas

| | Protection | Server check |
|---|---|---|
| [Math captcha](/math-captcha) | Weak: the answer is in the DOM | Optional sum check |
| [reCAPTCHA v3](/recaptcha) | Score-based bot detection | **Required**: `siteverify` with your secret key |
| [Turnstile](/turnstile) | Cloudflare challenge | **Required**: `siteverify` with your secret key |

Tokens prove nothing until your server verifies them. Keep secret keys in environment variables, never in front-end code or the repository.

## CSRF

submito sends cookies for same-origin requests (the `fetch` default), so session-based backends need CSRF protection. Either keep the framework's hidden field in the form:

```html
<form id="contact" action="/contact" method="post">
  <input type="hidden" name="_token" value="{{ csrf_token() }}" />
  …
</form>
```

or send the token as a header:

```js
submito.newForm({
  form: '#contact',
  headers: () => ({
    'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content,
  }),
});
```

Validate it on every state-changing request.

## File uploads

The `accept` attribute is only a hint. Check type, size and content on the server, and store uploads outside the web root.

## Third-party scripts

Optional integrations are globals you load yourself (`intlTelInput`, `Swal`, `grecaptcha`, `turnstile`). submito itself fetches one script, intl-tel-input's utils from jsDelivr, and only when you enable `iti` without providing `loadUtils`. Load third-party scripts from sources you trust, pin their versions, and use `integrity` attributes where the CDN supports them.

## Content Security Policy

With a strict CSP, allow the origins of the integrations you use (for example `https://challenges.cloudflare.com` for Turnstile, `https://www.google.com` and `https://www.gstatic.com` for reCAPTCHA, `https://cdn.jsdelivr.net` for intl-tel-input utils). The built-in dialog injects one `<style>` element; see [Response UI](/response-ui#strict-content-security-policy) if inline styles are blocked.
