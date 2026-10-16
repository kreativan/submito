/**
 * Type definitions for submito: vanilla JS AJAX forms.
 * Hand-written; keep in sync with src/ (see AGENTS.md → Docs sync).
 */

/** Built-in popup for responses. */
export type ResponseType = 'dialog' | 'swal' | 'none';

/** A normalized field or general error. `name: null` means it is not tied to a field. */
export interface FieldError {
  name: string | null;
  message: string;
}

/** What `callback`, the `success` / `error` / `after` events and `submit()` receive. */
export interface SubmitoResponse<TData = any> {
  /** HTTP 2xx and the body does not signal an error. */
  success: boolean;
  /** HTTP status; 0 when no response arrived (network or captcha failure). */
  status: number;
  /** Server message (`message`, `msg`, `error`, `data.message`), or '' when absent. */
  message: string;
  errors: FieldError[];
  /** Parsed JSON body, raw text body, or null. */
  data: TData;
}

/**
 * Any error shape submito understands:
 * strings, `[{ name|field|path|param, message|error|msg }]`, or `{ field: 'msg' | ['msg'] }`.
 */
export type ErrorsInput =
  | string
  | Array<string | Record<string, unknown>>
  | Record<string, string | string[]>
  | null
  | undefined;

/** A value in the `data` option. Plain objects are sent as JSON strings; arrays become repeated entries. */
export type DataValue = string | number | boolean | Blob | Record<string, unknown> | null | undefined;
export type DataInput = Record<string, DataValue | DataValue[]>;

/** Keys of the built-in strings (see docs: Internationalization). */
export type MessageKey =
  | 'required'
  | 'email'
  | 'url'
  | 'number'
  | 'minlength'
  | 'maxlength'
  | 'min'
  | 'max'
  | 'pattern'
  | 'invalid'
  | 'phone'
  | 'captcha'
  | 'captcha_required'
  | 'captcha_error'
  | 'success_title'
  | 'success'
  | 'error_title'
  | 'error'
  | 'network'
  | 'ok';

export interface RecaptchaOptions {
  siteKey: string;
  /** Default `'submit'`. Check it on the server. */
  action?: string;
  /** Field name for the token. Default `'recaptcha_response'`. */
  field?: string;
  /** Use `grecaptcha.enterprise`. Default false. */
  enterprise?: boolean;
}

export interface TurnstileOptions {
  /** Render the widget explicitly. Omit to use an existing `.cf-turnstile` widget. */
  siteKey?: string;
  /** Where to render (or where the existing widget is). Default: new div before the submit button. */
  container?: string | Element;
  /** Field name for the token. Default `'cf-turnstile-response'`. */
  field?: string;
  /** Any other `turnstile.render()` parameter: theme, size, action, appearance, execution, … */
  [param: string]: unknown;
}

export interface ItiOptions {
  /** Phone input: element, id or selector. Default: first `input[type="tel"]` in the form. */
  input?: string | HTMLInputElement;
  /** Initial country, ISO2 (case-insensitive). Shortcut for `initialCountry`. */
  country?: string;
  /** Field for the ISO2 country. Default `'country'`; `false` to omit. */
  countryField?: string | false;
  /** Field for the dial code digits. Default `'phone_code'`; `false` to omit. */
  phoneCodeField?: string | false;
  /** Validate non-empty numbers. Default true. */
  validate?: boolean;
  /** Any other intl-tel-input option. */
  [option: string]: unknown;
}

