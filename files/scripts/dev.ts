/**
 * `npm run dev [-- <folder>…]`: rebuilds every extension (or the named ones) into its dist/ folder
 * on each change (`vite build --watch`), with prefixed output. Chrome loads dist/ from disk, so
 * reload the extension on chrome://extensions after a rebuild.
 * Stops all watchers on SIGINT/SIGTERM; exits when all of them have exited.
 */
import { type ChildProcess, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline';
import { styleText } from 'node:util';
import { listExtensions, rootDir, selectExtensions, workspaceName } from './lib/workspace.ts';

type Color = 'cyan' | 'magenta' | 'yellow' | 'green' | 'blue' | 'red';
const colors: Color[] = ['cyan', 'magenta', 'yellow', 'green', 'blue', 'red'];

let extensions: string[];
try {
  extensions = selectExtensions(listExtensions(), process.argv.slice(2));
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
if (extensions.length === 0) {
  console.error('No extensions found. Create one with: npm run new -- "My Extension"');
  process.exit(1);
}

// Vite is a shared dependency in the root node_modules.
const viteBin = join(
  dirname(createRequire(join(rootDir, 'package.json')).resolve('vite/package.json')),
  'bin/vite.js',
);

const width = Math.max(...extensions.map((name) => name.length));
const children = new Set<ChildProcess>();
let stopping = false;
let failed = false;

function pipe(stream: NodeJS.ReadableStream, prefix: string, out: NodeJS.WriteStream): void {
  createInterface({ input: stream, crlfDelay: Infinity }).on('line', (line) => {
    out.write(`${prefix} ${line}\n`);
  });
}

function start(extension: string, color: Color): void {
  const child = spawn(process.execPath, [viteBin, 'build', '--watch'], {
    cwd: join(rootDir, extension),
    env: { ...process.env, ...(process.stdout.isTTY ? { FORCE_COLOR: '1' } : {}) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  children.add(child);

  const prefix = styleText(color, `[${extension.padEnd(width)}]`, { stream: process.stdout });
  pipe(child.stdout, prefix, process.stdout);
  pipe(child.stderr, prefix, process.stderr);

  // 'close' fires after the output streams are drained, so no log line is lost.
  child.on('close', (code, signal) => {
    children.delete(child);
    if (!stopping) {
      failed ||= code !== 0;
      console.log(`${prefix} stopped (${signal ?? `code ${String(code)}`})`);
    }
    if (children.size === 0) process.exit(stopping ? 0 : failed ? 1 : 0);
  });
}

function stop(signal: NodeJS.Signals): void {
  if (stopping) return;
  stopping = true;
  if (children.size === 0) process.exit(0);
  for (const child of children) child.kill(signal);
  // Do not hang on a watcher that ignores the signal.
  setTimeout(() => {
    for (const child of children) child.kill('SIGKILL');
    process.exit(0);
  }, 5_000).unref();
}

process.on('SIGINT', () => {
  stop('SIGINT');
});
process.on('SIGTERM', () => {
  stop('SIGTERM');
});
process.on('SIGHUP', () => {
  stop('SIGTERM');
});

const name = workspaceName();
console.log(
  `${name ? `${name}: w` : 'W'}atching ${String(extensions.length)} extension(s): ${extensions.join(', ')}.\n` +
    'Load <extension>/dist on chrome://extensions (Developer mode → Load unpacked); ' +
    'after a rebuild, click Reload on the extension card and reopen the side panel.\n',
);
extensions.forEach((extension, index) => {
  start(extension, colors[index % colors.length] ?? 'cyan');
});
