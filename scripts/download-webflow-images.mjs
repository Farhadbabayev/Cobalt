// Downloads every image that content/**/*.json still loads from Webflow's CDN into public/uploads/webflow/
// and rewrites the JSON to point at the local copy. Run it once, before the Webflow site is closed:
//
//   npm run download-images
//
// It is safe to re-run: files that were already downloaded are skipped.
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';

const WEBFLOW_URL = /https:\/\/(?:uploads-ssl\.webflow\.com|cdn\.prod\.website-files\.com|assets\.website-files\.com)\/[^"\s]+/g;
const OUT_DIR = join('public', 'uploads', 'webflow');
const PUBLIC_PATH = '/uploads/webflow';

mkdirSync(OUT_DIR, { recursive: true });

const files = ['projects', 'team']
  .map((c) => join('content', c))
  .filter(existsSync)
  .flatMap((dir) => readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => join(dir, f)));

// Webflow file names look like "<24-hex-id>_<original name>"; the id keeps them unique.
const localName = (url) =>
  decodeURIComponent(basename(new URL(url).pathname))
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-');

let downloaded = 0;
let failed = 0;
for (const file of files) {
  let json = readFileSync(file, 'utf8');
  const urls = [...new Set(json.match(WEBFLOW_URL) || [])];
  for (const url of urls) {
    const name = localName(url);
    const target = join(OUT_DIR, name);
    if (!existsSync(target)) {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`FAILED ${res.status} ${url}`);
        failed++;
        continue;
      }
      writeFileSync(target, Buffer.from(await res.arrayBuffer()));
      downloaded++;
      console.log(`${target}`);
    }
    json = json.split(url).join(`${PUBLIC_PATH}/${name}`);
  }
  writeFileSync(file, json);
}

console.log(`Done: ${downloaded} downloaded, ${failed} failed.`);
if (failed) process.exit(1);
