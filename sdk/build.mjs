// Concatenate sdk/src/*.js (filename order) into one IIFE → public/v1/install-kit.js
// No minifier dependency; we do a light, safe whitespace trim. Run at image build.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const srcDir = join(here, 'src');
const outDir = join(here, '..', 'public', 'v1');
mkdirSync(outDir, { recursive: true });

const files = readdirSync(srcDir).filter(f => f.endsWith('.js')).sort();
const parts = files.map(f => `/* ---- ${f} ---- */\n` + readFileSync(join(srcDir, f), 'utf8'));

const banner = `/*! InstallKit SDK — accurate PWA install instructions. installkit.zlef.fr | MIT */`;
const bundle = `${banner}\n;(function(){\n"use strict";\n${parts.join('\n\n')}\n})();\n`;

writeFileSync(join(outDir, 'install-kit.js'), bundle);
console.log(`built install-kit.js (${(bundle.length / 1024).toFixed(1)} kB) from ${files.length} sources`);
