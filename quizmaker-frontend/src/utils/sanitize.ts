// ---------------------------------------------------------------------------
// Content sanitization utilities to prevent XSS attacks
// ---------------------------------------------------------------------------

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
 * Sanitizes HTML content by removing potentially dangerous tags and attributes
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Remove script tags and their content
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove javascript: protocols
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Remove on* event handlers (both quoted and unquoted)
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\son\w+\s*=\s*[^\s>]*/gi, '');
  
  // Remove potentially dangerous attributes (both quoted and unquoted)
  sanitized = sanitized.replace(/\s(style|onload|onerror|onclick|onmouseover)\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s(style|onload|onerror|onclick|onmouseover)\s*=\s*[^\s>]*/gi, '');
  
  return sanitized;
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

/**
 * Validates and sanitizes a URL to prevent javascript: and data: protocols
 * @param url - The URL to validate
 * @returns Sanitized URL or empty string if invalid
 */
export const sanitizeUrl = (url: string): string => {
  if (!url || typeof url !== 'string') {
    return '';
  }

  // Remove dangerous protocols
  const dangerousProtocols = /^(javascript:|data:|vbscript:)/i;
  if (dangerousProtocols.test(url)) {
    return '';
  }

  // Ensure URL starts with http or https
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }

  return url;
};
