import { fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import ButtonWithValidationTooltip from './ButtonWithValidationTooltip';
import ColorSchemeDropdown from './ColorSchemeDropdown';
import ColorSchemeSelector from './ColorSchemeSelector';
import InstructionsModal from './InstructionsModal';
import Modal from './Modal';
import { getSchemeIcon, getThemeIcon } from './ThemeIcons';
import ThemeSelector from './ThemeSelector';
import ThemeToggle from './ThemeToggle';
import Tooltip from './Tooltip';
import { useToast } from './Toast';

const ToastTrigger = () => {
  const { addToast } = useToast();
  return (
    <button
      type="button"
      onClick={() => addToast({ id: 'saved', title: 'Saved', message: 'Quiz updated', type: 'success', duration: 0 })}
    >
      Show toast
    </button>
  );
};

describe('shared overlay and theme components', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('shows validation guidance only for disabled buttons with errors', () => {
    const { rerender } = renderWithProviders(
      <ButtonWithValidationTooltip disabled validationErrors={['Add at least one question']}>Publish</ButtonWithValidationTooltip>,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('button', { name: 'Publish' })).toBeDisabled();
    expect(screen.getByText('Please complete the following:')).toBeInTheDocument();
    expect(screen.getByText('Add at least one question')).toBeInTheDocument();

    rerender(<ButtonWithValidationTooltip validationErrors={['Add at least one question']}>Publish</ButtonWithValidationTooltip>);
    expect(screen.queryByText('Please complete the following:')).not.toBeInTheDocument();
  });

  it('closes modals by close button and Escape while restoring page scroll on unmount', async () => {
    const onClose = vi.fn();
    const { user, rerender } = renderWithProviders(
      <Modal isOpen onClose={onClose} title="Delete quiz">This cannot be undone.</Modal>,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('dialog', { name: 'Delete quiz' })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');
    await user.click(screen.getByRole('button', { name: 'Close modal' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(2);

    rerender(<Modal isOpen={false} onClose={onClose}>Closed</Modal>);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('unset');
  });

  it('shows tooltips on focus and hides them when focus leaves the trigger', () => {
    renderWithProviders(
      <Tooltip content="This setting is required" delay={0}><button type="button">More information</button></Tooltip>,
      { withAuthProvider: false },
    );
    const trigger = screen.getByRole('button', { name: 'More information' }).parentElement!;

    fireEvent.focus(trigger);
    expect(screen.getByRole('tooltip')).toHaveTextContent('This setting is required');
    fireEvent.blur(trigger);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('adds and removes toasts through the shared toast context', async () => {
    const { user } = renderWithProviders(<ToastTrigger />, { withAuthProvider: false });

    await user.click(screen.getByRole('button', { name: 'Show toast' }));
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Quiz updated')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByText('Quiz updated')).not.toBeInTheDocument();
  });

  it('renders instruction titles and consumer-provided guidance', () => {
    renderWithProviders(
      <InstructionsModal title="Before you begin"><p>Read every question carefully.</p></InstructionsModal>,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('heading', { name: 'Before you begin' })).toBeInTheDocument();
    expect(screen.getByText('Read every question carefully.')).toBeInTheDocument();
  });

  it('updates the color scheme through radio selection and persists the selection', async () => {
    const { user, container } = renderWithProviders(<ColorSchemeSelector />, { withAuthProvider: false });
    const blue = container.querySelector<HTMLInputElement>('input[value="blue"]')!;

    await user.click(blue);
    expect(blue).toBeChecked();
    expect(window.localStorage.getItem('quizmaker-color-scheme')).toBe('blue');
  });

  it('expands the compact color-scheme menu and selects a palette', async () => {
    const { user } = renderWithProviders(<ColorSchemeDropdown />, { withAuthProvider: false });

    await user.click(screen.getByRole('button', { name: /Current theme: Light/ }));
    await user.click(screen.getByRole('button', { name: 'Switch to Ocean Blue theme' }));
    expect(window.localStorage.getItem('quizmaker-color-scheme')).toBe('blue');
    expect(screen.getByRole('button', { name: /Current theme: Ocean Blue/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Switch to Ocean Blue theme' })).not.toBeInTheDocument();
  });

  it('updates the selected theme and publishes its current-theme guidance', async () => {
    const { user } = renderWithProviders(<ThemeSelector />, { withAuthProvider: false });
    const selector = screen.getByRole('combobox');

    await user.selectOptions(selector, 'dark');
    expect(selector).toHaveValue('dark');
    expect(screen.getByText('Always use dark theme')).toBeInTheDocument();
    expect(window.localStorage.getItem('quizmaker-theme')).toBe('dark');
  });

  it('toggles theme mode and updates its accessible action label', async () => {
    const { user } = renderWithProviders(<ThemeToggle showLabel />, { withAuthProvider: false });

    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }));
    expect(screen.getByText('Dark Mode')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
    expect(window.localStorage.getItem('quizmaker-theme')).toBe('dark');
  });

  it('maps theme and scheme icon helpers to the requested icon sizes', () => {
    const { container } = renderWithProviders(
      <div>
        {getThemeIcon('dark', { size: 'lg', className: 'theme-icon' })}
        {getSchemeIcon('unknown-scheme', { size: 'sm' })}
      </div>,
      { withAuthProvider: false },
    );
    const icons = container.querySelectorAll('svg');

    expect(icons[0]).toHaveClass('w-6', 'h-6', 'theme-icon');
    expect(icons[1]).toHaveClass('w-4', 'h-4');
  });
});
