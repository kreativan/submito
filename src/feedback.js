import { showDialog } from './dialog.js';
import { hasSwal, swalAlert } from './integrations/swal.js';
import { logError } from './utils.js';

let warnedSwal = false;

/**
 * Show a success / error popup according to `responseType`:
 * `dialog` (built-in), `swal` (SweetAlert2, falls back to dialog when `Swal` is missing), `none`.
 *
 * @param {{ type: 'success'|'error', messages: string[], responseType: string, t: Function, swal?: object }} params
 */
export function notify({ type, messages, responseType, t, swal }) {
  if (responseType === 'none' || !messages.length) return;

  if (responseType === 'swal') {
    if (hasSwal()) {
      swalAlert({ type, messages, t, options: swal });
      return;
    }
    if (!warnedSwal) {
      warnedSwal = true;
      logError('responseType "swal" needs SweetAlert2 (window.Swal). Using the built-in dialog instead.');
    }
  }

  showDialog({ type, title: t(`${type}_title`), messages, okText: t('ok') });
}
