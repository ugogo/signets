import * as esbuild from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(rootDir, 'public');
const srcDir = path.join(rootDir, 'src');

async function buildExtensionBundle(entry, outfile, options = {}) {
  await esbuild.build({
    absWorkingDir: rootDir,
    bundle: true,
    entryPoints: [path.join(srcDir, entry)],
    format: options.format ?? 'iife',
    outfile: path.join(publicDir, outfile),
    platform: 'browser',
    target: 'chrome109',
  });
}

await Promise.all([
  buildExtensionBundle('content.ts', 'content.js'),
  buildExtensionBundle('background.ts', 'background.js', { format: 'esm' }),
  buildExtensionBundle('popup.ts', 'popup.js'),
  buildExtensionBundle('page-interceptor-main.ts', 'page-interceptor-main.js'),
]);
