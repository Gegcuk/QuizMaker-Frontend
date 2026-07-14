import { describe, expect, it, vi } from 'vitest';
import { fireEvent, renderWithProviders, screen, waitFor } from '@/test/render';
import type { ComplianceContent } from '@/types';
import ComplianceEditor from './ComplianceEditor';

const complianceContent: ComplianceContent = {
  statements: [
    {
      id: 1,
      text: 'Users can unsubscribe from marketing emails at any time.',
      compliant: true,
    },
    {
      id: 2,
      text: 'Customer emails are stored indefinitely without consent.',
      compliant: false,
    },
  ],
};

const sixStatementContent: ComplianceContent = {
  statements: Array.from({ length: 6 }, (_, index) => ({
    id: index + 1,
    text: `Statement ${index + 1}`,
    compliant: index % 2 === 0,
  })),
};

const getLastChange = (onChange: ReturnType<typeof vi.fn>) =>
  onChange.mock.calls.at(-1)?.[0] as ComplianceContent | undefined;

describe('ComplianceEditor', () => {
  it('emits existing statements and updates statement text plus compliance status', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <ComplianceEditor content={complianceContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(getLastChange(onChange)).toEqual(complianceContent);
    expect(screen.getByText('1 Compliant • 1 Non-compliant')).toBeInTheDocument();
    expect(screen.getAllByRole('radio', { name: 'Compliant' })[0]).toBeChecked();
    expect(screen.getAllByRole('radio', { name: 'Non-compliant' })[1]).toBeChecked();
    expect(screen.queryByText('Compliance Summary')).not.toBeInTheDocument();

    fireEvent.change(screen.getAllByPlaceholderText('Enter statement text...')[0], {
      target: { value: 'Consent is gathered before marketing emails are sent.' },
    });

    await waitFor(() => {
      expect(getLastChange(onChange)?.statements[0]).toEqual({
        id: 1,
        text: 'Consent is gathered before marketing emails are sent.',
        compliant: true,
      });
    });

    await screen.findByDisplayValue('Consent is gathered before marketing emails are sent.');
    fireEvent.click(screen.getAllByRole('radio', { name: 'Non-compliant' })[0]);

    await waitFor(() => {
      expect(getLastChange(onChange)?.statements[0]).toEqual({
        id: 1,
        text: 'Consent is gathered before marketing emails are sent.',
        compliant: false,
      });
    });
    expect(screen.getByText('0 Compliant • 2 Non-compliant')).toBeInTheDocument();
  });

  it('normalizes empty content to the backend minimum of two statements', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <ComplianceEditor content={{ statements: [] }} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    expect(screen.getAllByPlaceholderText('Enter statement text...')).toHaveLength(2);
    expect(screen.getByText('2 empty statements')).toBeInTheDocument();

    await waitFor(() => {
      expect(getLastChange(onChange)).toEqual({
        statements: [
          { id: 1, text: '', compliant: true },
          { id: 2, text: '', compliant: false },
        ],
      });
    });
  });

  it('prevents removing below two statements', async () => {
    const onChange = vi.fn();
    renderWithProviders(
      <ComplianceEditor content={complianceContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(screen.getAllByLabelText(/Remove statement/)).toHaveLength(2);
    screen.getAllByLabelText(/Remove statement/).forEach((button) => {
      expect(button).toBeDisabled();
    });
  });

  it('prevents adding beyond six statements', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <ComplianceEditor content={sixStatementContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(screen.getByRole('button', { name: 'Add Statement' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Add Statement' }));

    expect(getLastChange(onChange)?.statements).toHaveLength(6);
  });

  it('adds a unique statement id after a middle statement is removed', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <ComplianceEditor
        content={{
          statements: [
            { id: 1, text: 'Statement 1', compliant: true },
            { id: 2, text: 'Statement 2', compliant: false },
            { id: 3, text: 'Statement 3', compliant: true },
          ],
        }}
        onChange={onChange}
        showPreview={false}
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByLabelText('Remove statement 2'));
    await user.click(screen.getByRole('button', { name: 'Add Statement' }));

    await waitFor(() => {
      expect(getLastChange(onChange)?.statements.map((statement) => statement.id)).toEqual([
        1,
        3,
        4,
      ]);
    });
  });

  it('preserves a media-only statement for submission', async () => {
    const onChange = vi.fn();
    const mediaContent: ComplianceContent = {
      statements: [
        {
          id: 1,
          compliant: true,
          media: {
            assetId: 'statement-image',
            cdnUrl: 'https://cdn.example.test/statement.png',
          },
        },
        { id: 2, text: 'A text statement', compliant: false },
      ],
    };

    renderWithProviders(
      <ComplianceEditor content={mediaContent} onChange={onChange} showPreview={false} />,
      { withAuthProvider: false },
    );

    await waitFor(() => {
      expect(getLastChange(onChange)?.statements[0]).toEqual(mediaContent.statements[0]);
    });
    expect(screen.getByAltText('Uploaded media preview')).toHaveAttribute(
      'src',
      'https://cdn.example.test/statement.png',
    );
  });
});
