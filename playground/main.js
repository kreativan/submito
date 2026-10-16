import submito from '../src/index.js';
import { installMock, SCENARIOS } from './mock.js';

const ENDPOINT = '/api/submit';
const state = { ui: 'dialog', scenario: 'success' };

installMock(ENDPOINT, () => state.scenario);

// Google has no reCAPTCHA v3 test key, so the playground stubs `grecaptcha` with a fake token.
window.grecaptcha ??= {
  ready: (callback) => callback(),
  execute: async () => `playground-token-${Math.random().toString(36).slice(2, 10)}`,
};

/** One newForm() config per demo form. `url` and the response UI are added in mountForms(). */
const FORMS = [
  {
    form: '#contact-form',
    indicator: '#contact-indicator',
    iti: { input: '#contact-phone', country: 'BG' },
  },
  {
    form: 'fields-form', // an id works as well as a selector
    indicator: '#fields-indicator',
    iti: { input: '#fields-phone', country: 'BG' },
    data: () => ({ source: 'playground', submitted_at: new Date().toISOString() }),
  },
  {
    form: '#captcha-form',
    indicator: '#captcha-indicator',
    turnstile: { siteKey: '1x00000000000000000000AA', container: '#captcha-turnstile' },
    recaptcha: { siteKey: 'playground-stub', action: 'contact' },
  },
];

let instances = [];

/** (Re)create every form. Called again when the response UI changes, which exercises destroy(). */
function mountForms() {
  for (const instance of instances) instance?.destroy();
  instances = FORMS.map((config) => submito.newForm({ url: ENDPOINT, ...config, ...responseOptions() }));
}

function responseOptions() {
  if (state.ui !== 'callback') return { responseType: state.ui };

  // You own the UI: show the message inline, map field errors, reset on success.
  return {
    callback(response, form) {
      const notice = form.form.querySelector('[data-notice]');
      const messages = response.success ? [] : form.showErrors(response.errors);
      notice.textContent = [response.message, ...messages].filter(Boolean).join(' ') ||
        (response.success ? 'Saved.' : `Request failed (HTTP ${response.status}).`);
      notice.className = `notice notice--${response.success ? 'success' : 'error'}`;
      notice.hidden = false;
      if (response.success) form.reset();
    },
  };
}

/* ---------- inspector: events bubble from each <form> up to document ---------- */

const log = document.getElementById('event-log');
const requestOut = document.getElementById('request');
const responseOut = document.getElementById('response');

const SUMMARY = {
  invalid: ({ errors }) => `${errors.length} invalid: ${errors.map((e) => e.name).join(', ')}`,
  before: ({ formData }) => `${[...formData.keys()].length} entries → ${ENDPOINT}`,
  success: ({ response }) => `HTTP ${response.status} · ${response.message || '(no message)'}`,
  error: ({ response }) => `HTTP ${response.status} · ${response.message || '(no message)'}`,
  after: ({ response }) => (response.success ? 'done' : 'done with errors'),
};

for (const name of Object.keys(SUMMARY)) {
  document.addEventListener(`submito:${name}`, (event) => {
    addLogEntry(name, event.target.id, SUMMARY[name](event.detail));
    if (name === 'before') requestOut.textContent = formatFormData(event.detail.formData);
    if (name === 'after') responseOut.textContent = JSON.stringify(event.detail.response, null, 2);
  });
}

// Clear stale notices when a callback-mode form is submitted again.
document.addEventListener('submito:before', (event) => {
  const notice = event.target.querySelector('[data-notice]');
  if (notice) notice.hidden = true;
});

function addLogEntry(name, formId, text) {
  const item = document.createElement('li');
  item.className = `log__item log__item--${name}`;
  const time = document.createElement('time');
  time.textContent = new Date().toLocaleTimeString([], { hour12: false });
  const label = document.createElement('strong');
  label.textContent = `submito:${name}`;
  const target = document.createElement('span');
  target.className = 'log__target';
  target.textContent = `#${formId}`;
  const detail = document.createElement('span');
  detail.className = 'log__detail';
  detail.textContent = text;
  item.append(time, label, target, detail);
  log.prepend(item);
  while (log.children.length > 40) log.lastElementChild.remove();
}

function formatFormData(formData) {
  const lines = [];
  for (const [key, value] of formData) {
    const shown = value instanceof File ? `File(${value.name}, ${value.size} B)` : value;
    lines.push(`${key}: ${String(shown).length > 60 ? `${String(shown).slice(0, 57)}…` : shown}`);
  }
  return lines.join('\n') || '(empty)';
}

document.getElementById('clear-log').addEventListener('click', () => {
  log.replaceChildren();
  requestOut.textContent = 'Submit a form to see the FormData.';
  responseOut.textContent = '—';
});

/* ---------- controls ---------- */

const scenarioSelect = document.getElementById('scenario');
for (const [value, { label }] of Object.entries(SCENARIOS)) {
  scenarioSelect.append(new Option(label, value));
}
scenarioSelect.addEventListener('change', () => {
  state.scenario = scenarioSelect.value;
});

for (const radio of document.querySelectorAll('input[name="response-ui"]')) {
  radio.addEventListener('change', () => {
    state.ui = radio.value;
    for (const notice of document.querySelectorAll('[data-notice]')) notice.hidden = true;
    mountForms();
  });
}

/* ---------- tabs ---------- */

const tabs = [...document.querySelectorAll('[data-tab]')];

function activateTab(tab) {
  for (const other of tabs) {
    const active = other === tab;
    other.setAttribute('aria-selected', String(active));
    other.tabIndex = active ? 0 : -1;
    document.querySelector(`[data-panel="${other.dataset.tab}"]`).hidden = !active;
  }
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => activateTab(tab));
  tab.addEventListener('keydown', (event) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    const next = tabs[(index + step + tabs.length) % tabs.length];
    activateTab(next);
    next.focus();
  });
});

mountForms();
