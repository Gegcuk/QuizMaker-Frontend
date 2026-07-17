import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '@/test/render';
import MediaPicker from './MediaPicker';
import type { MediaRefDto } from '../types/media.types';

const uploadState = vi.hoisted(() => ({
  clearError: vi.fn(),
  error: null as string | null,
  isUploading: false,
  uploadMedia: vi.fn(),
}));

vi.mock('../hooks/useMediaUpload', () => ({
  useMediaUpload: () => uploadState,
}));

const uploadedMedia: MediaRefDto = {
  assetId: '11111111-1111-1111-1111-111111111111',
  cdnUrl: 'https://cdn.example.com/diagram.png',
  width: 640,
  height: 480,
  mimeType: 'image/png',
};

describe('MediaPicker', () => {
  beforeEach(() => {
    uploadState.clearError.mockReset();
    uploadState.uploadMedia.mockReset();
    uploadState.error = null;
    uploadState.isUploading = false;
  });

  it('uploads a selected file and returns the stable media reference', async () => {
    uploadState.uploadMedia.mockResolvedValue(uploadedMedia);
    const onChange = vi.fn();
    const { container, user } = renderWithProviders(
      <MediaPicker label="Question image" onChange={onChange} options={{ allowedMimeTypes: ['image/png'] }} />,
      { withAuthProvider: false },
    );
    const file = new File(['image'], 'diagram.png', { type: 'image/png' });
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;

    expect(input).toHaveAttribute('accept', 'image/png');

    await user.upload(input, file);

    await waitFor(() => {
      expect(uploadState.uploadMedia).toHaveBeenCalledWith(file);
    });
    expect(onChange).toHaveBeenCalledWith(uploadedMedia);
    expect(uploadState.clearError).toHaveBeenCalled();
  });

  it('renders an existing preview and removes it without retaining upload state', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <MediaPicker value={uploadedMedia} onChange={onChange} removeLabel="Clear image" />,
      { withAuthProvider: false },
    );

    expect(screen.getByAltText('Uploaded media preview')).toHaveAttribute('src', uploadedMedia.cdnUrl);

    await user.click(screen.getByRole('button', { name: 'Clear image' }));

    expect(uploadState.clearError).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it('shows the upload-hook error and prevents interaction while disabled', async () => {
    uploadState.error = 'The selected image is too large.';
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <MediaPicker value={uploadedMedia} onChange={onChange} disabled uploadLabel="Choose image" />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('The selected image is too large.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Choose image' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(uploadState.clearError).not.toHaveBeenCalled();
  });
});
