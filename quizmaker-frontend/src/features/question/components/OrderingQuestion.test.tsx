import { describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen, within } from '@/test/render';
import type { QuestionDto } from '@/types';
import OrderingQuestion from './OrderingQuestion';

const orderingQuestion: QuestionDto = {
  id: 'ordering-question',
  type: 'ORDERING',
  difficulty: 'MEDIUM',
  questionText: 'Arrange the lifecycle steps.',
  content: {
    items: [
      { id: 1, text: 'Collect requirements' },
      { id: 2, text: 'Design the system' },
      { id: 3, text: 'Implement the design' },
    ],
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  quizIds: [],
  tagIds: [],
};

const getDraggableRow = (text: string) => {
  const row = screen.getByText(text).closest('[draggable]');
  expect(row).not.toBeNull();
  return row as HTMLElement;
};

describe('OrderingQuestion', () => {
  it('renders the provided current answer order and progress', () => {
    const { container } = renderWithProviders(
      <OrderingQuestion question={orderingQuestion} currentAnswer={[3, 1, 2]} />,
      { withAuthProvider: false },
    );

    const rows = container.querySelectorAll('[draggable="true"]');
    expect(within(rows[0] as HTMLElement).getByText('Implement the design')).toBeInTheDocument();
    expect(within(rows[1] as HTMLElement).getByText('Collect requirements')).toBeInTheDocument();
    expect(within(rows[2] as HTMLElement).getByText('Design the system')).toBeInTheDocument();
    expect(screen.getByText('0 of 3 items in correct position')).toBeInTheDocument();
  });

  it('submits the reordered item ids after drag and drop', () => {
    const onAnswerChange = vi.fn();
    renderWithProviders(
      <OrderingQuestion question={orderingQuestion} onAnswerChange={onAnswerChange} />,
      { withAuthProvider: false },
    );

    const source = getDraggableRow('Collect requirements');
    const target = getDraggableRow('Design the system');
    const dataTransfer = { effectAllowed: '', dropEffect: '' };

    fireEvent.dragStart(source, { dataTransfer });
    fireEvent.dragOver(target, { dataTransfer });
    fireEvent.drop(target, { dataTransfer });
    fireEvent.dragEnd(source);

    expect(onAnswerChange).toHaveBeenCalledWith([2, 1, 3]);
  });

  it('shows correct and submitted orders in review mode', () => {
    renderWithProviders(
      <OrderingQuestion
        question={orderingQuestion}
        currentAnswer={[2, 1, 3]}
        showCorrectAnswer
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Correct Order')).toBeInTheDocument();
    expect(screen.getByText('Your Order')).toBeInTheDocument();
    expect(screen.getByText('You have 1 items in the correct position.')).toBeInTheDocument();
  });

  it('renders a media-only ordering item without requiring text', () => {
    renderWithProviders(
      <OrderingQuestion
        question={{
          ...orderingQuestion,
          content: {
            items: [
              { id: 1, media: { assetId: 'ordering-image', cdnUrl: 'https://cdn.example.test/ordering.png' } },
              { id: 2, text: 'Design the system' },
              { id: 3, text: 'Implement the design' },
            ],
          },
        }}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByAltText('Ordering item 1 media')).toHaveAttribute(
      'src',
      'https://cdn.example.test/ordering.png',
    );
  });
});