export interface SubmitoOptions {
  /** Form element, id (`'contact'`) or selector (`'#contact'`). */
  form: string | HTMLFormElement;
  /** Endpoint. Default: the form's `action` attribute. */
  url?: string;
  /** Default: the form's `method` attribute, else `'POST'`. GET/HEAD send a query string. */
  method?: string;
  /** Extra trigger(s), e.g. a button outside the form. */
  submitButton?: string | Element | Iterable<Element>;
  /** Loading element, shown while a request runs. */
  indicator?: string | Element;
  /** Extra fields, merged on every submit (replace same-named fields). */
  data?: DataInput | ((form: SubmitoForm) => DataInput | Promise<DataInput>);
  /** Extra headers, merged over `Accept: application/json`. */
  headers?: HeadersInit | ((form: SubmitoForm) => HeadersInit | Promise<HeadersInit>);
  /** Default `'dialog'`. */
  responseType?: ResponseType;
  /** Validate while typing. Default true. */
  liveValidation?: boolean;
  /** Reset after success (built-in UI only). Default true. */
  resetOnSuccess?: boolean;
  /** Override built-in strings for this form. `{min}` / `{max}` are placeholders. */
  messages?: Partial<Record<MessageKey, string>>;
  /** Extra SweetAlert2 options (`html` is ignored). */
  swal?: Record<string, unknown>;
  /** reCAPTCHA v3 site key, or options. */
  recaptcha?: string | RecaptchaOptions;
  /** `true` for an existing widget, or options. */
  turnstile?: true | TurnstileOptions;
  /** `true` for the first tel input, or options. */
  iti?: true | ItiOptions;
  /** Replaces the built-in response UI (popup, inline server errors, reset). */
  callback?: (response: SubmitoResponse, form: SubmitoForm) => unknown;
}

/** The instance returned by `newForm()`. */
export interface SubmitoForm {
  readonly form: HTMLFormElement;
  readonly options: SubmitoOptions;
  /** True while a request is in flight. */
  readonly busy: boolean;
  /** Validate and send. Resolves with null when invalid, cancelled or already busy. */
  submit(submitter?: HTMLElement): Promise<SubmitoResponse | null>;
  /** Show errors, focus the first invalid field; true when valid. */
  validate(): boolean;
  /** Show errors inline; returns messages that matched no field. */
  showErrors(errors: ErrorsInput | FieldError[]): string[];
  clearErrors(): void;
  /** Reset values, errors, math captcha question and Turnstile widget. */
  reset(): void;
  /** Remove listeners, widgets and error markup. */
  destroy(): void;
}

export interface InvalidField {
  name: string;
  message: string;
  field: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
}

export interface SubmitoInvalidDetail {
  errors: InvalidField[];
  instance: SubmitoForm;
}

export interface SubmitoBeforeDetail {
  /** The payload about to be sent; mutate it to change the request. */
  formData: FormData;
  instance: SubmitoForm;
}

export interface SubmitoResponseDetail {
  response: SubmitoResponse;
  /** The same object `submito:before` received; null only if building the payload failed. */
  formData: FormData | null;
  instance: SubmitoForm;
}

/** Events dispatched on the form element. They bubble to `document` and `window`. */
export interface SubmitoEventMap {
  'submito:invalid': CustomEvent<SubmitoInvalidDetail>;
  /** Cancelable: `preventDefault()` cancels the request. */
  'submito:before': CustomEvent<SubmitoBeforeDetail>;
  /** Cancelable: `preventDefault()` skips the built-in UI. */
  'submito:success': CustomEvent<SubmitoResponseDetail>;
  /** Cancelable: `preventDefault()` skips the built-in UI. */
  'submito:error': CustomEvent<SubmitoResponseDetail>;
  'submito:after': CustomEvent<SubmitoResponseDetail>;
}

export interface Submito {
  /** Bind a form. Returns null (and logs why) when the form or endpoint is missing. */
  newForm(options: SubmitoOptions): SubmitoForm | null;
}

declare const submito: Submito;
export default submito;

declare global {
  interface HTMLElementEventMap extends SubmitoEventMap {}
  interface DocumentEventMap extends SubmitoEventMap {}
  interface WindowEventMap extends SubmitoEventMap {}

  interface Window {
    /** Set by the IIFE build and by importing the ES module in a browser. */
    submito: Submito;
  }
}
