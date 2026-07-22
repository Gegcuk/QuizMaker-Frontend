import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import FaqIntroCard from './FaqIntroCard';

describe('FaqIntroCard', () => {
  it('shows the draft note and links readers to the values page', () => {
    renderWithProviders(
      <FaqIntroCard note="If something is limited, we say so clearly." />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Draft')).toBeInTheDocument();
    expect(screen.getByText('If something is limited, we say so clearly.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Values, Mission, and Vision' })).toHaveAttribute(
      'href',
      '/values',
    );
  });
});
