import { describe, expect, it } from 'vitest';
import { MEDIA_ENDPOINTS } from './media.endpoints';

describe('MEDIA_ENDPOINTS', () => {
  it('matches every operation in the deployed media OpenAPI group', () => {
    expect(MEDIA_ENDPOINTS.CREATE_UPLOAD_INTENT).toBe('/v1/media/uploads');
    expect(MEDIA_ENDPOINTS.FINALIZE_UPLOAD('asset-1')).toBe(
      '/v1/media/uploads/asset-1/complete',
    );
    expect(MEDIA_ENDPOINTS.SEARCH).toBe('/v1/media');
    expect(MEDIA_ENDPOINTS.DELETE('asset-1')).toBe('/v1/media/asset-1');
  });

  it('retains the asset lookup path used by attempt and result rendering', () => {
    expect(MEDIA_ENDPOINTS.GET('asset-1')).toBe('/v1/media/asset-1');
  });
});
