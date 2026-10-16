---
title: Math captcha
description: A zero-dependency "3 + 7 = ?" question to slow down simple bots.
---

# Math captcha

Add a text input named `numb_captcha` to the form. No option is needed:

```html
<label>
  Are you human?
  <input name="numb_captcha" required />
</label>
```

When the form is bound, submito:

- picks two numbers from 1 to 10 and sets the placeholder to something like `3 + 7 = ?`
- adds hidden inputs `num1` and `num2` with the numbers (or reuses them if they already exist)
- sets `autocomplete="off"` and `inputmode="numeric"` unless you set them yourself
- checks the answer as part of [validation](/validation). A wrong or empty answer shows "Incorrect answer. Please try again." (key `captcha`)
- asks a new question whenever the form resets, including after a successful submit

The request contains `numb_captcha`, `num1` and `num2`, so your server can check the sum again:

```php
if ((int) $_POST['num1'] + (int) $_POST['num2'] !== (int) $_POST['numb_captcha']) {
    http_response_code(422);
    echo json_encode(['errors' => ['numb_captcha' => 'Incorrect answer.']]);
    exit;
}
```

:::warning A speed bump, not protection
The numbers are in the page, so any script that reads the DOM can solve it. It stops naive form spam only. For real bot protection use [Cloudflare Turnstile](/turnstile) or [Google reCAPTCHA](/recaptcha), and verify the token on the server.
:::

The placeholder is the only place the question appears. Make sure your label says what the field is for ("Are you human?", "Solve the sum"), because placeholder text disappears while the user types.
