---
title: Server responses
description: The JSON your endpoint should return, how submito reads it, and backend examples.
---

# Server responses

submito sends `multipart/form-data` (the form's `FormData`) with `Accept: application/json`. Your endpoint should return JSON. submito turns the reply into a single response object.

## The response object

This is what `callback`, the events and `form.submit()` give you:

```js
{
  success: true,          // HTTP 2xx and the body does not signal an error
  status: 200,            // HTTP status; 0 if no response arrived (network or captcha failure)
  message: 'Thanks!',     // the server's message, '' when there is none
  errors: [               // normalized errors (see below)
    { name: 'email', message: 'Already registered.' },
    { name: null, message: 'Try again tomorrow.' },
  ],
  data: { /* the parsed JSON body, the raw text if it is not JSON, or null */ },
}
```

## How success is decided

A response is a **success** when the HTTP status is 2xx **and** the JSON body does not report an error. The body is checked in this order, and the first match wins:

1. `success: true | false`
2. `status`: `"success"`, `"ok"`, or a 2xx number means success. `"error"`, `"fail"`, `"failed"`, `"invalid"`, or a number ≥ 400 means error.
3. `code`: same rules as `status`.
4. A non-empty `error` string, or a non-empty `errors` value, means error.

A body without any of these signals follows the HTTP status. Empty bodies and non-JSON bodies never throw: an HTML error page with HTTP 500 becomes `{ success: false, status: 500, data: '<html>…' }`.

## Message

The first non-empty string of `message`, `msg`, `error`, or `data.message` is used. For WordPress-style replies, `data` itself is used when it is a string.

When the server sends no message, the built-in UI falls back to localized defaults ("Your submission has been received." / "We could not process your request.").

## Errors

All of these shapes are accepted and normalized to `{ name, message }`:

```jsonc
// Array of objects: name | field | path | param, and message | error | msg
"errors": [{ "name": "email", "message": "Already registered." }]

// Object keyed by field (Laravel, Rails, Django): first message per field
"errors": { "email": ["The email has already been taken."] }

// Plain strings: general errors
"errors": ["Mail server unavailable."]
```

Field names are matched to `name` attributes. `tags` also matches `tags[]`, and dotted names like `user.email` match `user[email]`. Errors that match no field are shown in the popup instead.

## Recommended payloads

```json
{ "status": "success", "message": "Thanks, we will reply within a day." }
```

```json
{
  "status": "error",
  "message": "Please fix the highlighted fields.",
  "errors": [{ "name": "email", "message": "This email is already registered." }]
}
```

Send field errors with HTTP 422 (or 400). With the built-in UI, field errors are shown inline and the first one is focused. A popup appears only when there is a `message` or an error that did not match a field.

## Express

```js
import express from 'express';
import multer from 'multer';

const app = express();
const upload = multer(); // parses multipart/form-data

app.post('/api/contact', upload.none(), (req, res) => {
  const { name, email } = req.body;

  if (!email) {
    return res.status(422).json({
      status: 'error',
      message: 'Please fix the highlighted fields.',
      errors: [{ name: 'email', message: 'Email is required.' }],
    });
  }

  // …save, send mail…
  res.json({ status: 'success', message: `Thanks, ${name}!` });
});

app.listen(3000);
```

Use `upload.single('attachment')` / `upload.array('files[]')` for file fields.

## PHP

```php
<?php
header('Content-Type: application/json');

$email = trim($_POST['email'] ?? '');

if ($email === '') {
    http_response_code(422);
    echo json_encode([
        'status'  => 'error',
        'message' => 'Please fix the highlighted fields.',
        'errors'  => [['name' => 'email', 'message' => 'Email is required.']],
    ]);
    exit;
}

// …save…

echo json_encode(['status' => 'success', 'message' => 'Message sent!']);
```

Text fields are in `$_POST`, files in `$_FILES`.

## Laravel

Laravel's validation replies work as they are:

```php
public function store(Request $request)
{
    $request->validate([
        'email' => ['required', 'email', 'unique:subscribers'],
    ]);

    // …

    return response()->json(['message' => 'Subscribed!']);
}
```

A failed `validate()` returns HTTP 422 with `{ message, errors: { email: [...] } }`. submito shows each field error inline and the message in the popup. The `Accept: application/json` header that submito sends is what makes Laravel answer with JSON instead of a redirect. For CSRF, add the token to `headers` (see [Security](/security#csrf)).

## WordPress

`wp_send_json_success()` / `wp_send_json_error()` replies are understood:

```php
add_action('wp_ajax_nopriv_contact', 'my_contact');
add_action('wp_ajax_contact', 'my_contact');

function my_contact() {
    check_ajax_referer('contact');

    if (empty($_POST['email'])) {
        wp_send_json_error([
            'message' => 'Please fix the highlighted fields.',
            'errors'  => ['email' => 'Email is required.'],
        ], 422);
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
