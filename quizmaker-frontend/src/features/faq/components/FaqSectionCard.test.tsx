import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { FaqSection } from '../types/faq.types';
import FaqSectionCard from './FaqSectionCard';

const section: FaqSection = {
  id: 'access',
  title: 'Accounts and access',
  description: 'Sign in, verification, and account recovery.',
  items: [
    {
      id: 'verify-email',
      question: 'Do you verify emails?',
      answer: [{ type: 'paragraph', content: 'Yes, email verification is supported.' }],
    },
  ],
};

describe('FaqSectionCard', () => {
  it('renders section context and opens its accordion answer', async () => {
    const { user } = renderWithProviders(<FaqSectionCard section={section} />, {
      withAuthProvider: false,
    });

    expect(screen.getByRole('heading', { name: 'Accounts and access' })).toBeInTheDocument();
    expect(screen.getByText('Sign in, verification, and account recovery.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Do you verify emails?' }));
    expect(screen.getByText('Yes, email verification is supported.')).toBeInTheDocument();
  });
});
