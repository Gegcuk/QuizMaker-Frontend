import { fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import AddItemButton from './AddItemButton';
import Avatar from './Avatar';
import Breadcrumb from './Breadcrumb';
import BulletList from './BulletList';
import Card, { CardActions, CardBody, CardFooter, CardHeader } from './Card';
import Chart from './Chart';
import Chip from './Chip';
import Hint from './Hint';
import ProgressBar from './ProgressBar';
import Rating from './Rating';
import ValidationMessage from './ValidationMessage';

describe('shared display and feedback components', () => {
  it('invokes add-item actions and respects their disabled state', async () => {
    const onClick = vi.fn();
    const { user, rerender } = renderWithProviders(
      <AddItemButton itemType="question" onClick={onClick} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Add question' }));
    expect(onClick).toHaveBeenCalledOnce();

    rerender(<AddItemButton itemType="question" onClick={onClick} disabled />);
    await user.click(screen.getByRole('button', { name: 'Add question' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('uses initials after an avatar image fails and preserves its click action', () => {
    const onClick = vi.fn();
    renderWithProviders(
      <Avatar src="/missing-avatar.png" alt="Aleksei avatar" name="Aleksei Lazunin" status="online" onClick={onClick} />,
      { withAuthProvider: false },
    );

    const image = screen.getByRole('img', { name: 'Aleksei avatar' });
    fireEvent.click(image);
    fireEvent.error(image);

    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByText('AL')).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Aleksei avatar' })).not.toBeInTheDocument();
  });

  it('marks the current breadcrumb and keeps navigable breadcrumb links', () => {
    renderWithProviders(
      <Breadcrumb
        items={[
          { label: 'My quizzes', href: '/my-quizzes' },
          { label: 'Architecture basics', current: true },
        ]}
      />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My quizzes' })).toHaveAttribute('href', '/my-quizzes');
    expect(screen.getByText('Architecture basics')).toHaveAttribute('aria-current', 'page');
  });

  it('renders supplied bullet-list items and consumer-provided list children', () => {
    const { rerender } = renderWithProviders(
      <BulletList items={[{ id: 'one', content: 'First requirement' }]} />,
      { withAuthProvider: false },
    );

    expect(screen.getByRole('list')).toHaveTextContent('First requirement');

    rerender(
      <BulletList>
        <li>Custom requirement</li>
      </BulletList>,
    );
    expect(screen.getByRole('list')).toHaveTextContent('Custom requirement');
  });

  it('composes card slots and invokes the card action', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <Card selected onClick={onClick}>
        <CardHeader>Quiz details</CardHeader>
        <CardBody>Architecture fundamentals</CardBody>
        <CardFooter>Updated today</CardFooter>
        <CardActions align="right"><span>Edit actions</span></CardActions>
      </Card>,
      { withAuthProvider: false },
    );

    const card = screen.getByText('Architecture fundamentals').parentElement;
    expect(card).toHaveClass('ring-2', 'ring-theme-interactive-primary');
    expect(screen.getByText('Edit actions').parentElement).toHaveClass('justify-end');

    await user.click(card!);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('uses button semantics for interactive chips and disables their action', async () => {
    const onClick = vi.fn();
    const { user, rerender } = renderWithProviders(
      <Chip label="TypeScript" selected onClick={onClick} />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'TypeScript' }));
    expect(onClick).toHaveBeenCalledOnce();

    rerender(<Chip label="TypeScript" selected onClick={onClick} disabled />);
    expect(screen.getByRole('button', { name: 'TypeScript' })).toBeDisabled();
  });

  it('opens click-triggered hints and dismisses them after an outside click', async () => {
    const { user } = renderWithProviders(
      <Hint content="This hint explains the setting" trigger="click" />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByRole('button', { name: 'Show hint' }));
    expect(screen.getByRole('tooltip')).toHaveTextContent('This hint explains the setting');

    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('exposes progress semantics and clamps the visual progress to its range', () => {
    renderWithProviders(
      <ProgressBar value={160} max={100} label="Quiz completion" showPercentage />,
      { withAuthProvider: false },
    );

    const progressbar = screen.getByRole('progressbar', { name: 'Quiz completion' });
    expect(progressbar).toHaveAttribute('aria-valuenow', '160');
    expect(progressbar).toHaveAttribute('aria-valuemin', '0');
    expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    expect(progressbar).toHaveStyle({ width: '100%' });
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('passes selected chart data points to consumers', async () => {
    const onDataPointClick = vi.fn();
    const { user } = renderWithProviders(
      <Chart
        type="bar"
        title="Question difficulty"
        data={[{ label: 'Easy', value: 3 }, { label: 'Hard', value: 1 }]}
        onDataPointClick={onDataPointClick}
      />,
      { withAuthProvider: false },
    );

    await user.click(screen.getByTitle('Easy: 3'));
    expect(onDataPointClick).toHaveBeenCalledWith({ label: 'Easy', value: 3 }, 0);
  });

  it('updates ratings and keeps read-only ratings immutable', () => {
    const onChange = vi.fn();
    const { container, rerender } = renderWithProviders(
      <Rating value={2} onChange={onChange} showValue showLabel />,
      { withAuthProvider: false },
    );

    const stars = container.querySelectorAll('svg');
    fireEvent.click(stars[3]);
    expect(onChange).toHaveBeenCalledWith(4);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Fair')).toBeInTheDocument();

    rerender(<Rating value={2} onChange={onChange} readOnly />);
    fireEvent.click(container.querySelectorAll('svg')[3]);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('renders validation alerts only when a message is present', () => {
    const { rerender } = renderWithProviders(<ValidationMessage />, { withAuthProvider: false });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    rerender(<ValidationMessage id="title-error" type="warning" message="A title is required" />);
    expect(screen.getByRole('alert')).toHaveAttribute('id', 'title-error');
    expect(screen.getByRole('alert')).toHaveTextContent('A title is required');
  });
});
