# Installing the submito agent skill

`skills/submito/` is an **[Agent Skills](https://agentskills.io/specification)** package for **apps that use submito**. It is not for developing the submito library.

Copy (or symlink) it into your project's agent skill directory. The same `SKILL.md` works in every tool that follows the open skills format.

## Target paths

| Tool | Project skill path | User-wide path |
|------|--------------------|----------------|
| **Cursor** | `.cursor/skills/submito/` | `~/.cursor/skills/submito/` |
| **Claude Code** | `.claude/skills/submito/` | `~/.claude/skills/submito/` |
| **OpenAI Codex** | `.agents/skills/submito/` | `~/.agents/skills/submito/` |

## From npm (recommended)

The skill ships in the npm package, so it matches the installed version:

```bash
npm install submito
npx submito skill            # into the agent folders the project already has (all three if none)
npx submito skill --claude   # or --cursor / --codex / --all, plus --dir <path>
```

## One-shot install (from this repo)

```bash
# macOS / Linux / Git Bash
./skills/install.sh /path/to/your-app            # all three tools
./skills/install.sh /path/to/your-app --claude   # only Claude Code

# Windows PowerShell
./skills/install.ps1 -Target C:\path\to\your-app
./skills/install.ps1 -Target C:\path\to\your-app -Cursor
```

With no tool flag, the scripts install for Cursor, Claude Code and Codex. Re-running replaces the previous copy. If an old `formsub` skill is present in the same directory, the scripts remove it.

### Manual copy

```bash
DEST=/path/to/your-app
for dir in .cursor/skills .claude/skills .agents/skills; do
  mkdir -p "$DEST/$dir" && rm -rf "$DEST/$dir/submito" && cp -R skills/submito "$DEST/$dir/submito"
done
```

```powershell
$dest = "C:\path\to\your-app"
foreach ($dir in @(".cursor\skills", ".claude\skills", ".agents\skills")) {
  New-Item -ItemType Directory -Force -Path "$dest\$dir" | Out-Null
  Copy-Item -Recurse -Force skills\submito "$dest\$dir\submito"
}
```

## This repository

- The canonical package is `skills/submito/` (committed, for distribution).
- Do **not** enable the consumer skill for agents working **on** submito. They should follow the root `AGENTS.md`.
- `.cursor/skills/`, `.claude/skills/` and `.agents/skills/` are gitignored here so local copies are not picked up while developing the library.

## After install

In the consumer app, ask the agent to add or fix a submito form ("wire this contact form with submito and Turnstile"). Tools discover the skill from its `name` / `description`. You can also invoke it explicitly through the tool's skills UI (`/skills`, `$submito`, etc.).
