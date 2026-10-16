const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BUTTON_TYPES = new Set(['submit', 'button', 'reset', 'image']);
const NON_TEXT_TYPES = new Set(['checkbox', 'radio', 'file']);

/**
 * Named, enabled controls that take part in constraint validation.
 * Hidden, disabled and readonly fields are skipped by `willValidate`.
 */
export function isValidatable(field) {
  return Boolean(field?.willValidate && field.name && !BUTTON_TYPES.has(field.type));
}

/**
 * Check one control using its HTML constraints (`required`, `type`, `minlength`, `maxlength`,
 * `min`, `max`, `step`, `pattern`, `setCustomValidity`) plus extra rules from integrations.
 *
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} field
 * @param {Array<(field: Element) => ValidationResult>} rules
 * @returns {ValidationResult}
 *
 * @typedef {null | string | { key: string, params?: Record<string, string|number> }} ValidationResult
 *   null = valid, string = literal message, object = i18n key
 */
export function checkField(field, rules = []) {
  const { validity } = field;
  const value = typeof field.value === 'string' ? field.value : '';
  const isText = !NON_TEXT_TYPES.has(field.type);

  if (validity.valueMissing || (field.required && isText && !value.trim())) return { key: 'required' };
  if (validity.customError) return field.validationMessage;
  if (validity.badInput) return { key: field.type === 'number' ? 'number' : 'invalid' };

  if (field.type === 'email' && value) {
    const emails = field.multiple ? value.split(',') : [value];
    if (validity.typeMismatch || emails.some((email) => !EMAIL.test(email.trim()))) return { key: 'email' };
  } else if (validity.typeMismatch) {
    return { key: field.type === 'url' ? 'url' : 'invalid' };
  }

  // Checked by hand: the browser only flags tooShort/tooLong after user edits.
  if (value && field.minLength > 0 && value.length < field.minLength) {
    return { key: 'minlength', params: { min: field.minLength } };
  }
  if (value && field.maxLength >= 0 && value.length > field.maxLength) {
    return { key: 'maxlength', params: { max: field.maxLength } };
  }

  if (validity.rangeUnderflow) return { key: 'min', params: { min: field.min } };
  if (validity.rangeOverflow) return { key: 'max', params: { max: field.max } };
  if (validity.stepMismatch) return { key: 'invalid' };
  if (validity.patternMismatch) return field.title || { key: 'pattern' };

  for (const rule of rules) {
    const result = rule(field);
    if (result) return result;
  }
  return null;
}
