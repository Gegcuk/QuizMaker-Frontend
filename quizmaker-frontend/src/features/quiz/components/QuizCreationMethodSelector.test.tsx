import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { CreationMethod } from './QuizCreationWizard';
import { QuizCreationMethodSelector } from './QuizCreationMethodSelector';

const SelectorHarness = ({ onMethodSelect = vi.fn() }: { onMethodSelect?: (method: CreationMethod) => void }) => {
  const [selectedMethod, setSelectedMethod] = useState<CreationMethod | null>(null);

  const handleMethodSelect = (method: CreationMethod) => {
    setSelectedMethod(method);
    onMethodSelect(method);
  };

  return (
    <QuizCreationMethodSelector
      selectedMethod={selectedMethod}
      onMethodSelect={handleMethodSelect}
    />
  );
};

describe('QuizCreationMethodSelector', () => {
  it('renders the three supported quiz creation paths', () => {
    renderWithProviders(<SelectorHarness />, { withAuthProvider: false });

    expect(screen.getByRole('button', { name: /Manual Creation/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate from Text/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Generate from Document/ })).toBeInTheDocument();
  });

  it.each([
    ['Manual Creation', 'manual'],
    ['Generate from Text', 'text'],
    ['Generate from Document', 'document'],
  ] as const)('selects %s through its card control', async (label, method) => {
    const onMethodSelect = vi.fn();
    const { user } = renderWithProviders(
      <SelectorHarness onMethodSelect={onMethodSelect} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: new RegExp(label) }));

    expect(onMethodSelect).toHaveBeenCalledWith(method);
    expect(screen.getByRole('button', { name: new RegExp(label) })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('supports keyboard selection and updates the pressed state', async () => {
    const onMethodSelect = vi.fn();
    const { user } = renderWithProviders(
      <SelectorHarness onMethodSelect={onMethodSelect} />,
      { withAuthProvider: false },
    );
    const documentMethod = screen.getByRole('button', { name: /Generate from Document/ });

    documentMethod.focus();
    await user.keyboard('{Enter}');

    expect(onMethodSelect).toHaveBeenCalledWith('document');
    expect(documentMethod).toHaveAttribute('aria-pressed', 'true');
  });
});
