import { describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/render';
import type { HotspotContent } from '@/types';
import HotspotEditor from './HotspotEditor';

const hotspotContent: HotspotContent = {
  imageUrl: 'https://cdn.example.com/cell.png',
  regions: [
    { id: 1, x: 10, y: 20, width: 30, height: 40, correct: true },
    { id: 2, x: 55, y: 60, width: 15, height: 15, correct: false },
  ],
};

const fiveRegionContent: HotspotContent = {
  imageUrl: 'https://cdn.example.com/cell.png',
  regions: Array.from({ length: 5 }, (_, index) => ({
    id: index + 1,
    x: 10 + index,
    y: 20 + index,
    width: 15,
    height: 15,
    correct: index === 0,
  })),
};

const oversizedContent: HotspotContent = {
  imageUrl: 'https://cdn.example.com/cell.png',
  regions: Array.from({ length: 7 }, (_, index) => ({
    id: index + 1,
    x: 10 + index,
    y: 20 + index,
    width: 15,
    height: 15,
    correct: index === 0,
  })),
};

const getLastChange = (onChange: ReturnType<typeof vi.fn>) =>
  onChange.mock.calls.at(-1)?.[0] as HotspotContent | undefined;

describe('HotspotEditor', () => {
  it('loads saved image and regions while emitting the HOTSPOT content shape', async () => {
    const onChange = vi.fn();

    renderWithProviders(
      <HotspotEditor content={hotspotContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    expect(screen.getByLabelText(/Image/)).toHaveValue('https://cdn.example.com/cell.png');
    expect(screen.getAllByText('Region 1').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Region 2').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'Add Region' })).toBeEnabled();
    screen.getAllByLabelText(/Remove region/).forEach((button) => {
      expect(button).toBeDisabled();
    });

    await waitFor(() => {
      expect(getLastChange(onChange)).toEqual(hotspotContent);
    });
  });

  it('normalizes empty content to the backend minimum of two regions', async () => {
    const onChange = vi.fn();

    renderWithProviders(
      <HotspotEditor content={{ imageUrl: '', regions: [] }} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('2 regions')).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Remove region/)).toHaveLength(2);

    await waitFor(() => {
      expect(getLastChange(onChange)).toEqual({
        imageUrl: '',
        regions: [
          { id: 1, x: 20, y: 20, width: 15, height: 15, correct: true },
          { id: 2, x: 40, y: 20, width: 15, height: 15, correct: false },
        ],
      });
    });
  });

  it('adds regions up to the backend maximum of six', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <HotspotEditor content={fiveRegionContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Add Region' }));

    await waitFor(() => {
      expect(getLastChange(onChange)?.regions).toHaveLength(6);
    });
    expect(screen.getByText('6 regions')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Region' })).toBeDisabled();
    expect(getLastChange(onChange)?.regions.map((region) => region.id)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('trims oversized initial content to the backend maximum of six regions', async () => {
    const onChange = vi.fn();

    renderWithProviders(
      <HotspotEditor content={oversizedContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('6 regions')).toBeInTheDocument();
    expect(screen.queryByText('Region 7')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(getLastChange(onChange)?.regions).toHaveLength(6);
    });
  });

  it('removes regions above the minimum and reindexes ids', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <HotspotEditor
        content={{
          imageUrl: 'https://cdn.example.com/cell.png',
          regions: [
            ...hotspotContent.regions,
            { id: 3, x: 80, y: 80, width: 10, height: 10, correct: false },
          ],
        }}
        onChange={onChange}
        showPreview={false}
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByLabelText('Remove region 2'));

    await waitFor(() => {
      expect(getLastChange(onChange)?.regions).toEqual([
        { id: 1, x: 10, y: 20, width: 30, height: 40, correct: true },
        { id: 2, x: 80, y: 80, width: 10, height: 10, correct: false },
      ]);
    });
    screen.getAllByLabelText(/Remove region/).forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('updates selected region geometry and correctness with schema-safe values', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <HotspotEditor content={hotspotContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getAllByText('Region 1')[0]);
    fireEvent.change(screen.getByLabelText('X Position (%)'), {
      target: { value: '-12' },
    });
    fireEvent.change(screen.getByLabelText('Width (%)'), {
      target: { value: '25.8' },
    });
    await user.click(screen.getByLabelText('Toggle region 1 correctness'));

    await waitFor(() => {
      expect(getLastChange(onChange)?.regions[0]).toEqual({
        id: 1,
        x: 0,
        y: 20,
        width: 25,
        height: 40,
        correct: false,
      });
    });
  });
});
