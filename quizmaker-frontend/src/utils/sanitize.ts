// ---------------------------------------------------------------------------
// Content sanitization utilities to prevent XSS attacks
// ---------------------------------------------------------------------------

import createDOMPurify, {
  type Config as DOMPurifyConfig,
  type DOMPurify as DOMPurifyInstance,
} from 'dompurify';

const ALLOWED_HTML_TAGS = [
  'a', 'article', 'b', 'blockquote', 'br', 'code', 'del', 'details', 'div', 'em',
  'figcaption', 'figure', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img',
  'li', 'mark', 'ol', 'p', 'pre', 's', 'section', 'span', 'strong', 'sub', 'summary',
  'sup', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul',
];

const ALLOWED_HTML_ATTRIBUTES = [
  'alt', 'class', 'colspan', 'height', 'href', 'id', 'loading', 'referrerpolicy', 'rel',
  'rowspan', 'scope', 'src', 'target', 'title', 'width',
];

const HTML_SANITIZE_CONFIG: DOMPurifyConfig = {
  ALLOWED_TAGS: ALLOWED_HTML_TAGS,
  ALLOWED_ATTR: ALLOWED_HTML_ATTRIBUTES,
  ALLOWED_NAMESPACES: ['http://www.w3.org/1999/xhtml'],
  ALLOW_ARIA_ATTR: false,
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  FORBID_ATTR: ['formaction', 'srcset', 'style', 'xlink:href'],
  FORBID_TAGS: [
    'button', 'embed', 'form', 'iframe', 'input', 'math', 'meta', 'object', 'script',
    'select', 'style', 'svg', 'template', 'textarea',
  ],
};

const UNSAFE_URI_PROTOCOL = /^(?:data|javascript|vbscript):/i;
const URI_ATTRIBUTES = new Set(['href', 'src']);

const stripControlCharacters = (value: string, stripSpaces = false): string =>
  Array.from(value)
    .filter((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      const lowerBound = stripSpaces ? 0x20 : 0x1f;
      return codePoint > lowerBound && (codePoint < 0x7f || codePoint > 0x9f);
    })
    .join('');

let browserPurifier: DOMPurifyInstance | null = null;

const getBrowserPurifier = (): DOMPurifyInstance | null => {
  if (typeof window === 'undefined' || !window.document) return null;
  if (browserPurifier) return browserPurifier;

  browserPurifier = createDOMPurify(window);
  browserPurifier.addHook('uponSanitizeAttribute', (_node, event) => {
    if (!URI_ATTRIBUTES.has(event.attrName)) return;

    const normalizedValue = stripControlCharacters(event.attrValue.trim(), true);
    if (UNSAFE_URI_PROTOCOL.test(normalizedValue)) {
      event.keepAttr = false;
    }
  });
  browserPurifier.addHook('afterSanitizeAttributes', (node) => {
    if (!(node instanceof window.HTMLAnchorElement)) return;

    const target = node.getAttribute('target');
    if (target && target !== '_blank' && target !== '_self') {
      node.removeAttribute('target');
    }
    if (target === '_blank') {
      node.setAttribute('rel', 'noopener noreferrer');
    }
  });

  return browserPurifier;
};

/**
 * Escapes HTML attribute values to prevent XSS
 * @param value - The attribute value to escape
 * @returns Escaped attribute value safe for use in HTML attributes
 */
export const escapeHtmlAttribute = (value: string): string => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

/**
 * Validates and sanitizes a URL to prevent javascript: and data: protocols
 * @param url - The URL to validate
 * @returns Sanitized URL or empty string if invalid
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const normalizedUrl = stripControlCharacters(url.trim());
  if (!normalizedUrl || UNSAFE_URI_PROTOCOL.test(normalizedUrl)) return '';
  if (normalizedUrl.startsWith('//')) return '';

  if (
    normalizedUrl.startsWith('/') ||
    normalizedUrl.startsWith('./') ||
    normalizedUrl.startsWith('../') ||
    normalizedUrl.startsWith('#')
  ) {
    return normalizedUrl;
  }

  const candidate = /^[a-z][a-z\d+.-]*:/i.test(normalizedUrl)
    ? normalizedUrl
    : `https://${normalizedUrl}`;

  try {
    const parsedUrl = new URL(candidate);
    if (!['http:', 'https:', 'mailto:', 'tel:'].includes(parsedUrl.protocol)) return '';
    return parsedUrl.toString();
  } catch {
    return '';
  }
};

/**
 * Converts newlines to HTML breaks or paragraphs
 * Converts double newlines (paragraph breaks) to paragraph tags, single newlines to <br>
 * @param text - The text that may contain newlines
 * @returns Text with newlines converted to HTML formatting
 */
