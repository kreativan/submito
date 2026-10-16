---
layout: home
title: Submito
titleTemplate: AJAX forms for plain HTML

hero:
  name: Submito
  text: AJAX forms for plain HTML
  tagline: No framework, no runtime dependencies, and ready for AI coding agents.
  actions:
    - theme: brand
      text: Get started
      link: /getting-started
    - theme: alt
      text: AI & agents
      link: /ai
    - theme: alt
      text: Playground
      link: /playground/
      target: _self
---

<div class="home-install">

```bash
npm install submito
npx submito skill
```

<p class="home-meta"><span>Zero dependencies</span><span>TypeScript types</span><span>Agent skill included</span><span>MIT</span></p>
</div>

<section class="home-section home-split">
<div>
<p class="home-kicker">How it works</p>
<h2 class="home-h2">Write HTML.<br />Get a working form.</h2>
<ol class="home-steps">
<li><strong>Rules come from your markup.</strong> <code>required</code>, <code>type</code>, <code>minlength</code> and <code>pattern</code> are checked live and shown inline.</li>
<li><strong>One call sends it.</strong> <code>FormData</code> over <code>fetch</code>, with a loading state and a double-submit guard.</li>
<li><strong>The reply drives the UI.</strong> Field errors land next to their inputs, and the message opens a dialog.</li>
</ol>
</div>
<div class="home-window">
<div class="home-window__bar" aria-hidden="true"><span></span><span></span><span></span></div>

::: code-group

```html [contact.html]
<form id="contact" action="/api/contact" method="post">
  <input name="email" type="email" required />
  <textarea name="message" required minlength="10"></textarea>
  <button>Send</button>
</form>

<script type="module">
  import submito from 'submito';
  submito.newForm({ form: '#contact' });
</script>
```

```js [server.js]
app.post('/api/contact', upload.none(), (req, res) => {
  if (!isEmail(req.body.email)) {
    return res.status(422).json({
      message: 'Please fix the highlighted fields.',
      errors: [{ name: 'email', message: 'Enter a valid email.' }],
    });
  }
  res.json({ status: 'success', message: 'Thanks! We will reply soon.' });
});
```

```js [events.js]
const form = document.querySelector('#contact');

form.addEventListener('submito:success', (event) => {
  const { response, formData } = event.detail;
  console.log(response.message, formData.get('email'));
});
```

:::

</div>
</section>

<section class="home-section">
<p class="home-kicker">Features</p>
<h2 class="home-h2">Small core, optional extras.</h2>
<div class="home-grid">
<a class="home-card" href="/validation"><span class="home-card__index">01</span><h3 class="home-card__title">Live validation</h3><p class="home-card__text">Your HTML constraints, checked as the user types. Errors appear inline and accessibly.</p></a>
<a class="home-card" href="/response-ui"><span class="home-card__index">02</span><h3 class="home-card__title">Response dialog</h3><p class="home-card__text">A native &lt;dialog&gt; by default, themeable with CSS variables. Or SweetAlert2, or none.</p></a>
<a class="home-card" href="/turnstile"><span class="home-card__index">03</span><h3 class="home-card__title">Captchas</h3><p class="home-card__text">Math captcha, Google reCAPTCHA v3 and Cloudflare Turnstile. Tokens are added for you.</p></a>
<a class="home-card" href="/intl-tel-input"><span class="home-card__index">04</span><h3 class="home-card__title">Phone numbers</h3><p class="home-card__text">intl-tel-input with validation, E.164 numbers, country and dial code fields.</p></a>
<a class="home-card" href="/events"><span class="home-card__index">05</span><h3 class="home-card__title">Form events</h3><p class="home-card__text">submito:before, :success, :error and :after bubble from the form, with the payload.</p></a>
<a class="home-card" href="/server-responses"><span class="home-card__index">06</span><h3 class="home-card__title">Any backend</h3><p class="home-card__text">Express, PHP, Laravel or WordPress. Replies are normalized into one response object.</p></a>
</div>
</section>

<section class="home-section home-ai">
<div>
<p class="home-kicker">For AI agents</p>
<h2 class="home-h2">Give your coding agent the manual.</h2>
<p class="home-ai__text">One entry point, rules in plain HTML attributes and one typed response leave agents little to guess. The skill and the plain-text docs cover the rest.</p>
<a class="home-link" href="/ai">AI &amp; agents →</a>
</div>
<div class="home-ai__list">
<a class="home-ai__row" href="/agent-skill"><code>npx submito skill</code><span>Skill for Claude Code, Cursor and Codex</span></a>
<a class="home-ai__row" href="/llms.txt" target="_blank"><code>/llms.txt</code><span>Index of every docs page</span></a>
<a class="home-ai__row" href="/llms-full.txt" target="_blank"><code>/llms-full.txt</code><span>The whole documentation in one file</span></a>
<a class="home-ai__row" href="/ai"><code>types/index.d.ts</code><span>Typed options, events and responses</span></a>
</div>
</section>

