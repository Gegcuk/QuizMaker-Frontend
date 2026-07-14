import { describe, expect, it } from 'vitest';
import {
  sanitizeComplianceContentForSubmission,
  sanitizeMatchingContentForSubmission,
  sanitizeOrderingContentForSubmission,
} from './contentSanitizer';

describe('question content media sanitizers', () => {
  it('keeps only stable asset IDs for compliance and ordering items', () => {
    expect(sanitizeComplianceContentForSubmission({
      statements: [
        {
          id: 1,
          compliant: true,
          media: {
            assetId: 'compliance-asset',
            cdnUrl: 'https://cdn.example.test/compliance.png',
            width: 120,
          },
        },
      ],
    })).toEqual({
      statements: [
        { id: 1, compliant: true, media: { assetId: 'compliance-asset' } },
      ],
    });

    expect(sanitizeOrderingContentForSubmission({
      items: [
        {
          id: 1,
          text: 'Prepare the diagram',
          media: {
            assetId: 'ordering-asset',
            cdnUrl: 'https://cdn.example.test/ordering.png',
          },
        },
      ],
    })).toEqual({
      items: [
        { id: 1, text: 'Prepare the diagram', media: { assetId: 'ordering-asset' } },
      ],
    });
  });

  it('keeps matching pairs intact while removing resolved media fields on both columns', () => {
    expect(sanitizeMatchingContentForSubmission({
      left: [
        {
          id: 1,
          matchId: 10,
          media: { assetId: 'left-asset', cdnUrl: 'https://cdn.example.test/left.png' },
        },
      ],
      right: [
        {
          id: 10,
          media: { assetId: 'right-asset', cdnUrl: 'https://cdn.example.test/right.png' },
        },
      ],
    })).toEqual({
      left: [{ id: 1, matchId: 10, media: { assetId: 'left-asset' } }],
      right: [{ id: 10, media: { assetId: 'right-asset' } }],
    });
  });
});
