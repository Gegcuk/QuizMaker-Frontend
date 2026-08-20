const SAFE_PATH_SEGMENT = /^[A-Za-z][A-Za-z0-9-]{0,31}$/;

export const getSafeRequestTarget = (url: string | undefined): string => {
  if (!url) {
    return '[unknown endpoint]';
  }

  try {
    const parsed = new URL(url, 'https://request.invalid');
    const segments = parsed.pathname
      .split('/')
      .filter(Boolean)
      .map((segment) => {
        const decoded = decodeURIComponent(segment);
        return SAFE_PATH_SEGMENT.test(decoded) ? decoded : ':redacted';
      });

    return segments.length > 0 ? `/${segments.join('/')}` : '/';
  } catch {
    return '[redacted endpoint]';
  }
};
