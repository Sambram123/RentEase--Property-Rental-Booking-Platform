import express from 'express';
import Property from '../models/Property.js';

const router = express.Router();

const SITE_URL = 'https://rentease.vercel.app';

const staticUrls = [
  { loc: '/', changefreq: 'daily',  priority: '1.0' },
  { loc: '/properties',             changefreq: 'hourly', priority: '0.9' },
  // city pages
  ...['Bangalore','Mumbai','Delhi','Hyderabad','Chennai','Pune','Kolkata','Ahmedabad'].map(city => ({
    loc: `/properties?city=${encodeURIComponent(city)}`,
    changefreq: 'daily', priority: '0.8',
  })),
  // type pages
  ...['apartment','house','villa','studio','pg','commercial'].map(type => ({
    loc: `/properties?type=${type}`,
    changefreq: 'daily', priority: '0.7',
  })),
  { loc: '/login',    changefreq: 'monthly', priority: '0.4' },
  { loc: '/register', changefreq: 'monthly', priority: '0.4' },
];

/**
 * GET /api/seo/sitemap.xml
 * Dynamic sitemap including all active property pages.
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    // Fetch all available property IDs + slugs
    const properties = await Property.find(
      { availability: true },
      { _id: 1, title: 1, city: 1, updatedAt: 1 }
    ).lean().limit(5000);

    const now = new Date().toISOString().split('T')[0];

    const urlEntries = [
      ...staticUrls.map(({ loc, changefreq, priority }) => `
  <url>
    <loc>${SITE_URL}${loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
    <lastmod>${now}</lastmod>
  </url>`),
      ...properties.map((p) => {
        const slug = slugify(p.title, p._id);
        const lastmod = p.updatedAt
          ? new Date(p.updatedAt).toISOString().split('T')[0]
          : now;
        return `
  <url>
    <loc>${SITE_URL}/properties/${p._id}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
    <lastmod>${lastmod}</lastmod>
  </url>`;
      }),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlEntries.join('')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600'); // 1h cache
    res.send(xml);
  } catch (err) {
    console.error('Sitemap generation error:', err);
    res.status(500).send('Sitemap generation failed');
  }
});

/**
 * GET /api/seo/meta/:propertyId
 * Returns Open Graph / Twitter card metadata for a property.
 * Used for server-side preview generation.
 */
router.get('/meta/:propertyId', async (req, res) => {
  try {
    const property = await Property.findById(req.params.propertyId)
      .select('title description images city address price type rating reviewsCount availability')
      .lean();

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const city  = property.city || property.address?.city || '';
    const image = Array.isArray(property.images) && property.images[0]
      ? property.images[0]
      : `${SITE_URL}/icons/icon-512x512.svg`;

    const description = property.description
      ? property.description.slice(0, 160)
      : `${property.type ? capitalize(property.type) : 'Property'} for rent in ${city}. ₹${property.price?.toLocaleString('en-IN')}/month.`;

    res.json({
      success: true,
      meta: {
        title: `${property.title} | RentEase`,
        description,
        image,
        url: `${SITE_URL}/properties/${property._id}`,
        type: 'website',
        price: property.price,
        city,
        availability: property.availability,
        rating: property.rating,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────
const slugify = (title = '', id) => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60);
  return `${slug}-${id}`;
};

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export default router;