export const convertNewlinesToHtml = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Check if content already contains HTML block tags (like <p>, <div>, <section>, etc.)
  const hasBlockHtmlTags = /<(p|div|section|article|header|footer|h[1-6]|ul|ol|li|blockquote)[\s>]/i.test(text);
  
  if (hasBlockHtmlTags) {
    // If HTML block tags are already present, preserve structure
    // Only convert newlines that are not inside HTML tags to <br>
    // This is a simple approach - more complex parsing would be needed for perfect handling
    return text.replace(/([^\n>])\n([^\n<])/g, '$1<br>$2');
  }

  // If no HTML block tags, convert newlines to proper paragraph structure
  // First, normalize: replace multiple consecutive newlines with double newline
  const normalized = text.replace(/\n{3,}/g, '\n\n');
  
  // Split by double newlines (paragraph breaks)
  const paragraphs = normalized.split(/\n\s*\n/);
  
  return paragraphs
    .map((para) => {
      // Trim whitespace
      const trimmed = para.trim();
      if (!trimmed) return '';
      
      // Convert single newlines within paragraph to <br>
      const withBreaks = trimmed.replace(/\n/g, '<br>');
      
      // Wrap in paragraph tag
      return `<p>${withBreaks}</p>`;
    })
    .filter((p) => p.length > 0) // Remove empty paragraphs
    .join('');
};

/**
 * Converts markdown-style links [text](url) to HTML anchor tags
 * @param text - The text that may contain markdown links
 * @returns Text with markdown links converted to HTML anchor tags
 */
export const convertMarkdownLinks = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Pattern: [text](url) - matches markdown link syntax
  // Group 1: link text (can contain special characters like ‡)
  // Group 2: URL
  const markdownLinkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  
  return text.replace(markdownLinkPattern, (match, linkText, url) => {
    // Sanitize the URL to prevent XSS
    const sanitizedUrl = sanitizeUrl(url);
    if (!sanitizedUrl) {
      // If URL is invalid, return just the text without the link
      return linkText;
    }
    
    // Escape the link text to prevent XSS
    const escapedText = escapeHtmlAttribute(linkText);
    
    // Return HTML anchor tag with proper attributes matching References style
    return `<a href="${sanitizedUrl}" target="_blank" rel="noopener noreferrer" class="text-theme-interactive-primary hover:text-theme-interactive-primary-hover">${escapedText}</a>`;
  });
};

/**
 * Converts markdown-style bold and italic formatting to HTML tags
 * Supports: **bold**, __bold__, *italic*, _italic_, and nested ***bold italic***
 * @param text - The text that may contain markdown formatting
 * @returns Text with markdown formatting converted to HTML tags
 */
export const convertMarkdownFormatting = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  // Split text into parts that are inside HTML tags and parts that are not
  // This prevents converting markdown inside HTML attributes
  const parts: Array<{ isHtml: boolean; content: string }> = [];
  let lastIndex = 0;
  let inTag = false;
  
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '<' && !inTag) {
      // Start of HTML tag
      if (i > lastIndex) {
        parts.push({ isHtml: false, content: text.substring(lastIndex, i) });
      }
      inTag = true;
      lastIndex = i;
    } else if (text[i] === '>' && inTag) {
      // End of HTML tag
      parts.push({ isHtml: true, content: text.substring(lastIndex, i + 1) });
      inTag = false;
      lastIndex = i + 1;
    }
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    parts.push({ isHtml: false, content: text.substring(lastIndex) });
  }

  // Process only non-HTML parts
  const processedParts = parts.map(part => {
    if (part.isHtml) {
      return part.content;
    }
    
    let result = part.content;
    
    // Process in order: triple (bold+italic) -> double (bold) -> single (italic)
    // This ensures nested formatting works correctly
    
    // First, handle triple asterisks/underscores (bold + italic)
    // Pattern: ***text*** or ___text___
    result = result.replace(/\*\*\*([^*]+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    result = result.replace(/___([^_]+?)___/g, '<strong><em>$1</em></strong>');

    // Then handle bold: **text** or __text__
    // Use non-greedy matching to handle multiple bold sections
    result = result.replace(/\*\*([^*]+?)\*\*/g, '<strong>$1</strong>');
    result = result.replace(/__([^_]+?)__/g, '<strong>$1</strong>');

    // Finally handle italic: *text* or _text_
    // Match single asterisk/underscore, ensuring it's not part of bold markers
    // Pattern: *text* where * is not adjacent to another *
    result = result.replace(/([^*]|^)\*([^*\n]+?)\*([^*]|$)/g, '$1<em>$2</em>$3');
    result = result.replace(/([^_]|^)_([^_\n]+?)_([^_]|$)/g, '$1<em>$2</em>$3');

    return result;
  });

  return processedParts.join('');
};

/**
 * Sanitizes HTML content with a parser-based allowlist.
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const purifier = getBrowserPurifier();
  if (!purifier) {
    // Server-side callers do not have a DOM. Escape everything rather than
    // attempting incomplete HTML parsing; browser prerendering uses DOMPurify.
    return escapeHtmlAttribute(html);
  }

  let sanitized = purifier.sanitize(html, HTML_SANITIZE_CONFIG);
  sanitized = convertNewlinesToHtml(sanitized);
  sanitized = convertMarkdownLinks(sanitized);
  sanitized = convertMarkdownFormatting(sanitized);

  return purifier.sanitize(sanitized, HTML_SANITIZE_CONFIG);
};

/**
 * Sanitizes plain text by escaping HTML entities
 * @param text - The text to sanitize
 * @returns Sanitized text with HTML entities escaped
 */
export const sanitizeText = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Sanitizes user input for display in React components
 * @param input - The input to sanitize
 * @param allowHtml - Whether to allow HTML tags (default: false)
 * @returns Sanitized input safe for display
 */
export const sanitizeForDisplay = (input: string, allowHtml: boolean = false): string => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  if (allowHtml) {
    return sanitizeHtml(input);
  }
  
  return sanitizeText(input);
};
