/**
 * Optional SweetAlert2 output (`responseType: 'swal'`). Needs `window.Swal`; submito never bundles it.
 */

export function hasSwal() {
  return typeof window.Swal?.fire === 'function';
}

/**
 * @param {{ type: 'success'|'error', messages: string[], t: Function, options?: object }} params
 *   `options` is the `swal` option, merged into `Swal.fire()`. `html` is dropped: messages are untrusted.
 */
export function swalAlert({ type, messages, t, options }) {
  const custom = { ...options };
  delete custom.html;

  return window.Swal.fire({
    icon: type,
    title: t(`${type}_title`),
    confirmButtonText: t('ok'),
    ...custom,
    text: messages.join('\n'),
  });
}
