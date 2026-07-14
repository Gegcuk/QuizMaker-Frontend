import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import type { CreateQuestionRequest, QuestionType } from '@/types';
import QuestionPreview from './QuestionPreview';

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
  MCQ_SINGLE: {
    options: [
      { id: 'a', text: 'Mitochondria', correct: true },
      { id: 'b', text: 'Nucleus', correct: false },
      { id: 'c', text: 'Ribosome', correct: false },
      { id: 'd', text: 'Golgi apparatus', correct: false },
    ],
  },
  MCQ_MULTI: {
    options: [
      { id: 'a', text: 'Hair', correct: true },
      { id: 'b', text: 'Milk production', correct: true },
      { id: 'c', text: 'Cold blood', correct: false },
      { id: 'd', text: 'Warm blood', correct: true },
    ],
  },
  TRUE_FALSE: { answer: false },
  OPEN: { answer: 'Cellular respiration produces ATP.' },
  FILL_GAP: {
    text: 'Cellular respiration produces {1}.',
    gaps: [{ id: 1, answer: 'ATP' }],
    options: ['ATP', 'DNA', 'RNA', 'glucose', 'oxygen', 'water', 'protein'],
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
  overrides: Partial<CreateQuestionRequest> = {},
): CreateQuestionRequest => ({
  type,
  difficulty: 'MEDIUM',
  questionText: 'Preview this schema-compatible question.',
  content: contentByType[type],
  ...overrides,
});

describe('QuestionPreview', () => {
  it.each([
    ['MCQ_SINGLE', 'Mitochondria'],
    ['MCQ_MULTI', 'Hair'],
    ['TRUE_FALSE', 'Correct Answer: False'],
    ['OPEN', 'Cellular respiration produces ATP.'],
    ['FILL_GAP', 'Answer: ATP'],
    ['COMPLIANCE', 'Consent is recorded.'],
    ['ORDERING', 'Collect requirements'],
    ['HOTSPOT', '2 hotspot region(s) defined'],
    ['MATCHING', 'Energy production'],
  ] as const)('previews schema-compatible %s content', (type, marker) => {
    renderWithProviders(<QuestionPreview question={makeQuestion(type)} />, {
      withAuthProvider: false,
    });

    expect(screen.getByText(marker)).toBeInTheDocument();
  });

  it('renders matching pairs instead of the unsupported preview fallback', () => {
    renderWithProviders(<QuestionPreview question={makeQuestion('MATCHING')} />, {
      withAuthProvider: false,
    });

    expect(screen.getByText('Mitochondria')).toBeInTheDocument();
    expect(screen.getByText('Energy production')).toBeInTheDocument();
    expect(screen.queryByText('Preview not available for this question type')).not.toBeInTheDocument();
  });

  it('renders resolved question and option media with missing-asset fallbacks', () => {
    const question = {
      ...makeQuestion('MCQ_SINGLE', {
        content: {
          options: [
            {
              id: 'a',
              media: {
                assetId: '11111111-1111-1111-1111-111111111111',
                cdnUrl: 'https://cdn.example.com/option.png',
              },
              correct: true,
            },
            {
              id: 'b',
              media: { assetId: '22222222-2222-2222-2222-222222222222' },
              correct: false,
            },
            { id: 'c', text: 'Text option', correct: false },
            { id: 'd', text: 'Another option', correct: false },
          ],
        },
      }),
      attachment: {
        assetId: '33333333-3333-3333-3333-333333333333',
        cdnUrl: 'https://cdn.example.com/question.png',
      },
    };

    renderWithProviders(<QuestionPreview question={question} />, {
      withAuthProvider: false,
    });

    expect(screen.getByAltText('Question attachment')).toHaveAttribute(
      'src',
      'https://cdn.example.com/question.png',
    );
    expect(screen.getByAltText('Option A media')).toHaveAttribute(
      'src',
      'https://cdn.example.com/option.png',
    );
    expect(screen.getAllByText('Image unavailable').length).toBeGreaterThan(0);
  });

  it('reports a question attachment asset that has no resolved URL', () => {
    renderWithProviders(
      <QuestionPreview
        question={{
          ...makeQuestion('TRUE_FALSE'),
          attachment: { assetId: '44444444-4444-4444-4444-444444444444' },
        }}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Attachment unavailable.')).toBeInTheDocument();
  });

  it('renders media-only compliance, ordering, and matching items', () => {
    const compliance = renderWithProviders(
      <QuestionPreview
        question={makeQuestion('COMPLIANCE', {
          content: {
            statements: [
              {
                id: 1,
                compliant: true,
                media: { assetId: 'statement-asset', cdnUrl: 'https://cdn.example.test/statement.png' },
              },
              { id: 2, text: 'Text statement', compliant: false },
            ],
          },
        })}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByAltText('Statement 1 media')).toHaveAttribute(
      'src',
      'https://cdn.example.test/statement.png',
    );
    compliance.unmount();

    const ordering = renderWithProviders(
      <QuestionPreview
        question={makeQuestion('ORDERING', {
          content: {
            items: [
              { id: 1, media: { assetId: 'ordering-asset', cdnUrl: 'https://cdn.example.test/ordering.png' } },
              { id: 2, text: 'Design the system' },
              { id: 3, text: 'Implement the design' },
            ],
          },
        })}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByAltText('Item 1 media')).toHaveAttribute(
      'src',
      'https://cdn.example.test/ordering.png',
    );
    ordering.unmount();

    renderWithProviders(
      <QuestionPreview
        question={makeQuestion('MATCHING', {
          content: {
            left: [
              { id: 1, matchId: 10, media: { assetId: 'left-asset', cdnUrl: 'https://cdn.example.test/left.png' } },
            ],
            right: [
              { id: 10, media: { assetId: 'right-asset', cdnUrl: 'https://cdn.example.test/right.png' } },
            ],
          },
        })}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByAltText('Left item 1 media')).toHaveAttribute(
      'src',
      'https://cdn.example.test/left.png',
    );
    expect(screen.getByAltText('Right item 10 media')).toHaveAttribute(
      'src',
      'https://cdn.example.test/right.png',
    );
  });

  it('sanitizes authored question HTML and preserves safe formatting', () => {
    const { container } = renderWithProviders(
      <QuestionPreview
        question={makeQuestion('TRUE_FALSE', {
          questionText: '<strong>Safe preview</strong><script>previewAttack()</script><img src=x onerror="attack()">',
        })}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Safe preview').tagName).toBe('STRONG');
    expect(container.querySelector('script')).not.toBeInTheDocument();
    expect(container.querySelector('img[onerror]')).not.toBeInTheDocument();
  });

  it('shows author metadata, tags, hint, and explanation', () => {
    renderWithProviders(
      <QuestionPreview
        question={makeQuestion('TRUE_FALSE', {
          difficulty: 'HARD',
          hint: 'Review the definition.',
          explanation: 'The statement is false.',
          tagIds: ['architecture', 'leadership'],
        })}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getAllByText('HARD')).toHaveLength(2);
    expect(screen.getByText('Review the definition.')).toBeInTheDocument();
    expect(screen.getByText('The statement is false.')).toBeInTheDocument();
    expect(screen.getByText('architecture, leadership')).toBeInTheDocument();
  });
});
