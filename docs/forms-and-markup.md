---
title: Forms & markup
description: HTML conventions, supported controls, where errors go, and how to style them.
---

# Forms & markup

submito works with the form you already have. It reads values, writes error text, and toggles a few attributes. You style everything.

## What submito changes on the form

| When | Change |
|------|--------|
| `newForm()` | `novalidate` on the form (browser bubbles are replaced by inline messages). Restored by `destroy()`. |
| Field invalid | `aria-invalid="true"` + `aria-describedby` on the control, class `error` on its wrapper, a message element. |
| Request running | `aria-busy="true"` on the form, submit buttons `disabled`, indicator shown. |
| Success (built-in UI) | `form.reset()`, unless `resetOnSuccess: false`. |

## Fields

Every field you want to send needs a `name`. submito builds the payload with the browser's own `new FormData(form)`, so the rules are the native ones:

| Control | Sent |
|---------|------|
| text, email, tel, number, date, hidden, … | the `value` |
| `select` | the selected value(s); `multiple` sends one entry per option |
| `textarea` | the value |
| checkbox / radio | only when checked |
| `file` | each selected file; empty file inputs are dropped |
| the clicked submit button | its `name=value`, if it has a `name` |
| disabled fields | nothing |

Fields outside the `<form>` tag but linked with `form="form-id"` are included. Use bracket names (`tags[]`, `user[email]`) if your backend expects arrays or nested fields.

## Where error messages go

By default submito appends a message to the field's parent element:

```html
<label class="field error">
  Email
  <input name="email" type="email" aria-invalid="true" aria-describedby="submito-error-1" />
  <span class="error-message" id="submito-error-1">Please enter a valid email address.</span>
</label>
```

- Wrap each control in its own element (a `<label>` or `<div>`) so the message lands next to it.
- A group of radios or checkboxes that each sit in their own `<label>` gets one message on the group's container.
- The intl-tel-input wrapper (`.iti`) is skipped, so the message goes below the phone field.

### Custom placement

Put an element with `data-submito-error="<field name>"` anywhere in the form, and submito writes into it instead:

```html
<div class="row">
  <input name="email" type="email" required />
  <button>Subscribe</button>
</div>
<p class="form-hint" data-submito-error="email"></p>
```

submito never removes your element. It only sets and clears its text, so you can style the empty state with `:empty`.

## Styling

```css
.error-message {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #b00020;
}

[aria-invalid="true"] {
  border-color: #b00020;
}

.error > label,
.error .label {
  color: #b00020;
}

form[aria-busy="true"] {
  cursor: progress;
}
```

Error text is always set with `textContent`, never as HTML.

## Loading indicator

```html
<button type="submit">Send</button>
<span id="sending" hidden>Sending…</span>
```

```js
submito.newForm({ form: '#contact', indicator: '#sending' });
```

See [Configuration → indicator](/configuration#indicator) for the class rules (`hidden`, `uk-hidden`, `d-none`).

## Multiple forms

Call `newForm` once per form:

```js
submito.newForm({ form: '#newsletter' });
submito.newForm({ form: '#contact', indicator: '#contact-sending' });
```

Each instance is independent. Events are dispatched on their own form element, so listeners never need to filter by id unless they listen on `document`.

## Forms added later

Call `newForm` after the form exists in the DOM, for example after you inject it or when your component mounts. When you remove it again, call `form.destroy()`. Calling `newForm` twice on the same form element replaces the old instance.
