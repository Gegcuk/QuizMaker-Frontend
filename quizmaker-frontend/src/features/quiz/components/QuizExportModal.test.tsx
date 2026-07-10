import { describe, expect, it, vi } from 'vitest';
import { act, renderWithProviders, screen, waitFor } from '@/test/render';
import type { QuizDto } from '@/types';
import QuizExportModal, { type ExportOptions } from './QuizExportModal';

const quiz: QuizDto = {
  id: 'quiz-1',
  creatorId: 'user-1',
  title: 'Architecture Quiz',
  description: 'Export configuration fixture.',
  visibility: 'PRIVATE',
  difficulty: 'MEDIUM',
  status: 'DRAFT',
  estimatedTime: 10,
  isRepetitionEnabled: false,
  timerEnabled: false,
  timerDuration: 0,
  tagIds: [],
  createdAt: '2026-07-10T12:00:00Z',
  updatedAt: '2026-07-10T12:00:00Z',
};

const renderModal = ({
  onClose = vi.fn(),
  onExport = vi.fn().mockResolvedValue(undefined),
}: {
  onClose?: () => void;
  onExport?: (format: string, options: ExportOptions) => Promise<void>;
} = {}) =>
  renderWithProviders(
    <QuizExportModal isOpen onClose={onClose} onExport={onExport} quiz={quiz} />,
    { withAuthProvider: false },
  );

describe('QuizExportModal', () => {
  it('associates print-option labels and sends the configured JSON export options', async () => {
    const onClose = vi.fn();
    const onExport = vi.fn().mockResolvedValue(undefined);
    const { user } = renderModal({ onClose, onExport });

    const includeCover = screen.getByRole('checkbox', { name: /Include Cover Page/ });
    expect(includeCover).toBeChecked();

    await user.click(includeCover);
    expect(includeCover).not.toBeChecked();

    await user.click(screen.getByRole('button', { name: /JSON Editable/ }));
    expect(screen.queryByText('Print Options')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Export as JSON_EDITABLE' }));

    await waitFor(() => {
      expect(onExport).toHaveBeenCalledWith('JSON_EDITABLE', {
        format: 'JSON_EDITABLE',
        includeCover: false,
        includeMetadata: true,
        answersOnSeparatePages: true,
        includeHints: false,
        includeExplanations: false,
        groupQuestionsByType: false,
      });
    });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('prevents duplicate export submissions while the export is running', async () => {
    let resolveExport: (() => void) | undefined;
    const pendingExport = new Promise<void>((resolve) => {
      resolveExport = resolve;
    });
    const onExport = vi.fn(() => pendingExport);
    const { user } = renderModal({ onExport });

    const exportButton = screen.getByRole('button', { name: 'Export as PDF_PRINT' });
    await user.click(exportButton);

    expect(onExport).toHaveBeenCalledOnce();
    expect(exportButton).toBeDisabled();

    await user.click(exportButton);
    expect(onExport).toHaveBeenCalledOnce();

    expect(resolveExport).toBeDefined();
    await act(async () => {
      resolveExport?.();
    });
  });
});
