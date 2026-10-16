import { logError, resolveElement, SubmitoError, waitFor } from '../utils.js';

/**
 * Cloudflare Turnstile. Needs `https://challenges.cloudflare.com/turnstile/v0/api.js` on the page.
 *
 * - `turnstile: true` → use the widget already in the form (`<div class="cf-turnstile" data-sitekey="…">`).
 * - `turnstile: { siteKey, container?, field?, ...renderParams }` → submito renders the widget
 *   (load the script with `?render=explicit`). `container` defaults to a new div before the submit button.
 *
 * The token is sent as `cf-turnstile-response` (or `field`). Tokens are single-use, so the widget is
 * reset after every request that used one.
 *
 * @param {{ form: HTMLFormElement, t: Function, submitters: () => Element[] }} context
 * @param {true | { siteKey?: string, container?: string|Element, field?: string, [param: string]: any }} config
 */
export default function turnstile({ form, t, submitters }, config) {
  const { siteKey, container, field = 'cf-turnstile-response', ...params } = config === true ? {} : config;
  const executeMode = params.execution === 'execute';
  let target = resolveElement(container);
  let created = null;
  let rendered = false;
  let used = false;
  let destroyed = false;

  const api = () => (typeof window.turnstile?.getResponse === 'function' ? window.turnstile : null);
  const safely = (run) => {
    try {
      return run(window.turnstile);
    } catch {
      return undefined; // widget not rendered (yet) or already removed
    }
  };

  let ready;
  if (siteKey) {
    if (!target) {
      created = target = document.createElement('div');
      created.className = 'submito-turnstile';
      const button = submitters().find((el) => form.contains(el));
      if (button) button.before(created);
      else form.append(created);
    }
    ready = waitFor(() => window.turnstile?.render).then((render) => {
      if (destroyed) return;
      if (!render) {
        logError('Turnstile is not loaded. Add https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit');
        return;
      }
      try {
        window.turnstile.render(target, { sitekey: siteKey, 'response-field-name': field, ...params });
        rendered = true;
      } catch (error) {
        logError('Turnstile render failed:', error);
      }
    });
  } else {
    target ??= form.querySelector('.cf-turnstile');
    if (!target) {
      logError('turnstile: no widget found. Add <div class="cf-turnstile" data-sitekey="…"> to the form or pass turnstile: { siteKey }.');
      return null;
    }
    ready = Promise.resolve();
  }

  const reset = () => {
    if (!used) return;
    used = false;
    safely((ts) => ts.reset(target));
  };

  return {
    async prepare(formData) {
      await ready;
      const ts = await waitFor(api, 3000);
      if (!ts || (siteKey && !rendered)) throw new SubmitoError(t('captcha_error'));

      if (safely(() => ts.isExpired(target))) safely(() => ts.reset(target));
      let token = safely(() => ts.getResponse(target));
      if (!token) {
        // Invisible / "execute" widgets run on demand; managed widgets may still be solving.
        if (executeMode) safely(() => ts.execute(target));
        token = await waitFor(() => safely(() => ts.getResponse(target)), executeMode ? 30000 : 3000, 100);
      }
      if (!token) throw new SubmitoError(t('captcha_required'));

      formData.set(field, token);
      used = true;
    },
    afterSubmit: reset,
    reset,
    destroy() {
      destroyed = true;
      if (rendered) safely((ts) => ts.remove(target));
      created?.remove();
    },
  };
}
