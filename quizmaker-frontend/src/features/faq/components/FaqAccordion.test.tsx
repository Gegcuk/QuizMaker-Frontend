import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { FaqItem } from '../types/faq.types';
import FaqAccordion from './FaqAccordion';

const items: FaqItem[] = [
  {
    id: 'account',
    question: 'Do I need an account?',
    answer: [
      { type: 'paragraph', content: 'An account is required to save quiz progress.' },
      {
        type: 'list',
        items: [
          'Browse public pages without signing in.',
          { type: 'link', label: 'Create an account', to: '/register', description: 'Start learning.' },
        ],
      },
    ],
    note: { title: 'Learning note', content: 'Review mistakes after each attempt.', type: 'info' },
  },
  {
    id: 'mobile',
    question: 'Is there a mobile app?',
    answer: [{ type: 'subheading', content: 'Browser support' }],
  },
];

describe('FaqAccordion', () => {
  it('renders a default-expanded answer with accessible controls, links, and notes', () => {
    renderWithProviders(<FaqAccordion items={items} defaultExpandedIds={['account']} />, {
      withAuthProvider: false,
    });

    const accountButton = screen.getByRole('button', { name: 'Do I need an account?' });
    expect(accountButton).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('region')).toHaveAttribute('aria-labelledby', 'account-toggle');
    expect(screen.getByText('An account is required to save quiz progress.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/register');
    expect(screen.getByText('Learning note')).toBeInTheDocument();
  });

  it('toggles answers with pointer and keyboard interaction', async () => {
    const { user } = renderWithProviders(<FaqAccordion items={items} />, {
      withAuthProvider: false,
    });

    const accountButton = screen.getByRole('button', { name: 'Do I need an account?' });
    await user.click(accountButton);
    expect(accountButton).toHaveAttribute('aria-expanded', 'true');

    accountButton.focus();
    await user.keyboard('{Enter}');
    expect(accountButton).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('An account is required to save quiz progress.')).not.toBeInTheDocument();
  });
});
