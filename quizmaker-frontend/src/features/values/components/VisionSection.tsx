import React from 'react';
import { Card, CardBody, CardHeader } from '@/components';

const VisionSection: React.FC = () => {
  return (
    <Card padding="lg">
      <CardHeader>
        <h2 className="text-2xl font-bold text-theme-text-primary">Vision</h2>
      </CardHeader>
      <CardBody>
        <p className="text-lg text-theme-text-secondary leading-relaxed">
          A future where most people understand the value of knowledge and have the basic tools to learn well: how to absorb, understand, retain, and apply information — without unnecessary friction or self-deception.
        </p>
      </CardBody>
    </Card>
  );
};

export default VisionSection;
