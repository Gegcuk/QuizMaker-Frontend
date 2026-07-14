import { describe, expect, it } from 'vitest';
import { sanitizeQuizExportBlob, sanitizeQuizExportPayload } from './quizExportSanitizer';

describe('quizExportSanitizer', () => {
  it('replaces resolved media details with portable attachment and asset references', () => {
    const sanitized = sanitizeQuizExportPayload({
      id: 'quiz-1',
      questions: [
        {
          id: 'question-1',
          attachment: {
            assetId: 'attachment-asset',
            cdnUrl: 'https://cdn.example.test/attachment.png',
            signedUrl: 'https://signed.example.test/attachment.png',
          },
          content: {
            options: [
              {
                id: 'a',
                text: 'Diagram answer',
                media: {
                  assetId: 'option-asset',
                  cdnUrl: 'https://cdn.example.test/option.png',
                  signedUrl: 'https://signed.example.test/option.png',
                },
              },
            ],
            statements: [
              {
                id: 1,
                compliant: true,
                media: {
                  assetId: 'statement-asset',
                  cdnUrl: 'https://cdn.example.test/statement.png',
                },
              },
            ],
            items: [
              {
                id: 1,
                media: {
                  assetId: 'ordering-asset',
                  cdnUrl: 'https://cdn.example.test/ordering.png',
                },
              },
            ],
            left: [
              {
                id: 1,
                matchId: 10,
                media: {
                  assetId: 'left-asset',
                  cdnUrl: 'https://cdn.example.test/left.png',
                },
              },
            ],
            right: [
              {
                id: 10,
                media: {
                  assetId: 'right-asset',
                  cdnUrl: 'https://cdn.example.test/right.png',
                },
              },
            ],
          },
        },
      ],
    });

    expect(sanitized).toEqual({
      id: 'quiz-1',
      questions: [
        {
          id: 'question-1',
          attachmentUrl: 'https://cdn.example.test/attachment.png',
          attachmentAssetId: 'attachment-asset',
          content: {
            options: [
              {
                id: 'a',
                text: 'Diagram answer',
                media: { assetId: 'option-asset' },
              },
            ],
            statements: [
              { id: 1, compliant: true, media: { assetId: 'statement-asset' } },
            ],
            items: [
              { id: 1, media: { assetId: 'ordering-asset' } },
            ],
            left: [
              { id: 1, matchId: 10, media: { assetId: 'left-asset' } },
            ],
            right: [
              { id: 10, media: { assetId: 'right-asset' } },
            ],
          },
        },
      ],
    });
  });

  it('sanitizes JSON blobs and preserves non-JSON exports unchanged', async () => {
    const jsonBlob = new Blob([
      JSON.stringify({
        questions: [
          {
            attachment: { assetId: 'attachment-asset', cdnUrl: 'https://cdn.example.test/attachment.png' },
            content: { options: [] },
          },
        ],
      }),
    ]);
    const nonJsonBlob = new Blob(['not-json']);

    const sanitizedJson = await sanitizeQuizExportBlob(jsonBlob);
    const untouched = await sanitizeQuizExportBlob(nonJsonBlob);

    await expect(sanitizedJson.text()).resolves.toContain('attachmentAssetId');
    await expect(sanitizedJson.text()).resolves.not.toContain('"attachment"');
    expect(untouched).toBe(nonJsonBlob);
  });
});
