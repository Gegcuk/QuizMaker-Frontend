import { getAlternatePublicRoutePath, publicRouteManifest } from '../src/routes/publicRouteManifest.mjs';

const securityHeaders = [
  'add_header X-Frame-Options "SAMEORIGIN" always;',
  'add_header X-Content-Type-Options "nosniff" always;',
  'add_header X-XSS-Protection "1; mode=block" always;',
  'add_header Referrer-Policy "strict-origin-when-cross-origin" always;',
  'add_header Strict-Transport-Security "max-age=2592000" always;',
];

const noindexHeaders = [
  ...securityHeaders,
  'add_header X-Robots-Tag "noindex, nofollow" always;',
];

const indent = (lines) => lines.map((line) => `    ${line}`).join('\n');

const exactLocation = (path, lines) => `location = ${path} {\n${indent(lines)}\n}`;

const routeOutputPath = (routePath) => {
  if (routePath === '/') {
    return '/index.html';
  }
  return `${routePath.replace(/\/$/, '')}/index.html`;
};

const compileDynamicPath = (route, includeTrailingSlash) => {
  let captureIndex = 0;
  const outputPathParts = [];
  const expression = route.path
    .replace(/\/$/, '')
    .replace(/:([A-Za-z0-9_]+)/g, (_match, parameterName) => {
      captureIndex += 1;
      const pattern = route.parameterPatterns?.[parameterName] ?? '[^/]+';
      outputPathParts.push({ parameterName, captureIndex });
      return `(${pattern})`;
    });

  const outputPath = route.path
    .replace(/\/$/, '')
    .replace(/:([A-Za-z0-9_]+)/g, (_match, parameterName) => {
      const parameter = outputPathParts.find((entry) => entry.parameterName === parameterName);
      return `$${parameter.captureIndex}`;
    });

  return {
    expression: `^${expression}${includeTrailingSlash ? '/' : ''}$`,
    outputPath: `${outputPath}/index.html`,
    canonicalPath: `${outputPath}/`,
  };
};

const renderExactRoute = (route) => {
  const locations = [];
  const alternatePath = getAlternatePublicRoutePath(route);

  if (route.delivery === 'prerender') {
    locations.push(exactLocation(route.path, [
      'expires -1;',
      `try_files ${routeOutputPath(route.path)} =404;`,
    ]));

    if (alternatePath) {
      locations.push(exactLocation(alternatePath, [`return 301 https://$host${route.path};`]));
    }
    return locations;
  }

  if (route.delivery === 'callback') {
    const callbackLines = [
      'access_log off;',
      ...securityHeaders.slice(0, 3),
      'add_header Referrer-Policy "no-referrer" always;',
      securityHeaders[4],
      'add_header X-Robots-Tag "noindex, nofollow" always;',
      'add_header Cache-Control "no-store" always;',
      'try_files /index.html =404;',
    ];
    locations.push(exactLocation(route.path, callbackLines));
    if (alternatePath) {
      locations.push(exactLocation(alternatePath, callbackLines));
    }
    return locations;
  }

  if (route.delivery === 'spa') {
    const spaLines = [...noindexHeaders, 'try_files /index.html =404;'];
    locations.push(exactLocation(route.path, spaLines));
    if (alternatePath) {
      locations.push(exactLocation(alternatePath, spaLines));
    }
  }

  return locations;
};

const renderDynamicRoute = (route) => {
  const canonical = compileDynamicPath(route, true);
  const alternate = compileDynamicPath(route, false);
  return [
    `location ~ ${alternate.expression} {\n${indent([
      `return 301 https://$host${alternate.canonicalPath};`,
    ])}\n}`,
    `location ~ ${canonical.expression} {\n${indent([
      'error_page 404 =404 /__not-found-shell;',
      `try_files ${canonical.outputPath} =404;`,
    ])}\n}`,
  ];
};

export const renderPublicRouteNginx = () => {
  const exactRoutes = publicRouteManifest.filter((route) =>
    route.delivery === 'prerender' || route.delivery === 'spa' || route.delivery === 'callback');
  const dynamicRoutes = publicRouteManifest.filter((route) => route.delivery === 'dynamic-prerender');
  const locations = [
    ...exactRoutes.flatMap(renderExactRoute),
    ...dynamicRoutes.flatMap(renderDynamicRoute),
  ];

  return `# Generated from src/routes/publicRouteManifest.mjs. Do not edit by hand.\n\n${locations.join('\n\n')}\n`;
};
