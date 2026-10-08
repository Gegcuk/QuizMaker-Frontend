import { colorPalettes, generateCSSVariables } from './ColorPalettes';

export type Theme = 'light' | 'dark' | 'auto';
export interface ThemePreferences { theme: Theme; colorScheme: string }
interface StartupPalette {
  appearance: 'light' | 'dark';
  variables: Record<string, string>;
}

export const startupPalettes: Record<string, StartupPalette> = Object.fromEntries(
  colorPalettes.map(palette => [palette.id, {
    appearance: palette.appearance,
    variables: generateCSSVariables(palette),
  }]),
);

/** Self-contained so Vite can embed exactly this resolver in the pre-paint script. */
export function createThemeRuntime(palettes: Record<string, StartupPalette>, host: Window, doc: Document) {
  const validTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark' || value === 'auto';
  const validScheme = (value: unknown): value is string => typeof value === 'string' && Object.prototype.hasOwnProperty.call(palettes, value);
  const read = (key: string) => {
    try { return host.localStorage.getItem(key); } catch { return null; }
  };
  const readPreferences = (defaults: ThemePreferences = { theme: 'auto', colorScheme: 'light' }): ThemePreferences => {
    const theme = read('quizmaker-theme');
    const colorScheme = read('quizmaker-color-scheme');
    return {
      theme: validTheme(theme) ? theme : validTheme(defaults.theme) ? defaults.theme : 'auto',
      colorScheme: validScheme(colorScheme) ? colorScheme : validScheme(defaults.colorScheme) ? defaults.colorScheme : 'light',
    };
  };
  const systemTheme = (): 'light' | 'dark' => {
    try { return host.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
    catch { return 'light'; }
  };
  const resolve = (preferences: ThemePreferences, systemPreference: 'light' | 'dark' = systemTheme()) => {
    const theme = validTheme(preferences.theme) ? preferences.theme : 'auto';
    const scheme = validScheme(preferences.colorScheme) ? preferences.colorScheme : 'light';
    const custom = scheme !== 'light' && scheme !== 'dark';
    const resolvedTheme = custom ? palettes[scheme].appearance : theme === 'auto' ? systemPreference : theme;
    const colorScheme = custom ? scheme : resolvedTheme;
    return { resolvedTheme, colorScheme, palette: palettes[colorScheme] };
  };
  const apply = (preferences: ThemePreferences) => {
    const result = resolve(preferences);
    const root = doc.documentElement;
    for (const id of Object.keys(palettes)) root.classList.remove(`theme-${id}`);
    root.classList.add(`theme-${result.colorScheme}`);
    root.classList.toggle('dark', result.resolvedTheme === 'dark');
    root.style.colorScheme = result.resolvedTheme;
    for (const [name, value] of Object.entries(result.palette.variables)) root.style.setProperty(name, value);
    doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', result.palette.variables['--color-bg-primary']);
    return result;
  };
  const persist = (preferences: ThemePreferences) => {
    // Keep each write independent; one denied key must not prevent the other.
    for (const [key, value] of [['quizmaker-theme', preferences.theme], ['quizmaker-color-scheme', preferences.colorScheme]]) {
      try { host.localStorage.setItem(key, value); } catch { /* React remains the in-memory owner. */ }
    }
  };
  return { readPreferences, resolve, apply, persist };
}
