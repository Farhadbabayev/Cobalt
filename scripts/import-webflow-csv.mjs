// Converts a Webflow CMS CSV export into JSON files under content/<collection>/.
//
//   node scripts/import-webflow-csv.mjs projects "Cobalt - Projects.csv"
//   node scripts/import-webflow-csv.mjs team "Cobalt - Team.csv"
//
// Existing files with the same slug are overwritten.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'csv-parse/sync';

const [collection, csvPath] = process.argv.slice(2);
if (!['projects', 'team'].includes(collection) || !csvPath) {
  console.error('Usage: node scripts/import-webflow-csv.mjs <projects|team> <file.csv>');
  process.exit(1);
}

const rows = parse(readFileSync(csvPath, 'utf8'), { columns: true, skip_empty_lines: true, bom: true });

const text = (v) => (v ?? '').replace(/\r\n/g, '\n').trim();
const bool = (v) => String(v).trim().toLowerCase() === 'true';
const images = (v) => text(v).split(';').map((s) => s.trim()).filter(Boolean);
const num = (v) => (text(v) === '' ? null : Number(v));
// Returns the first column that exists, so small differences in Webflow column names don't break the import.
const col = (row, ...names) => {
  for (const n of names) if (n in row) return row[n];
  return '';
};

const mappers = {
  projects: (r) => ({
    name: text(r['Name']),
    slug: text(r['Slug']),
    displayName: text(r['Project Page Name']),
    order: num(r['Project order number']),
    draft: bool(r['Draft']) || bool(r['Archived']),
    projectType: text(r['Project Type']),
    authors: text(r['Authors']),
    team: text(r['Team']),
    status: text(r['Status']),
    year: text(r['Year']),
    about: text(r['About Paragraph']),
    featured: text(r['Selected Project Image']) !== '',
    featuredImage: text(r['Selected Project Image']),
    listImage: text(col(r, '"Projects" Page Icon', 'Projects Page Icon')),
    inSlider: bool(r['Appears in Slider']),
    sliderImage: text(r['Slider Image']),
    headerImage: text(r['Projects Page Header Image']),
    featureImage: text(r['PP Feature Image']),
    featureVideo: text(r['PP Feature Video']),
    architecture: {
      topImages: images(r['PP Architecture Tri/Duo Multi-Image']),
      image: text(r['PP Architecture Image Above Description']),
      description: text(r['PP Architecture Description']),
      images: images(r['PP Architecture Multi-Image 1']),
    },
    interior: {
      topImages: images(r['PP Interior Tri/Duo Multi-Image']),
      image: text(col(r, 'PP Interior Image Above Desctiption', 'PP Interior Image Above Description')),
      description: text(r['PP Interior Description']),
      images: images(r['PP Interior Multi-Image']),
      horizontalImages: images(r['PP Interior Horizontal Multi-Image']),
      images2: images(r['PP Interior Multi-Image 2']),
      horizontalImages2: images(r['PP Interior Horizontal Multi-Image 2']),
      images3: images(r['PP Interior Multi-Image 3']),
    },
  }),
  // Column names are a best guess until a Team CSV is available; adjust if the import comes out empty.
  team: (r) => ({
    name: text(r['Name']),
    slug: text(r['Slug']),
    draft: bool(r['Draft']) || bool(r['Archived']),
    order: num(col(r, 'Order', 'Order number', 'Team order number')),
    position: text(col(r, 'Position', 'Job Title', 'Title', 'Role')),
    photo: text(col(r, 'Photo', 'Image', 'Picture')),
  }),
};

const dir = join('content', collection);
mkdirSync(dir, { recursive: true });
for (const row of rows) {
  const item = mappers[collection](row);
  if (!item.slug) continue;
  writeFileSync(join(dir, `${item.slug}.json`), JSON.stringify(item, null, 2) + '\n');
  console.log(`${dir}/${item.slug}.json`);
}
