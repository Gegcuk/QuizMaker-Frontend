import React from 'react';
import { Card, CardBody, CardHeader } from '@/components';
import type { FaqSection } from '../types/faq.types';
import FaqAccordion from './FaqAccordion';

interface FaqSectionCardProps {
  section: FaqSection;
}

const FaqSectionCard: React.FC<FaqSectionCardProps> = ({ section }) => {
  return (
    <Card id={section.id} padding="lg">
      <CardHeader>
        <h3 className="text-xl font-semibold text-theme-text-primary">{section.title}</h3>
        {section.description && (
          <p className="mt-2 text-theme-text-secondary">{section.description}</p>
        )}
      </CardHeader>
      <CardBody className="space-y-0 article-content">
        <FaqAccordion items={section.items} />
      </CardBody>
    </Card>
  );
};

export default FaqSectionCard;
