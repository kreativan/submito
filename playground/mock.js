/**
 * In-browser mock for the playground endpoint. Wraps window.fetch so requests to `path`
 * get a canned answer — works the same on `npm run play`, `npm run dev` and the static docs site.
 */

const json = (status, body) => ({ status, body: JSON.stringify(body), type: 'application/json' });

export const SCENARIOS = {
  success: {
    label: 'Success',
    respond: () => json(200, { status: 'success', message: 'Thanks! Your message is on its way.' }),
  },
  'field-errors': {
    label: 'Field errors (422)',
    respond: () =>
      json(422, {
        status: 'error',
        message: 'Please fix the highlighted fields.',
        errors: [
          { name: 'email', message: 'This email address is already registered.' },
          { name: 'name', message: 'Please use your full name.' },
        ],
      }),
  },
  laravel: {
    label: 'Laravel-style errors object (422)',
    respond: () =>
      json(422, {
        message: 'The email has already been taken.',
        errors: { email: ['The email has already been taken.'] },
      }),
  },
  error: {
    label: 'Error message (400)',
    respond: () => json(400, { status: 'error', message: 'We could not send your message right now. Please try again later.' }),
  },
  'server-error': {
    label: 'HTML error page (500)',
    respond: () => ({ status: 500, body: '<!doctype html><h1>500 Internal Server Error</h1>', type: 'text/html' }),
  },
  network: {
    label: 'Network failure',
    respond: () => {
      throw new TypeError('Failed to fetch');
    },
  },
  slow: {
    label: 'Slow success (2.5 s)',
    delay: 2500,
    respond: () => json(200, { status: 'success', message: 'That took a while, but it worked.' }),
  },
};

/**
 * @param {string} path  pathname to intercept, e.g. "/api/submit"
 * @param {() => string} getScenario  key of SCENARIOS to answer with
 */
export function installMock(path, getScenario) {
  const realFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const url = new URL(input instanceof Request ? input.url : String(input), location.href);
    if (url.pathname !== path) return realFetch(input, init);

    const scenario = SCENARIOS[getScenario()] ?? SCENARIOS.success;
    await new Promise((resolve) => setTimeout(resolve, scenario.delay ?? 700));
    const { status, body, type } = scenario.respond();
    return new Response(body, { status, headers: { 'Content-Type': type } });
  };
}
