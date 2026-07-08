import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { QuestionDto, QuestionType } from '@/types';
import QuestionRenderer from './QuestionRenderer';

const mcqOptions = [
  { id: 'a', text: 'Mitochondria', correct: true },
  { id: 'b', text: 'Nucleus', correct: false },
  { id: 'c', text: 'Ribosome', correct: false },
  { id: 'd', text: 'Golgi apparatus', correct: false },
];

const matchingContent = {
  left: [
    { id: 1, text: 'Mitochondria', matchId: 1 },
    { id: 2, text: 'Ribosome', matchId: 2 },
    { id: 3, text: 'Nucleus', matchId: 3 },
    { id: 4, text: 'Golgi apparatus', matchId: 4 },
  ],
  right: [
    { id: 1, text: 'Energy production' },
    { id: 2, text: 'Protein synthesis' },
    { id: 3, text: 'Genetic information storage' },
    { id: 4, text: 'Protein packaging' },
  ],
};

const contentByType: Record<QuestionType, unknown> = {
  MCQ_SINGLE: { options: mcqOptions },
  MCQ_MULTI: { options: mcqOptions.map((option, index) => ({ ...option, correct: index < 2 })) },
  TRUE_FALSE: { answer: false },
  OPEN: { answer: 'A model answer.' },
  FILL_GAP: {
    text: 'Cellular respiration produces {1}.',
    gaps: [{ id: 1, answer: 'ATP' }],
  },
  COMPLIANCE: {
    statements: [
      { id: 1, text: 'Consent is recorded.', compliant: true },
      { id: 2, text: 'Consent is assumed.', compliant: false },
    ],
  },
  ORDERING: {
    items: [
      { id: 1, text: 'Collect requirements' },
      { id: 2, text: 'Design the system' },
      { id: 3, text: 'Implement the design' },
    ],
  },
  HOTSPOT: {
    imageUrl: 'https://cdn.example.com/cell.png',
    regions: [
      { id: 1, x: 10, y: 10, width: 20, height: 20, correct: true },
      { id: 2, x: 50, y: 50, width: 20, height: 20, correct: false },
    ],
  },
  MATCHING: matchingContent,
};

const makeQuestion = (
  type: QuestionType,
  overrides: Partial<QuestionDto> = {},
): QuestionDto => ({
  id: `question-${type.toLowerCase()}`,
  type,
  difficulty: 'MEDIUM',
  questionText: 'Render this schema-compatible question.',
  content: contentByType[type],
  hint: null,
  explanation: null,
  createdAt: '2026-07-08T10:00:00Z',
  updatedAt: '2026-07-08T10:00:00Z',
  quizIds: [],
  tagIds: [],
  ...overrides,
});

