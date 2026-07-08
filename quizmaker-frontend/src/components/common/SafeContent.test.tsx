import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import SafeContent, { SafeLink } from './SafeContent';

describe('SafeContent', () => {
  it('renders markup as text unless HTML is explicitly enabled', () => {
    const { container } = renderWithProviders(
      <SafeContent content="<strong>Untrusted markup</strong>" />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('<strong>Untrusted markup</strong>')).toBeInTheDocument();
    expect(container.querySelector('strong')).not.toBeInTheDocument();
  });

  it('renders allowed formatting and removes executable markup', () => {
    const { container } = renderWithProviders(
      <SafeContent
        allowHtml
        content={'<h2>Heading</h2><p><strong>Safe</strong></p><script>attack()</script><img src="data:image/svg+xml,evil" onerror="attack()">'}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('heading', { name: 'Heading' })).toBeInTheDocument();
    expect(screen.getByText('Safe').tagName).toBe('STRONG');
    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(container.querySelector('[onerror]')).not.toBeInTheDocument();
    expect(container.querySelector('img')).not.toHaveAttribute('src');
  });

  it('adds reverse-tabnabbing protection to allowed external links', () => {
    renderWithProviders(
      <SafeContent
        allowHtml
        content={'<a href="https://example.com/docs" target="_blank" rel="opener">Docs</a>'}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute(
      'rel',
      'noopener noreferrer',
    );
  });
});

describe('SafeLink', () => {
  it('renders safe URLs as protected external links', () => {
    renderWithProviders(
      <SafeLink href="example.com/docs">Documentation</SafeLink>,
      { withAuthProvider: false },
    );

    const link = screen.getByRole('link', { name: 'Documentation' });
    expect(link).toHaveAttribute('href', 'https://example.com/docs');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('falls back to text for unsafe URLs', () => {
    renderWithProviders(
      <SafeLink href="javascript:alert(1)">Unsafe destination</SafeLink>,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Unsafe destination')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Unsafe destination' })).not.toBeInTheDocument();
  });
});
