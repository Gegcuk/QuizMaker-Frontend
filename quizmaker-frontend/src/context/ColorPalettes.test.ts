import { describe, expect, it } from 'vitest';
import { colorPalettes, generateCSSVariables } from './ColorPalettes';

// WCAG relative luminance and contrast; requirements come from issue #202.
const luminance = (hex: string) => {
  const channels = hex.slice(1).match(/../g);
  if (!channels || channels.length !== 3) throw new Error(`Expected opaque sRGB: ${hex}`);
  const [r, g, b] = channels.map(channel => Number.parseInt(channel, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string) => {
  const values = [luminance(a), luminance(b)];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
};
const readable = (foreground: string, fill: string, label: string, minimum = 4.5) => {
  expect(contrast(foreground, fill), `${label}: ${foreground} on ${fill}`).toBeGreaterThanOrEqual(minimum);
};

describe.each(colorPalettes)('$name contrast contract', palette => {
  it('keeps normal text readable on every surface, including muted text and link hover', () => {
    for (const fill of Object.values(palette.colors.bg)) {
      for (const role of ['primary', 'secondary', 'tertiary'] as const) readable(palette.colors.text[role], fill, role);
      for (const [role, foreground] of Object.entries(palette.colors.interactive)) readable(foreground, fill, `interactive ${role}`);
    }
  });
  it('covers all default, hover, focus and disabled control pairs without inverse inference', () => {
    for (const [tone, control] of Object.entries(palette.colors.controls)) {
      for (const [state, pair] of Object.entries(control)) {
        readable(pair.foreground, pair.fill, `${tone} ${state}`);
        // Pale inactive fills use their readable foreground for the visible boundary.
        for (const surface of Object.values(palette.colors.bg)) readable(state === 'disabled' ? pair.foreground : pair.fill, surface, `${tone} boundary`, 3);
      }
    }
    readable(palette.colors.disabled.foreground, palette.colors.disabled.fill, 'disabled');
    for (const fill of Object.values(palette.colors.bg)) {
      readable(palette.colors.border.control, fill, 'control boundary', 3);
      readable(palette.colors.focus.ring, fill, 'focus ring', 3);
      readable(palette.colors.border.focus, fill, 'focus border', 3);
      readable(palette.colors.interactive.primary, fill, 'outline/ghost');
    }
    readable(palette.colors.focus.ring, palette.colors.focus.ringOffset, 'focus offset', 3);
  });
  it('covers status panels, matching card/badge pairs and opaque tooltip text', () => {
    for (const status of ['success', 'warning', 'danger', 'info'] as const) {
      readable(palette.colors.status[status], palette.colors.status[`${status}Bg`], `status ${status}`);
      readable(palette.colors.text.primary, palette.colors.status[`${status}Bg`], `status content ${status}`);
    }
    for (const [name, pair] of Object.entries(palette.colors.matching)) {
      readable(pair.foreground, pair.bg, `${name} card`);
      readable(pair.badgeForeground, pair.badge, `${name} badge`);
      readable(pair.border, pair.bg, `${name} boundary`, 3);
    }
    readable(palette.colors.tooltip.foreground, palette.colors.tooltip.fill, 'tooltip');
  });
  it('publishes each explicit pair as an opaque CSS value', () => {
    const variables = generateCSSVariables(palette);
    for (const [name, value] of Object.entries(variables)) {
      if (!name.includes('shadow') && !name.includes('overlay')) expect(value, name).toMatch(/^#[0-9a-f]{6}$/i);
    }
    expect(Object.keys(variables)).toContain('--color-control-warning-hover-foreground');
    expect(Object.keys(variables)).toContain('--color-matching-pair-4-badge-foreground');
  });
});
