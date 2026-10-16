---
title: AI & agents
description: Use submito with coding agents through the agent skill, TypeScript types, llms.txt and Markdown pages.
---

# AI & agents

Submito is built so a coding agent (Claude Code, Cursor, Codex, Copilot…) can wire a form correctly on the first try. It has a single entry point, rules that live in plain HTML attributes, one response shape, and docs written for machines as well as people.

## What agents can use

| Resource | Where | Best for |
|----------|-------|----------|
| **Agent skill** | `npx submito skill` → `.claude/skills/submito/`, `.cursor/…`, `.agents/…` | Tools that support skills: instructions and references load automatically |
| **TypeScript types** | `node_modules/submito/types/index.d.ts` | Exact options, events and response object; editor autocomplete |
| **`llms.txt`** | <a href="/llms.txt" target="_blank">/llms.txt</a> on this site | An index of every docs page, for LLMs |
| **`llms-full.txt`** | <a href="/llms-full.txt" target="_blank">/llms-full.txt</a> | The whole documentation in one Markdown file |
| **Markdown pages** | add `.md` to any page URL, e.g. <a href="/configuration.md" target="_blank">/configuration.md</a> | Fetching one page without HTML |

## 1. Install the skill

This is the recommended route for tools that support [Agent Skills](https://agentskills.io/):

```bash
npm install submito
npx submito skill
```

The skill comes from the installed package, so it always matches your submito version. See [Agent skill](/agent-skill) for flags, manual installation and what is inside.

## 2. Or give the agent the docs

If your tool does not support skills:

- Ask it to fetch `/llms-full.txt` from this site before it works on forms.
- Or paste `llms-full.txt` into the chat, or into your project's knowledge or rules.
- In tools that index documentation by URL, add this site and let it crawl the `.md` pages listed in `/llms.txt`.

## 3. Add a project rule

Agents read project instruction files (`AGENTS.md`, `CLAUDE.md`, `.cursor/rules/…`) on every task. A few lines keep form code consistent:

```md
## Forms
- Forms use submito (`submito.newForm`). Follow the submito skill
  (`.claude/skills/submito/SKILL.md`) or node_modules/submito/types/index.d.ts.
- Validation rules live in HTML attributes (required, type, minlength, pattern + title).
- Endpoints return JSON: `{ status, message }`, and HTTP 422 with
  `{ message, errors: [{ name, message }] }` for field errors.
- Turnstile / reCAPTCHA tokens are verified on the server. Never render server text as HTML.
```

## Example prompts

- "Wire the contact form in `contact.html` with submito. Add Turnstile and write the Express endpoint."
- "Replace this jQuery `$.ajax` form handler with submito, keeping our CSS classes."
- "Add an intl-tel-input phone field to the signup form and return Laravel validation errors."
- "The newsletter form doesn't show server errors next to the fields. Find out why."
- "Track every successful form submission in analytics, including the selected `topic` field."

## Why submito works well with agents

- **One entry point.** `submito.newForm(options)` and a small instance API. There is nothing else to discover.
- **HTML is the source of truth.** Validation comes from attributes every model already knows (`required`, `minlength`, `pattern`), not a custom schema.
- **Typed contract.** One normalized response object and typed events. `form.addEventListener('submito:success', …)` gives a typed `event.detail` in TypeScript and in JS projects with type checking.
- **Loud, specific failures.** Misconfiguration logs a `[submito] …` error that names the missing element or option, and `newForm()` returns `null` instead of half-working.
- **Nothing implicit.** Integrations are opt-in options. No third-party script is loaded unless you enable it.
