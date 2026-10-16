#!/usr/bin/env node
/**
 * submito CLI: installs the agent skill bundled with this package into a project.
 *
 *   npx submito skill                 # into the agent folders the project already has
 *   npx submito skill --claude        # only .claude/skills/submito
 *   npx submito skill --all --dir ../my-app
 *
 * Node-only tooling. The browser library lives in src/ and never imports this file.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SOURCE = path.join(ROOT, 'skills', 'submito');

/** flag → project folder that holds `skills/` for that tool */
const TOOLS = {
  claude: '.claude',
  cursor: '.cursor',
  codex: '.agents',
};

const HELP = `submito CLI

Usage:
  npx submito skill [options]   Install the submito agent skill into a project

Options:
  --claude        .claude/skills/submito   (Claude Code)
  --cursor        .cursor/skills/submito   (Cursor)
  --codex         .agents/skills/submito   (OpenAI Codex)
  --all           all three
  --dir <path>    project directory (default: current directory)
  -h, --help      show this help
  -v, --version   show the submito version

Without a tool flag, the skill goes into the agent folders that already exist in the
project (.claude, .cursor, .agents). If there are none, it goes into all three.
`;

function main(argv) {
  const [command, ...rest] = argv;

  if (!command || ['-h', '--help', 'help'].includes(command)) {
    process.stdout.write(HELP);
    return 0;
  }
  if (['-v', '--version'].includes(command)) {
    const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    console.log(pkg.version);
    return 0;
  }
  if (command !== 'skill' && command !== 'skills') {
    console.error(`Unknown command: ${command}\n`);
    process.stderr.write(HELP);
    return 1;
  }

  const options = parseSkillArgs(rest);
  if (!options) return 1;
  if (options.help) {
    process.stdout.write(HELP);
    return 0;
  }
  return installSkill(options);
}

function parseSkillArgs(args) {
  const tools = new Set();
  let dir = process.cwd();

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === 'install' || arg === 'add') continue; // `npx submito skill install` reads naturally too
    if (arg === '--all') Object.keys(TOOLS).forEach((tool) => tools.add(tool));
    else if (arg.startsWith('--') && arg.slice(2) in TOOLS) tools.add(arg.slice(2));
    else if (arg === '--dir') dir = args[++i];
    else if (arg.startsWith('--dir=')) dir = arg.slice('--dir='.length);
    else if (arg === '-h' || arg === '--help') return { help: true };
    else {
      console.error(`Unknown option: ${arg}\n`);
      process.stderr.write(HELP);
      return null;
    }
  }

  if (!dir) {
    console.error('--dir needs a path.');
    return null;
  }
  return { tools, dir: path.resolve(dir) };
}

function installSkill({ tools, dir }) {
  if (!fs.existsSync(path.join(SOURCE, 'SKILL.md'))) {
    console.error(`The skill is missing from this package (${SOURCE}).`);
    return 1;
  }
  if (!fs.statSync(dir, { throwIfNoEntry: false })?.isDirectory()) {
    console.error(`Project directory not found: ${dir}`);
    return 1;
  }

  let targets = [...tools];
  if (!targets.length) {
    targets = Object.keys(TOOLS).filter((tool) => fs.existsSync(path.join(dir, TOOLS[tool])));
    if (!targets.length) targets = Object.keys(TOOLS);
  }

  for (const tool of targets) {
    const skillsDir = path.join(dir, TOOLS[tool], 'skills');
    const dest = path.join(skillsDir, 'submito');
    const legacy = path.join(skillsDir, 'formsub');

    fs.mkdirSync(skillsDir, { recursive: true });
    if (fs.existsSync(path.join(legacy, 'SKILL.md'))) {
      fs.rmSync(legacy, { recursive: true, force: true });
      console.log(`removed old skill: ${path.relative(dir, legacy)}`);
    }
    fs.rmSync(dest, { recursive: true, force: true });
    fs.cpSync(SOURCE, dest, { recursive: true });
    console.log(`installed: ${path.relative(dir, dest) || dest}`);
  }

  console.log('\nDone. Ask your agent to "wire this form with submito" to use it.');
  return 0;
}

process.exitCode = main(process.argv.slice(2));
