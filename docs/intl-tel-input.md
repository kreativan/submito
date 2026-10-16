---
title: Phone numbers
description: International phone input with E.164 output, country fields and validation via intl-tel-input.
---

# Phone numbers (intl-tel-input)

submito can set up [intl-tel-input](https://intl-tel-input.com/) for you. The phone number is then validated, and the request carries a clean E.164 number such as `+359888123456` together with the country. The widget is not bundled: load it yourself so `window.intlTelInput` exists.

## 1. Load intl-tel-input

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/intl-tel-input@29.5.5/dist/css/intlTelInput.css" />
<script src="https://cdn.jsdelivr.net/npm/intl-tel-input@29.5.5/dist/js/intlTelInput.min.js"></script>
```

## 2. Add a phone field

```html
<div class="field">
  <label for="phone">Phone</label>
  <input id="phone" name="phone" type="tel" autocomplete="tel" />
</div>
```

## 3. Enable `iti`

```js
submito.newForm({
  form: '#contact',
  iti: { input: '#phone', country: 'BG' },
});
```

`iti: true` uses the first `input[type="tel"]` in the form.

## What is submitted

| Field | Example | Notes |
|-------|---------|-------|
| the phone input's `name` | `+359888123456` | E.164, only when a number was typed |
| `country` | `bg` | selected country (ISO 3166-1 alpha-2) |
| `phone_code` | `359` | dial code digits, without `+` |

The visible field keeps what the user typed. Only the submitted value is converted. The extra fields are added to the `FormData` (no hidden inputs are created) before [`submito:before`](/events), so listeners see the final payload.

## Validation

When the number is not empty and intl-tel-input reports it as invalid, the field shows "Please enter a valid phone number." (key `phone`). An empty field only fails if it has `required`. Once the field has been checked, changing the country checks it again.

Validation and E.164 formatting need intl-tel-input's utils script. submito loads it on demand from jsDelivr, using the same version as the loaded library. If you use the `intlTelInputWithUtils` build, or pass your own `loadUtils`, nothing extra is fetched. If the utils fail to load, the number is sent as typed and phone validation is skipped.

## Options

| Key | Default | Description |
|-----|---------|-------------|
| `input` | first `input[type="tel"]` | Element, id or selector of the phone input. |
| `country` | — | Initial country, ISO2, case-insensitive (`'BG'`). Shortcut for `initialCountry`. |
| `countryField` | `'country'` | Field name for the country. `false` to skip it. |
| `phoneCodeField` | `'phone_code'` | Field name for the dial code. `false` to skip it. |
| `validate` | `true` | `false` to skip the phone-number check. |
| *any other key* | — | Passed to `intlTelInput(input, options)`. |

```js
iti: {
  input: '#phone',
  country: 'US',
  countryField: 'phone_country',
  phoneCodeField: false,
  separateDialCode: true,
  onlyCountries: ['us', 'ca', 'gb'],
}
```

## Notes

- If the page already called `intlTelInput()` on that input, submito reuses that instance and leaves it alone on `destroy()`.
- If the script loads after `newForm()` (for example with `async`), submito waits for it.
- If the script or the input is missing, submito logs a `console.error` and the form keeps working without the widget.
- Error messages are placed below the whole widget, not inside the `.iti` wrapper.