<style>
/* Home page only. Every rule is scoped to .VPHome, so nothing leaks into the docs pages. */
.VPHome {
  --home-accent: var(--vp-c-brand-1);
  --home-border: var(--vp-c-divider);
  --home-glow: rgb(47 111 106 / 0.2);
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: linear-gradient(115deg, #1d5c56 0%, #2f8a7c 45%, #4cb59d 100%);
}

.dark .VPHome {
  --home-glow: rgb(111 183 177 / 0.16);
  --vp-home-hero-name-background: linear-gradient(115deg, #6fb7b1 0%, #8fd6c4 50%, #c2f0e2 100%);
}

/* ---------- hero ---------- */

.VPHome div.VPHero {
  position: relative;
  isolation: isolate;
  padding-bottom: 2.5rem;
}

.VPHome div.VPHero::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background-image: radial-gradient(var(--vp-c-divider) 1px, transparent 1.4px);
  background-size: 22px 22px;
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 42%, #000 20%, transparent 72%);
  mask-image: radial-gradient(ellipse 70% 60% at 50% 42%, #000 20%, transparent 72%);
}

.VPHome div.VPHero::after {
  content: '';
  position: absolute;
  top: 22%;
  left: 50%;
  z-index: -1;
  width: min(56rem, 120vw);
  height: 26rem;
  transform: translateX(-50%);
  background: radial-gradient(closest-side, var(--home-glow), transparent);
  pointer-events: none;
}

.VPHome .VPHero .container {
  justify-content: center;
  text-align: center;
}

.VPHome .VPHero .main {
  width: 100%;
  max-width: 56rem;
  margin: 0 auto;
}

.VPHome .VPHero .heading {
  align-items: center;
}

.VPHome .VPHero .name {
  max-width: none;
  padding-bottom: 0.06em;
  font-size: clamp(3.25rem, 10vw, 6.25rem);
  line-height: 1;
  letter-spacing: -0.045em;
}

.VPHome .VPHero .text {
  max-width: none;
  margin-top: 0.4rem;
  font-size: clamp(1.6rem, 4.4vw, 2.75rem);
  line-height: 1.15;
  letter-spacing: -0.03em;
}

.VPHome .VPHero .tagline {
  max-width: 32rem;
  margin: 0 auto;
  padding-top: 1.25rem;
  font-size: clamp(1.05rem, 2vw, 1.2rem);
  font-weight: 400;
  line-height: 1.6;
}

.VPHome .VPHero .actions {
  justify-content: center;
  padding-top: 2rem;
}

@keyframes home-rise {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
}

.VPHome .VPHero .heading,
.VPHome .VPHero .tagline,
.VPHome .VPHero .actions,
.VPHome .home-install {
  animation: home-rise 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) both;
}

.VPHome .VPHero .tagline { animation-delay: 0.08s; }
.VPHome .VPHero .actions { animation-delay: 0.16s; }
.VPHome .home-install { animation-delay: 0.24s; }

/* ---------- install ---------- */

.VPHome .home-install {
  max-width: 36rem;
  margin: 0 auto;
}

.VPHome .vp-doc .home-install div[class*='language-'] {
  max-width: 26rem;
  margin: 0 auto;
  border: 1px solid var(--home-border);
  border-radius: 12px;
  box-shadow: 0 18px 40px -24px rgb(0 0 0 / 0.35);
}

.VPHome .home-install span.lang {
  display: none;
}

.VPHome .home-install .line::before {
  content: '$ ';
  color: var(--vp-c-text-3);
}

.VPHome .vp-doc .home-meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.25rem 1.1rem;
  margin: 1rem 0 0;
  font-size: 0.8rem;
  line-height: 1.6;
  color: var(--vp-c-text-3);
}

.VPHome .home-meta span {
  white-space: nowrap;
}

.VPHome .home-meta span::before {
  content: '';
  display: inline-block;
  width: 5px;
  height: 5px;
  margin-right: 0.45rem;
  border-radius: 50%;
  background: var(--home-accent);
  vertical-align: middle;
  opacity: 0.7;
}

/* ---------- sections ---------- */

.VPHome .home-section {
  max-width: 72rem;
  margin: 4.5rem auto 0;
}

@media (min-width: 640px) {
  .VPHome .home-section { margin-top: 7rem; }
}

.VPHome .vp-doc .home-kicker {
  margin: 0 0 0.75rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--home-accent);
}

.VPHome .vp-doc .home-h2 {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: clamp(1.75rem, 3.6vw, 2.5rem);
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: -0.03em;
}

.VPHome .vp-doc .home-link {
  display: inline-block;
  margin-top: 1.5rem;
  font-weight: 600;
  text-decoration: none;
}

/* ---------- how it works ---------- */

.VPHome .home-split {
  display: grid;
  gap: 2.5rem;
  align-items: center;
}

@media (min-width: 960px) {
  .VPHome .home-split {
    grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
    gap: 4rem;
  }
}

