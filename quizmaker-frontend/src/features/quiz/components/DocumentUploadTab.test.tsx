import { describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/render';
import { DocumentUploadTab } from './DocumentUploadTab';

const service = vi.hoisted(() => ({
  generateQuizFromUpload: vi.fn(),
  estimateFromText: vi.fn().mockReturnValue(null),
}));

vi.mock('@/services', () => ({
  api: {},
  QuizService: class {
    generateQuizFromUpload = service.generateQuizFromUpload;
  },
  tokenEstimationService: { estimateFromText: service.estimateFromText },
}));

vi.mock('@/features/ai', () => ({
  GenerationProgress: ({ jobId }: { jobId: string }) => <div>Generation job: {jobId}</div>,
  TokenEstimationDisplay: () => null,
}));

describe('DocumentUploadTab', () => {
  it('rejects an unsupported upload', async () => {
    renderWithProviders(<DocumentUploadTab />, { withAuthProvider: false });
    const file = new File(['image'], 'diagram.png', { type: 'image/png' });
    const upload = document.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(upload, { target: { files: [file] } });

    expect(screen.getByText(/File type not supported/)).toBeInTheDocument();
  });

  it('uploads a supported document and displays generation progress', async () => {
    service.generateQuizFromUpload.mockResolvedValue({ jobId: 'job-1' });
    const { user } = renderWithProviders(<DocumentUploadTab />, { withAuthProvider: false });
    const file = new File(['architecture'], 'architecture.pdf', { type: 'application/pdf' });
    const upload = document.querySelector('input[type="file"]') as HTMLInputElement;

    await user.upload(upload, file);
    expect(screen.getByText('architecture.pdf')).toBeInTheDocument();
    expect(screen.getByDisplayValue('architecture Quiz')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Upload Document & Start Quiz Generation' }));

    await waitFor(() => expect(service.generateQuizFromUpload).toHaveBeenCalledOnce());
    const formData = service.generateQuizFromUpload.mock.calls[0][0] as FormData;
    expect(formData.get('title')).toBe('architecture');
    expect(formData.get('quizTitle')).toBe('architecture Quiz');
    expect(screen.getByText('Generation job: job-1')).toBeInTheDocument();
  });
});
