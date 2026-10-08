import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createThemeRuntime, startupPalettes } from './themeRuntime';

beforeEach(() => { localStorage.clear(); document.documentElement.className = ''; document.documentElement.removeAttribute('style'); });
afterEach(() => vi.restoreAllMocks());
const runtime = () => createThemeRuntime(startupPalettes, window, document);
const darkSystem = () => vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);

describe('theme startup', () => {
  it.each([
    ['auto', 'light', 'dark', 'dark'],
    ['light', 'dark', 'light', 'light'],
    ['dark', 'light', 'dark', 'dark'],
    ['dark', 'blue', 'blue', 'light'],
    ['light', 'purple', 'purple', 'dark'],
    ['auto', 'green', 'green', 'light'],
  ])('resolves saved %s/%s to palette %s with %s browser appearance before React', (theme, scheme, expectedPalette, expectedAppearance) => {
    darkSystem();
    localStorage.setItem('quizmaker-theme', theme);
    localStorage.setItem('quizmaker-color-scheme', scheme);
    const service = runtime();
    service.apply(service.readPreferences());
    expect(document.documentElement).toHaveClass(`theme-${expectedPalette}`);
    expect(document.documentElement.classList.contains('dark')).toBe(expectedAppearance === 'dark');
    expect(document.documentElement.style.colorScheme).toBe(expectedAppearance);
    expect(document.documentElement.style.getPropertyValue('--color-control-info-hover-foreground')).toMatch(/^#/);
  });
  it.each(['', 'null', '"dark"', 'DARK', '{"theme":"dark"}', '__proto__', 'constructor', '<script>'])('rejects malformed stored values %j', value => {
    localStorage.setItem('quizmaker-theme', value);
    localStorage.setItem('quizmaker-color-scheme', value);
    expect(runtime().readPreferences()).toEqual({ theme: 'auto', colorScheme: 'light' });
  });
  it('survives a throwing storage property getter', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new DOMException('Unavailable', 'SecurityError'); });
    const service = runtime();
    expect(service.readPreferences()).toEqual({ theme: 'auto', colorScheme: 'light' });
    expect(() => service.persist({ theme: 'dark', colorScheme: 'dark' })).not.toThrow();
    expect(service.apply({ theme: 'dark', colorScheme: 'dark' }).colorScheme).toBe('dark');
  });
  it('survives throwing getItem and setItem methods', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('read denied'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota exceeded'); });
    const service = runtime();
    expect(service.readPreferences()).toEqual({ theme: 'auto', colorScheme: 'light' });
    expect(() => service.persist({ theme: 'dark', colorScheme: 'purple' })).not.toThrow();
    expect(service.apply({ theme: 'dark', colorScheme: 'purple' }).colorScheme).toBe('purple');
  });
  it('preserves a valid preference when the other key cannot be read', () => {
    const original = Storage.prototype.getItem;
    localStorage.setItem('quizmaker-color-scheme', 'purple');
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(function (this: Storage, key) {
      if (key === 'quizmaker-theme') throw new Error('denied');
      return original.call(this, key);
    });
    expect(runtime().readPreferences()).toEqual({ theme: 'auto', colorScheme: 'purple' });
  });
  it('falls back to light if media detection is missing or throws', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(() => { throw new Error('unavailable'); });
    expect(runtime().resolve({ theme: 'auto', colorScheme: 'light' }).colorScheme).toBe('light');
    expect(runtime().resolve({ theme: 'light', colorScheme: '__proto__' }).colorScheme).toBe('light');
  });
  it('clears only known theme classes, preserving unrelated classes', () => {
    document.documentElement.className = 'theme-light theme-purple app-ready';
    runtime().apply({ theme: 'light', colorScheme: 'green' });
    expect(document.documentElement.className).toBe('app-ready theme-green');
  });
});
