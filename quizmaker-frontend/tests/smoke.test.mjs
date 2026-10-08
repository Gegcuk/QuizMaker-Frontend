import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { test } from 'node:test';
import { mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { launchBrowser } from '../scripts/browser/launch-browser.mjs';
import { createTestContext } from './fixtures/browser-context.mjs';

const HOST = '127.0.0.1';
const PORT = 4179;
const BASE_URL = process.env.RELEASE_BASE_URL || `http://${HOST}:${PORT}`;
const PALETTES = ['light', 'dark', 'blue', 'purple', 'green'];

const createDevServer = () =>
  spawn(
    process.execPath,
    ['node_modules/vite/bin/vite.js', '--host', HOST, '--port', String(PORT), '--strictPort'],
    {
      cwd: process.cwd(),
      env: { ...process.env, BROWSER: 'none' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );

const stopDevServer = async (server) => {
  if (!server) return;
  if (server.exitCode !== null || server.signalCode !== null) {
    return;
  }

  server.kill('SIGKILL');
  await Promise.race([once(server, 'exit'), delay(2_000)]);
};

const waitForServer = async (url, timeoutMs = 30_000) => {
  const startedAt = Date.now();
  let lastError;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
      lastError = new Error(`Server responded with ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    await delay(500);
  }

  throw lastError ?? new Error(`Server did not start at ${url}`);
};

const parseRgb = (value) => {
  const channels = value.match(/\d+(\.\d+)?/g)?.slice(0, 3).map(Number);
  assert.equal(channels?.length, 3, `Expected an RGB color, received ${value}`);
  return channels;
};

const relativeLuminance = ([red, green, blue]) => {
  const [r, g, b] = [red, green, blue].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrastRatio = (foreground, background) => {
  const foregroundLuminance = relativeLuminance(parseRgb(foreground));
  const backgroundLuminance = relativeLuminance(parseRgb(background));
  const lighter = Math.max(foregroundLuminance, backgroundLuminance);
  const darker = Math.min(foregroundLuminance, backgroundLuminance);

  return (lighter + 0.05) / (darker + 0.05);
};

const collectHomeStyles = async (page) =>
  page.evaluate(() => {
    const px = (value) => Number.parseFloat(value) || 0;
    const rectToObject = (rect) => ({
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    });

    const hero = document.querySelector('section[aria-labelledby="homepage-title"]');
    const heading = document.querySelector('h1');
    const howItWorks = document.querySelector('section[aria-labelledby="how-it-works-title"]');
    const steps = Array.from(howItWorks?.querySelectorAll('.grid > div') ?? []);
    const ctaButtons = Array.from(hero?.querySelectorAll('button') ?? []);
    const primaryButton = ctaButtons[0];
    const paragraph = hero?.querySelector('p');
    const documentPreviewLibraryUrls = [
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    ];
    const documentPreviewScriptCount = Array.from(document.scripts).filter((script) =>
      documentPreviewLibraryUrls.includes(script.src),
    ).length;
    const deferredRouteModules = [
      '/src/pages/QuizFormPage.tsx',
      '/src/pages/DocumentListPage.tsx',
      '/src/features/billing/components/BillingPage.tsx',
      '/src/features/bug-report/components/BugReportManagementPage.tsx',
    ];
    const deferredRouteRequestCount = performance
      .getEntriesByType('resource')
      .filter((entry) => deferredRouteModules.some((modulePath) => entry.name.includes(modulePath))).length;

    if (!hero) {
      throw new Error('Home hero section is missing');
    }
    if (!heading) {
      throw new Error('Home heading is missing');
    }
    if (!primaryButton) {
      throw new Error('Primary homepage call to action is missing');
    }
    if (steps.length !== 3) {
      throw new Error(`Expected three home explainer steps, got ${steps.length}`);
    }

    const heroStyle = getComputedStyle(hero);
    const headingStyle = getComputedStyle(heading);
    const primaryButtonStyle = getComputedStyle(primaryButton);
    const firstStepStyle = getComputedStyle(steps[0]);
    const paragraphStyle = paragraph ? getComputedStyle(paragraph) : null;

    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      stylesheetCount: document.querySelectorAll('link[rel="stylesheet"], style').length,
      documentPreviewScriptCount,
      deferredRouteRequestCount,
      hero: {
        display: heroStyle.display,
        flexDirection: heroStyle.flexDirection,
        alignItems: heroStyle.alignItems,
        justifyContent: heroStyle.justifyContent,
        minHeight: px(heroStyle.minHeight),
        paddingLeft: px(heroStyle.paddingLeft),
        backgroundColor: heroStyle.backgroundColor,
        textAlign: heroStyle.textAlign,
      },
      heading: {
        fontSize: px(headingStyle.fontSize),
        fontWeight: Number.parseInt(headingStyle.fontWeight, 10),
        color: headingStyle.color,
      },
      paragraph: paragraphStyle
        ? {
            color: paragraphStyle.color,
            fontSize: px(paragraphStyle.fontSize),
          }
        : null,
      primaryButton: {
        display: primaryButtonStyle.display,
        paddingTop: px(primaryButtonStyle.paddingTop),
        paddingLeft: px(primaryButtonStyle.paddingLeft),
        borderRadius: px(primaryButtonStyle.borderRadius),
        backgroundColor: primaryButtonStyle.backgroundColor,
        color: primaryButtonStyle.color,
        fontSize: px(primaryButtonStyle.fontSize),
        fontWeight: Number.parseInt(primaryButtonStyle.fontWeight, 10),
      },
      firstStep: {
        paddingTop: px(firstStepStyle.paddingTop),
        borderTopWidth: px(firstStepStyle.borderTopWidth),
        borderTopColor: firstStepStyle.borderTopColor,
      },
      stepRects: steps.map((step) => rectToObject(step.getBoundingClientRect())),
      ctaButtonRects: ctaButtons.map((button) => rectToObject(button.getBoundingClientRect())),
    };
  });

const assertTailwindLayoutIsApplied = (styles) => {
  assert.ok(styles.stylesheetCount > 0, 'Expected at least one stylesheet to be loaded');
  assert.equal(
    styles.documentPreviewScriptCount,
    0,
    'Expected document-preview libraries to stay out of the public initial load',
  );
  assert.equal(
    styles.deferredRouteRequestCount,
    0,
    'Expected protected route modules to stay out of the homepage initial load',
  );

  assert.equal(styles.hero.display, 'flex');
  assert.equal(styles.hero.flexDirection, 'column');
  assert.equal(styles.hero.alignItems, 'center');
  assert.equal(styles.hero.justifyContent, 'center');
  assert.equal(styles.hero.textAlign, 'center');
  assert.ok(styles.hero.minHeight >= 500, `Expected hero min-height from Tailwind, got ${styles.hero.minHeight}px`);
  assert.ok(styles.hero.paddingLeft >= 16, `Expected hero horizontal padding, got ${styles.hero.paddingLeft}px`);
  assert.notEqual(styles.hero.backgroundColor, 'rgba(0, 0, 0, 0)');

  assert.ok(styles.heading.fontSize >= 36, `Expected styled heading font size, got ${styles.heading.fontSize}px`);
  assert.ok(styles.heading.fontWeight >= 700, `Expected bold heading, got weight ${styles.heading.fontWeight}`);

  assert.ok(
    ['inline-flex', 'flex'].includes(styles.primaryButton.display),
    `Expected flex CTA layout, got ${styles.primaryButton.display}`,
  );
  assert.ok(styles.primaryButton.paddingLeft >= 16, `Expected CTA padding, got ${styles.primaryButton.paddingLeft}px`);
  assert.ok(styles.primaryButton.paddingTop >= 8, `Expected CTA vertical padding, got ${styles.primaryButton.paddingTop}px`);
  assert.ok(styles.primaryButton.borderRadius >= 8, `Expected rounded CTA, got ${styles.primaryButton.borderRadius}px`);
  assert.ok(styles.primaryButton.fontSize >= 13, `Expected CTA text size, got ${styles.primaryButton.fontSize}px`);
  assert.ok(styles.primaryButton.fontWeight >= 500, `Expected CTA font weight, got ${styles.primaryButton.fontWeight}`);
  assert.notEqual(styles.primaryButton.backgroundColor, 'rgba(0, 0, 0, 0)');

  assert.ok(styles.firstStep.paddingTop >= 16, `Expected explainer step padding, got ${styles.firstStep.paddingTop}px`);
  assert.ok(styles.firstStep.borderTopWidth >= 2, `Expected explainer step border, got ${styles.firstStep.borderTopWidth}px`);
  assert.notEqual(styles.firstStep.borderTopColor, 'rgba(0, 0, 0, 0)');
};

const assertHomeDoesNotOverflow = (styles) => {
  assert.ok(
    styles.documentWidth <= styles.viewportWidth + 1,
    `Expected no horizontal overflow, viewport=${styles.viewportWidth}, document=${styles.documentWidth}`,
  );

  for (const [index, rect] of styles.stepRects.entries()) {
    assert.ok(rect.left >= 0, `Explainer step ${index + 1} overflows left`);
    assert.ok(rect.right <= styles.viewportWidth + 1, `Explainer step ${index + 1} overflows right`);
    assert.ok(rect.width > 0, `Explainer step ${index + 1} has no rendered width`);
  }

  for (const [index, rect] of styles.ctaButtonRects.entries()) {
    assert.ok(rect.left >= 0, `CTA button ${index + 1} overflows left`);
    assert.ok(rect.right <= styles.viewportWidth + 1, `CTA button ${index + 1} overflows right`);
  }
};

// WCAG large text means >=24px, or >=18.667px at weight >=700.
const textContrastThreshold = ({ fontSize, fontWeight }) =>
  fontSize >= 24 || (fontSize >= 18.667 && fontWeight >= 700) ? 3 : 4.5;

const assertThemeContrast = (styles, palette) => {
  assert(styles.paragraph, 'Expected hero paragraph styles');

  const paragraphRatio = contrastRatio(styles.paragraph.color, styles.hero.backgroundColor);
  assert.ok(
    paragraphRatio >= 4.5,
    `${palette} paragraph contrast should be at least 4.5:1, got ${paragraphRatio.toFixed(2)}:1`,
  );

  const headingRatio = contrastRatio(styles.heading.color, styles.hero.backgroundColor);
  assert.ok(
    headingRatio >= 3,
    `${palette} large heading contrast should be at least 3:1, got ${headingRatio.toFixed(2)}:1`,
  );

  const buttonRatio = contrastRatio(styles.primaryButton.color, styles.primaryButton.backgroundColor);
  assert.ok(
    buttonRatio >= textContrastThreshold(styles.primaryButton),
    `${palette} CTA contrast should meet its font-size/weight threshold, got ${buttonRatio.toFixed(2)}:1`,
  );
};

const applyPalette = async (page, palette) => {
  await page.evaluate((colorScheme) => {
    localStorage.setItem('quizmaker-theme', colorScheme === 'dark' || colorScheme === 'purple' ? 'dark' : 'light');
    localStorage.setItem('quizmaker-color-scheme', colorScheme);
  }, palette);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(
    (colorScheme) => {
      const root = document.documentElement;
      const interactivePrimary = getComputedStyle(root).getPropertyValue('--color-interactive-primary').trim();

      return root.classList.contains(`theme-${colorScheme}`) && interactivePrimary.length > 0;
    },
    palette,
  );
};

test('home page passes styling, theme, and responsive smoke checks', { timeout: 60_000 }, async () => {
  const server = process.env.RELEASE_BASE_URL ? null : createDevServer();

  let browser;

  try {
    await waitForServer(BASE_URL);
    browser = await launchBrowser();

    const page = await (await createTestContext(browser, { viewport: { width: 1280, height: 720 } })).newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]');
    assert.equal(await appleTouchIcon.count(), 1, 'Expected a single Apple touch icon link');
    assert.equal(await appleTouchIcon.getAttribute('href'), '/apple-touch-icon.png');

    const appleTouchIconResponse = await fetch(`${BASE_URL}/apple-touch-icon.png`);
    assert.equal(appleTouchIconResponse.status, 200, 'Expected the Apple touch icon asset to be available');
    assert.match(
      appleTouchIconResponse.headers.get('content-type') ?? '',
      /^image\/png/,
      'Expected the Apple touch icon to be served as a PNG',
    );

    await assert.doesNotReject(() =>
      page.getByRole('heading', { name: /create ai quizzes that help students learn and remember/i }).waitFor(),
    );

    await assert.doesNotReject(() =>
      page.getByRole('button', { name: /login/i }).waitFor(),
    );

    const desktopStyles = await collectHomeStyles(page);
    assertTailwindLayoutIsApplied(desktopStyles);
    assertHomeDoesNotOverflow(desktopStyles);

    for (const viewport of [{ width: 1280, height: 720 }, { width: 390, height: 844 }, { width: 320, height: 720 }]) {
      // 320 CSS px is the reflow width of a 1280px desktop at 400% browser zoom.
      await page.setViewportSize(viewport);
      for (const palette of PALETTES) {
        await applyPalette(page, palette);
        const paletteStyles = await collectHomeStyles(page);
        assertTailwindLayoutIsApplied(paletteStyles);
        assertThemeContrast(paletteStyles, palette);
        assertHomeDoesNotOverflow(paletteStyles);
      }
    }
  } finally {
    await browser?.close();
    await stopDevServer(server);
  }
});

const buttonStyles = async button => button.evaluate(element => {
  const style = getComputedStyle(element);
  // Transparent outline/ghost controls are read against the actual painted ancestor.
  let ancestor = element.parentElement;
  let surfaceColor = 'rgba(0, 0, 0, 0)';
  while (ancestor && surfaceColor === 'rgba(0, 0, 0, 0)') {
    surfaceColor = getComputedStyle(ancestor).backgroundColor;
    ancestor = ancestor.parentElement;
  }
  if (surfaceColor === 'rgba(0, 0, 0, 0)') throw new Error('Expected an opaque theme surface');
  return {
    color: style.color, backgroundColor: style.backgroundColor === 'rgba(0, 0, 0, 0)' ? surfaceColor : style.backgroundColor, backgroundImage: style.backgroundImage, opacity: style.opacity,
    fontSize: Number.parseFloat(style.fontSize), fontWeight: Number.parseInt(style.fontWeight, 10),
    outlineStyle: style.outlineStyle, outlineColor: style.outlineColor, outlineWidth: style.outlineWidth,
    boxShadow: style.boxShadow, transitionDuration: style.transitionDuration,
    surface: surfaceColor, borderColor: style.borderColor,
  };
});
const readableButton = async (button, label) => {
  const style = await buttonStyles(button);
  assert.equal(style.opacity, '1', `${label} must not fade readable text`);
  const ratio = contrastRatio(style.color, style.backgroundColor);
  assert.ok(ratio >= textContrastThreshold(style), `${label} contrast ${ratio.toFixed(2)}:1`);
  return style;
};

test('theme controls retain contrast across all palettes, states and accessibility preferences', { timeout: 120_000 }, async () => {
  const server = process.env.RELEASE_BASE_URL ? null : createDevServer();
  let browser;
  try {
    await waitForServer(BASE_URL);
    browser = await launchBrowser();
    const context = await createTestContext(browser, { viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${BASE_URL}/theme-demo`, { waitUntil: 'networkidle' });
    await page.getByRole('heading', { name: 'Theme System Demo' }).waitFor();
    const variants = ['Primary', 'Secondary', 'Success', 'Danger', 'Warning', 'Info', 'Outline', 'Ghost'];
    const screenshots = process.env.THEME_SCREENSHOT_DIR;
    if (screenshots) await mkdir(screenshots, { recursive: true });
    for (const viewport of [{ width: 1280, height: 900 }, { width: 390, height: 844 }, { width: 320, height: 720 }]) {
      await page.setViewportSize(viewport);
      for (const palette of PALETTES) {
        await applyPalette(page, palette);
        for (const variant of variants) {
          const button = page.getByRole('button', { name: variant, exact: true });
          // Move off any previous hover before measuring default colors.
          await page.mouse.move(0, 0);
          await readableButton(button, `${palette}/${variant}/default`);
          await button.hover();
          // Allow the actual transition to complete, without arbitrary sleeps.
          await button.evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
          await readableButton(button, `${palette}/${variant}/hover`);
          await button.focus();
          const focused = await readableButton(button, `${palette}/${variant}/focus`);
          assert.notEqual(focused.boxShadow, 'none', `${palette}/${variant} needs visible focus`);
          const ring = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-focus-ring'));
          const offset = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--color-bg-primary'));
          // CSS-variable hex values are converted by the browser to sRGB.
          const resolved = await page.evaluate(([a, b]) => {
            const probe = document.createElement('span'); probe.style.color = a; probe.style.backgroundColor = b;
            document.body.append(probe); const style = getComputedStyle(probe); const result = [style.color, style.backgroundColor]; probe.remove(); return result;
          }, [ring, offset]);
          assert.ok(contrastRatio(...resolved) >= 3, `${palette} focus ring`);
          const disabled = page.getByRole('button', { name: `Disabled ${variant}`, exact: true });
          assert.equal(await disabled.isDisabled(), true);
          await readableButton(disabled, `${palette}/${variant}/disabled`);
        }
        for (const field of [page.getByRole('textbox', { name: 'Sample Input', exact: true }), page.getByRole('textbox', { name: 'Sample Textarea', exact: true })]) {
          const style = await buttonStyles(field);
          assert.ok(contrastRatio(style.borderColor, style.backgroundColor) >= 3, `${palette} field boundary`);
          const placeholder = await field.evaluate(element => getComputedStyle(element, '::placeholder').color);
          assert.ok(contrastRatio(placeholder, style.backgroundColor) >= 4.5, `${palette} placeholder text`);
        }
        for (const radio of await page.getByRole('radio').all()) {
          const style = await buttonStyles(radio);
          // Compare a checked fill or an unchecked border with the containing surface.
          const surface = await radio.evaluate(element => getComputedStyle(document.body).backgroundColor);
          assert.ok(contrastRatio(style.borderColor, surface) >= 3, `${palette} radio boundary`);
          if (await radio.isChecked()) {
            const dot = style.backgroundImage.match(/rgba?\([^)]+\)/)?.[0];
            assert.ok(dot, `${palette} selected radio needs a visible dot`);
            assert.ok(contrastRatio(dot, style.backgroundColor) >= 3, `${palette} radio dot`);
          }
        }
        const checkbox = page.getByRole('checkbox', { name: 'Sample checkbox', exact: true });
        await checkbox.check();
        await checkbox.evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
        const choice = await buttonStyles(checkbox);
        const mark = await checkbox.evaluate(element => getComputedStyle(element.parentElement.querySelector('svg')).color);
        assert.ok(contrastRatio(mark, choice.backgroundColor) >= 3, `${palette} checked mark`);
        const disabledChoice = page.getByRole('checkbox', { name: 'Disabled checked example' });
        assert.equal(await disabledChoice.isChecked(), true);
        const disabledStyle = await buttonStyles(disabledChoice);
        const disabledMark = await disabledChoice.evaluate(element => getComputedStyle(element.parentElement.querySelector('svg')).color);
        assert.equal(disabledStyle.opacity, '1');
        assert.ok(contrastRatio(disabledMark, disabledStyle.backgroundColor) >= 3, `${palette} disabled checked mark`);
        const dimensions = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
        assert.ok(dimensions.content <= dimensions.viewport + 1, `${palette}/${viewport.width} theme-demo overflow`);
        if (screenshots) await page.screenshot({ path: `${screenshots}/${palette}-${viewport.width}.png`, fullPage: true });
      }
    }
    // Text resizing complements the 400% reflow-equivalent viewport above.
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    const resized = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
    assert.ok(resized, '200% text resizing must preserve reflow');
    await page.evaluate(() => { document.documentElement.style.fontSize = ''; });

    await page.emulateMedia({ forcedColors: 'active', reducedMotion: 'reduce' });
    for (const palette of PALETTES) {
      await applyPalette(page, palette);
      const button = page.getByRole('button', { name: 'Primary', exact: true });
      await button.focus();
      const style = await buttonStyles(button);
      assert.equal(style.transitionDuration, '0s');
      assert.equal(style.outlineStyle, 'solid');
      assert.ok(Number.parseFloat(style.outlineWidth) >= 2);
      assert.notEqual(style.color, style.backgroundColor);
      assert.notEqual(style.borderColor, style.backgroundColor);
      assert.equal(await page.getByRole('status', { name: 'Loading', exact: true }).evaluate(element => getComputedStyle(element).animationName), 'none');
      assert.equal(await page.getByRole('button', { name: /Saving example/ }).isDisabled(), true);
      const nativeChoice = page.getByRole('checkbox', { name: 'Disabled checked example' });
      assert.equal(await nativeChoice.evaluate(element => getComputedStyle(element).appearance), 'auto');
      assert.equal(await nativeChoice.evaluate(element => getComputedStyle(element.parentElement.querySelector('svg')).display), 'none');
      assert.equal(await nativeChoice.isChecked(), true);
      const selected = page.getByRole('radio', { checked: true });
      assert.equal(await selected.count(), 1, 'Palette selection retains its non-color state');
      assert.ok((await selected.getAttribute('aria-label')) || (await selected.evaluate(element => element.labels?.length > 0)));
    }
    assert.deepEqual(errors, [], 'Theme startup and switching must not throw browser errors');
  } finally {
    await browser?.close();
    await stopDevServer(server);
  }
});

