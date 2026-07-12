import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import PageHeader from './PageHeader';

describe('PageHeader', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders heading details and runs back and confirmed actions', async () => {
    const onBack = vi.fn();
    const onDelete = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { user } = renderWithProviders(
      <PageHeader
        title="Quiz details"
        subtitle="Review configuration"
        showBackButton
        onBack={onBack}
        actions={[{ label: 'Delete', type: 'delete', confirmMessage: 'Delete quiz?', onClick: onDelete }]}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('heading', { name: 'Quiz details' })).toBeInTheDocument();
    expect(screen.getByText('Review configuration')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Go back' }));
    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(onBack).toHaveBeenCalledOnce();
    expect(window.confirm).toHaveBeenCalledWith('Delete quiz?');
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('does not run a destructive action when confirmation is declined', async () => {
    const onDelete = vi.fn();
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    const { user } = renderWithProviders(
      <PageHeader
        title="Quiz details"
        actions={[{ label: 'Delete', type: 'delete', confirmMessage: 'Delete quiz?', onClick: onDelete }]}
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).not.toHaveBeenCalled();
  });
});
