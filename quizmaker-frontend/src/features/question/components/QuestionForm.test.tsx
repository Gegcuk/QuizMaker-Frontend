import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/render';
import type { HotspotContent, HotspotRegion, McqOption, OrderingItem, QuestionDto } from '@/types';
import QuestionForm from './QuestionForm';

const questionServiceMocks = vi.hoisted(() => ({
  createQuestion: vi.fn(),
  updateQuestion: vi.fn(),
  getQuestionById: vi.fn(),
}));

vi.mock('@/services', () => ({
  QuestionService: vi.fn(function QuestionService() {
    return questionServiceMocks;
  }),
  api: {},
}));

vi.mock('./McqQuestionEditor', async () => {
  const React = await import('react');

  const option = (id: string, text: string, correct = false): McqOption => ({
    id,
    text,
    correct,
  });

  const threeOptions = [
    option('a', 'Store genetic information'),
    option('b', 'Produce ATP', true),
    option('c', 'Transport proteins'),
  ];

  const validSingleOptions = [
    ...threeOptions,
    option('d', 'Break down waste'),
  ];

  const validMultiOptions = [
    option('a', 'Has hair or fur', true),
    option('b', 'Produces milk', true),
    option('c', 'Is warm-blooded', true),
    option('d', 'Exclusively lays eggs'),
  ];

  const sevenOptions = [
    ...validMultiOptions,
    option('e', 'Breathes with lungs'),
    option('f', 'Has a backbone'),
    option('g', 'Uses photosynthesis'),
  ];

  const McqQuestionEditorMock = ({
    onChange,
    isMultiSelect = false,
  }: {
    onChange: (content: { options: McqOption[] }) => void;
    isMultiSelect?: boolean;
  }) =>
    React.createElement(
      'div',
      { 'aria-label': isMultiSelect ? 'Mock multi-choice editor' : 'Mock single-choice editor' },
      React.createElement(
        'button',
        { type: 'button', onClick: () => onChange({ options: threeOptions }) },
        'Use three options',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: () => onChange({ options: validSingleOptions }) },
        'Use valid single options',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: () => onChange({ options: sevenOptions }) },
        'Use seven options',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: () => onChange({ options: validMultiOptions }) },
        'Use valid multi options',
      ),
    );

  return { default: McqQuestionEditorMock };
});

vi.mock('./OrderingEditor', async () => {
  const React = await import('react');

  const item = (id: number, text: string): OrderingItem => ({
    id,
    text,
  });

  const twoItems = [
    item(1, 'First step'),
    item(2, 'Second step'),
  ];

  const shortTextItems = [
    item(1, 'One'),
    item(2, 'Two'),
    item(3, 'Tri'),
  ];

  const validItems = [
    item(1, 'Collect requirements'),
    item(2, 'Design the system'),
    item(3, 'Implement the design'),
  ];

  const OrderingEditorMock = ({
    onChange,
  }: {
    onChange: (content: { items: OrderingItem[] }) => void;
  }) =>
    React.createElement(
      'div',
      { 'aria-label': 'Mock ordering editor' },
      React.createElement(
        'button',
        { type: 'button', onClick: () => onChange({ items: twoItems }) },
        'Use two ordering items',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: () => onChange({ items: shortTextItems }) },
        'Use short ordering text',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: () => onChange({ items: validItems }) },
        'Use valid ordering items',
      ),
    );

  return { default: OrderingEditorMock };
});

vi.mock('./HotspotEditor', async () => {
  const React = await import('react');

  const region = (
    id: number,
    x: number,
    y: number,
    width: number,
    height: number,
    correct: boolean,
  ): HotspotRegion => ({
    id,
    x,
    y,
    width,
    height,
    correct,
  });

  const oneRegion: HotspotContent = {
    imageUrl: 'https://cdn.example.com/cell.png',
    regions: [region(1, 10, 20, 30, 40, true)],
  };

  const duplicateIdRegions: HotspotContent = {
    imageUrl: 'https://cdn.example.com/cell.png',
    regions: [
      region(1, 10, 20, 30, 40, true),
      region(1, 50, 60, 10, 10, false),
    ],
  };

  const invalidGeometryRegions: HotspotContent = {
    imageUrl: 'https://cdn.example.com/cell.png',
    regions: [
      region(1, -1, 20, 30, 40, true),
      region(2, 50, 60, 10, 10, false),
    ],
  };

  const missingImage: HotspotContent = {
    imageUrl: '',
    regions: [
      region(1, 10, 20, 30, 40, true),
      region(2, 50, 60, 10, 10, false),
    ],
  };

  const validHotspot: HotspotContent = {
    imageUrl: 'https://cdn.example.com/cell.png',
    regions: [
      region(1, 10, 20, 30, 40, true),
      region(2, 50, 60, 10, 10, false),
    ],
  };

  const HotspotEditorMock = ({
    onChange,
  }: {
    onChange: (content: HotspotContent) => void;
  }) =>
    React.createElement(
      'div',
      { 'aria-label': 'Mock hotspot editor' },
      React.createElement(
        'button',
        { type: 'button', onClick: () => onChange(oneRegion) },
        'Use one hotspot region',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: () => onChange(duplicateIdRegions) },
        'Use duplicate hotspot ids',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: () => onChange(invalidGeometryRegions) },
        'Use invalid hotspot geometry',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: () => onChange(missingImage) },
        'Use hotspot without image',
      ),
      React.createElement(
        'button',
        { type: 'button', onClick: () => onChange(validHotspot) },
        'Use valid hotspot content',
      ),
    );

  return { default: HotspotEditorMock };
});

