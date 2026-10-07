// Public read DTOs matching the live Articles rendition contract. All network
// responses, including bytes for these external-looking URLs, stay local in tests.
export const SITE_URL = 'https://www.quizzence.com';
export const FALLBACK_URL = 'https://cdn.quizzence.com/library/aec804f3-e4b3-430a-ba3e-109e819b3c56.png';
export const HERO_URL = 'https://cdn.quizzence.com/fixtures/published-cover.jpg';
export const SOCIAL_URL = 'https://cdn.quizzence.com/fixtures/authored-social.png';
export const UNKNOWN_SIZE_URL = 'https://cdn.quizzence.com/fixtures/legacy-cover.webp';
export const FAILED_HERO_URL = 'https://cdn.quizzence.com/fixtures/deleted-cover.png';

const hero = {
  assetId: '11111111-1111-4111-8111-111111111111',
  alt: 'Students practise recalling a lesson',
  caption: 'The article cover caption',
  rendition: { url: HERO_URL, width: 1200, height: 630, mimeType: 'image/jpeg' },
};

const article = (slug, title, patch = {}) => ({
  id: `fixture-${slug}`,
  revision: 1,
  slug,
  title,
  description: `Local article fixture: ${title}.`,
  excerpt: 'A readable article with a local fixture cover.',
  author: { name: 'Fixture Author', title: 'Educator' },
  tags: ['Learning'],
  status: 'PUBLISHED',
  publishedAt: '2026-09-01T10:00:00Z',
  updatedAt: '2026-09-02T10:00:00Z',
  readingTime: '3 min read',
  canonicalUrl: `${SITE_URL}/blog/${slug}/`,
  sections: [{
    sectionId: 'fixture-body',
    title: 'Fixture article body',
    content: '<p>Local fixture article body remains readable.</p>',
  }],
  ...patch,
});

export const articles = [
  article('hero-rendition', 'Article with a documented hero', {
    heroImage: hero,
    primaryCta: { label: 'Next fixture article', href: '/blog/explicit-social/' },
  }),
  article('explicit-social', 'Article with a separate social image', {
    heroImage: hero,
    ogImage: SOCIAL_URL,
    primaryCta: { label: 'Next fixture article', href: '/blog/unknown-dimensions/' },
  }),
  article('unknown-dimensions', 'Article with unknown image dimensions', {
    heroImage: { ...hero, rendition: { url: UNKNOWN_SIZE_URL, width: null, height: null, mimeType: 'image/webp' } },
    primaryCta: { label: 'Next fixture article', href: '/blog/missing-hero/' },
  }),
  article('missing-hero', 'Article without a hero'),
  article('missing-rendition', 'Article awaiting its rendition', {
    heroImage: { assetId: hero.assetId, alt: 'Unresolved article cover', caption: 'Stale cover caption' },
  }),
  article('deleted-rendition', 'Article with a deleted image', {
    heroImage: { assetId: hero.assetId, alt: 'Deleted article cover', caption: 'Stale cover caption', rendition: null },
  }),
  article('failed-hero', 'Article with an unavailable cover', {
    heroImage: { ...hero, rendition: { url: FAILED_HERO_URL, width: 800, height: 600, mimeType: 'image/png' } },
  }),
  article('failed-fallback', 'Article with an unavailable fallback'),
];

export const sitemapEntries = articles.map(({ canonicalUrl, updatedAt }) => ({
  url: canonicalUrl,
  updatedAt,
  changefreq: 'weekly',
  priority: 0.8,
}));

// SVG fixtures let real Chromium decoding preserve the declared aspect ratios,
// without downloading or committing production imagery.
export const imageFixtures = new Map([
  [HERO_URL, { width: 1200, height: 630 }],
  [UNKNOWN_SIZE_URL, { width: 960, height: 540 }],
  [SOCIAL_URL, { width: 600, height: 600 }],
  [FALLBACK_URL, { width: 1792, height: 592 }],
]);
