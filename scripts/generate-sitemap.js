import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base URL for production
const BASE_URL = 'https://newerahockeytraining.com';

// Define routes with SEO metadata
const routes = [
  {
    path: '/',
    priority: '1.0',
    changefreq: 'weekly',
  },
  {
    path: '/coaches',
    priority: '0.8',
    changefreq: 'monthly',
  },
  // Temporarily excluded - under development
  // {
  //   path: '/schedule',
  //   priority: '0.9',
  //   changefreq: 'weekly',
  // },
  {
    path: '/register',
    priority: '0.9',
    changefreq: 'weekly',
  },
  {
    path: '/testimonials',
    priority: '0.7',
    changefreq: 'monthly',
  },
  {
    path: '/testimonials/submit-review',
    priority: '0.5',
    changefreq: 'monthly',
  },
  {
    path: '/gallery',
    priority: '0.6',
    changefreq: 'monthly',
  },
  {
    path: '/contact',
    priority: '0.8',
    changefreq: 'monthly',
  },
  {
    path: '/faq',
    priority: '0.7',
    changefreq: 'monthly',
  },
  {
    path: '/waiver',
    priority: '0.4',
    changefreq: 'yearly',
  },
  {
    path: '/terms-and-conditions',
    priority: '0.3',
    changefreq: 'yearly',
  },
  {
    path: '/privacy-policy',
    priority: '0.3',
    changefreq: 'yearly',
  },
];

// Generate sitemap XML
function generateSitemap() {
  const timestamp = new Date().toISOString();

  const urlElements = routes
    .map(
      (route) => `  <url>
    <loc>${BASE_URL}${route.path}</loc>
    <lastmod>${timestamp}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
    )
    .join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;

  return sitemap;
}

// Write sitemap to public directory
try {
  const sitemap = generateSitemap();
  const publicDir = join(__dirname, '..', 'public');
  const sitemapPath = join(publicDir, 'sitemap.xml');

  writeFileSync(sitemapPath, sitemap, 'utf-8');
  console.log('✅ Sitemap generated successfully at public/sitemap.xml');
  console.log(`📄 Generated ${routes.length} URLs`);
} catch (error) {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
}
