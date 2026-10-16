import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(__dirname, '../..');

const DOCS_DIR = path.join(repoRoot, 'docs');
const DIST_DIR = path.join(DOCS_DIR, '.vitepress/dist');

/**
 * Static folders served next to the docs. The playground imports live ES modules from src/
 * and mocks its endpoint in the browser (playground/mock.js), so no API middleware is needed.
 * The agent skill is published so agents can fetch it from the site.
 */
const MOUNTS = {
  '/playground': path.join(repoRoot, 'playground'),
  '/src': path.join(repoRoot, 'src'),
  '/skills/submito': path.join(repoRoot, 'skills/submito'),
};

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.yaml': 'text/yaml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

/* ---------- AI-friendly docs: /llms.txt, /llms-full.txt, /<page>.md ---------- */

const LLMS_INTRO = `Submito is a dependency-free browser library. \`submito.newForm({ form: '#id' })\` binds an existing HTML form to \`fetch\`: validation from HTML constraints (live while typing), a built-in response dialog (or SweetAlert2), math captcha, Google reCAPTCHA v3, Cloudflare Turnstile, intl-tel-input phone fields, and bubbling \`submito:*\` events on the form element. Endpoints reply with JSON such as \`{ "status": "success", "message": "…" }\`, or HTTP 422 with \`{ "message": "…", "errors": [{ "name": "email", "message": "…" }] }\`.

The npm package ships TypeScript types (\`types/index.d.ts\`) and an agent skill for Claude Code, Cursor and Codex (\`npx submito skill\`). Every page below is plain Markdown.`;

function parsePage(link) {
  const file = path.join(DOCS_DIR, `${link.replace(/^\//, '')}.md`);
  if (!fs.existsSync(file)) return null;

  const raw = fs.readFileSync(file, 'utf8');
  const front = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  const meta = {};
  for (const line of front?.[1].split(/\r?\n/) ?? []) {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) meta[match[1]] = match[2].trim().replace(/^(['"])(.*)\1$/, '$2');
  }
  return {
    link,
    title: meta.title ?? link.slice(1),
    description: meta.description ?? '',
    body: raw.slice(front?.[0].length ?? 0).trim(),
  };
}

/** Docs pages grouped like the sidebar (playground and external links skipped). */
function sidebarPages(sidebar) {
  return sidebar
    .map((group) => ({
      text: group.text,
      pages: (group.items ?? [])
        .filter((item) => item.link?.startsWith('/') && !item.link.startsWith('/playground'))
        .map((item) => parsePage(item.link))
        .filter(Boolean),
    }))
    .filter((group) => group.pages.length);
}

/** Point internal page links at their Markdown twins: (/configuration#data) → (/configuration.md#data). */
function linkToMarkdown(body, links) {
  return body.replace(/\]\((\/[\w-]+)(#[^)]*)?\)/g, (match, link, hash = '') =>
    links.has(link) ? `](${link}.md${hash})` : match,
  );
}

/**
 * @param {{ title: string, description: string, sidebar: object[] }} site
 * @returns {Map<string, string>} published path (no leading slash) → content
 */
export function aiFiles(site) {
  const groups = sidebarPages(site.sidebar);
  const pages = groups.flatMap((group) => group.pages);
  const links = new Set(pages.map((page) => page.link));
  const files = new Map();

  const index = [`# ${site.title}`, '', `> ${site.description}`, '', LLMS_INTRO, ''];
  for (const group of groups) {
    index.push(`## ${group.text}`, '');
    for (const page of group.pages) {
      index.push(`- [${page.title}](${page.link}.md)${page.description ? `: ${page.description}` : ''}`);
    }
    index.push('');
  }
  index.push(
    '## Optional',
    '',
    '- [Full documentation](/llms-full.txt): every page above in one file',
    '- [Agent skill](/skills/submito/SKILL.md): instructions for coding agents, with references/api.md, references/integrations.md and references/server.md',
    '',
  );
  files.set('llms.txt', index.join('\n'));

  const full = [`# ${site.title} documentation`, '', `> ${site.description}`, '', LLMS_INTRO];
  for (const page of pages) {
    const body = linkToMarkdown(page.body, links);
    full.push('', '---', '', `<!-- ${page.link}.md -->`, '', body);
    files.set(`${page.link.slice(1)}.md`, `${body}\n`);
  }
  files.set('llms-full.txt', `${full.join('\n')}\n`);

  return files;
}

/* ---------- dev server + build ---------- */

function resolveFile(urlPath) {
  for (const [prefix, dir] of Object.entries(MOUNTS)) {
    if (urlPath !== prefix && !urlPath.startsWith(`${prefix}/`)) continue;

    const rel = decodeURIComponent(urlPath.slice(prefix.length)).replace(/^\/+/, '');
    let file = path.resolve(dir, rel);
    const inside = path.relative(dir, file);
    if (inside.startsWith('..') || path.isAbsolute(inside)) return null;

    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    return fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
  }
  return null;
}

function send(res, type, body) {
  res.statusCode = 200;
  res.setHeader('Content-Type', type);
  res.setHeader('Cache-Control', 'no-store');
  res.end(body);
}

function devMiddleware(site) {
  return (req, res, next) => {
    const urlPath = (req.url ?? '').split('?')[0];

    if (urlPath === '/playground') {
      res.statusCode = 302;
      res.setHeader('Location', '/playground/');
      res.end();
      return;
    }

    // In dev, VitePress imports each page as a JS module from /<page>.md (sec-fetch-dest: script,
    // or with ?t= on HMR). Those must reach Vite; only direct requests get the raw Markdown twin.
    const pageModule = req.headers['sec-fetch-dest'] === 'script' || (req.url ?? '').includes('?');
    if (urlPath === '/llms.txt' || urlPath === '/llms-full.txt' || (/^\/[\w-]+\.md$/.test(urlPath) && !pageModule)) {
      const content = aiFiles(site).get(urlPath.slice(1));
      if (content) return send(res, MIME[path.extname(urlPath)], content);
    }

    const file = resolveFile(urlPath);
    if (!file) return next();
    send(res, MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream', fs.readFileSync(file));
  };
}

/** @param {{ title: string, description: string, sidebar: object[] }} site */
export function submitoSitePlugin(site) {
  return {
    name: 'submito-docs-site',
    configureServer(server) {
      // Runs before VitePress' SPA fallback so these paths are real files.
      return () => {
        server.middlewares.stack.unshift({ route: '', handle: devMiddleware(site) });
      };
    },
  };
}

/** Production: ship the playground, the source it imports, the skill and the AI files. */
export function writeExtras(site) {
  for (const [prefix, dir] of Object.entries(MOUNTS)) {
    fs.cpSync(dir, path.join(DIST_DIR, prefix.slice(1)), { recursive: true });
  }
  for (const [file, content] of aiFiles(site)) {
    fs.writeFileSync(path.join(DIST_DIR, file), content);
  }
}
