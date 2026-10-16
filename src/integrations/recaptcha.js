import { logError, SubmitoError, waitFor } from '../utils.js';

/**
 * Google reCAPTCHA v3 (score-based, invisible). Needs the Google script on the page:
 * `<script src="https://www.google.com/recaptcha/api.js?render=SITE_KEY"></script>`
 * (or `enterprise.js` with `enterprise: true`). A fresh token is requested on every submit.
 *
 * reCAPTCHA v2 checkbox widgets need no option: their `g-recaptcha-response` field is
 * already inside the form and is sent with the rest of the FormData.
 *
 * @param {{ t: Function }} context
 * @param {string | { siteKey: string, action?: string, field?: string, enterprise?: boolean }} config
 */
export default function recaptcha({ t }, config) {
  const options = typeof config === 'string' ? { siteKey: config } : config;
  if (!options?.siteKey) {
    logError('recaptcha needs a site key, e.g. recaptcha: { siteKey: "…" }.');
    return null;
  }

  const { siteKey, action = 'submit', field = 'recaptcha_response', enterprise = false } = options;
  const api = () => {
    const grecaptcha = enterprise ? window.grecaptcha?.enterprise : window.grecaptcha;
    return typeof grecaptcha?.ready === 'function' || typeof grecaptcha?.execute === 'function' ? grecaptcha : null;
  };

  return {
    async prepare(formData) {
      const grecaptcha = await waitFor(api, 5000);
      if (!grecaptcha) {
        logError(`grecaptcha is not loaded. Add https://www.google.com/recaptcha/${enterprise ? 'enterprise' : 'api'}.js?render=<siteKey>.`);
        throw new SubmitoError(t('captcha_error'));
      }

      try {
        if (typeof grecaptcha.ready === 'function') await new Promise((resolve) => grecaptcha.ready(resolve));
        formData.set(field, await grecaptcha.execute(siteKey, { action }));
      } catch (error) {
        logError('reCAPTCHA failed:', error);
        throw new SubmitoError(t('captcha_error'));
      }
    },
  };
}
