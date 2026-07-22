import { describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/render';
import type { OrderingContent } from '@/types';
import OrderingEditor from './OrderingEditor';

const orderingContent: OrderingContent = {
  items: [
    { id: 1, text: 'Collect requirements' },
    { id: 2, text: 'Design the system' },
    { id: 3, text: 'Implement the design' },
  ],
};

const fourItemContent: OrderingContent = {
  items: [
    ...orderingContent.items,
    { id: 4, text: 'Deploy the release' },
  ],
};

const nineItemContent: OrderingContent = {
  items: Array.from({ length: 9 }, (_, index) => ({
    id: index + 1,
    text: `Sequence step ${index + 1}`,
  })),
};

const oversizedContent: OrderingContent = {
  items: Array.from({ length: 11 }, (_, index) => ({
    id: index + 1,
    text: `Sequence step ${index + 1}`,
  })),
};

const getLastChange = (onChange: ReturnType<typeof vi.fn>) =>
  onChange.mock.calls.at(-1)?.[0] as OrderingContent | undefined;

describe('OrderingEditor', () => {
  it('loads saved ordering items and emits the ORDERING content shape', async () => {
    const onChange = vi.fn();

    renderWithProviders(
      <OrderingEditor content={orderingContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Arrange items in the correct order')).toBeInTheDocument();
    expect(screen.getAllByPlaceholderText('Enter item text...')).toHaveLength(3);
    expect(screen.getByDisplayValue('Collect requirements')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Design the system')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Implement the design')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Item' })).toBeEnabled();
    screen.getAllByLabelText(/Remove item/).forEach((button) => {
      expect(button).toBeDisabled();
    });

    await waitFor(() => {
      expect(getLastChange(onChange)).toEqual(orderingContent);
    });
  });

  it('normalizes empty initial content to the backend minimum of three items', async () => {
    const onChange = vi.fn();

    renderWithProviders(
      <OrderingEditor content={{ items: [] }} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    expect(screen.getAllByPlaceholderText('Enter item text...')).toHaveLength(3);
    expect(screen.getByText('3 empty items')).toBeInTheDocument();

    await waitFor(() => {
      expect(getLastChange(onChange)).toEqual({
        items: [
          { id: 1, text: '' },
          { id: 2, text: '' },
          { id: 3, text: '' },
        ],
      });
    });
  });

  it('adds ordering items up to the backend maximum of ten', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <OrderingEditor content={nineItemContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Add Item' }));

    await waitFor(() => {
      expect(screen.getAllByPlaceholderText('Enter item text...')).toHaveLength(10);
    });
    expect(screen.getByRole('button', { name: 'Add Item' })).toBeDisabled();
    expect(getLastChange(onChange)?.items.map((item) => item.id)).toEqual([
      1,
      2,
      3,
      4,
      5,
      6,
      7,
      8,
      9,
      10,
    ]);
  });

  it('trims oversized initial content to the backend maximum of ten items', async () => {
    const onChange = vi.fn();

    renderWithProviders(
      <OrderingEditor content={oversizedContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    expect(screen.getAllByPlaceholderText('Enter item text...')).toHaveLength(10);
    expect(screen.queryByDisplayValue('Sequence step 11')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(getLastChange(onChange)?.items).toHaveLength(10);
    });
  });

  it('removes an item above the minimum and reindexes ids to match the visible order', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <OrderingEditor content={fourItemContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByLabelText('Remove item 2'));

    await waitFor(() => {
      expect(getLastChange(onChange)?.items).toEqual([
        { id: 1, text: 'Collect requirements' },
        { id: 2, text: 'Implement the design' },
        { id: 3, text: 'Deploy the release' },
      ]);
    });
    expect(screen.queryByDisplayValue('Design the system')).not.toBeInTheDocument();
    screen.getAllByLabelText(/Remove item/).forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('updates item text while preserving sequential ids', async () => {
    const onChange = vi.fn();

    renderWithProviders(
      <OrderingEditor content={orderingContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    fireEvent.change(screen.getAllByPlaceholderText('Enter item text...')[0], {
      target: { value: 'Gather stakeholder requirements' },
    });

    await waitFor(() => {
      expect(getLastChange(onChange)?.items[0]).toEqual({
        id: 1,
        text: 'Gather stakeholder requirements',
      });
      expect(getLastChange(onChange)?.items.map((item) => item.id)).toEqual([1, 2, 3]);
    });
  });

  it('preserves a media-only ordering item for submission', async () => {
    const onChange = vi.fn();
    const mediaContent: OrderingContent = {
      items: [
        {
          id: 1,
          media: {
            assetId: 'ordering-image',
            cdnUrl: 'https://cdn.example.test/ordering.png',
          },
        },
        { id: 2, text: 'Design the system' },
        { id: 3, text: 'Implement the design' },
      ],
    };

    renderWithProviders(
      <OrderingEditor content={mediaContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    await waitFor(() => {
      expect(getLastChange(onChange)?.items[0]).toEqual({
        ...mediaContent.items[0],
        text: '',
      });
    });
    expect(screen.getByAltText('Uploaded media preview')).toHaveAttribute(
      'src',
      'https://cdn.example.test/ordering.png',
    );
  });
});
