import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { Seo } from './Seo';
import type { SeoConfig } from './useSeo';

const withImage: SeoConfig = {
  title: 'Article with a hero',
  canonicalPath: '/blog/with-hero/',
  ogImage: 'https://images.example.test/hero.webp',
  ogImageWidth: 1600,
  ogImageHeight: 900,
  ogImageType: 'image/webp',
  ogImageAlt: 'A student testing their knowledge',
  structuredData: [{ '@context': 'https://schema.org', '@type': 'Article', image: 'https://images.example.test/hero.webp' }],
};

const meta = (key: string, property = false) =>
  document.head.querySelector(`meta[${property ? 'property' : 'name'}="${key}"]`)?.getAttribute('content');

afterEach(() => {
  cleanup();
  document.head.querySelectorAll('meta, link[rel="canonical"], script[data-seo]').forEach((element) => element.remove());
});

describe('SEO image metadata lifecycle', () => {
  it('publishes dimensions and type for Open Graph and image alt for both social formats', () => {
    render(<Seo {...withImage} />);
    expect(meta('og:image', true)).toBe('https://images.example.test/hero.webp');
    expect(meta('og:image:width', true)).toBe('1600');
    expect(meta('og:image:height', true)).toBe('900');
    expect(meta('og:image:type', true)).toBe('image/webp');
    expect(meta('og:image:alt', true)).toBe('A student testing their knowledge');
    expect(meta('twitter:image')).toBe('https://images.example.test/hero.webp');
    expect(meta('twitter:image:alt')).toBe('A student testing their knowledge');
    expect(meta('twitter:card')).toBe('summary_large_image');
  });

  it('removes old dimensions, type, alt and secure URL when the next image has no such metadata', () => {
    const { rerender } = render(<Seo {...withImage} />);
    const staleSecureUrl = document.createElement('meta');
    staleSecureUrl.setAttribute('property', 'og:image:secure_url');
    staleSecureUrl.setAttribute('content', 'https://images.example.test/stale.png');
    document.head.appendChild(staleSecureUrl);
    const duplicateImage = document.createElement('meta');
    duplicateImage.setAttribute('property', 'og:image');
    duplicateImage.setAttribute('content', 'https://images.example.test/stale.png');
    document.head.appendChild(duplicateImage);

    rerender(<Seo title="A different article" ogImage="https://images.example.test/social.png" />);

    expect(document.head.querySelectorAll('meta[property="og:image"]')).toHaveLength(1);
    expect(meta('og:image', true)).toBe('https://images.example.test/social.png');
    expect(meta('twitter:image')).toBe('https://images.example.test/social.png');
    for (const key of ['og:image:width', 'og:image:height', 'og:image:type', 'og:image:alt', 'og:image:secure_url']) {
      expect(meta(key, true)).toBeUndefined();
    }
    expect(meta('twitter:image:alt')).toBeUndefined();
  });

  it('removes all article image metadata and JSON-LD when navigation reaches a page without an image', () => {
    const { rerender } = render(<Seo {...withImage} />);
    rerender(<Seo title="About Quizzence" canonicalPath="/about/" />);

    expect(document.head.querySelectorAll('meta[property="og:image"], meta[property^="og:image:"]')).toHaveLength(0);
    expect(document.head.querySelectorAll('meta[name="twitter:image"], meta[name^="twitter:image:"]')).toHaveLength(0);
    expect(meta('twitter:card')).toBe('summary');
    expect(document.head.querySelectorAll('script[data-seo="structured-data"]')).toHaveLength(0);
    expect(document.head.querySelector('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.quizzence.com/about/');
    expect(meta('og:url', true)).toBe('https://www.quizzence.com/about/');
  });

  it('removes image metadata when the page unmounts', () => {
    const { unmount } = render(<Seo {...withImage} />);
    unmount();
    expect(document.head.querySelectorAll('meta[property^="og:image"], meta[name^="twitter:image"], meta[name="twitter:card"]')).toHaveLength(0);
    expect(document.head.querySelectorAll('script[data-seo="structured-data"]')).toHaveLength(0);
  });

  it('does not publish invalid image dimensions', () => {
    render(<Seo {...withImage} ogImageWidth={-1} ogImageHeight={Number.NaN} />);
    expect(meta('og:image:width', true)).toBeUndefined();
    expect(meta('og:image:height', true)).toBeUndefined();
  });
});
