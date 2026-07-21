import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as esbuild from 'esbuild';

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(rootDir, 'public');
const srcDir = path.join(rootDir, 'src');

async function buildPageInterceptorImpl() {
  const result = await esbuild.build({
    absWorkingDir: rootDir,
    banner: {
      js: 'var SignetsPageInterceptor = (() => {',
    },
    bundle: true,
    entryPoints: [path.join(srcDir, 'page-interceptor.ts')],
    footer: {
      js: 'return { installPageInterceptor }; })();',
    },
    format: 'iife',
    platform: 'browser',
    write: false,
  });

  const output = result.outputFiles?.[0]?.text;
  if (!output) {
    throw new Error('Failed to bundle page interceptor.');
  }

  return output;
}

async function buildExtensionBundle(entry, outfile, options) {
  await esbuild.build({
    absWorkingDir: rootDir,
    banner: options.interceptorImpl
      ? {
          js: `const __SIGNETS_PAGE_INTERCEPTOR_IMPL__ = ${JSON.stringify(options.interceptorImpl)};`,
        }
      : undefined,
    bundle: true,
    entryPoints: [path.join(srcDir, entry)],
    format: options.format,
    outfile: path.join(publicDir, outfile),
    platform: 'browser',
    target: 'chrome109',
  });
}

const interceptorImpl = await buildPageInterceptorImpl();

await Promise.all([
  buildExtensionBundle('content.ts', 'content.js', {
    format: 'iife',
    interceptorImpl,
  }),
  buildExtensionBundle('background.ts', 'background.js', { format: 'esm' }),
  buildExtensionBundle('popup.ts', 'popup.js', { format: 'iife' }),
]);

writeFileSync(path.join(publicDir, 'page-interceptor.js'), interceptorImpl);
