---
title: Cloudflare Turnstile
description: Add a Cloudflare Turnstile token to submissions and verify it on your server.
---

# Cloudflare Turnstile

[Turnstile](https://developers.cloudflare.com/turnstile/) is Cloudflare's privacy-friendly captcha. Most visitors never see a challenge. submito adds the token to the request as `cf-turnstile-response` and resets the widget after each request, because tokens are single-use.

There are two ways to set it up.

## Option A: submito renders the widget

Load the script in explicit mode and pass your site key:

```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>

<form id="contact" action="/api/contact">
  <input name="email" type="email" required />
  <div id="captcha"></div>
  <button>Send</button>
</form>
```

```js
submito.newForm({
  form: '#contact',
  turnstile: {
    siteKey: 'YOUR_SITE_KEY',
    container: '#captcha', // optional: default is a new <div class="submito-turnstile"> before the submit button
  },
});
```

The script may load after `newForm()`; submito waits for it. Any other key is passed to [`turnstile.render()`](https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/widget-configurations/):

```js
turnstile: {
  siteKey: 'YOUR_SITE_KEY',
  theme: 'light',
  size: 'flexible',
  action: 'contact',
  appearance: 'interaction-only',
}
```

Use a plain element as `container`, not one with the `cf-turnstile` class (Cloudflare would render that one a second time).

## Option B: your own widget

If the page already renders Turnstile implicitly, set `turnstile: true`. submito finds the `.cf-turnstile` element in the form:

```html
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

<form id="contact" action="/api/contact">
  …
  <div class="cf-turnstile" data-sitekey="YOUR_SITE_KEY"></div>
  <button>Send</button>
</form>
```

```js
submito.newForm({ form: '#contact', turnstile: true });
```

Pass `turnstile: { container: '#my-widget' }` if the widget lives somewhere else.

## What happens on submit

1. Client validation runs first.
2. submito reads the widget's token. If it is expired, the widget is refreshed.
3. No token yet? submito waits up to 3 seconds (30 seconds with `execution: 'execute'`, which it triggers for you). This covers users who click Send before the invisible check finishes.
4. Still no token: nothing is sent, and the form gets an error response with "Please complete the security check." (key `captcha_required`).
5. Otherwise the token is added as `cf-turnstile-response` (or `field`), and the widget is reset when the request ends.

## Testing

Cloudflare's [test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) work on `localhost` and any domain:

| Site key | Behavior |
|----------|----------|
| `1x00000000000000000000AA` | Always passes (visible) |
| `2x00000000000000000000AB` | Always fails (visible) |
| `1x00000000000000000000BB` | Always passes (invisible) |
| `3x00000000000000000000FF` | Forces an interactive challenge |

Use the secret key `1x0000000000000000000000000000000AA` on the server to always pass.

## Verify on the server

POST the token to `https://challenges.cloudflare.com/turnstile/v0/siteverify` with your **secret key**. Never ship the secret to the browser.

### Node

```js
async function verifyTurnstile(token, ip) {
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET, response: token, remoteip: ip }),
  });
  const result = await res.json();
  return result.success === true;
}

app.post('/api/contact', upload.none(), async (req, res) => {
  if (!(await verifyTurnstile(req.body['cf-turnstile-response'], req.ip))) {
    return res.status(400).json({ status: 'error', message: 'Verification failed. Please try again.' });
  }
  // …
});
```

### PHP

```php
<?php
function verify_turnstile(string $token): bool
{
    $ch = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS     => http_build_query([
            'secret'   => getenv('TURNSTILE_SECRET'),
            'response' => $token,
            'remoteip' => $_SERVER['REMOTE_ADDR'] ?? null,
        ]),
    ]);
    $result = json_decode((string) curl_exec($ch), true) ?: [];
    curl_close($ch);

    return !empty($result['success']);
}

if (!verify_turnstile($_POST['cf-turnstile-response'] ?? '')) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Verification failed. Please try again.']);
    exit;
}
```

If you set `action` on the widget, also check that `result.action` matches.
