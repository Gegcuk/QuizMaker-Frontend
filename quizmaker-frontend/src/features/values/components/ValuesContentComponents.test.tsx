import { describe, expect, it } from 'vitest';
import { renderWithProviders, screen } from '@/test/render';
import EducatorsSection from './EducatorsSection';
import FounderNote from './FounderNote';
import HeroImagePlaceholder from './HeroImagePlaceholder';
import { ImagePlaceholder } from './ImagePlaceholder';
import ManipulationSection from './ManipulationSection';
import MissionSection from './MissionSection';
import ValuesPageContent from './ValuesPageContent';
import ValuesSection from './ValuesSection';
import VisionSection from './VisionSection';

describe('values content components', () => {
  it('renders the educator workflow copy and descriptive images', () => {
    renderWithProviders(<EducatorsSection />, { withAuthProvider: false });
    expect(screen.getByRole('heading', { name: 'How Quizzence helps teachers and educators' })).toBeInTheDocument();
    expect(screen.getByAltText('Workflow graphic showing quizzes simplifying teacher prep.')).toBeInTheDocument();
  });

  it('renders the founder note and its learning principle', () => {
    renderWithProviders(<FounderNote />, { withAuthProvider: false });
    expect(screen.getByRole('heading', { name: 'A note from the founder' })).toBeInTheDocument();
    expect(screen.getByText(/Less noise.*more meaning/)).toBeInTheDocument();
  });

  it('renders the eager hero image with accessible alternative text', () => {
    renderWithProviders(<HeroImagePlaceholder />, { withAuthProvider: false });
    const image = screen.getByAltText('Illustration of information noise filtered into structured knowledge and quiz cards.');
    expect(image).toHaveAttribute('src', '/values_hero.png');
    expect(image).toHaveAttribute('loading', 'eager');
  });

  it('renders image sources and a descriptive fallback placeholder', () => {
    const { rerender } = renderWithProviders(
      <ImagePlaceholder name="Learning image" width={320} height={180} description="Learning workflow" src="/image.png" alt="Learning workflow image" />,
      { withAuthProvider: false },
    );
    expect(screen.getByAltText('Learning workflow image')).toHaveAttribute('src', '/image.png');

    rerender(<ImagePlaceholder name="Learning image" width={320} height={180} description="Learning workflow" />);
    expect(screen.getByText('Learning image')).toBeInTheDocument();
    expect(screen.getByText('Learning workflow')).toBeInTheDocument();
  });

  it('renders the manipulation awareness section', () => {
    renderWithProviders(<ManipulationSection />, { withAuthProvider: false });
    expect(screen.getByRole('heading', { name: 'Why this also protects against manipulation' })).toBeInTheDocument();
    expect(screen.getByText(/Regularly testing recall/)).toBeInTheDocument();
  });

  it('renders the mission and learning-loop image', () => {
    renderWithProviders(<MissionSection />, { withAuthProvider: false });
    expect(screen.getByRole('heading', { name: 'Mission' })).toBeInTheDocument();
    expect(screen.getByAltText('Learning loop diagram showing the cycle of study, testing, feedback, and review.')).toBeInTheDocument();
  });

  it('renders the value cards and FAQ links', () => {
    renderWithProviders(<ValuesSection />, { withAuthProvider: false });
    expect(screen.getByRole('heading', { name: /Our values/ })).toBeInTheDocument();
    expect(screen.getByText(/1\) Transparency and openness/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'FAQ' })).not.toHaveLength(0);
  });

  it('renders the future-facing vision statement', () => {
    renderWithProviders(<VisionSection />, { withAuthProvider: false });
    expect(screen.getByRole('heading', { name: 'Vision' })).toBeInTheDocument();
    expect(screen.getByText(/A future where most people understand the value of knowledge/)).toBeInTheDocument();
  });

  it('composes all values page sections in reading order', () => {
    renderWithProviders(<ValuesPageContent />, { withAuthProvider: false });
    expect(screen.getByRole('heading', { name: 'A note from the founder' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Mission' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Vision' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'How Quizzence helps teachers and educators' })).toBeInTheDocument();
  });
});
