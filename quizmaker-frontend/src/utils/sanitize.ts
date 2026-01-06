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

  // Allow relative URLs (starting with /) and absolute URLs (http/https)
  if (url.startsWith('/')) {
    return url;
  }

  // Ensure absolute URL starts with http or https
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return `https://${url}`;
  }

  return url;
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
  let normalized = text.replace(/\n{3,}/g, '\n\n');
  
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
 * Sanitizes HTML content by removing potentially dangerous tags and attributes
 * @param html - The HTML string to sanitize
 * @returns Sanitized HTML string
 */
export const sanitizeHtml = (html: string): string => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // First, convert newlines to HTML formatting
  // Then convert markdown links to HTML links
  // Order matters: newlines first, then links
  let sanitized = convertNewlinesToHtml(html);
  sanitized = convertMarkdownLinks(sanitized);

  // Remove script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
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
