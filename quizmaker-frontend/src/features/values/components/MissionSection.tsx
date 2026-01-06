import React from 'react';
import { Card, CardBody, CardHeader } from '@/components';
import { ImagePlaceholder } from './ImagePlaceholder';

const MissionSection: React.FC = () => {
  return (
    <Card padding="lg">
      <CardHeader>
        <h2 className="text-2xl font-bold text-theme-text-primary">Mission</h2>
      </CardHeader>
      <CardBody className="space-y-6">
        <p className="text-lg text-theme-text-secondary leading-relaxed">
          To help people learn faster, more reliably, and more meaningfully — grounded in learning science.
        </p>
        
        {/* Image D: Learning loop */}
        <div className="flex justify-center">
          <ImagePlaceholder
            name="Image D: Learning Loop"
            width={500}
            height={500}
            description="Circular loop with 4-5 nodes. Icons: book → checkbox → feedback → calendar → key. One node highlighted as lever (retrieval/attempt)."
          />
        </div>
      </CardBody>
    </Card>
  );
};

export default MissionSection;
