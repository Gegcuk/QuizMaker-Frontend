import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeProvider, useTheme } from './ThemeContext';
import Button from '@/components/ui/Button';
import ThemeSelector from '@/components/ui/ThemeSelector';
import ThemeToggle from '@/components/ui/ThemeToggle';

const Preferences = () => {
  const { theme, colorScheme, resolvedTheme, setColorScheme } = useTheme();
  return <>
    <output aria-label="Appearance">{theme}/{colorScheme}/{resolvedTheme}</output>
    <Button onClick={() => setColorScheme('purple')}>Choose Purple</Button>
    <Button onClick={() => setColorScheme('blue')}>Choose Blue</Button>
    <ThemeSelector />
    <ThemeToggle />
  </>;
};
beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());
const mount = () => render(<ThemeProvider><Preferences /></ThemeProvider>);

describe('theme preference interactions', () => {
  it.each(['property', 'read', 'write'])('renders and changes theme with storage %s failure', async failure => {
    if (failure === 'property') vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('denied'); });
    if (failure === 'read') vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('denied'); });
    if (failure === 'write') vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota'); });
    mount();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Choose Purple' }));
    expect(screen.getByLabelText('Appearance')).toHaveTextContent('auto/purple/dark');
    expect(document.documentElement).toHaveClass('theme-purple', 'dark');
    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }));
    expect(screen.getByLabelText('Appearance')).toHaveTextContent('light/light/light');
    expect(document.documentElement).not.toHaveClass('dark');
    await user.click(screen.getByRole('button', { name: 'Choose Blue' }));
    expect(screen.getByLabelText('Appearance')).toHaveTextContent('light/blue/light');
  });
  it('switches a named palette to the chosen mode and persists a coherent pair', async () => {
    mount();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Choose Blue' }));
    expect(screen.getByText(/Ocean Blue uses a light appearance/)).toBeInTheDocument();
    await user.click(screen.getByRole('combobox', { name: 'Theme' }));
    await user.click(screen.getByRole('option', { name: 'Dark' }));
    expect(screen.getByLabelText('Appearance')).toHaveTextContent('dark/dark/dark');
    expect(localStorage.getItem('quizmaker-theme')).toBe('dark');
    expect(localStorage.getItem('quizmaker-color-scheme')).toBe('dark');
  });
  it('lets users explicitly choose a remembered mode while a named palette overrides it', async () => {
    localStorage.setItem('quizmaker-theme', 'light');
    localStorage.setItem('quizmaker-color-scheme', 'purple');
    mount();
    const user = userEvent.setup();
    const selector = screen.getByRole('combobox', { name: 'Theme' });
    expect(selector).toHaveTextContent('Royal Purple palette');
    await user.click(selector);
    await user.click(screen.getByRole('option', { name: 'Light' }));
    expect(screen.getByLabelText('Appearance')).toHaveTextContent('light/light/light');
    expect(selector).toHaveTextContent('Light');
  });
  it('lets users resume Auto from a named palette even when Auto was already remembered', async () => {
    localStorage.setItem('quizmaker-theme', 'auto');
    localStorage.setItem('quizmaker-color-scheme', 'green');
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaQueryList);
    mount();
    const user = userEvent.setup();
    await user.click(screen.getByRole('combobox', { name: 'Theme' }));
    await user.click(screen.getByRole('option', { name: 'Auto (System)' }));
    expect(screen.getByLabelText('Appearance')).toHaveTextContent('auto/dark/dark');
    expect(document.documentElement).toHaveClass('dark', 'theme-dark');
  });
  it('follows system changes in Auto, keeps named palettes pinned, and unsubscribes on unmount', () => {
    let listener: (() => void) | undefined;
    const media = { matches: false, addEventListener: vi.fn((_event, callback) => { listener = callback; }), removeEventListener: vi.fn() };
    vi.spyOn(window, 'matchMedia').mockReturnValue(media as unknown as MediaQueryList);
    const { unmount } = mount();
    expect(screen.getByLabelText('Appearance')).toHaveTextContent('auto/light/light');
    media.matches = true;
    act(() => listener?.());
    expect(screen.getByLabelText('Appearance')).toHaveTextContent('auto/dark/dark');
    fireEvent.click(screen.getByRole('button', { name: 'Choose Blue' }));
    expect(screen.getByLabelText('Appearance')).toHaveTextContent('auto/blue/light');
    unmount();
    expect(media.removeEventListener).toHaveBeenCalledWith('change', listener);
  });
  it('mounts and updates without matchMedia', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(() => { throw new Error('unsupported'); });
    mount();
    expect(screen.getByLabelText('Appearance')).toHaveTextContent('auto/light/light');
    await userEvent.setup().click(screen.getByRole('button', { name: 'Choose Purple' }));
    expect(document.documentElement).toHaveClass('theme-purple', 'dark');
  });
});
