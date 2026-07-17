import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { FaqSection } from '../types/faq.types';
import FaqSectionList from './FaqSectionList';

const sections: FaqSection[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    items: [{ id: 'what', question: 'What is Quizzence?', answer: [] }],
  },
  {
    id: 'billing',
    title: 'Billing',
    description: 'Plans and token balances.',
    items: [{ id: 'tokens', question: 'How do tokens work?', answer: [] }],
  },
];

describe('FaqSectionList', () => {
  it('renders every supplied section and its questions in order', () => {
    renderWithProviders(<FaqSectionList sections={sections} />, { withAuthProvider: false });

    expect(screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
      'Getting started',
      'Billing',
    ]);
    expect(screen.getByRole('button', { name: 'What is Quizzence?' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'How do tokens work?' })).toBeInTheDocument();
  });
});
