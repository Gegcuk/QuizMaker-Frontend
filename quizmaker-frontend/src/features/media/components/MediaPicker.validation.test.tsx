import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen } from '@/test/render';
import { diagnostics } from '@/features/diagnostics/reporter';
import MediaPicker from './MediaPicker';

afterEach(() => diagnostics.clear());

describe('MediaPicker with the real upload hook and error model', () => {
  it.each([
    ['empty', () => new File([], 'seeded-secret.png', { type: 'image/png' }), 'File is empty.'],
    ['oversized', () => new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'seeded-secret.png', { type: 'image/png' }), 'File is too large. Max size is 10.0 MB.'],
    ['unsupported', () => new File(['seeded-secret'], 'seeded-secret.svg', { type: 'image/svg+xml' }), 'Unsupported file type. Allowed: image/jpeg, image/png, image/gif, image/webp.'],
  ] as const)('shows %s file feedback', async (_kind, createFile, message) => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(<MediaPicker onChange={onChange} />, { withAuthProvider: false });
    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    fireEvent.change(input as HTMLInputElement, { target: { files: [createFile()] } });
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Upload image' })).toBeEnabled();
    expect(onChange).not.toHaveBeenCalled();
    expect(document.body).not.toHaveTextContent('seeded-secret');
  });
});