describe('QuestionRenderer', () => {
  it.each([
    ['MCQ_SINGLE', 'Select the one correct answer.'],
    ['MCQ_MULTI', 'Select all correct answers.'],
    ['TRUE_FALSE', 'Select whether the statement is True or False.'],
    ['OPEN', 'Your Answer'],
    ['FILL_GAP', 'Fill in each blank with the appropriate word or phrase.'],
    ['COMPLIANCE', 'Check the statements that are compliant with the requirements.'],
    ['ORDERING', 'Drag and drop the items to arrange them in the correct order.'],
    ['HOTSPOT', 'Click on the areas in the image that you believe are correct.'],
    ['MATCHING', 'Column A'],
  ] as const)('renders the %s question component', (type, marker) => {
    renderWithProviders(<QuestionRenderer question={makeQuestion(type)} />, {
      withAuthProvider: false,
    });

    expect(screen.getByText(marker)).toBeInTheDocument();
  });

  it('forwards answer changes and disabled state to the selected renderer', async () => {
    const onAnswerChange = vi.fn();
    const { user, rerender } = renderWithProviders(
      <QuestionRenderer
        question={makeQuestion('MCQ_SINGLE')}
        onAnswerChange={onAnswerChange}
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByLabelText('Select option A'));
    expect(onAnswerChange).toHaveBeenCalledWith('a');

    rerender(
      <QuestionRenderer
        question={makeQuestion('MCQ_SINGLE')}
        onAnswerChange={onAnswerChange}
        disabled
      />,
    );
    await user.click(screen.getByLabelText('Select option B'));
    expect(onAnswerChange).toHaveBeenCalledTimes(1);
  });

  it('shows a stable fallback for null or malformed supported content', () => {
    const { rerender } = renderWithProviders(
      <QuestionRenderer question={makeQuestion('MCQ_SINGLE', { content: null })} />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Question content is unavailable or invalid.')).toBeInTheDocument();

    rerender(
      <QuestionRenderer
        question={makeQuestion('MATCHING', { content: { left: 'invalid', right: [] } })}
      />,
    );
    expect(screen.getByText('Question content is unavailable or invalid.')).toBeInTheDocument();
  });

  it('shows the unsupported-type fallback without attempting a renderer', () => {
    const question = {
      ...makeQuestion('MCQ_SINGLE'),
      type: 'UNKNOWN' as QuestionType,
      content: {},
    };

    renderWithProviders(<QuestionRenderer question={question} />, {
      withAuthProvider: false,
    });

    expect(screen.getByText('Unsupported Question Type')).toBeInTheDocument();
    expect(screen.getByText(/Question type "UNKNOWN" is not supported/)).toBeInTheDocument();
  });

  it('renders resolved attachments first and reports unresolved asset references', () => {
    const { rerender } = renderWithProviders(
      <QuestionRenderer
        question={makeQuestion('TRUE_FALSE', {
          attachment: {
            assetId: '11111111-1111-1111-1111-111111111111',
            cdnUrl: 'https://cdn.example.com/resolved.png',
          },
          attachmentUrl: 'https://legacy.example.com/legacy.png',
        })}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByAltText('Question attachment')).toHaveAttribute(
      'src',
      'https://cdn.example.com/resolved.png',
    );

    rerender(
      <QuestionRenderer
        question={makeQuestion('TRUE_FALSE', {
          attachment: { assetId: '22222222-2222-2222-2222-222222222222' },
          attachmentUrl: null,
        })}
      />,
    );
    expect(screen.getByText('Attachment unavailable.')).toBeInTheDocument();
  });

  it('sanitizes authored prompt, option, and explanation HTML while preserving formatting', () => {
    const question = makeQuestion('MCQ_SINGLE', {
      questionText: '<strong>Safe prompt</strong><script>promptAttack()</script>',
      content: {
        options: [
          { id: 'a', text: '<em>Safe option</em><img src=x onerror="optionAttack()">', correct: true },
          ...mcqOptions.slice(1),
        ],
      },
      explanation: '<strong>Safe explanation</strong><script>explanationAttack()</script>',
    });

    const { container } = renderWithProviders(
      <QuestionRenderer question={question} showCorrectAnswer />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Safe prompt').tagName).toBe('STRONG');
    expect(screen.getByText('Safe option').tagName).toBe('EM');
    expect(screen.getByText('Safe explanation').tagName).toBe('STRONG');
    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(container.querySelector('img[onerror]')).not.toBeInTheDocument();
  });

  it.each([
    ['OPEN', { answer: '<strong>Safe answer</strong><script>attack()</script>' }],
    ['COMPLIANCE', {
      statements: [
        { id: 1, text: '<strong>Safe statement</strong><script>attack()</script>', compliant: true },
        { id: 2, text: 'Second statement', compliant: false },
      ],
    }],
    ['ORDERING', {
      items: [
        { id: 1, text: '<strong>Safe item</strong><script>attack()</script>' },
        { id: 2, text: 'Second item' },
        { id: 3, text: 'Third item' },
      ],
    }],
  ] as const)('sanitizes rich content rendered by %s', (type, content) => {
    const { container } = renderWithProviders(
      <QuestionRenderer
        question={makeQuestion(type, { content })}
        showCorrectAnswer
      />,
      { withAuthProvider: false },
    );

    expect(container.querySelector('strong')).toBeInTheDocument();
    expect(container.querySelector('script')).not.toBeInTheDocument();
  });

  it('shows hint and explanation only in their intended states', () => {
    const question = makeQuestion('TRUE_FALSE', {
      hint: 'Review the definition.',
      explanation: 'The statement is false.',
    });
    const { rerender } = renderWithProviders(
      <QuestionRenderer question={question} />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Review the definition.')).toBeInTheDocument();
    expect(screen.queryByText('The statement is false.')).not.toBeInTheDocument();

    rerender(<QuestionRenderer question={question} showCorrectAnswer />);
    expect(screen.getByText('The statement is false.')).toBeInTheDocument();
  });
});
