#!/usr/bin/env node
/**
 * encrypt-resume.mjs
 *
 * Reads resume-source.html (gitignored plaintext) and a password from .env,
 * derives an AES-GCM key via PBKDF2-SHA256 (200k iters), encrypts the
 * plaintext, and writes the cipher + parameters to resume.enc.json.
 *
 * Run locally after editing resume-source.html, then commit resume.enc.json.
 * The .env, the plaintext source, and the password never leave your machine.
 *
 *   node scripts/encrypt-resume.mjs
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');

const envPath  = resolve(root, '.env');
const srcPath  = resolve(root, 'resume-source.html');
const outPath  = resolve(root, 'resume.enc.json');

if (!existsSync(envPath))  fail(`.env not found at ${envPath}`);
if (!existsSync(srcPath))  fail(`resume-source.html not found at ${srcPath}`);

const password = readFileSync(envPath, 'utf8')
  .split(/\r?\n/).map(s => s.trim())
  .filter(s => s && !s.startsWith('#'))
  .map(line => {
    const i = line.indexOf('=');
    return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
  })
  .find(([k]) => k === 'SIMPLE_AUTH')?.[1];

if (!password) fail('SIMPLE_AUTH= is missing in .env');

const html = readFileSync(srcPath, 'utf8');

const ITERATIONS = 200000;
const enc  = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv   = crypto.getRandomValues(new Uint8Array(12));

const baseKey = await crypto.subtle.importKey(
  'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
  baseKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt']
);
const ct = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  key,
  enc.encode(html)
);

const b64 = (u8) => Buffer.from(u8).toString('base64');

const payload = {
  alg: 'AES-GCM',
  kdf: 'PBKDF2-SHA256',
  iterations: ITERATIONS,
  keyLength: 256,
  salt: b64(salt),
  iv: b64(iv),
  ct: b64(new Uint8Array(ct)),
  bytes: html.length,
  generated: new Date().toISOString(),
};

writeFileSync(outPath, JSON.stringify(payload, null, 2) + '\n');
console.log(`✓ wrote ${outPath}  (${html.length.toLocaleString()} bytes plaintext → ${b64(new Uint8Array(ct)).length.toLocaleString()} b64 ciphertext)`);

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}
