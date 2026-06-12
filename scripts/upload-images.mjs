/**
 * Upload all public-facing images to the media server (media.aircnc.co.ke)
 * Then output the replacement map so we can update source code references.
 *
 * Usage:
 *   node scripts/upload-images.mjs
 *
 * Requires environment variables:
 *   MEDIA_API_KEY  (from the .env file shown in the instructions)
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, extname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = resolve(fileURLToPath(import.meta.url), '..', '..');

// ── Config ────────────────────────────────────────────────────────────────
const MEDIA_SERVER = 'https://media.aircnc.co.ke';
const API_KEY = process.env.MEDIA_API_KEY;
const CLIENT_ID = 'icims';
const MEDIA_BASE_URL = MEDIA_SERVER;  // Our media server URL

if (!API_KEY) {
  console.error('❌ MEDIA_API_KEY environment variable is required.');
  console.error('   Set it before running:');
  console.error('   $env:MEDIA_API_KEY="minio_api_key_hfge3ederhf347yf43t67r346tfdfwtyfydtf263er"');
  console.error('   node scripts/upload-images.mjs');
  process.exit(1);
}

// ── Files to upload ───────────────────────────────────────────────────────
// These are ALL image files used across public pages
const FILES = [
  // From public/ (root-relative paths used in <img src="/..."> and meta tags)
  { filepath: 'public/icims-logo.jpg',     label: 'logo' },
  { filepath: 'public/about.png',          label: 'about-hero' },
  { filepath: 'public/features.png',       label: 'features-hero' },
  { filepath: 'public/contact.png',        label: 'contact-hero' },
  { filepath: 'public/cta.png',            label: 'cta' },
  { filepath: 'public/og-image.png',       label: 'og-image' },

  // From src/assets/ (imported in components)
  { filepath: 'src/assets/hero-church.jpg',           label: 'hero-church' },
  { filepath: 'src/assets/hero-church-subdomain.png',  label: 'hero-subdomain' },
  { filepath: 'src/assets/church-community.jpg',       label: 'church-community' },
  { filepath: 'src/assets/prices.png',                 label: 'prices-hero' },
];

// ── Upload helper ─────────────────────────────────────────────────────────
async function uploadFile(filepath) {
  const fullPath = resolve(__dirname, filepath);
  
  try {
    statSync(fullPath);
  } catch {
    console.warn(`⚠️  File not found, skipping: ${filepath}`);
    return null;
  }

  const fileBuffer = readFileSync(fullPath);
  const originalName = basename(filepath);

  // Build multipart form manually (avoids needing form-data package)
  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
  const header = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${originalName}"\r\nContent-Type: application/octet-stream\r\n\r\n`;
  const footer = `\r\n--${boundary}--\r\n`;
  const body = Buffer.concat([
    Buffer.from(header, 'utf-8'),
    fileBuffer,
    Buffer.from(footer, 'utf-8'),
  ]);

  const url = `${MEDIA_SERVER}/upload/`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY,
        'X-Client-Id': CLIENT_ID,
        'X-Media-Base-Url': MEDIA_BASE_URL,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': body.length.toString(),
      },
      body,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ Upload failed (${response.status}) for ${filepath}: ${text}`);
      return null;
    }

    const data = await response.json();
    console.log(`✅ Uploaded ${filepath} → ${data.url}`);
    return data;
  } catch (err) {
    console.error(`❌ Network error uploading ${filepath}:`, err.message);
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting image upload to', MEDIA_SERVER);
  console.log('');

  const results = {};

  for (const { filepath, label } of FILES) {
    const result = await uploadFile(filepath);
    if (result) {
      results[label] = result.url;
    }
    // Small delay to avoid overwhelming the server
    await new Promise(r => setTimeout(r, 200));
  }

  // ── Output replacement map ──────────────────────────────────────────
  console.log('');
  console.log('══════════════════════════════════════════════════════════');
  console.log('📋  REPLACEMENT MAP — use these URLs in your code');
  console.log('══════════════════════════════════════════════════════════');
  console.log('');

  // Public/ assets
  if (results['logo'])           console.log(`icims-logo.jpg        → ${results['logo']}`);
  if (results['about-hero'])     console.log(`about.png             → ${results['about-hero']}`);
  if (results['features-hero'])  console.log(`features.png          → ${results['features-hero']}`);
  if (results['contact-hero'])   console.log(`contact.png           → ${results['contact-hero']}`);
  if (results['cta'])            console.log(`cta.png               → ${results['cta']}`);
  if (results['og-image'])       console.log(`og-image.png          → ${results['og-image']}`);
  if (results['hero-church'])    console.log(`hero-church.jpg       → ${results['hero-church']}`);
  if (results['hero-subdomain']) console.log(`hero-church-subdomain → ${results['hero-subdomain']}`);
  if (results['church-community']) console.log(`church-community.jpg  → ${results['church-community']}`);
  if (results['prices-hero'])    console.log(`prices.png            → ${results['prices-hero']}`);

  console.log('');
  console.log('══════════════════════════════════════════════════════════');
  console.log('✅ Done!');
}

main().catch(console.error);