test('theme bootstrap resolves before application code and survives inaccessible or malformed storage', { timeout: 90_000 }, async () => {
  const server = process.env.RELEASE_BASE_URL ? null : createDevServer();
  let browser;
  try {
    await waitForServer(BASE_URL);
    browser = await launchBrowser();
    const scenarios = [
      { theme: 'auto', scheme: 'light', system: 'dark', expected: 'dark' },
      { theme: 'dark', scheme: 'blue', system: 'dark', expected: 'blue' },
      { theme: 'light', scheme: 'purple', system: 'light', expected: 'purple' },
      { theme: '"dark"', scheme: '__proto__', system: 'light', expected: 'light' },
      { failure: 'getter', system: 'dark', expected: 'dark' },
      { failure: 'getItem', system: 'light', expected: 'light' },
      { failure: 'setItem', system: 'light', expected: 'light' },
      { failure: 'matchMedia', system: 'dark', expected: 'light' },
    ];
    for (const scenario of scenarios) {
      const context = await createTestContext(browser, { colorScheme: scenario.system });
      const page = await context.newPage();
      const failures = [];
      page.on('pageerror', error => failures.push(error.message));
      await page.addInitScript(options => {
        if (options.theme) localStorage.setItem('quizmaker-theme', options.theme);
        if (options.scheme) localStorage.setItem('quizmaker-color-scheme', options.scheme);
        if (options.failure === 'getter') Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Denied', 'SecurityError'); } });
        if (options.failure === 'getItem' || options.failure === 'setItem') Storage.prototype[options.failure] = () => { throw new DOMException('Denied', 'SecurityError'); };
        if (options.failure === 'matchMedia') Object.defineProperty(window, 'matchMedia', { value: undefined });
      }, scenario);
      // With all application modules blocked, only the synchronous head bootstrap can resolve appearance.
      await page.route('**/*', route => {
        const url = new URL(route.request().url());
        return url.pathname.endsWith('.js') || url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts')
          ? route.abort('blockedbyclient') : route.fallback();
      });
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
      const initial = await page.evaluate(() => ({ classes: document.documentElement.className, color: document.documentElement.style.colorScheme, rootChildren: document.getElementById('root')?.childElementCount }));
      assert.ok(initial.classes.split(' ').includes(`theme-${scenario.expected}`), JSON.stringify(scenario));
      assert.equal(initial.color, ['dark', 'purple'].includes(scenario.expected) ? 'dark' : 'light');
      if (!process.env.RELEASE_BASE_URL) assert.equal(initial.rootChildren, 0, 'React must remain blocked during the startup assertion');
      await page.unroute('**/*');
      // Reinstall provider fakes after removing the page-owned module blocker.
      await page.reload({ waitUntil: 'networkidle' });
      try {
        await page.getByRole('heading', { name: /create ai quizzes/i }).waitFor();
      } catch (error) {
        throw new Error(`Startup scenario ${JSON.stringify(scenario)} failed; browser errors: ${JSON.stringify(failures)}`, { cause: error });
      }
      await page.getByRole('button', { name: /Current theme:/ }).click();
      await page.getByRole('button', { name: 'Switch to Royal Purple theme', exact: true }).click();
      assert.ok(await page.evaluate(() => document.documentElement.classList.contains('theme-purple')), 'In-memory palette update must work after startup failures');
      await context.close();
    }
    // With JavaScript disabled, every semantic CSS token must still have a usable fallback.
    const context = await createTestContext(browser, { javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(BASE_URL, { waitUntil: 'load' });
    const fallback = await page.evaluate(() => ({ bg: getComputedStyle(document.body).backgroundColor, text: getComputedStyle(document.body).color, info: getComputedStyle(document.documentElement).getPropertyValue('--color-control-info-hover-foreground'), status: getComputedStyle(document.documentElement).getPropertyValue('--color-status-info-bg'), overlay: getComputedStyle(document.documentElement).getPropertyValue('--color-bg-overlay') }));
    assert.ok(contrastRatio(fallback.text, fallback.bg) >= 4.5);
    assert.ok(fallback.info && fallback.status && fallback.overlay, 'Complete startup fallbacks must survive missing JavaScript');
    await context.close();
  } finally {
    await browser?.close();
    await stopDevServer(server);
  }
});
