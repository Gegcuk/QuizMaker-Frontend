import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import type { QuizDto } from '@/types';
import QuizExport from './QuizExport';

const mocks = vi.hoisted(() => ({
  createObjectURL: vi.fn((_blob: Blob) => 'blob:quiz-export'),
  exportQuizzes: vi.fn(),
  revokeObjectURL: vi.fn((_url: string) => undefined),
}));

vi.mock('../services/quiz.service', () => ({
  QuizService: class {
    exportQuizzes = mocks.exportQuizzes;
  },
}));

const quiz: QuizDto = {
  id: 'quiz-1',
  creatorId: 'user-1',
  title: 'Architecture Quiz',
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

describe('QuizExport', () => {
  beforeEach(() => {
    class URLMock extends URL {}
    URLMock.createObjectURL = mocks.createObjectURL;
    URLMock.revokeObjectURL = mocks.revokeObjectURL;

    vi.stubGlobal('URL', URLMock);
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('sanitizes editable JSON exports before downloading them', async () => {
    mocks.exportQuizzes.mockResolvedValue(new Blob([
      JSON.stringify({
        questions: [
          {
            attachment: {
              assetId: 'attachment-asset',
              cdnUrl: 'https://cdn.example.test/attachment.png',
              signedUrl: 'https://signed.example.test/attachment.png',
            },
            content: {
              options: [
                {
                  id: 'a',
                  text: 'Answer A',
                  media: {
                    assetId: 'option-asset',
                    cdnUrl: 'https://cdn.example.test/option.png',
                  },
                },
              ],
            },
          },
        ],
      }),
    ]));
    const { user } = renderWithProviders(<QuizExport quiz={quiz} />, { withAuthProvider: false });

    await user.click(screen.getByRole('button', { name: 'Export Quiz' }));
    await user.click(screen.getByRole('button', { name: /JSON Editable/ }));
    await user.click(screen.getByRole('button', { name: 'Export as JSON_EDITABLE' }));

    await waitFor(() => {
      expect(mocks.exportQuizzes).toHaveBeenCalledWith({
        format: 'JSON_EDITABLE',
        scope: 'me',
        quizIds: ['quiz-1'],
        includeCover: true,
        includeMetadata: true,
        answersOnSeparatePages: true,
        includeHints: false,
        includeExplanations: false,
        groupQuestionsByType: false,
      });
    });

    const downloadedBlob = mocks.createObjectURL.mock.calls.at(0)?.at(0);
    expect(downloadedBlob).toBeInstanceOf(Blob);
    if (!downloadedBlob) {
      throw new Error('Expected an exported download blob.');
    }
    const downloadedJson = JSON.parse(await downloadedBlob.text());

    expect(downloadedJson.questions[0]).toMatchObject({
      attachmentUrl: 'https://cdn.example.test/attachment.png',
      attachmentAssetId: 'attachment-asset',
      content: {
        options: [{ media: { assetId: 'option-asset' } }],
      },
    });
    expect(downloadedJson.questions[0].attachment).toBeUndefined();
    expect(downloadedJson.questions[0].content.options[0].media.cdnUrl).toBeUndefined();
    expect(mocks.revokeObjectURL).toHaveBeenCalledWith('blob:quiz-export');
  });
});
