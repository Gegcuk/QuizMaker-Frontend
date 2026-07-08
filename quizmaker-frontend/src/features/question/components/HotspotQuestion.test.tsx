import { describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen } from '@/test/render';
import type { QuestionDto } from '@/types';
import HotspotQuestion from './HotspotQuestion';

const makeQuestion = (imageUrl = 'https://cdn.example.com/cell.png'): QuestionDto => ({
  id: 'hotspot-question',
  type: 'HOTSPOT',
  difficulty: 'MEDIUM',
  questionText: 'Click the target regions.',
  content: {
    imageUrl,
    regions: [
      { id: 1, x: 10, y: 10, width: 20, height: 20, correct: true },
      { id: 2, x: 60, y: 60, width: 20, height: 20, correct: false },
    ],
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  quizIds: [],
  tagIds: [],
});

const getHotspotCanvas = () => {
  const canvas = screen.getByAltText('Hotspot question image').parentElement;
  expect(canvas).not.toBeNull();

  vi.spyOn(canvas as HTMLElement, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: 0,
    left: 0,
    top: 0,
    right: 100,
    bottom: 100,
    width: 100,
    height: 100,
    toJSON: () => ({}),
  } as DOMRect);

  return canvas as HTMLElement;
};

describe('HotspotQuestion', () => {
  it('submits clicked hotspot regions and toggles repeat clicks', () => {
    const onAnswerChange = vi.fn();
    renderWithProviders(
      <HotspotQuestion question={makeQuestion()} onAnswerChange={onAnswerChange} />,
      { withAuthProvider: false },
    );

    const canvas = getHotspotCanvas();
    fireEvent.click(canvas, { clientX: 20, clientY: 20 });
    fireEvent.click(canvas, { clientX: 20, clientY: 20 });

    expect(onAnswerChange).toHaveBeenNthCalledWith(1, [1]);
    expect(onAnswerChange).toHaveBeenNthCalledWith(2, []);
    expect(screen.getByText('0 regions clicked')).toBeInTheDocument();
  });

  it('syncs clicked regions when the parent currentAnswer changes', () => {
    const { rerender } = renderWithProviders(
      <HotspotQuestion question={makeQuestion()} currentAnswer={[2]} />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('1 region clicked')).toBeInTheDocument();

    rerender(<HotspotQuestion question={makeQuestion()} currentAnswer={[1, 2]} />);

    expect(screen.getByText('2 regions clicked')).toBeInTheDocument();
  });

  it('does not submit clicks while disabled', () => {
    const onAnswerChange = vi.fn();
    renderWithProviders(
      <HotspotQuestion
        question={makeQuestion()}
        onAnswerChange={onAnswerChange}
        disabled
      />,
      { withAuthProvider: false },
    );

    fireEvent.click(getHotspotCanvas(), { clientX: 20, clientY: 20 });

    expect(onAnswerChange).not.toHaveBeenCalled();
  });

  it('shows review analysis and handles missing image content', () => {
    const { rerender } = renderWithProviders(
      <HotspotQuestion
        question={makeQuestion()}
        currentAnswer={[1, 2]}
        showCorrectAnswer
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Hotspot Analysis')).toBeInTheDocument();
    expect(screen.getByText('Correct Regions')).toBeInTheDocument();
    expect(screen.getByText('Your Clicks')).toBeInTheDocument();
    expect(screen.getByText('Correctly clicked regions:')).toBeInTheDocument();

    rerender(<HotspotQuestion question={makeQuestion('')} />);

    expect(screen.getByText('No image provided')).toBeInTheDocument();
  });
});
