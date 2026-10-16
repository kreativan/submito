#!/usr/bin/env bash
# Copy the submito consumer skill into a target project's agent skill dirs.
# Usage: ./skills/install.sh /path/to/app [--cursor] [--claude] [--codex] [--all]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$ROOT/submito"

if [[ ! -f "$SRC/SKILL.md" ]]; then
  echo "error: missing $SRC/SKILL.md" >&2
  exit 1
fi

TARGET=""
DO_CURSOR=0
DO_CLAUDE=0
DO_CODEX=0
EXPLICIT=0

usage() {
  cat <<'EOF'
Usage: ./skills/install.sh <target-project-dir> [options]

  --all      Install for Cursor, Claude Code, and Codex (default if no flags)
  --cursor   .cursor/skills/submito
  --claude   .claude/skills/submito
  --codex    .agents/skills/submito
  -h, --help Show help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --all) DO_CURSOR=1; DO_CLAUDE=1; DO_CODEX=1; EXPLICIT=1; shift ;;
    --cursor) DO_CURSOR=1; EXPLICIT=1; shift ;;
    --claude) DO_CLAUDE=1; EXPLICIT=1; shift ;;
    --codex) DO_CODEX=1; EXPLICIT=1; shift ;;
    -h|--help) usage; exit 0 ;;
    -*)
      echo "error: unknown option: $1" >&2
      usage >&2
      exit 1
      ;;
    *)
      if [[ -n "$TARGET" ]]; then
        echo "error: unexpected argument: $1" >&2
        exit 1
      fi
      TARGET="$1"
      shift
      ;;
  esac
done

if [[ -z "$TARGET" ]]; then
  usage >&2
  exit 1
fi

if [[ ! -d "$TARGET" ]]; then
  echo "error: target directory does not exist: $TARGET" >&2
  exit 1
fi

if [[ "$EXPLICIT" -eq 0 ]]; then
  DO_CURSOR=1
  DO_CLAUDE=1
  DO_CODEX=1
fi

install_one() {
  local rel="$1"
  local dest="$TARGET/$rel/submito"
  local legacy="$TARGET/$rel/formsub"
  mkdir -p "$(dirname "$dest")"
  if [[ -f "$legacy/SKILL.md" ]]; then
    rm -rf "$legacy"
    echo "removed old skill: $legacy"
  fi
  rm -rf "$dest"
  cp -R "$SRC" "$dest"
  echo "installed: $dest"
}

[[ "$DO_CURSOR" -eq 1 ]] && install_one ".cursor/skills"
[[ "$DO_CLAUDE" -eq 1 ]] && install_one ".claude/skills"
[[ "$DO_CODEX" -eq 1 ]] && install_one ".agents/skills"

echo "Done. See skills/INSTALL.md"