.VPHome .vp-doc .home-steps {
  display: grid;
  gap: 1.4rem;
  margin: 2rem 0 0;
  padding: 0;
  list-style: none;
  counter-reset: step;
}

.VPHome .vp-doc .home-steps li {
  position: relative;
  margin: 0;
  padding-left: 2.75rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  counter-increment: step;
}

.VPHome .home-steps li::before {
  content: counter(step);
  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  place-items: center;
  width: 1.85rem;
  height: 1.85rem;
  border: 1px solid var(--home-border);
  border-radius: 50%;
  background: var(--vp-c-bg);
  font: 600 0.8rem var(--vp-font-family-mono);
  color: var(--home-accent);
}

.VPHome .home-steps strong {
  display: block;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.VPHome .home-window {
  overflow: hidden;
  border: 1px solid var(--home-border);
  border-radius: 14px;
  background: var(--vp-code-block-bg);
  box-shadow: 0 40px 80px -40px var(--home-glow), 0 24px 48px -32px rgb(0 0 0 / 0.35);
}

.VPHome .home-window__bar {
  display: flex;
  gap: 6px;
  padding: 12px 16px 2px;
  background: var(--vp-code-tab-bg);
}

.VPHome .home-window__bar span {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--vp-c-divider);
}

.VPHome .vp-doc .home-window .vp-code-group {
  margin: 0;
}

.VPHome .vp-doc .home-window .vp-code-group .tabs {
  margin: 0;
  padding: 0 8px;
  border-radius: 0;
}

.VPHome .vp-doc .home-window div[class*='language-'] {
  margin: 0;
  border-radius: 0;
}

.VPHome .vp-doc .home-window div[class*='language-'] pre {
  min-height: 17.5rem;
}

/* The tabs already name each file */
.VPHome .home-window span.lang {
  display: none;
}

/* ---------- features ---------- */

.VPHome .home-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1px;
  margin-top: 2.5rem;
  overflow: hidden;
  border: 1px solid var(--home-border);
  border-radius: 16px;
  background: var(--home-border);
}

@media (min-width: 640px) {
  .VPHome .home-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .VPHome .vp-doc .home-card { padding: 1.75rem 1.5rem 1.9rem; }
}

@media (min-width: 960px) {
  .VPHome .home-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

.VPHome .vp-doc .home-card {
  display: block;
  padding: 1.25rem 1.25rem 1.4rem;
  background: var(--vp-c-bg);
  color: inherit;
  font-weight: 400;
  text-decoration: none;
  transition: background-color 0.2s ease;
}

.VPHome .vp-doc .home-card:hover {
  background: var(--vp-c-bg-soft);
}

.VPHome .home-card__index {
  font: 600 0.75rem var(--vp-font-family-mono);
  color: var(--home-accent);
}

.VPHome .vp-doc .home-card__title {
  margin: 0.9rem 0 0.4rem;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.4;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
}

.VPHome .home-card__title::after {
  content: '→';
  display: inline-block;
  margin-left: 0.4rem;
  color: var(--home-accent);
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.VPHome .home-card:hover .home-card__title::after {
  opacity: 1;
  transform: none;
}

.VPHome .vp-doc .home-card__text {
  margin: 0;
  font-size: 0.925rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

/* ---------- AI ---------- */

.VPHome .home-ai {
  display: grid;
  gap: 2.5rem;
  padding: clamp(1.75rem, 4vw, 3rem);
  border: 1px solid var(--home-border);
  border-radius: 20px;
  background:
    radial-gradient(120% 140% at 0% 0%, var(--vp-c-brand-soft), transparent 55%),
    var(--vp-c-bg-soft);
}

@media (min-width: 960px) {
  .VPHome .home-ai {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 3rem;
    align-items: center;
  }
}

.VPHome .vp-doc .home-ai__text {
  margin: 1rem 0 0;
  max-width: 30rem;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

.VPHome .home-ai__list {
  display: grid;
  gap: 0.5rem;
}

.VPHome .vp-doc .home-ai__row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.25rem 1rem;
  padding: 0.85rem 1rem;
  border: 1px solid var(--home-border);
  border-radius: 12px;
  background: var(--vp-c-bg);
  font-size: 0.875rem;
  font-weight: 400;
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.VPHome .vp-doc .home-ai__row:hover {
  border-color: var(--home-accent);
  transform: translateY(-1px);
}

.VPHome .vp-doc .home-ai__row code {
  padding: 0;
  background: none;
  font-size: 0.85rem;
  color: var(--vp-c-text-1);
  white-space: nowrap;
}

@media (prefers-reduced-motion: reduce) {
  .VPHome .VPHero .heading,
  .VPHome .VPHero .tagline,
  .VPHome .VPHero .actions,
  .VPHome .home-install {
    animation: none;
  }

  .VPHome .vp-doc .home-ai__row:hover {
    transform: none;
  }
}
</style>
