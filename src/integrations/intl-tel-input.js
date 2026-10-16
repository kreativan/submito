import { logError, resolveElement, waitFor } from '../utils.js';

// Used only when the loaded intl-tel-input does not report its version.
const FALLBACK_VERSION = '29.5.5';

const utilsUrl = (version) =>
  `https://cdn.jsdelivr.net/npm/intl-tel-input@${version || FALLBACK_VERSION}/dist/js/utils.js`;

/**
 * intl-tel-input phone field. Needs `window.intlTelInput` (load its script + CSS yourself).
 *
 * submito-only keys: `input` (element, id or selector; default: first `input[type="tel"]` in the form),
 * `country` (alias for `initialCountry`), `countryField`, `phoneCodeField`, `validate`.
 * Every other key is passed to `intlTelInput(input, options)`.
 *
 * On submit: the phone value becomes E.164 (`+359888123456`) and `country` (ISO2) and
 * `phone_code` (dial code digits) are added. Set either field option to `false` to skip it.
 *
 * @param {{ form: HTMLFormElement }} context
 * @param {true | object} config
 */
export default function intlTelInput({ form }, config) {
  const {
    input,
    id,
    country,
    countryField = 'country',
    phoneCodeField = 'phone_code',
    validate = true,
    ...libOptions
  } = config === true ? {} : config;

  const el = resolveElement(input ?? id) ?? form.querySelector('input[type="tel"]');
  if (!(el instanceof HTMLInputElement)) {
    logError(`iti: phone input not found (${String(input ?? id ?? 'input[type="tel"]')}).`);
    return null;
  }

  let iti = null;
  let owned = false;
  let destroyed = false;
  const utilsLoaded = () => Boolean(window.intlTelInput?.utils);

  const ready = waitFor(() => window.intlTelInput).then((lib) => {
    if (destroyed) return;
    if (!lib) {
      logError('iti: window.intlTelInput is not loaded. Add the intl-tel-input script to the page.');
      return;
    }

    iti = lib.getInstance?.(el) ?? null;
    if (iti) return; // initialised by the page itself: reuse it, never destroy it

    const options = { ...libOptions };
    if (country && !options.initialCountry) options.initialCountry = String(country).toLowerCase();
    if (!options.loadUtils && !lib.utils) {
      options.loadUtils = () => import(/* @vite-ignore */ /* webpackIgnore: true */ utilsUrl(lib.version));
    }
    try {
      iti = lib(el, options);
      owned = true;
    } catch (error) {
      logError('iti: intlTelInput() failed:', error);
    }
  });

  const selectedCountry = () => iti?.getSelectedCountry?.() ?? iti?.getSelectedCountryData?.() ?? null;

  return {
    rule(field) {
      if (field !== el || !validate || !iti || !utilsLoaded() || !el.value.trim()) return null;
      return iti.isValidNumber() === false ? { key: 'phone' } : null;
    },
    async prepare(formData) {
      await ready;
      if (!iti) return;
      try {
        await iti.promise;
      } catch {
        /* utils failed to load: still send country fields */
      }

      if (el.name && el.value.trim() && utilsLoaded()) {
        const number = iti.getNumber();
        if (number) formData.set(el.name, number);
      }
      const selected = selectedCountry();
      if (countryField && selected?.iso2) formData.set(countryField, selected.iso2);
      if (phoneCodeField && selected?.dialCode) formData.set(phoneCodeField, selected.dialCode);
    },
    destroy() {
      destroyed = true;
      if (owned) iti?.destroy();
      iti = null;
    },
  };
}
