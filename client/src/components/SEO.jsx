import { Helmet } from 'react-helmet-async';

const SITE_NAME    = 'RentEase';
const SITE_URL     = 'https://rentease.vercel.app'; // canonical base URL
const DEFAULT_IMG  = `${SITE_URL}/icons/icon-512x512.svg`;
const DEFAULT_DESC =
  'Find and book your perfect rental property with RentEase. Browse verified apartments, book instantly, and pay advance rent online.';

/**
 * SEO — drop this into any page to set dynamic meta tags.
 *
 * Props:
 *   title         – page title (will be suffixed with site name)
 *   description   – meta description (max 160 chars recommended)
 *   keywords      – comma-separated or array of keywords
 *   canonical     – canonical path (e.g. "/properties/123")
 *   ogImage       – absolute URL for OG / Twitter image
 *   noIndex       – set true for auth/dashboard pages
 *   structuredData – JSON-LD object or array (will be serialised)
 *   type          – OG type ("website" | "article" | "product")  default "website"
 */
const SEO = ({
  title,
  description = DEFAULT_DESC,
  keywords = '',
  canonical = '',
  ogImage = DEFAULT_IMG,
  noIndex = false,
  structuredData = null,
  type = 'website',
}) => {
  const pageTitle    = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Find Your Perfect Rental`;
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : SITE_URL;
  const keywordsStr  = Array.isArray(keywords) ? keywords.join(', ') : keywords;
  const desc         = description.slice(0, 160);

  // Ensure OG image is absolute
  const absOgImage = ogImage?.startsWith('http') ? ogImage : `${SITE_URL}${ogImage}`;

  return (
    <Helmet>
      {/* ── Primary ────────────────────────────────────────────────────── */}
      <title>{pageTitle}</title>
      <meta name="description" content={desc} />
      {keywordsStr && <meta name="keywords" content={keywordsStr} />}
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* ── Open Graph ─────────────────────────────────────────────────── */}
      <meta property="og:type"        content={type} />
      <meta property="og:title"       content={pageTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url"         content={canonicalUrl} />
      <meta property="og:image"       content={absOgImage} />
      <meta property="og:site_name"   content={SITE_NAME} />
      <meta property="og:locale"      content="en_IN" />

      {/* ── Twitter Card ───────────────────────────────────────────────── */}
      <meta name="twitter:card"        content="summary_large_image" />
      <meta name="twitter:title"       content={pageTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image"       content={absOgImage} />
      <meta name="twitter:site"        content="@RentEaseIndia" />

      {/* ── JSON-LD Structured Data ────────────────────────────────────── */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(structuredData) ? structuredData : structuredData)}
        </script>
      )}
    </Helmet>
  );
};

/* ── Pre-built JSON-LD schemas ──────────────────────────────────────────────── */

/** Organization schema for homepage */
export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icons/icon-512x512.svg`,
  description: DEFAULT_DESC,
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+91-98765-43210',
    contactType: 'customer service',
    availableLanguage: ['English', 'Hindi'],
  },
  sameAs: [],
};

/** WebSite schema with search action */
export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/properties?city={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

/**
 * Build a RealEstateListing / Product schema from a property object.
 * @param {Object} property
 * @returns {Object} JSON-LD schema
 */
export const buildPropertySchema = (property) => {
  if (!property) return null;
  const city  = property.city || property.address?.city || '';
  const state = property.address?.state || '';
  const image = Array.isArray(property.images) && property.images[0]
    ? property.images[0]
    : `${SITE_URL}/icons/icon-512x512.svg`;

  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.title,
    description: property.description || `${property.type} available for rent in ${city}`,
    url: `${SITE_URL}/properties/${property._id}`,
    image: Array.isArray(property.images) ? property.images : [image],
    address: {
      '@type': 'PostalAddress',
      addressLocality: city,
      addressRegion: state,
      addressCountry: 'IN',
    },
    offers: {
      '@type': 'Offer',
      price: property.price ?? property.pricePerMonth ?? 0,
      priceCurrency: 'INR',
      availability: property.availability
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: property.price ?? property.pricePerMonth ?? 0,
        priceCurrency: 'INR',
        referenceQuantity: {
          '@type': 'QuantitativeValue',
          value: 1,
          unitCode: 'MON',
        },
      },
    },
    ...(property.rating > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: Number(property.rating).toFixed(1),
        reviewCount: property.reviewsCount || 1,
        bestRating: 5,
        worstRating: 1,
      },
    }),
    numberOfRooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
    floorSize: property.area ? {
      '@type': 'QuantitativeValue',
      value: property.area,
      unitCode: 'FTK',
    } : undefined,
  };
};

export default SEO;
