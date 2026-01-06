import React from 'react';
import { Card, CardBody } from '@/components';
import { ImagePlaceholder } from './ImagePlaceholder';

const FounderNote: React.FC = () => {
  return (
    <Card padding="lg">
      <CardBody className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-theme-text-primary mb-4">A note from the founder</h2>
          <div className="space-y-4 text-theme-text-secondary leading-relaxed">
            <p>
              I built Quizzence because I see knowledge as more than "nice to have". Knowledge is a practical tool for freedom: it helps us make better decisions, build careers, raise children, and understand the world with less dependence on other people's interpretations.
            </p>
            <p>
              But learning has become strangely harder in the modern world. We have more information than ever — and also more noise: repetition, confident nonsense, content optimized for attention rather than truth. Even with AI, this doesn't magically disappear. You can get answers faster, but it's still easy to drown in fluff.
            </p>
            <p>
              That's why I care not only about learning <em>more</em>, but about learning <em>better</em>: processing information in a way that turns it into understanding and skill — not just a temporary feeling of "I've read something".
            </p>
            <p className="font-semibold text-theme-text-primary">Less noise — more meaning.</p>
          </div>
        </div>
        
        <div className="bg-theme-bg-secondary rounded-lg p-4 border border-theme-border-primary">
          <p className="text-sm text-theme-text-secondary">
            <strong className="text-theme-text-primary">Educational note:</strong> A reliable marker of "I know this" is that you can <strong>recall</strong>, <strong>explain</strong>, and <strong>apply</strong> it without hints. If you can't, it's likely familiarity — not mastery.
          </p>
        </div>
      </CardBody>
    </Card>
  );
};

export default FounderNote;
