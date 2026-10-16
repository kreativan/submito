#!/usr/bin/env node
/**
 * One-line release to npm.
 *
 *   npm run publish                  publish the version in package.json
 *   npm run publish patch            bump 0.1.0 → 0.1.1 (or minor / major / 1.2.3 / prerelease), then publish
 *   npm run publish -- --dry-run     build + pack + show what would be uploaded, upload nothing
 *   npm run publish minor -- --otp 123456   extra flags after `--` go to `npm publish`
 *
 * Checks before uploading: logged in to npm (offers `npm login` in the browser if not),
 * version not already published.
 * The build runs in `prepublishOnly`, so even a bare `npm publish` ships a fresh dist/.
 *
 * "publish" is also an npm lifecycle name: `npm publish` runs this script again after the upload.
 * That nested run is detected (npm_command === "publish") and exits immediately.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.env.npm_command === 'publish') process.exit(0);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NPM_CLI = process.env.npm_execpath;
const BUMPS = ['patch', 'minor', 'major', 'prepatch', 'preminor', 'premajor', 'prerelease'];
const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

/** Run npm with the same Node + npm that started this script (works on Windows without a shell). */
function npm(args, { capture = false } = {}) {
  return spawnSync(process.execPath, [NPM_CLI, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
}

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

const readPackage = () => JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

/**
 * Returns the npm username. When logged out in an interactive terminal, runs `npm login`
 * (browser login: npm prints a URL and opens it on ENTER), then checks again.
 */
function ensureLoggedIn() {
  const whoami = () => npm(['whoami'], { capture: true });
  let result = whoami();
  if (result.status === 0) return result.stdout.trim();

  if (!process.stdin.isTTY) fail('Not logged in to npm. Run `npm login`, then try again.');

  console.log('Not logged in to npm. Starting `npm login`…\n');
  if (npm(['login']).status !== 0) fail('npm login did not complete.');
  result = whoami();
  if (result.status !== 0) fail('Still not logged in to npm. Run `npm login`, then try again.');
  return result.stdout.trim();
}

function main() {
  if (!NPM_CLI) fail('Run this through npm: npm run publish [patch|minor|major|<version>]');

  const args = process.argv.slice(2);
  const bump = args[0] && !args[0].startsWith('-') ? args.shift() : null;
  const dryRun = args.includes('--dry-run');

  if (bump && !BUMPS.includes(bump) && !SEMVER.test(bump)) {
    fail(`Unknown version "${bump}". Use ${BUMPS.slice(0, 3).join(' / ')} or an exact version like 1.2.3.`);
  }

  const { name } = readPackage();

  if (!dryRun) console.log(`npm user: ${ensureLoggedIn()}`);

  if (bump) {
    if (dryRun) {
      console.log(`(dry run) would bump the version with: npm version ${bump}`);
    } else {
      const result = npm(['version', bump, '--no-git-tag-version'], { capture: true });
      if (result.status !== 0) fail(`npm version ${bump} failed:\n${result.stderr}`);
    }
  }

  const { version } = readPackage();
  const published = npm(['view', `${name}@${version}`, 'version'], { capture: true });
  if (published.status === 0 && published.stdout.trim() === version) {
    fail(`${name}@${version} is already on npm. Bump it, e.g.: npm run publish patch`);
  }

  const publishArgs = ['publish', ...args];
  // npm refuses prerelease versions without an explicit dist-tag.
  if (version.includes('-') && !args.some((arg) => arg === '--tag' || arg.startsWith('--tag='))) {
    publishArgs.push('--tag', 'next');
  }

  console.log(`\n${dryRun ? 'Dry run: ' : ''}publishing ${name}@${version}…\n`);
  const result = npm(publishArgs);
  if (result.status !== 0) {
    fail(`npm publish failed.${bump && !dryRun ? ` package.json is already at ${version}; rerun without a bump argument.` : ''}`);
  }

  if (dryRun) {
    console.log(`\n✔ Dry run done. Nothing was uploaded.`);
  } else {
    console.log(`\n✔ Published ${name}@${version}`);
    console.log(`  https://www.npmjs.com/package/${name}`);
    console.log(`  https://cdn.jsdelivr.net/npm/${name}@${version}/dist/${name}.min.js`);
  }
}

main();
