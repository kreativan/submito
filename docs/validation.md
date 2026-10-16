---
title: Validation
description: Client-side validation from HTML constraints, live while the user types.
---

# Validation

submito validates in the browser before anything is sent. The rules come from the HTML you already write. Failed checks show inline messages, focus the first invalid field, fire [`submito:invalid`](/events), and skip the request.

:::warning Not a security boundary
Anyone can bypass browser checks or call your endpoint directly. Always validate again on the server. See [Security](/security).
:::

## Rules

| HTML | Message key | Default message |
|------|-------------|-----------------|
| `required` (whitespace-only counts as empty) | `required` | This field is required. |
| `type="email"` (also `multiple`) | `email` | Please enter a valid email address. |
| `type="url"` | `url` | Please enter a valid URL. |
| `type="number"` with non-numeric input | `number` | Please enter a valid number. |
| `minlength="8"` | `minlength` | Please enter at least {min} characters. |
| `maxlength="200"` | `maxlength` | Please enter no more than {max} characters. |
| `min="18"` (numbers, dates) | `min` | Please enter a value of {min} or more. |
| `max="120"` | `max` | Please enter a value of {max} or less. |
| `step` mismatch, unparsable dates | `invalid` | Please enter a valid value. |
| `pattern="…"` | `pattern`, or the field's `title` | Please match the requested format. |
| intl-tel-input number | `phone` | Please enter a valid phone number. |
| `name="numb_captcha"` | `captcha` | Incorrect answer. Please try again. |

Checks run in that order. Only the first failing rule is shown. Disabled, readonly and hidden fields, and fields without a `name`, are skipped.

### Custom message per pattern

The `title` attribute becomes the message for `pattern`:

```html
<input name="username" pattern="[a-z]{3,12}" title="Use 3–12 lowercase letters." />
```

### Change the wording

Override any message for one form with `messages` (see [Internationalization](/internationalization)):

```js
submito.newForm({
  form: '#signup',
  messages: {
    required: 'Required',
    minlength: 'At least {min} characters, please.',
  },
});
```

### Custom rules with `setCustomValidity`

Anything you set with the standard `setCustomValidity()` API is shown like a built-in rule:

```js
const confirm = document.querySelector('[name="password_confirm"]');
confirm.addEventListener('input', () => {
  const same = confirm.value === document.querySelector('[name="password"]').value;
  confirm.setCustomValidity(same ? '' : 'Passwords do not match.');
});
```

Attach the listener to the field itself. It then runs before submito's listener on the form, so submito sees the updated validity.

## When validation runs

**On submit.** Every field is checked and the first invalid one is focused.

**While the user works on the form** (`liveValidation: true`, the default):

1. Nothing is flagged while someone types into a field for the first time.
2. When they leave a field they changed (or pick an option, or toggle a checkbox), that field is checked.
3. After that, the field is re-checked on every keystroke. Errors disappear as soon as the value is fixed.
4. After a submit attempt, every field is re-checked on every keystroke.

Tabbing through an empty field does not show an error. Resetting the form clears all messages and starts over.

Set `liveValidation: false` to validate only on submit.

### Validate from code

```js
const form = submito.newForm({ form: '#checkout' });

nextStepButton.addEventListener('click', () => {
  if (form.validate()) goToNextStep();
});
```

`validate()` shows the messages, focuses the first invalid field, and returns `true` when everything passes.

## Server-side errors

Messages returned by your API are shown next to the matching field in the same way. See [Server responses](/server-responses). They are cleared when the user edits the field, or on the next submit.
