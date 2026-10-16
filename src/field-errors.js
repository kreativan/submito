const MESSAGE_CLASS = 'error-message';
const INVALID_CLASS = 'error';

let uid = 0;

/**
 * Inline field errors for one form.
 *
 * - Message goes into `[data-submito-error="<name>"]` when the form has one, otherwise into a
 *   `<span class="error-message">` appended to the field's wrapper.
 * - Wrapper gets class `error`; controls get `aria-invalid="true"` + `aria-describedby`.
 * - Text is always set with `textContent`.
 */
export default class FieldErrors {
  /** @param {HTMLFormElement} form */
  constructor(form) {
    this.form = form;
    /** @type {Map<string, { el: HTMLElement, wrapper: Element|null, controls: Element[], created: boolean }>} */
    this.items = new Map();
  }

  /** Every control sharing the field's name (radio/checkbox groups), or just the field. */
  controls(field) {
    const named = field.name ? this.form.elements.namedItem(field.name) : null;
    return named instanceof RadioNodeList ? [...named] : [field];
  }

  /** Find the control for a server error name: `email`, `tags[]`, or dotted `user.email` → `user[email]`. */
  field(name) {
    for (const candidate of [name, `${name}[]`, name.replace(/\.([^.]+)/g, '[$1]')]) {
      const named = this.form.elements.namedItem(candidate);
      if (named) return named instanceof RadioNodeList ? named[0] : named;
    }
    return null;
  }

  has(name) {
    return this.items.has(name);
  }

  show(field, message) {
    let item = this.items.get(field.name);
    if (!item) {
      const controls = this.controls(field);
      const wrapper = wrapperOf(controls[0], controls.length > 1);
      const target = this.form.querySelector(`[data-submito-error="${CSS.escape(field.name)}"]`);
      const el = target ?? document.createElement('span');
      if (!target) {
        el.className = MESSAGE_CLASS;
        (wrapper ?? controls[0].parentNode)?.append(el);
      }
      if (!el.id) el.id = `submito-error-${++uid}`;
      item = { el, wrapper, controls, created: !target };
      this.items.set(field.name, item);
    }

    item.el.textContent = message;
    item.wrapper?.classList.add(INVALID_CLASS);
    for (const control of item.controls) {
      control.setAttribute('aria-invalid', 'true');
      describedBy(control, item.el.id, true);
    }
  }

  clear(name) {
    const item = this.items.get(name);
    if (!item) return;

    if (item.created) item.el.remove();
    else item.el.textContent = '';
    item.wrapper?.classList.remove(INVALID_CLASS);
    for (const control of item.controls) {
      control.removeAttribute('aria-invalid');
      describedBy(control, item.el.id, false);
    }
    this.items.delete(name);
  }

  clearAll() {
    for (const name of [...this.items.keys()]) this.clear(name);
  }
}

/** The element that receives the message: the field's parent, skipping the intl-tel-input wrapper. */
function wrapperOf(field, isGroup) {
  let el = field.parentElement;
  if (el?.classList.contains('iti')) el = el.parentElement;
  // A group of choices each wrapped in its own <label>: use the group container.
  if (isGroup && el?.tagName === 'LABEL' && (field.type === 'radio' || field.type === 'checkbox')) {
    el = el.parentElement;
  }
  return el;
}

function describedBy(el, id, add) {
  const ids = new Set((el.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean));
  if (add) ids.add(id);
  else ids.delete(id);
  if (ids.size) el.setAttribute('aria-describedby', [...ids].join(' '));
  else el.removeAttribute('aria-describedby');
}
