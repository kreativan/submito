---
title: Google reCAPTCHA
description: Send a reCAPTCHA v3 token with every submit and verify it on your server.
---

# Google reCAPTCHA

submito supports **reCAPTCHA v3**, the invisible score-based version. On every submit it asks Google for a fresh token and adds it to the request as `recaptcha_response`. Only your server can decide whether the token is good.

## Front end

1. Load Google's script with your site key:

```html
<script src="https://www.google.com/recaptcha/api.js?render=YOUR_SITE_KEY"></script>
```

2. Pass the site key:

```js
submito.newForm({
  form: '#contact',
  recaptcha: 'YOUR_SITE_KEY',
});
```

Or with every option:

```js
recaptcha: {
  siteKey: 'YOUR_SITE_KEY',
  action: 'contact',             // default 'submit'; your server should check it
  field: 'g-recaptcha-response', // default 'recaptcha_response'
  enterprise: false,             // true for reCAPTCHA Enterprise (enterprise.js)
}
```

The token request happens after client validation passes and before [`submito:before`](/events). If `grecaptcha` has not loaded within a few seconds, or Google returns an error, nothing is sent. Instead the form gets an error response (`status: 0`, message key `captcha_error`), which goes to the popup or your callback like any other error.

### reCAPTCHA v2 (checkbox)

v2 needs no submito option. Google's widget puts a `g-recaptcha-response` field inside your form, and that field is sent with the rest of the form data:

```html
<script src="https://www.google.com/recaptcha/api.js" async defer></script>
<form id="contact" action="/api/contact">
  …
  <div class="g-recaptcha" data-sitekey="YOUR_SITE_KEY"></div>
  <button>Send</button>
</form>
```

Call `grecaptcha.reset()` in a [`submito:after`](/events) listener if users may submit more than once.

## Verify on the server

POST to `https://www.google.com/recaptcha/api/siteverify` with:

| Parameter | Value |
|-----------|-------|
| `secret` | your **secret** key (server only, never in front-end code or git) |
| `response` | the `recaptcha_response` field |

Accept the request only when `success` is `true`, `action` matches, and `score` is at or above your threshold (start around `0.5`).

### PHP

```php
<?php
function verify_recaptcha(string $token, string $action = 'submit'): bool
{
    $ch = curl_init('https://www.google.com/recaptcha/api/siteverify');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS     => http_build_query([
            'secret'   => getenv('RECAPTCHA_SECRET'),
            'response' => $token,
            'remoteip' => $_SERVER['REMOTE_ADDR'] ?? null,
        ]),
    ]);
    $result = json_decode((string) curl_exec($ch), true) ?: [];
    curl_close($ch);

    return !empty($result['success'])
        && ($result['action'] ?? '') === $action
        && ($result['score'] ?? 0) >= 0.5;
}

if (!verify_recaptcha($_POST['recaptcha_response'] ?? '')) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Verification failed. Please try again.']);
    exit;
}
```

### Node

```js
async function verifyRecaptcha(token, action = 'submit') {
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET, response: token }),
  });
  const result = await res.json();
  return result.success && result.action === action && result.score >= 0.5;
}
```

### WordPress

```php
$response = wp_remote_post('https://www.google.com/recaptcha/api/siteverify', [
    'body' => ['secret' => RECAPTCHA_SECRET, 'response' => $_POST['recaptcha_response'] ?? ''],
]);
$result = json_decode(wp_remote_retrieve_body($response), true) ?: [];

if (empty($result['success']) || ($result['score'] ?? 0) < 0.5) {
    wp_send_json_error(['message' => 'Verification failed.'], 400);
}
```

Define `RECAPTCHA_SECRET` in `wp-config.php`, not in a theme or plugin file that ends up in git.
