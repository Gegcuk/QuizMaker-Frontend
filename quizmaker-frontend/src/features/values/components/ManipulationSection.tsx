import React from 'react';
import { Card, CardBody, CardHeader } from '@/components';
import { ImagePlaceholder } from './ImagePlaceholder';

const ManipulationSection: React.FC = () => {
  return (
    <Card padding="lg">
      <CardHeader>
        <h2 className="text-2xl font-bold text-theme-text-primary">Why this also protects against manipulation</h2>
      </CardHeader>
      <CardBody className="space-y-6">
        <div className="space-y-4 text-theme-text-secondary leading-relaxed">
          <p>
            Knowledge matters — but what matters even more is <em>awareness of knowledge</em>: the ability to spot distortions, detect weak arguments, and separate facts from rhetoric. When you build that skill, empty content becomes boring — which is a good sign. It means you've developed standards for quality, and learning becomes more enjoyable because you can feel real progress.
          </p>
        </div>

        <div className="bg-theme-bg-secondary rounded-lg p-4 border border-theme-border-primary">
          <p className="text-sm text-theme-text-secondary">
            <strong className="text-theme-text-primary">Educational note:</strong> Many cognitive traps are strongest when people don't check understanding. Regularly testing recall is a kind of "antivirus" against confident misconceptions.
          </p>
        </div>
      </CardBody>
    </Card>
  );
};

export default ManipulationSection;
