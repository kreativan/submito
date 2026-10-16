---
title: Internationalization
description: Built-in languages, language detection, and overriding any message.
---

# Internationalization

Validation messages, dialog titles and the OK label come from built-in dictionaries. submito picks the language from the **closest `lang` attribute** around the form (falling back to `<html lang>`). A regional code falls back to its base language (`sr-Latn` → `sr`, `en-GB` → `en`), and unknown languages fall back to English.

```html
<html lang="sr">
  …
  <!-- or per form -->
  <section lang="en">
    <form id="contact">…</form>
  </section>
</html>
```

Built-in languages:

| Code | Language |
|------|----------|
| `en` | English (default and fallback) |
| `bg` | Bulgarian |
| `de` | German |
| `es` | Spanish |
| `fr` | French |
| `sr` | Serbian (Latin script) |

Regional variants use the base dictionary, so `de-AT`, `es-MX`, `fr-CA` and `sr-Latn` all work.

## Override messages

Use `messages` to replace any string for one form. Anything you leave out keeps the built-in text for the detected language:

```js
submito.newForm({
  form: '#signup',
  messages: {
    required: 'Please fill this in.',
    minlength: 'Use at least {min} characters.',
    success_title: 'Welcome aboard!',
    success: 'Check your inbox to confirm your email.',
  },
});
```

For a language submito does not ship, pass the whole set in `messages` (for example, render it from your server for the current locale).

## Keys

| Key | English default |
|-----|-----------------|
| `required` | This field is required. |
| `email` | Please enter a valid email address. |
| `url` | Please enter a valid URL. |
| `number` | Please enter a valid number. |
| `minlength` | Please enter at least {min} characters. |
| `maxlength` | Please enter no more than {max} characters. |
| `min` | Please enter a value of {min} or more. |
| `max` | Please enter a value of {max} or less. |
| `pattern` | Please match the requested format. |
| `invalid` | Please enter a valid value. |
| `phone` | Please enter a valid phone number. |
| `captcha` | Incorrect answer. Please try again. |
| `captcha_required` | Please complete the security check. |
| `captcha_error` | The security check could not be completed. Please try again. |
| `success_title` | Thank you! |
| `success` | Your submission has been received. |
| `error_title` | Something went wrong |
| `error` | We could not process your request. Please try again. |
| `network` | Network error. Check your connection and try again. |
| `ok` | OK |

`{min}` and `{max}` are replaced with the field's attribute values. `success` and `error` are only used when the server sends no message.

## Server messages

submito never translates `message` or `errors` from your API. Return them in the user's language, for example based on the `Accept-Language` header or a `locale` field you add with [`data`](/configuration#data-extra-fields).

## Contributing a language

Dictionaries live in `src/i18n.js`. Add a new top-level key (e.g. `de`) with the same keys as `en`, rebuild, and open a pull request.
