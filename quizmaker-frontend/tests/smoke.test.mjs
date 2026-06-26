import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';

const HOST = '127.0.0.1';
const PORT = 4179;
const BASE_URL = `http://${HOST}:${PORT}`;
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
    return normalized <= 0.03928
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

    const hero = document.querySelector('main section');
    const heading = document.querySelector('h1');
    const scoreChip = document.querySelector('main section p span');
    const cards = Array.from(document.querySelectorAll('main section .grid > div'));
    const ctaButtons = Array.from(document.querySelectorAll('main section button'));
    const paragraph = document.querySelector('main section p');

    if (!hero) {
      throw new Error('Home hero section is missing');
    }
    if (!heading) {
      throw new Error('Home heading is missing');
    }
    if (!scoreChip) {
      throw new Error('Research score chip is missing');
    }
    if (cards.length !== 3) {
      throw new Error(`Expected three home explainer cards, got ${cards.length}`);
    }

    const heroStyle = getComputedStyle(hero);
    const headingStyle = getComputedStyle(heading);
    const scoreChipStyle = getComputedStyle(scoreChip);
    const firstCardStyle = getComputedStyle(cards[0]);
    const paragraphStyle = paragraph ? getComputedStyle(paragraph) : null;

    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      stylesheetCount: document.querySelectorAll('link[rel="stylesheet"], style').length,
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
      scoreChip: {
        display: scoreChipStyle.display,
        gap: px(scoreChipStyle.gap),
        paddingTop: px(scoreChipStyle.paddingTop),
        paddingLeft: px(scoreChipStyle.paddingLeft),
        borderRadius: px(scoreChipStyle.borderRadius),
        backgroundColor: scoreChipStyle.backgroundColor,
        color: scoreChipStyle.color,
        fontSize: px(scoreChipStyle.fontSize),
        fontWeight: Number.parseInt(scoreChipStyle.fontWeight, 10),
      },
      firstCard: {
        paddingTop: px(firstCardStyle.paddingTop),
        paddingLeft: px(firstCardStyle.paddingLeft),
        borderRadius: px(firstCardStyle.borderRadius),
        backgroundColor: firstCardStyle.backgroundColor,
      },
      cardRects: cards.map((card) => rectToObject(card.getBoundingClientRect())),
      ctaButtonRects: ctaButtons.map((button) => rectToObject(button.getBoundingClientRect())),
    };
  });

const assertTailwindLayoutIsApplied = (styles) => {
  assert.ok(styles.stylesheetCount > 0, 'Expected at least one stylesheet to be loaded');

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

  assert.equal(styles.scoreChip.display, 'inline-flex');
  assert.ok(styles.scoreChip.gap >= 8, `Expected score chip gap, got ${styles.scoreChip.gap}px`);
  assert.ok(styles.scoreChip.paddingLeft >= 8, `Expected score chip padding, got ${styles.scoreChip.paddingLeft}px`);
  assert.ok(styles.scoreChip.paddingTop >= 4, `Expected score chip vertical padding, got ${styles.scoreChip.paddingTop}px`);
  assert.ok(styles.scoreChip.borderRadius > 100, `Expected rounded score chip, got ${styles.scoreChip.borderRadius}px`);
  assert.ok(styles.scoreChip.fontSize >= 13, `Expected score chip text size, got ${styles.scoreChip.fontSize}px`);
  assert.ok(styles.scoreChip.fontWeight >= 600, `Expected semibold score chip, got ${styles.scoreChip.fontWeight}`);

  assert.ok(styles.firstCard.paddingLeft >= 16, `Expected card padding, got ${styles.firstCard.paddingLeft}px`);
  assert.ok(styles.firstCard.paddingTop >= 16, `Expected card padding, got ${styles.firstCard.paddingTop}px`);
  assert.ok(styles.firstCard.borderRadius >= 12, `Expected rounded card, got ${styles.firstCard.borderRadius}px`);
  assert.notEqual(styles.firstCard.backgroundColor, 'rgba(0, 0, 0, 0)');
};

const assertHomeDoesNotOverflow = (styles) => {
  assert.ok(
    styles.documentWidth <= styles.viewportWidth + 1,
    `Expected no horizontal overflow, viewport=${styles.viewportWidth}, document=${styles.documentWidth}`,
  );

  for (const [index, rect] of styles.cardRects.entries()) {
    assert.ok(rect.left >= 0, `Card ${index + 1} overflows left`);
    assert.ok(rect.right <= styles.viewportWidth + 1, `Card ${index + 1} overflows right`);
    assert.ok(rect.width > 0, `Card ${index + 1} has no rendered width`);
  }

  for (const [index, rect] of styles.ctaButtonRects.entries()) {
    assert.ok(rect.left >= 0, `CTA button ${index + 1} overflows left`);
    assert.ok(rect.right <= styles.viewportWidth + 1, `CTA button ${index + 1} overflows right`);
  }
};

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

  const chipRatio = contrastRatio(styles.scoreChip.color, styles.scoreChip.backgroundColor);
  assert.ok(
    chipRatio >= 3,
    `${palette} score chip contrast should be at least 3:1, got ${chipRatio.toFixed(2)}:1`,
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
  const server = createDevServer();

  let browser;

  try {
    await waitForServer(BASE_URL);
    browser = await chromium.launch();

    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    await assert.doesNotReject(() =>
      page.getByRole('heading', { name: /welcome to quizzence/i }).waitFor(),
    );

    await assert.doesNotReject(() =>
      page.getByRole('button', { name: /login/i }).waitFor(),
    );

    const desktopStyles = await collectHomeStyles(page);
    assertTailwindLayoutIsApplied(desktopStyles);
    assertHomeDoesNotOverflow(desktopStyles);

    for (const palette of PALETTES) {
      await applyPalette(page, palette);
      const paletteStyles = await collectHomeStyles(page);
      assertTailwindLayoutIsApplied(paletteStyles);
      assertThemeContrast(paletteStyles, palette);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'networkidle' });

    const mobileStyles = await collectHomeStyles(page);
    assertTailwindLayoutIsApplied(mobileStyles);
    assertHomeDoesNotOverflow(mobileStyles);
  } finally {
    await browser?.close();
    await stopDevServer(server);
  }
});
