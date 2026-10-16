---
title: Agent skill
description: Install the submito agent skill for Claude Code, Cursor and OpenAI Codex.
---

# Agent skill

The submito skill is an [Agent Skills](https://agentskills.io/) package: a `SKILL.md` with instructions, plus reference files that your coding agent loads when it works on forms. It teaches the agent:

- the options, events, response contract and instance API
- every integration and server-side example
- the rules that matter: verify captcha tokens on the server, never render responses as HTML, keep validation in HTML attributes

It works in any tool that reads the open skills format, including **Claude Code**, **Cursor** and **OpenAI Codex**.

## Install with npm (recommended)

```bash
npm install submito
npx submito skill
```

The skill ships inside the npm package, so it always matches the version you installed. `npx submito skill`:

- copies it into the agent folders your project already has (`.claude`, `.cursor`, `.agents`)
- installs into all three when none of them exist yet
- replaces an older copy of the skill

| Option | Installs into |
|--------|---------------|
| `--claude` | `.claude/skills/submito/` (Claude Code) |
| `--cursor` | `.cursor/skills/submito/` (Cursor) |
| `--codex` | `.agents/skills/submito/` (OpenAI Codex) |
| `--all` | all three |
| `--dir <path>` | another project directory (default: the current directory) |

```bash
npx submito skill --claude                  # only Claude Code
npx submito skill --all --dir ../marketing-site
```

Commit the skill folder so everyone on the team, and every CI agent, gets it too.

### Updating

Run it again after upgrading:

```bash
npm update submito
npx submito skill
```

## Install from the repository

If you have the submito repository checked out:

```bash
# macOS / Linux / Git Bash
./skills/install.sh /path/to/your-app

# Windows PowerShell
./skills/install.ps1 -Target C:\path\to\your-app
```

The scripts accept `--claude`, `--cursor`, `--codex` and `--all` (PowerShell: `-Claude`, `-Cursor`, `-Codex`, `-All`). Without a flag they install for all three tools.

## Install manually

Copy the `submito` skill folder from `node_modules/submito/skills/submito/` (or `skills/submito/` in the repository) into one of these:

| Tool | Project | All projects (user-wide) |
|------|---------|--------------------------|
| Claude Code | `.claude/skills/submito/` | `~/.claude/skills/submito/` |
| Cursor | `.cursor/skills/submito/` | `~/.cursor/skills/submito/` |
| OpenAI Codex | `.agents/skills/submito/` | `~/.agents/skills/submito/` |

The files are also published on this site, so an agent can fetch them directly:

- `/skills/submito/SKILL.md`
- `/skills/submito/references/api.md`
- `/skills/submito/references/integrations.md`
- `/skills/submito/references/server.md`

## What is inside

```
submito/
├── SKILL.md              # when to use it, workflow, decision guide, hard rules, checklist
├── references/
│   ├── api.md            # options, response object, events, instance API, markup hooks, i18n
│   ├── integrations.md   # Turnstile, reCAPTCHA, math captcha, intl-tel-input, SweetAlert2, dialog theme
│   └── server.md         # Express, PHP, Laravel and WordPress endpoints + captcha verification
└── agents/openai.yaml    # display metadata for Codex
```

Agents read `SKILL.md` first and open a reference file only when the task needs it, which keeps their context small.

## Using it

You do not need to mention the skill. Agents pick it up from its description whenever you work on forms ("add Turnstile to the newsletter form", "why are server errors not shown?"). To force it, ask for it by name ("use the submito skill"), or pick it in your tool's skills menu.

:::tip Developing submito itself?
The skill is for **apps that use** submito. Contributors to the library follow `AGENTS.md` in the repository instead. The repository gitignores local skill folders, so the consumer skill never loads while you work on the library.
:::
