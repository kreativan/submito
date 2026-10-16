export const PREFIX = '[submito]';

export function logError(...args) {
  console.error(PREFIX, ...args);
}

/**
 * Resolve one element from an Element, an id (`"contact-form"`) or a CSS selector (`"#contact-form"`).
 * @param {string|Element|null|undefined} ref
 * @returns {Element|null}
 */
export function resolveElement(ref) {
  if (!ref) return null;
  if (ref instanceof Element) return ref;
  if (typeof ref !== 'string') return null;
  return document.getElementById(ref) ?? query(() => document.querySelector(ref));
}

/**
 * Resolve a list of elements from an Element, an iterable of elements, an id or a CSS selector.
 * @returns {Element[]}
 */
export function resolveElements(ref) {
  if (!ref) return [];
  if (ref instanceof Element) return [ref];
  if (typeof ref === 'string') {
    const byId = document.getElementById(ref);
    return byId ? [byId] : [...(query(() => document.querySelectorAll(ref)) ?? [])];
  }
  if (typeof ref[Symbol.iterator] === 'function') return [...ref].filter((el) => el instanceof Element);
  return [];
}

function query(run) {
  try {
    return run();
  } catch {
    return null; // invalid selector
  }
}

export function isPlainObject(value) {
  return Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * Dispatch a bubbling `submito:<name>` event on `target`.
 * @returns {boolean} false when a listener called `preventDefault()`
 */
export function emit(target, name, detail, cancelable = false) {
  return target.dispatchEvent(new CustomEvent(`submito:${name}`, { bubbles: true, cancelable, detail }));
}

/**
 * Poll until `check()` returns a truthy value (e.g. a third-party global finished loading).
 * @returns {Promise<any>} the truthy value, or null after `timeout` ms
 */
export function waitFor(check, timeout = 10000, interval = 50) {
  return new Promise((resolve) => {
    const started = Date.now();
    const tick = () => {
      let value = null;
      try {
        value = check();
      } catch {
        /* not ready yet */
      }
      if (value) return resolve(value);
      if (Date.now() - started >= timeout) return resolve(null);
      setTimeout(tick, interval);
    };
    tick();
  });
}

/** An error whose message is safe to show to the user (captcha failures during submit). */
export class SubmitoError extends Error {}