const fillQuestionText = (text = 'What is the main function of mitochondria?') => {
  fireEvent.change(screen.getByLabelText('Question Text'), {
    target: { value: text },
  });
};

const expectValidationMessage = (message: string) => {
  expect(screen.getAllByText(message).length).toBeGreaterThan(0);
};

const makeHotspotQuestion = (): QuestionDto => ({
  id: 'hotspot-question',
  type: 'HOTSPOT',
  difficulty: 'MEDIUM',
  questionText: 'Click the nucleus in this cell diagram.',
  content: {
    imageUrl: 'https://cdn.example.com/cell.png',
    regions: [
      { id: 1, x: 10, y: 20, width: 30, height: 40, correct: true },
      { id: 2, x: 50, y: 60, width: 10, height: 10, correct: false },
    ],
  },
  hint: '',
  explanation: '',
  attachmentUrl: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  quizIds: [],
  tagIds: [],
});

const renderHotspotEditForm = async (onSuccess = vi.fn()) => {
  questionServiceMocks.getQuestionById.mockResolvedValue(makeHotspotQuestion());
  const renderResult = renderWithProviders(
    <QuestionForm compact questionId="hotspot-question" onSuccess={onSuccess} />,
    { withAuthProvider: false },
  );

  await screen.findByDisplayValue('Click the nucleus in this cell diagram.');
  return renderResult;
};

