import FieldErrors from './field-errors.js';
import { notify } from './feedback.js';
import { langOf, translate } from './i18n.js';
import { errorResponse, normalizeErrors, parseResponse } from './response.js';
import { checkField, isValidatable } from './validation.js';
import { emit, isPlainObject, logError, resolveElement, resolveElements, SubmitoError } from './utils.js';
import intlTelInput from './integrations/intl-tel-input.js';
import numbCaptcha from './integrations/numb-captcha.js';
import recaptcha from './integrations/recaptcha.js';
import turnstile from './integrations/turnstile.js';

/**
 * @typedef {object} SubmitoOptions
 * @property {string|HTMLFormElement} form  Form element, id (`"contact"`) or selector (`"#contact"`). Required.
 * @property {string} [url]  Endpoint. Default: the form's `action` attribute.
 * @property {string} [method]  Default: the form's `method` attribute, else `POST`. GET/HEAD send fields as query string.
 * @property {string|Element|Element[]} [submitButton]  Extra trigger(s), e.g. a button outside the form.
 * @property {string|Element} [indicator]  Loading element, shown while a request runs.
 * @property {object|((form: SubmitoForm) => object|Promise<object>)} [data]  Extra fields, merged on every submit.
 * @property {HeadersInit|((form: SubmitoForm) => HeadersInit|Promise<HeadersInit>)} [headers]  Extra request headers.
 * @property {'dialog'|'swal'|'none'} [responseType]  Built-in response UI. Default `dialog`.
 * @property {boolean} [liveValidation]  Validate while the user types. Default true.
 * @property {boolean} [resetOnSuccess]  Reset the form after a successful response. Default true.
 * @property {Record<string, string>} [messages]  Override built-in strings (see i18n.js keys).
 * @property {object} [swal]  Extra SweetAlert2 options for `responseType: 'swal'`.
 * @property {string|object} [recaptcha]  reCAPTCHA v3 site key, or `{ siteKey, action, field, enterprise }`.
 * @property {true|object} [turnstile]  `true` for an existing widget, or `{ siteKey, container, field, ...params }`.
 * @property {true|object} [iti]  `true`, or `{ input, country, countryField, phoneCodeField, validate, ...itiOptions }`.
 * @property {(response: import('./response.js').SubmitoResponse, form: SubmitoForm) => any} [callback]
 *   Replaces the built-in response UI (dialog/swal, server field errors, reset on success).
 */

const DEFAULTS = {
  form: null,
  url: null,
  method: null,
  submitButton: null,
  indicator: null,
  data: null,
  headers: null,
  responseType: 'dialog',
  liveValidation: true,
  resetOnSuccess: true,
  messages: null,
  swal: null,
  recaptcha: null,
  turnstile: null,
  iti: null,
  callback: null,
};

const RESPONSE_TYPES = ['dialog', 'swal', 'none'];
const HIDING_CLASSES = ['hidden', 'uk-hidden', 'd-none'];

/** @type {WeakMap<HTMLFormElement, SubmitoForm>} */
const instances = new WeakMap();

/**
 * Bind a form. Returns null (and logs why) when the form or endpoint is missing.
 * Calling it again for the same form destroys the previous instance first.
 * @param {SubmitoOptions} options
 * @returns {SubmitoForm|null}
 */
export function newForm(options = {}) {
  const config = { ...DEFAULTS, ...options };

  const form = resolveElement(config.form);
  if (!(form instanceof HTMLFormElement)) {
    logError(`form not found: ${String(config.form)}`);
    return null;
  }
  if (!config.url && !form.getAttribute('action')) {
    logError(`${describe(form)}: set the url option or an action attribute on the form.`);
    return null;
  }
  if (!RESPONSE_TYPES.includes(config.responseType)) {
    logError(`unknown responseType "${config.responseType}". Using "dialog".`);
    config.responseType = 'dialog';
  }

  instances.get(form)?.destroy();
  const instance = new SubmitoForm(form, config);
  instances.set(form, instance);
  return instance;
}

export class SubmitoForm {
  #errors;
  #addons;
  #rules;
  #indicator;
  #noValidate;
  #cleanup = [];
  #touched = new Set();
  #disabled = new Set();
  #submitted = false;
  #busy = false;

