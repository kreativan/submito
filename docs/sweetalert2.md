---
title: SweetAlert2
description: Show submito responses with SweetAlert2 instead of the built-in dialog.
---

# SweetAlert2

Prefer [SweetAlert2](https://sweetalert2.github.io/) over the built-in dialog? Load it so `window.Swal` exists, then set `responseType: 'swal'`.

```html
<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js"></script>
```

```js
submito.newForm({
  form: '#contact',
  responseType: 'swal',
});
```

Success and error responses open a SweetAlert2 modal with:

| Option | Value |
|--------|-------|
| `icon` | `'success'` or `'error'` |
| `title` | i18n `success_title` / `error_title` |
| `text` | the message(s) |
| `confirmButtonText` | i18n `ok` |

Inline field errors and the reset on success behave exactly as with the [built-in dialog](/response-ui). If `Swal` is not loaded, submito logs one `console.error` and uses the built-in dialog instead.

## Customize

Anything in the `swal` option is merged into every `Swal.fire()` call:

```js
submito.newForm({
  form: '#contact',
  responseType: 'swal',
  swal: {
    confirmButtonColor: '#4f46e5',
    customClass: { popup: 'my-popup' },
  },
});
```

Toasts instead of modals:

```js
swal: {
  toast: true,
  position: 'top-end',
  showConfirmButton: false,
  timer: 4000,
  timerProgressBar: true,
}
```

:::warning Messages are text only
Server messages are passed as `text`, never as `html`, so a response cannot inject markup. An `html` key in the `swal` option is ignored for the same reason.
:::