describe('QuestionForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    questionServiceMocks.createQuestion.mockResolvedValue({ questionId: 'question-1' });
    questionServiceMocks.updateQuestion.mockResolvedValue(makeHotspotQuestion());
  });

  it('blocks MCQ_SINGLE submission unless exactly four options are present', async () => {
    const { user } = renderWithProviders(<QuestionForm compact />, {
      withAuthProvider: false,
    });

    await user.click(screen.getByRole('button', { name: /Single Choice/ }));
    fillQuestionText();
    await user.click(screen.getByRole('button', { name: 'Use three options' }));

    expectValidationMessage('Single-choice questions must have exactly 4 options.');
    expect(screen.getByRole('button', { name: 'Create Question' })).toBeDisabled();
    expect(questionServiceMocks.createQuestion).not.toHaveBeenCalled();
  });

  it('blocks MCQ_MULTI submission outside the live 4 to 6 option range', async () => {
    const { user } = renderWithProviders(<QuestionForm compact />, {
      withAuthProvider: false,
    });

    await user.click(screen.getByRole('button', { name: /Multiple Choice/ }));
    fillQuestionText('Which characteristics are associated with mammals?');
    await user.click(screen.getByRole('button', { name: 'Use seven options' }));

    expectValidationMessage('Multiple-choice questions must have 4 to 6 options.');
    expect(screen.getByRole('button', { name: 'Create Question' })).toBeDisabled();
    expect(questionServiceMocks.createQuestion).not.toHaveBeenCalled();
  });

  it('submits schema-sized MCQ_SINGLE content after validation passes', async () => {
    const onSuccess = vi.fn();
    const { user } = renderWithProviders(<QuestionForm compact onSuccess={onSuccess} />, {
      withAuthProvider: false,
    });

    await user.click(screen.getByRole('button', { name: /Single Choice/ }));
    fillQuestionText();
    await user.click(screen.getByRole('button', { name: 'Use valid single options' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create Question' })).toBeEnabled();
    });
    await user.click(screen.getByRole('button', { name: 'Create Question' }));

    await waitFor(() => {
      expect(questionServiceMocks.createQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'MCQ_SINGLE',
          questionText: 'What is the main function of mitochondria?',
          content: {
            options: [
              { id: 'a', text: 'Store genetic information', correct: false, media: undefined },
              { id: 'b', text: 'Produce ATP', correct: true, media: undefined },
              { id: 'c', text: 'Transport proteins', correct: false, media: undefined },
              { id: 'd', text: 'Break down waste', correct: false, media: undefined },
            ],
          },
        }),
      );
    });
    expect(onSuccess).toHaveBeenCalledWith({ questionId: 'question-1' });
  });

  it('blocks ORDERING submission outside the live 3 to 10 item range', async () => {
    const { user } = renderWithProviders(<QuestionForm compact />, {
      withAuthProvider: false,
    });

    await user.click(screen.getByRole('button', { name: /Ordering/ }));
    fillQuestionText('Arrange the project lifecycle steps.');
    await user.click(screen.getByRole('button', { name: 'Use two ordering items' }));

    expectValidationMessage('Ordering questions must have 3 to 10 items.');
    expect(screen.getByRole('button', { name: 'Create Question' })).toBeDisabled();
    expect(questionServiceMocks.createQuestion).not.toHaveBeenCalled();
  });

  it('blocks ORDERING submission when item text is too short for the live schema', async () => {
    const { user } = renderWithProviders(<QuestionForm compact />, {
      withAuthProvider: false,
    });

    await user.click(screen.getByRole('button', { name: /Ordering/ }));
    fillQuestionText('Arrange the project lifecycle steps.');
    await user.click(screen.getByRole('button', { name: 'Use short ordering text' }));

    expectValidationMessage('Each ordering item must have text of at least 5 characters or an image.');
    expect(screen.getByRole('button', { name: 'Create Question' })).toBeDisabled();
    expect(questionServiceMocks.createQuestion).not.toHaveBeenCalled();
  });

  it('submits schema-sized ORDERING content after validation passes', async () => {
    const onSuccess = vi.fn();
    const { user } = renderWithProviders(<QuestionForm compact onSuccess={onSuccess} />, {
      withAuthProvider: false,
    });

    await user.click(screen.getByRole('button', { name: /Ordering/ }));
    fillQuestionText('Arrange the project lifecycle steps.');
    await user.click(screen.getByRole('button', { name: 'Use valid ordering items' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create Question' })).toBeEnabled();
    });
    await user.click(screen.getByRole('button', { name: 'Create Question' }));

    await waitFor(() => {
      expect(questionServiceMocks.createQuestion).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'ORDERING',
          questionText: 'Arrange the project lifecycle steps.',
          content: {
            items: [
              { id: 1, text: 'Collect requirements' },
              { id: 2, text: 'Design the system' },
              { id: 3, text: 'Implement the design' },
            ],
          },
        }),
      );
    });
    expect(onSuccess).toHaveBeenCalledWith({ questionId: 'question-1' });
  });

  it('blocks HOTSPOT submission outside the live 2 to 6 region range', async () => {
    const { user } = await renderHotspotEditForm();

    await user.click(screen.getByRole('button', { name: 'Use one hotspot region' }));

    expectValidationMessage('Hotspot questions must have 2 to 6 regions.');
    expect(screen.getByRole('button', { name: 'Update Question' })).toBeDisabled();
    expect(questionServiceMocks.updateQuestion).not.toHaveBeenCalled();
  });

  it('blocks HOTSPOT submission without a live schema image URL', async () => {
    const { user } = await renderHotspotEditForm();

    await user.click(screen.getByRole('button', { name: 'Use hotspot without image' }));

    expectValidationMessage('Hotspot questions must include an image URL.');
    expect(screen.getByRole('button', { name: 'Update Question' })).toBeDisabled();
    expect(questionServiceMocks.updateQuestion).not.toHaveBeenCalled();
  });

  it('blocks HOTSPOT submission with duplicate region ids or invalid geometry', async () => {
    const { user } = await renderHotspotEditForm();

    await user.click(screen.getByRole('button', { name: 'Use duplicate hotspot ids' }));

    expectValidationMessage('Hotspot region IDs must be unique positive integers.');
    expect(screen.getByRole('button', { name: 'Update Question' })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Use invalid hotspot geometry' }));

    expectValidationMessage('Each hotspot region must use non-negative integer coordinates, dimensions, and a correct flag.');
    expect(screen.getByRole('button', { name: 'Update Question' })).toBeDisabled();
    expect(questionServiceMocks.updateQuestion).not.toHaveBeenCalled();
  });

  it('submits schema-sized HOTSPOT content after validation passes', async () => {
    const onSuccess = vi.fn();
    const { user } = await renderHotspotEditForm(onSuccess);

    await user.click(screen.getByRole('button', { name: 'Use valid hotspot content' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Update Question' })).toBeEnabled();
    });
    await user.click(screen.getByRole('button', { name: 'Update Question' }));

    await waitFor(() => {
      expect(questionServiceMocks.updateQuestion).toHaveBeenCalledWith(
        'hotspot-question',
        expect.objectContaining({
          type: 'HOTSPOT',
          questionText: 'Click the nucleus in this cell diagram.',
          content: {
            imageUrl: 'https://cdn.example.com/cell.png',
            regions: [
              { id: 1, x: 10, y: 20, width: 30, height: 40, correct: true },
              { id: 2, x: 50, y: 60, width: 10, height: 10, correct: false },
            ],
          },
        }),
      );
    });
    expect(onSuccess).toHaveBeenCalled();
  });
});
