import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen } from '@/test/render';
import QuestionEditor from './QuestionEditor';

const execCommand = vi.fn();

describe('QuestionEditor', () => {
  beforeEach(() => {
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
      writable: true,
    });
    execCommand.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes content and reports rich-text input changes', () => {
    const onChange = vi.fn();
    const { container } = renderWithProviders(
      <QuestionEditor content="<p>Initial question</p>" onChange={onChange} />,
      { withAuthProvider: false },
    );
    const editor = container.querySelector('[contenteditable="true"]') as HTMLDivElement;

    expect(editor.innerHTML).toBe('<p>Initial question</p>');

    editor.innerHTML = '<p>Updated question</p>';
    fireEvent.input(editor);

    expect(onChange).toHaveBeenCalledWith('<p>Updated question</p>');
  });

  it('executes toolbar formatting commands and respects disabled mode', async () => {
    const { container, rerender, user } = renderWithProviders(
      <QuestionEditor content="Question" onChange={vi.fn()} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByTitle('Bold'));
    expect(execCommand).toHaveBeenCalledWith('bold', false, undefined);

    rerender(<QuestionEditor content="Question" onChange={vi.fn()} disabled />);

    expect(screen.getByTitle('Bold')).toBeDisabled();
    expect(container.querySelector('[contenteditable="false"]')).toBeInTheDocument();
  });
});
