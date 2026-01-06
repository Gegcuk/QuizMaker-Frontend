import React from 'react';
import type { FaqSection } from '../types/faq.types';
import FaqSectionCard from './FaqSectionCard';

interface FaqSectionListProps {
  sections: FaqSection[];
}

const FaqSectionList: React.FC<FaqSectionListProps> = ({ sections }) => {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <FaqSectionCard key={section.id} section={section} />
      ))}
    </div>
  );
};

export default FaqSectionList;
