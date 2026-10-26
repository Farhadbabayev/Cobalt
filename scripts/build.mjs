// Builds the static site into dist/:
//   - copies public/ as-is (css, js, images, videos, admin panel)
//   - renders src/pages/*.njk with the content from content/projects and content/team
//   - renders one page per project at /projects/<slug>
//   - writes sitemap.xml and robots.txt
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import nunjucks from 'nunjucks';

const OUT = 'dist';
const site = {
  url: (process.env.SITE_URL || 'https://cobalt.az').replace(/\/$/, ''),
  name: 'Cobalt',
  description:
    'Cobalt is an architecture and design bureau based in Baku. Master plans, urbanism, residential architecture and interior design.',
  image: '/images/homepage.png',
};

function readCollection(name) {
  const dir = join('content', name);
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')))
    .filter((item) => !item.draft)
    .sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity) || a.name.localeCompare(b.name));
}

const projects = readCollection('projects').map((p) => ({ ...p, url: `/projects/${p.slug}` }));
const team = readCollection('team');

const env = nunjucks.configure(['src/pages', 'src/partials'], { autoescape: true, throwOnUndefined: false });
env.addFilter('nl2br', (text) => {
  const escaped = nunjucks.lib.escape(String(text ?? ''));
  return new nunjucks.runtime.SafeString(escaped.replace(/\r?\n/g, '<br>'));
});
env.addFilter('absoluteUrl', (url) => (!url ? '' : /^https?:\/\//.test(url) ? url : site.url + url));

const globals = { site, year: new Date().getFullYear(), projects, team };
const featuredProjects = projects.filter((p) => p.featured && p.featuredImage);
const sliderProjects = projects.filter((p) => p.inSlider && (p.sliderImage || p.listImage));

function render(template, outFile, page, data = {}) {
  const html = env.render(template, { ...globals, ...data, page: { image: site.image, ...page } });
  const file = join(OUT, outFile);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
}

rmSync(OUT, { recursive: true, force: true });
cpSync('public', OUT, { recursive: true });

render('index.njk', 'index.html', { title: 'Cobalt | Architecture and Design', description: site.description, path: '/' }, {
  featuredProjects,
  sliderProjects,
});
render('projects.njk', 'projects.html', {
  title: 'Projects | Cobalt',
  description: 'Selected architecture, city planning and interior design projects by Cobalt.',
  path: '/projects',
});
render('about.njk', 'about.html', {
  title: 'About | Cobalt',
  description: 'About Cobalt Architecture and Design: our approach and our team.',
  path: '/about',
});
render('get-in-touch.njk', 'get-in-touch.html', {
  title: 'Get in Touch | Cobalt',
  description: 'Contact Cobalt Architecture and Design, Port Baku Towers, Baku, Azerbaijan.',
  path: '/get-in-touch',
});
render('404.njk', '404.html', { title: 'Page not found | Cobalt', description: site.description, path: '/404' });

for (const project of projects) {
  const summary = (project.about || site.description).replace(/\s+/g, ' ').trim();
  render(`project.njk`, `projects/${project.slug}.html`, {
    title: `${project.name} | Cobalt`,
    description: summary.length > 160 ? summary.slice(0, 157) + '...' : summary,
    image: project.headerImage || project.featureImage || site.image,
    path: project.url,
  }, { project });
}

const paths = ['/', '/projects', '/about', '/get-in-touch', ...projects.map((p) => p.url)];
writeFileSync(
  join(OUT, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    paths.map((p) => `  <url><loc>${site.url}${p}</loc></url>`).join('\n') +
    `\n</urlset>\n`,
);
writeFileSync(join(OUT, 'robots.txt'), `User-agent: *\nDisallow: /admin/\nSitemap: ${site.url}/sitemap.xml\n`);

console.log(`Built ${paths.length} pages (${projects.length} projects, ${team.length} team members) into ${OUT}/`);
