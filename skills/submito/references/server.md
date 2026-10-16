# Server endpoints for submito

submito sends `multipart/form-data` (the form's FormData) with `Accept: application/json`, plus same-origin cookies. Return JSON:

- Success: HTTP 200 + `{ "status": "success", "message": "…" }`
- Validation error: HTTP 422 + `{ "message": "…", "errors": [{ "name": "email", "message": "…" }] }` (or `errors: { email: ["…"] }`)
- Other error: HTTP 4xx/5xx + `{ "status": "error", "message": "…" }`

Error `name` values must match the inputs' `name` attributes. Always re-validate everything server-side.

## Express

```js
import express from 'express';
import multer from 'multer';

const app = express();
const upload = multer(); // multipart parser; use .single('file') / .array('files[]') for uploads

app.post('/api/contact', upload.none(), async (req, res) => {
  const { email = '', message = '' } = req.body;

  if (!(await verifyTurnstile(req.body['cf-turnstile-response'], req.ip))) {
    return res.status(400).json({ status: 'error', message: 'Verification failed. Please try again.' });
  }

  const errors = [];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push({ name: 'email', message: 'Enter a valid email.' });
  if (message.trim().length < 10) errors.push({ name: 'message', message: 'At least 10 characters.' });
  if (errors.length) return res.status(422).json({ message: 'Please fix the highlighted fields.', errors });

  // …save / send…
  res.json({ status: 'success', message: 'Thanks! We will reply soon.' });
});

async function verifyTurnstile(token, ip) {
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: process.env.TURNSTILE_SECRET, response: token ?? '', remoteip: ip }),
  });
  return (await r.json()).success === true;
}

async function verifyRecaptcha(token, action = 'submit') {
  const r = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    body: new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET, response: token ?? '' }),
  });
  const result = await r.json();
  return result.success && result.action === action && result.score >= 0.5;
}
```

## PHP

```php
<?php
header('Content-Type: application/json');

function siteverify(string $url, string $secret, string $token): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS => http_build_query(['secret' => $secret, 'response' => $token]),
    ]);
    $result = json_decode((string) curl_exec($ch), true) ?: [];
    curl_close($ch);
    return $result;
}

$turnstile = siteverify(
    'https://challenges.cloudflare.com/turnstile/v0/siteverify',
    getenv('TURNSTILE_SECRET'),
    $_POST['cf-turnstile-response'] ?? ''
);
if (empty($turnstile['success'])) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => 'Verification failed.']);
    exit;
}

$errors = [];
if (!filter_var($_POST['email'] ?? '', FILTER_VALIDATE_EMAIL)) {
    $errors[] = ['name' => 'email', 'message' => 'Enter a valid email.'];
}
if ($errors) {
    http_response_code(422);
    echo json_encode(['message' => 'Please fix the highlighted fields.', 'errors' => $errors]);
    exit;
}

echo json_encode(['status' => 'success', 'message' => 'Message sent!']);
```

Files are in `$_FILES`; for reCAPTCHA use `https://www.google.com/recaptcha/api/siteverify` and also check `action` + `score`.

## Laravel

`$request->validate([...])` already returns `422 { message, errors: { field: [...] } }` because submito sends `Accept: application/json`. Return `response()->json(['message' => 'Saved!'])` on success. CSRF: keep `@csrf` in the form (the `_token` field is sent) or pass `headers: () => ({ 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content })`.

## WordPress (admin-ajax)

```php
add_action('wp_ajax_nopriv_contact', 'theme_contact');
add_action('wp_ajax_contact', 'theme_contact');

function theme_contact() {
    check_ajax_referer('contact');
    if (empty($_POST['email'])) {
        wp_send_json_error(['message' => 'Please fix the highlighted fields.', 'errors' => ['email' => 'Email is required.']], 422);
    }
    wp_send_json_success(['message' => 'Thanks!']);
}
```

```js
submito.newForm({
  form: '#contact',
  url: '/wp-admin/admin-ajax.php',
  data: { action: 'contact', _ajax_nonce: window.contactNonce },
});
```

`{ success: false, data: { message, errors } }` is understood natively.

## Secrets

Keep `TURNSTILE_SECRET` / `RECAPTCHA_SECRET` in environment variables or `wp-config.php`, never in front-end code or git.
