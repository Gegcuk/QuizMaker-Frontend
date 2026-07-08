import { describe, expect, it, vi } from 'vitest';
import {
  convertMarkdownFormatting,
  convertMarkdownLinks,
  convertNewlinesToHtml,
  sanitizeForDisplay,
  sanitizeHtml,
  sanitizeText,
  sanitizeUrl,
} from './sanitize';

const parseHtml = (html: string) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
};

describe('sanitizeUrl', () => {
  it.each([
    ['https://example.com/path', 'https://example.com/path'],
    ['http://example.com', 'http://example.com/'],
    ['example.com/docs', 'https://example.com/docs'],
    ['mailto:team@example.com', 'mailto:team@example.com'],
    ['tel:+441234567890', 'tel:+441234567890'],
    ['/docs/getting-started', '/docs/getting-started'],
    ['./local', './local'],
    ['../parent', '../parent'],
    ['#section', '#section'],
  ])('allows and normalizes %s', (input, expected) => {
    expect(sanitizeUrl(input)).toBe(expected);
  });

  it.each([
    'javascript:alert(1)',
    ' java\nscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'ftp://example.com/file',
    '//untrusted.example.com/path',
    'not a valid host',
  ])('rejects unsafe or invalid URL %s', (input) => {
    expect(sanitizeUrl(input)).toBe('');
  });
});

describe('format conversion', () => {
  it('preserves paragraph and line-break behavior', () => {
    expect(convertNewlinesToHtml('First line\nSecond line\n\nNext paragraph')).toBe(
      '<p>First line<br>Second line</p><p>Next paragraph</p>',
    );
  });

  it('converts supported Markdown formatting without changing tag attributes', () => {
    expect(convertMarkdownFormatting('**bold** and *italic*')).toBe(
      '<strong>bold</strong> and <em>italic</em>',
    );
    expect(convertMarkdownLinks('[Documentation](https://example.com/docs)')).toContain(
      'href="https://example.com/docs"',
    );
  });
});

describe('sanitizeHtml', () => {
  it('preserves the explicit article and question formatting allowlist', () => {
    const result = sanitizeHtml(`
      <article class="article-content">
        <h2 id="overview">Overview</h2>
        <p><strong>Important</strong> and <em>emphasized</em></p>
        <blockquote>Quoted content</blockquote>
        <table><thead><tr><th scope="col">Term</th></tr></thead><tbody><tr><td>Value</td></tr></tbody></table>
        <img src="https://cdn.example.com/image.png" alt="Diagram" width="800" height="600" loading="lazy">
        <a href="https://example.com/docs" target="_blank" rel="author">Documentation</a>
      </article>
    `);
    const fragment = parseHtml(result);

    expect(fragment.querySelector('article.article-content')).not.toBeNull();
    expect(fragment.querySelector('h2#overview')?.textContent).toBe('Overview');
    expect(fragment.querySelector('strong')?.textContent).toBe('Important');
    expect(fragment.querySelector('table')).not.toBeNull();
    expect(fragment.querySelector('img')).toMatchObject({
      alt: 'Diagram',
      width: 800,
      height: 600,
    });
    expect(fragment.querySelector('a')?.getAttribute('href')).toBe('https://example.com/docs');
    expect(fragment.querySelector('a')?.getAttribute('target')).toBe('_blank');
    expect(fragment.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('preserves newline and Markdown conversions before final sanitization', () => {
    const result = sanitizeHtml(
      'First line\nSecond line\n\n**Bold** and [documentation](https://example.com/docs)',
    );
    const fragment = parseHtml(result);

    expect(fragment.querySelectorAll('p')).toHaveLength(2);
    expect(fragment.querySelector('br')).not.toBeNull();
    expect(fragment.querySelector('strong')?.textContent).toBe('Bold');
    expect(fragment.querySelector('a')?.getAttribute('href')).toBe('https://example.com/docs');
    expect(fragment.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('removes executable elements, event handlers, styles, forms, and active namespaces', () => {
    const result = sanitizeHtml(`
      <script>alert('script')</script>
      <style>body { display: none }</style>
      <iframe src="https://evil.example"></iframe>
      <object data="https://evil.example"></object>
      <form action="https://evil.example"><input name="secret"></form>
      <svg onload="alert(1)"><a xlink:href="javascript:alert(1)">svg</a></svg>
      <math><mtext>math</mtext></math>
      <p onclick="alert(1)" style="position:fixed">Safe paragraph</p>
      <img src="https://cdn.example.com/image.png" onerror="alert(1)" srcset="evil 2x">
    `);
    const fragment = parseHtml(result);

    expect(fragment.querySelector('script, style, iframe, object, form, input, svg, math')).toBeNull();
    expect(fragment.querySelector('[onclick], [onload], [onerror], [style], [srcset]')).toBeNull();
    expect(fragment.querySelector('p')?.textContent).toBe('Safe paragraph');
    expect(fragment.querySelector('img')?.getAttribute('src')).toBe('https://cdn.example.com/image.png');
  });

  it.each([
    '<a href="javascript:alert(1)">link</a>',
    '<a href="jav&#x61;script:alert(1)">link</a>',
    '<a href="java\nscript:alert(1)">link</a>',
    '<img src="data:image/svg+xml,<svg onload=alert(1)>">',
    '<img src="vbscript:msgbox(1)">',
  ])('removes unsafe URI attributes from %s', (payload) => {
    const fragment = parseHtml(sanitizeHtml(payload));
    const element = fragment.querySelector('a, img');

    expect(element).not.toBeNull();
    expect(element?.hasAttribute('href')).toBe(false);
    expect(element?.hasAttribute('src')).toBe(false);
  });

  it('escapes all markup when no browser DOM is available', () => {
    const originalWindow = globalThis.window;
    vi.stubGlobal('window', undefined);

    try {
      expect(sanitizeHtml('<strong>Server text</strong><script>attack()</script>')).toBe(
        '&lt;strong&gt;Server text&lt;/strong&gt;&lt;script&gt;attack()&lt;/script&gt;',
      );
    } finally {
      vi.stubGlobal('window', originalWindow);
    }
  });
});

describe('display modes', () => {
  it('escapes plain text and only permits HTML when explicitly enabled', () => {
    expect(sanitizeText('<strong>Text</strong>')).toBe(
      '&lt;strong&gt;Text&lt;&#x2F;strong&gt;',
    );
    expect(sanitizeForDisplay('<strong>Text</strong>')).toBe(
      '&lt;strong&gt;Text&lt;&#x2F;strong&gt;',
    );
    expect(sanitizeForDisplay('<strong>Text</strong>', true)).toContain('<strong>Text</strong>');
  });
});
