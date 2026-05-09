#!/usr/bin/env node
/**
 * verify-resume.mjs
 *
 * Reads resume.enc.json and the SIMPLE_AUTH secret from the environment,
 * attempts decryption, and verifies the plaintext is sane HTML. Used by the
 * GitHub Actions workflow to catch a stale cipher (e.g. someone changed the
 * password but didn't re-run encrypt-resume.mjs).
 *
 * Exits 0 on success, 1 on failure.
 */
import { readFileSync, existsSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
import { Buffer } from 'node:buffer';

const password = process.env.SIMPLE_AUTH;
if (!password) fail('SIMPLE_AUTH not in env');

const path = 'resume.enc.json';
if (!existsSync(path)) fail(`${path} missing`);
const blob = JSON.parse(readFileSync(path, 'utf8'));

const b64dec = (s) => Uint8Array.from(Buffer.from(s, 'base64'));

const baseKey = await crypto.subtle.importKey(
  'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']
);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt: b64dec(blob.salt), iterations: blob.iterations, hash: 'SHA-256' },
  baseKey, { name: 'AES-GCM', length: blob.keyLength }, false, ['decrypt']
);

let plain;
try {
  const buf = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64dec(blob.iv) }, key, b64dec(blob.ct)
  );
  plain = new TextDecoder().decode(buf);
} catch (e) {
  fail(`decrypt failed — secret likely doesn't match cipher: ${e.message}`);
}

if (!/<!doctype html>/i.test(plain) || !/<\/html>/i.test(plain)) {
  fail('decrypted payload does not look like a full HTML document');
}
if (plain.length !== blob.bytes) {
  console.warn(`⚠ length mismatch: cipher metadata says ${blob.bytes}, decrypted ${plain.length}`);
}

console.log(`✓ resume cipher verifies (${plain.length.toLocaleString()} bytes plaintext)`);
process.exit(0);

function fail(msg) {
  console.error(`✗ ${msg}`);
  process.exit(1);
}
