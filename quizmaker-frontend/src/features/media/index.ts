// Media library feature exports
export { MediaService, mediaService } from './services/media.service';
export { MEDIA_ENDPOINTS } from './services/media.endpoints';
export { useMediaUpload } from './hooks/useMediaUpload';
export { default as MediaPicker } from './components/MediaPicker';

export type {
  MediaAssetListResponse,
  MediaAssetResponse,
  MediaAssetStatus,
  MediaAssetType,
  MediaRefDto,
  MediaSearchParams,
  MediaSearchResponse,
  MediaUploadCompleteRequest,
  MediaUploadRequest,
  MediaUploadResponse,
  UploadTargetDto,
} from './types/media.types';
