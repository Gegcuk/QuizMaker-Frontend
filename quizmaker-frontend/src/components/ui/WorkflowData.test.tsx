import { fireEvent, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import Checklist from './Checklist';
import FileUpload from './FileUpload';
import Form from './Form';
import FormField from './FormField';
import GroupedList from './GroupedList';
import ItemManagementContainer from './ItemManagementContainer';
import PageHeader from './PageHeader';
import QuestionEditorHeader from './QuestionEditorHeader';
import QuestionPreviewSection from './QuestionPreviewSection';
import SortDropdown from './SortDropdown';
import Table from './Table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './Tabs';

describe('shared workflow and data components', () => {
  it('renders checklist content and exposes list semantics', () => {
    renderWithProviders(
      <Checklist items={[{ id: 'contract', content: 'Verify the API contract' }]} />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('list')).toHaveTextContent('Verify the API contract');
    expect(screen.getByRole('listitem')).toHaveTextContent('Verify the API contract');
  });

  it('toggles grouped-list content and supports bulk expand and collapse', async () => {
    const { user, rerender } = renderWithProviders(
      <GroupedList
        groups={[
          { key: 'published', label: 'Published', items: ['Architecture'], activeCount: 1 },
          { key: 'drafts', label: 'Drafts', items: ['Security'] },
        ]}
        defaultExpandedGroups={['published']}
        itemLabel="quiz"
        itemLabelPlural="quizzes"
        renderItem={(item) => <span>{item}</span>}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Architecture')).toBeInTheDocument();
    expect(screen.queryByText('Security')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Drafts/ }));
    expect(screen.getByText('Security')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Collapse All' }));
    expect(screen.queryByText('Architecture')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Expand All' }));
    expect(screen.getByText('Architecture')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();

    rerender(<GroupedList groups={[]} renderItem={() => null} emptyMessage="No quizzes yet" />);
    expect(screen.getByText('No quizzes yet')).toBeInTheDocument();
  });

  it('validates uploaded files and lets consumers remove a selected preview', () => {
    const onFileSelect = vi.fn();
    const { container } = renderWithProviders(
      <FileUpload onFileSelect={onFileSelect} accept=".pdf" showPreview multiple maxFiles={2} />,
      { withAuthProvider: false },
    );
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    const validFile = new File(['quiz'], 'architecture.pdf', { type: 'application/pdf' });
    const invalidFile = new File(['quiz'], 'architecture.txt', { type: 'text/plain' });

    fireEvent.change(input!, { target: { files: [validFile] } });
    expect(onFileSelect).toHaveBeenCalledWith([validFile]);
    expect(screen.getByText('architecture.pdf')).toBeInTheDocument();

    fireEvent.click(container.querySelector('button')!);
    expect(onFileSelect).toHaveBeenLastCalledWith([]);

    fireEvent.change(input!, { target: { files: [invalidFile] } });
    expect(onFileSelect).toHaveBeenCalledTimes(2);
    expect(screen.getByText('File architecture.txt is not an accepted file type')).toBeInTheDocument();
  });

  it('validates form fields, clears errors after input, and submits registered values', async () => {
    const onSubmit = vi.fn();
    const { user } = renderWithProviders(
      <Form onSubmit={onSubmit}>
        <FormField name="title" label="Quiz title" required />
        <button type="submit">Save quiz</button>
      </Form>,
      { withAuthProvider: false },
    );
    const input = screen.getByRole('textbox', { name: /Quiz title/ });

    await user.click(input);
    await user.tab();
    expect(screen.getAllByText('Quiz title is required')).toHaveLength(2);

    await user.type(input, 'Architecture fundamentals');
    expect(screen.queryByText('Please fix the following errors:')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save quiz' }));
    expect(onSubmit).toHaveBeenCalledWith({ title: 'Architecture fundamentals' });
  });

  it('renders management and editor headings and conditionally exposes previews', () => {
    const { rerender } = renderWithProviders(
      <>
        <ItemManagementContainer title="Tags" helperText="Use up to ten tags"><span>TypeScript</span></ItemManagementContainer>
        <PageHeader title="Edit quiz" subtitle="Update the details" actions={<button type="button">Publish</button>} />
        <QuestionEditorHeader title="Options" description="Set available answers" itemCount={2} itemType="option" emptyCount={1} />
        <QuestionPreviewSection showPreview title="Question preview">A complete question</QuestionPreviewSection>
      </>,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('heading', { name: 'Tags' })).toBeInTheDocument();
    expect(screen.getByText('Use up to ten tags')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Edit quiz' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument();
    expect(screen.getByText('2 options')).toBeInTheDocument();
    expect(screen.getByText('1 empty option')).toBeInTheDocument();
    expect(screen.getByText('A complete question')).toBeInTheDocument();

    rerender(<QuestionPreviewSection showPreview={false}>A complete question</QuestionPreviewSection>);
    expect(screen.queryByText('A complete question')).not.toBeInTheDocument();
  });

  it('selects sort options and closes the menu after selection or outside interaction', async () => {
    const onChange = vi.fn();
    const { user } = renderWithProviders(
      <SortDropdown
        value="title"
        onChange={onChange}
        options={[{ value: 'title', label: 'Title' }, { value: 'created', label: 'Created' }]}
      />,
      { withAuthProvider: false },
    );

    const sortTrigger = screen.getByRole('button', { name: /Sort by: Title/ });
    await user.click(sortTrigger);
    await user.click(screen.getByRole('button', { name: 'Created' }));
    expect(onChange).toHaveBeenCalledWith('created');
    expect(screen.queryByRole('button', { name: 'Created' })).not.toBeInTheDocument();

    await user.click(sortTrigger);
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('button', { name: 'Created' })).not.toBeInTheDocument();
  });

  it('sorts table rows, reports selection changes, and retains row actions', async () => {
    const onSelectionChange = vi.fn();
    const onRowClick = vi.fn();
    const { user, container } = renderWithProviders(
      <Table
        data={[{ id: 'b', title: 'Beta' }, { id: 'a', title: 'Alpha' }]}
        columns={[{ key: 'title', header: 'Title', sortable: true }]}
        sortable
        selectable
        onSelectionChange={onSelectionChange}
        onRowClick={onRowClick}
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByText('Title'));
    const bodyRows = within(container.querySelector('tbody')!).getAllByRole('row');
    expect(bodyRows[0]).toHaveTextContent('Alpha');

    const checkboxes = within(container.querySelector('table')!).getAllByRole('checkbox');
    await user.click(checkboxes[1]);
    expect(onSelectionChange).toHaveBeenCalledWith(['a']);

    await user.click(screen.getByText('Beta'));
    expect(onRowClick).toHaveBeenCalledWith({ id: 'b', title: 'Beta' }, 1);
  });

  it('switches tab content and reports a controlled tab selection', async () => {
    const onValueChange = vi.fn();
    const { user } = renderWithProviders(
      <Tabs defaultValue="details" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
        </TabsList>
        <TabsContent value="details">Quiz details</TabsContent>
        <TabsContent value="questions">Quiz questions</TabsContent>
      </Tabs>,
      { withAuthProvider: false },
    );

    expect(screen.getByText('Quiz details')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Questions' }));
    expect(onValueChange).toHaveBeenCalledWith('questions');
    expect(screen.getByText('Quiz details')).toBeInTheDocument();
  });
});
