/**
 * Built-in response dialog (`responseType: 'dialog'`, the default).
 * One native <dialog> is created lazily and reused. All text is set with `textContent`.
 *
 * Styles are injected once into <head> as `<style id="submito-styles">` with zero-specificity
 * selectors, so any site CSS wins. If an element with that id already exists, nothing is injected.
 */

const STYLE_ID = 'submito-styles';
const SVG_NS = 'http://www.w3.org/2000/svg';
const ICON_PATHS = {
  success: 'M5 12.5l4.5 4.5L19 7.5',
  error: 'M12 7.5v5.5M12 16.5v.01',
};

/**
 * Theme variables and their defaults. Sites override them as `--submito-<name>` in their own CSS,
 * e.g. `:root { --submito-accent: #4f46e5; }`. Keep this list in sync with docs/response-ui.md.
 */
const THEME = {
  bg: '#fff', // dialog background
  fg: '#1f2937', // title text
  muted: '#4b5563', // message + list text
  accent: '#111827', // OK button background, focus ring
  'accent-fg': '#fff', // OK button text
  success: '#15803d', // success icon
  error: '#c62828', // error icon
  radius: '14px',
  font: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
  backdrop: 'rgb(15 23 42/.45)',
};

/** `var(--submito-<name>, <default>)` */
const theme = (name) => `var(--submito-${name},${THEME[name]})`;

const CSS = `
:where(.submito-dialog){box-sizing:border-box;width:min(100% - 2rem,26rem);max-height:calc(100% - 2rem);margin:auto;padding:0;border:0;border-radius:${theme('radius')};background:${theme('bg')};color:${theme('fg')};box-shadow:0 24px 64px rgb(0 0 0/.18),0 2px 8px rgb(0 0 0/.08);font-family:${theme('font')};text-align:center;overflow:auto}
:where(.submito-dialog)::backdrop{background:${theme('backdrop')}}
:where(.submito-dialog[open]){animation:submito-in .18s ease-out}
@keyframes submito-in{from{opacity:0;transform:translateY(8px) scale(.98)}}
:where(.submito-dialog--success){--submito-tone:${theme('success')}}
:where(.submito-dialog--error){--submito-tone:${theme('error')}}
:where(.submito-dialog__panel){padding:1.75rem 1.5rem 1.25rem}
:where(.submito-dialog__icon){display:grid;place-items:center;width:3rem;height:3rem;margin:0 auto 1rem;border-radius:50%;color:#fff;background:var(--submito-tone)}
:where(.submito-dialog__icon svg){width:1.5rem;height:1.5rem}
:where(.submito-dialog__title){margin:0 0 .5rem;font-size:1.125rem;font-weight:600;line-height:1.3}
:where(.submito-dialog__message){margin:0;font-size:.95rem;line-height:1.5;color:${theme('muted')}}
:where(.submito-dialog__list){margin:.75rem 0 0;padding:0;list-style:none;font-size:.9rem;line-height:1.45;color:${theme('muted')}}
:where(.submito-dialog__list li+li){margin-top:.3rem}
:where(.submito-dialog__actions){margin-top:1.5rem}
:where(.submito-dialog__button){appearance:none;min-width:7rem;padding:.65rem 1.25rem;border:0;border-radius:calc(${theme('radius')} - 6px);background:${theme('accent')};color:${theme('accent-fg')};font:inherit;font-weight:600;cursor:pointer}
:where(.submito-dialog__button:hover){filter:brightness(1.15)}
:where(.submito-dialog__button:focus-visible){outline:2px solid ${theme('accent')};outline-offset:2px}
@media (prefers-reduced-motion:reduce){:where(.submito-dialog[open]){animation:none}}
`;

let parts = null;

/**
 * @param {{ type: 'success'|'error', title: string, messages: string[], okText: string }} content
 */
export function showDialog({ type, title, messages, okText }) {
  injectStyles();
  if (!parts?.dialog.isConnected) parts = createDialog();

  const { dialog, path, heading, message, list, button } = parts;
  dialog.className = `submito-dialog submito-dialog--${type}`;
  dialog.setAttribute('role', type === 'error' ? 'alertdialog' : 'dialog');
  path.setAttribute('d', ICON_PATHS[type]);
  heading.textContent = title;
  message.textContent = messages[0] ?? '';
  list.replaceChildren(
    ...messages.slice(1).map((text) => Object.assign(document.createElement('li'), { textContent: text })),
  );
  list.hidden = messages.length < 2;
  button.textContent = okText;

  if (!dialog.open) {
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
  }
  button.focus();
}

function createDialog() {
  const dialog = document.createElement('dialog');
  dialog.setAttribute('aria-labelledby', 'submito-dialog-title');
  dialog.setAttribute('aria-describedby', 'submito-dialog-message');

  const panel = element('div', 'submito-dialog__panel');
  const icon = element('div', 'submito-dialog__icon');
  icon.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(SVG_NS, 'svg');
  const path = document.createElementNS(SVG_NS, 'path');
  for (const [name, value] of Object.entries({
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2.5',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
  })) {
    svg.setAttribute(name, value);
  }
  svg.append(path);
  icon.append(svg);

  const heading = element('h2', 'submito-dialog__title');
  heading.id = 'submito-dialog-title';
  const message = element('p', 'submito-dialog__message');
  message.id = 'submito-dialog-message';
  const list = element('ul', 'submito-dialog__list');
  const actions = element('div', 'submito-dialog__actions');
  const button = element('button', 'submito-dialog__button');
  button.type = 'button';

  button.addEventListener('click', () => dialog.close());
  // Clicks on the dialog element itself (not the panel) are backdrop clicks.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  actions.append(button);
  panel.append(icon, heading, message, list, actions);
  dialog.append(panel);
  document.body.append(dialog);
  return { dialog, path, heading, message, list, button };
}

function element(tag, className) {
  const el = document.createElement(tag);
  el.className = className;
  return el;
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.append(style);
}
