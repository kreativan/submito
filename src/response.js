import { isPlainObject } from './utils.js';

const SUCCESS_WORDS = new Set(['success', 'ok', 'true', 'done']);
const ERROR_WORDS = new Set(['error', 'fail', 'failed', 'failure', 'false', 'invalid']);

/**
 * The object passed to `callback`, events and `submit()`.
 *
 * @typedef {object} SubmitoResponse
 * @property {boolean} success  HTTP 2xx and the body does not signal an error
 * @property {number}  status   HTTP status; 0 when no response arrived (network / captcha failure)
 * @property {string}  message  Server message (or a synthesized one for failures); '' when absent
 * @property {{ name: string|null, message: string }[]} errors  Normalized field / general errors
 * @property {any}     data     Parsed JSON body, raw text body, or null
 */

/**
 * Read a fetch Response into a SubmitoResponse. Never throws on bad / non-JSON bodies.
 * @param {Response} res
 * @returns {Promise<SubmitoResponse>}
 */
export async function parseResponse(res) {
  let data = null;
  try {
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }
  } catch {
    /* body unreadable: keep null */
  }

  const json = isPlainObject(data) ? data : null;
  return {
    success: res.ok && (json ? successSignal(json) : null) !== false,
    status: res.status,
    message: json ? pickMessage(json) : '',
    errors: json ? normalizeErrors(json.errors ?? (isPlainObject(json.data) ? json.data.errors : null)) : [],
    data,
  };
}

/** A synthesized failure (network error, captcha failure, unexpected exception). */
export function errorResponse(message, status = 0) {
  return { success: false, status, message, errors: [], data: null };
}

/**
 * Does the JSON body say success (true), error (false), or nothing (null)?
 * Checks `success`, then `status`, then `code`, then `error` / `errors`.
 */
export function successSignal(json) {
  if (typeof json.success === 'boolean') return json.success;

  for (const key of ['status', 'code']) {
    let value = json[key];
    if (typeof value === 'string' && /^\d+$/.test(value)) value = Number(value);
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      if (value >= 200 && value < 300) return true;
      if (value >= 400) return false;
    }
    if (typeof value === 'string') {
      const word = value.toLowerCase();
      if (SUCCESS_WORDS.has(word)) return true;
      if (ERROR_WORDS.has(word)) return false;
    }
  }

  if (json.error === true || (typeof json.error === 'string' && json.error.trim())) return false;
  if (normalizeErrors(json.errors).length) return false;
  return null;
}

/** First non-empty of `message`, `msg`, `error`, `data.message` (or `data` itself for WordPress-style `{ success, data }`). */
export function pickMessage(json) {
  const { data } = json;
  const candidates = [
    json.message,
    json.msg,
    json.error,
    isPlainObject(data) ? data.message : typeof json.success === 'boolean' ? data : null,
  ];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

/**
 * Accepts every common error shape and returns `{ name, message }[]`:
 * - `"Something failed"` or `["…", "…"]` → general errors (`name: null`)
 * - `[{ name|field|path|param, message|error|msg }]` (express-validator, Zod issues, …)
 * - `{ email: ["Taken"], name: "Required" }` (Laravel, Rails, Django)
 */
export function normalizeErrors(raw) {
  if (!raw) return [];
  if (typeof raw === 'string') return raw.trim() ? [{ name: null, message: raw.trim() }] : [];
  if (Array.isArray(raw)) return raw.map(fromItem).filter((error) => error.message);
  if (isPlainObject(raw)) {
    return Object.entries(raw)
      .map(([name, value]) => ({ name, message: firstText(value) }))
      .filter((error) => error.message);
  }
  return [];
}

function fromItem(item) {
  if (typeof item === 'string') return { name: null, message: item.trim() };
  if (!isPlainObject(item)) return { name: null, message: '' };

  let name = item.name ?? item.field ?? item.path ?? item.param ?? null;
  if (Array.isArray(name)) name = name.join('.');
  return {
    name: name === null || name === '' ? null : String(name),
    message: firstText(item.message ?? item.error ?? item.msg),
  };
}

function firstText(value) {
  if (Array.isArray(value)) value = value.find((entry) => typeof entry === 'string');
  return typeof value === 'string' ? value.trim() : '';
}