  /**
   * @param {HTMLFormElement} form
   * @param {SubmitoOptions} options
   */
  constructor(form, options) {
    /** @type {HTMLFormElement} */
    this.form = form;
    /** @type {SubmitoOptions} */
    this.options = options;

    this.#errors = new FieldErrors(form);
    this.#noValidate = form.noValidate;
    form.noValidate = true; // submito shows its own messages instead of the browser bubbles
    this.#indicator = createIndicator(options.indicator);

    const context = { form, t: this.#t, submitters: () => this.#submitters() };
    this.#addons = [
      options.iti && intlTelInput(context, options.iti),
      numbCaptcha(context),
      options.recaptcha && recaptcha(context, options.recaptcha),
      options.turnstile && turnstile(context, options.turnstile),
    ].filter(Boolean);
    this.#rules = this.#addons.map((addon) => addon.rule).filter(Boolean);

    this.#listen(form, 'submit', (event) => {
      event.preventDefault();
      this.submit(event.submitter);
    });
    this.#listen(form, 'reset', () => this.#onReset());

    if (options.liveValidation) {
      const onEdit = (event) => this.#live(event.target, false);
      this.#listen(form, 'input', onEdit);
      this.#listen(form, 'countrychange', onEdit); // intl-tel-input
      this.#listen(form, 'change', (event) => this.#live(event.target, true));
    }

    if (options.submitButton) {
      const buttons = resolveElements(options.submitButton);
      if (!buttons.length) logError(`submitButton not found: ${String(options.submitButton)}`);
      for (const button of buttons) {
        if (isSubmitter(button, form)) continue; // the native submit event already covers it
        this.#listen(button, 'click', (event) => {
          event.preventDefault();
          this.submit();
        });
      }
    }
  }

  /** True while a request is in flight. */
  get busy() {
    return this.#busy;
  }

  /**
   * Validate, collect, send and handle the response. Ignored while a request is already running.
   * @param {HTMLElement} [submitter] the clicked submit button (its name/value is sent)
   * @returns {Promise<import('./response.js').SubmitoResponse|null>} null when invalid, cancelled or busy
   */
  async submit(submitter) {
    if (this.#busy) return null;

    const errors = this.#validateAll();
    if (errors.length) {
      errors[0].field.focus();
      emit(this.form, 'invalid', { errors, instance: this });
      return null;
    }

    // Snapshot before #setBusy: disabled buttons (including the submitter) are left out of FormData.
    const snapshot = formSnapshot(this.form, submitter);
    this.#setBusy(true);
    let result = null;
    try {
      result = await this.#request(snapshot);
      if (result) await this.#respond(result);
    } finally {
      for (const addon of this.#addons) addon.afterSubmit?.();
      this.#setBusy(false);
    }

    if (result) emit(this.form, 'after', { ...result, instance: this });
    return result?.response ?? null;
  }

  /** Validate every field and show inline errors. Focuses the first invalid field. */
  validate() {
    const errors = this.#validateAll();
    errors[0]?.field.focus();
    return errors.length === 0;
  }

  /**
   * Show server-style errors next to their fields (any shape `normalizeErrors` accepts).
   * @returns {string[]} messages that did not match a field
   */
  showErrors(errors) {
    const unmatched = [];
    const fields = [];
    for (const { name, message } of normalizeErrors(errors)) {
      const field = name ? this.#errors.field(name) : null;
      if (field) {
        this.#errors.show(field, message);
        fields.push(field);
      } else {
        unmatched.push(message);
      }
    }
    fields.sort(byDocumentOrder)[0]?.focus();
    return unmatched;
  }

  clearErrors() {
    this.#errors.clearAll();
  }

  /** Reset field values, errors, the math captcha question and the Turnstile widget. */
  reset() {
    this.form.reset();
  }

  /** Remove listeners, integration widgets and error markup. */
  destroy() {
    for (const off of this.#cleanup) off();
    this.#cleanup = [];
    for (const addon of this.#addons) addon.destroy?.();
    this.#errors.clearAll();
    this.form.noValidate = this.#noValidate;
    if (instances.get(this.form) === this) instances.delete(this.form);
  }

  #t = (key, params) => translate(key, params, langOf(this.form), this.options.messages);

  #listen(target, type, handler) {
    target.addEventListener(type, handler);
    this.#cleanup.push(() => target.removeEventListener(type, handler));
  }

  /**
   * Live validation: errors appear once a field is committed (change/blur) and then update on
   * every keystroke. After a submit attempt every field updates as the user types.
   */
  #live(field, committed) {
    if (!isValidatable(field)) return;
    if (committed) this.#touched.add(field.name);
    if (committed || this.#submitted || this.#touched.has(field.name) || this.#errors.has(field.name)) {
      this.#check(field);
    }
  }

  #check(field) {
    const message = this.#message(field);
    if (message) this.#errors.show(field, message);
    else this.#errors.clear(field.name);
    return message;
  }

  #message(field) {
    for (const control of this.#errors.controls(field)) {
      if (!isValidatable(control)) continue;
      const result = checkField(control, this.#rules);
      if (result) return typeof result === 'string' ? result : this.#t(result.key, result.params);
    }
    return null;
  }

  #validateAll() {
    this.#submitted = true;
    this.#errors.clearAll();

    const errors = [];
    const seen = new Set();
    for (const field of this.form.elements) {
      if (!isValidatable(field) || seen.has(field.name)) continue;
      seen.add(field.name);
      const message = this.#check(field);
      if (message) errors.push({ name: field.name, message, field });
    }
    return errors;
  }

  /** @returns {Promise<{ response: object, formData: FormData|null }|null>} null when cancelled */
  async #request(snapshot) {
    let formData = null;
    try {
      formData = await this.#collect(snapshot);
      for (const addon of this.#addons) await addon.prepare?.(formData);
      if (!emit(this.form, 'before', { formData, instance: this }, true)) return null;
      return { response: await this.#send(formData), formData };
    } catch (error) {
      if (error instanceof SubmitoError) return { response: errorResponse(error.message), formData };
      logError(error);
      return { response: errorResponse(this.#t('error')), formData };
    }
  }

  async #collect(snapshot) {
    const formData = new FormData();
    for (const [key, value] of snapshot) {
      if (value instanceof File && !value.name && !value.size) continue; // empty <input type="file">
      formData.append(key, value);
    }

    const { data } = this.options;
    const extra = typeof data === 'function' ? await data(this) : data;
    if (isPlainObject(extra)) {
      for (const [key, value] of Object.entries(extra)) {
        if (value === undefined || value === null) continue;
        formData.delete(key);
        for (const item of Array.isArray(value) ? value : [value]) formData.append(key, toEntry(item));
      }
    }
    return formData;
  }

  async #send(formData) {
    const { form, options } = this;
    const methodAttr = form.getAttribute('method');
    const method = String(
      options.method || (methodAttr && methodAttr.toLowerCase() !== 'dialog' ? methodAttr : 'POST'),
    ).toUpperCase();
    const url = new URL(options.url || form.getAttribute('action'), document.baseURI);

    const headers = new Headers({ Accept: 'application/json' });
    const extra = typeof options.headers === 'function' ? await options.headers(this) : options.headers;
    if (extra) new Headers(extra).forEach((value, key) => headers.set(key, value));

    const init = { method, headers, cache: 'no-cache' };
    if (method === 'GET' || method === 'HEAD') {
      for (const [key, value] of formData) {
        if (typeof value === 'string') url.searchParams.append(key, value);
      }
    } else {
      init.body = formData;
    }

    let res;
    try {
      res = await fetch(url, init);
    } catch {
      return errorResponse(this.#t('network'));
    }
    return parseResponse(res);
  }

  async #respond({ response, formData }) {
    const type = response.success ? 'success' : 'error';
    const proceed = emit(this.form, type, { response, formData, instance: this }, true);
    try {
      if (typeof this.options.callback === 'function') await this.options.callback(response, this);
      else if (proceed) this.#present(response);
    } catch (error) {
      logError(error);
    }
  }

  /** Built-in response UI: popup + server field errors + reset on success. */
  #present(response) {
    const { responseType, resetOnSuccess, swal } = this.options;
    const show = (type, messages) => notify({ type, messages, responseType, swal, t: this.#t });

    if (response.success) {
      show('success', [response.message || this.#t('success')]);
      if (resetOnSuccess) this.reset();
      return;
    }

    const unmatched = this.showErrors(response.errors);
    const messages = [...new Set([response.message, ...unmatched].filter(Boolean))];
    // Field errors alone are explained inline; anything else needs a popup.
    if (!messages.length && !response.errors.length) messages.push(this.#t('error'));
    show('error', messages);
  }

  #onReset() {
    this.#errors.clearAll();
    this.#touched.clear();
    this.#submitted = false;
    for (const addon of this.#addons) addon.reset?.();
  }

  #submitters() {
    const native = [...this.form.elements].filter((el) => isSubmitter(el, this.form));
    return [...new Set([...native, ...resolveElements(this.options.submitButton)])];
  }

  #setBusy(busy) {
    this.#busy = busy;
    if (busy) {
      this.form.setAttribute('aria-busy', 'true');
      for (const button of this.#submitters()) {
        if (button.disabled) continue;
        button.disabled = true;
        this.#disabled.add(button);
      }
    } else {
      this.form.removeAttribute('aria-busy');
      for (const button of this.#disabled) button.disabled = false;
      this.#disabled.clear();
    }
    this.#indicator?.(busy);
  }
}

function formSnapshot(form, submitter) {
  try {
    return new FormData(form, submitter);
  } catch {
    return new FormData(form); // submitter is not a submit button of this form
  }
}

function isSubmitter(el, form) {
  return (
    (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) &&
    el.form === form &&
    (el.type === 'submit' || el.type === 'image')
  );
}

/**
 * Toggle a loading element. Uses the hiding classes it already has (`hidden`, `uk-hidden`,
 * `d-none`), otherwise the `hidden` attribute. The element starts hidden.
 */
function createIndicator(ref) {
  if (!ref) return null;
  const el = resolveElement(ref);
  if (!(el instanceof HTMLElement)) {
    logError(`indicator not found: ${String(ref)}`);
    return null;
  }
  const classes = HIDING_CLASSES.filter((name) => el.classList.contains(name));
  const useAttribute = el.hidden || classes.length === 0;
  if (useAttribute) el.hidden = true;
  return (busy) => {
    for (const name of classes) el.classList.toggle(name, !busy);
    if (useAttribute) el.hidden = !busy;
  };
}

function toEntry(value) {
  if (value instanceof Blob) return value;
  return isPlainObject(value) ? JSON.stringify(value) : String(value);
}

function byDocumentOrder(a, b) {
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

function describe(form) {
  return form.id ? `#${form.id}` : 'form';
}
