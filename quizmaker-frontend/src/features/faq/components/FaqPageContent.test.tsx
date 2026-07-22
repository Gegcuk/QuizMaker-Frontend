import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { FaqSection } from '../types/faq.types';
import FaqPageContent from './FaqPageContent';

const sections: FaqSection[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    items: [
      {
        id: 'what-is-it',
        question: 'What is Quizzence?',
        answer: [{ type: 'paragraph', content: 'A practical quiz platform.' }],
      },
    ],
  },
];

describe('FaqPageContent', () => {
  it('composes the introductory note and supplied FAQ sections', () => {
    renderWithProviders(
      <FaqPageContent introNote="Content is updated as features change." sections={sections} />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Content is updated as features change.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Getting started' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'What is Quizzence?' })).toBeInTheDocument();
  });
});
