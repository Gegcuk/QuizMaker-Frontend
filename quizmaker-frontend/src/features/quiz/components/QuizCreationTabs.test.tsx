import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import { QuizCreationTabs } from './QuizCreationTabs';

vi.mock('./QuizForm', () => ({
  default: () => <div>Manual quiz configuration</div>,
}));

vi.mock('./TextGenerationTab', () => ({
  TextGenerationTab: () => <div>Text generation configuration</div>,
}));

vi.mock('./DocumentUploadTab', () => ({
  DocumentUploadTab: () => <div>Document upload configuration</div>,
}));

describe('QuizCreationTabs', () => {
  it('shows the manual creation path by default', () => {
    renderWithProviders(<QuizCreationTabs />, { withAuthProvider: false });

    expect(screen.getByRole('navigation', { name: 'Tabs' })).toBeInTheDocument();
    expect(screen.getByText('Create quiz manually by adding questions and settings')).toBeInTheDocument();
    expect(screen.getByText('Manual quiz configuration')).toBeInTheDocument();
    expect(screen.queryByText('Text generation configuration')).not.toBeInTheDocument();
    expect(screen.queryByText('Document upload configuration')).not.toBeInTheDocument();
  });

  it.each([
    [
      'Generate from Text',
      'Generate quiz from plain text content using AI',
      'Text generation configuration',
    ],
    [
      'Generate from Document',
      'Upload a document and generate quiz automatically',
      'Document upload configuration',
    ],
  ])('switches to %s', async (label, description, content) => {
    const { user } = renderWithProviders(<QuizCreationTabs />, { withAuthProvider: false });

    await user.click(screen.getByRole('button', { name: new RegExp(label) }));

    expect(screen.getByText(description)).toBeInTheDocument();
    expect(screen.getByText(content)).toBeInTheDocument();
    expect(screen.queryByText('Manual quiz configuration')).not.toBeInTheDocument();
  });

  it('supports keyboard activation of a creation method', async () => {
    const { user } = renderWithProviders(<QuizCreationTabs />, { withAuthProvider: false });
    const documentTab = screen.getByRole('button', { name: /Generate from Document/ });

    documentTab.focus();
    await user.keyboard('{Enter}');

    expect(screen.getByText('Document upload configuration')).toBeInTheDocument();
  });
});
