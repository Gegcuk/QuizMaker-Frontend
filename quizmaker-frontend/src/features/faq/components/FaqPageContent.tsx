import React from 'react';
import type { FaqSection } from '../types/faq.types';
import FaqIntroCard from './FaqIntroCard';
import FaqSectionList from './FaqSectionList';

interface FaqPageContentProps {
  introNote: string;
  sections: FaqSection[];
}

const FaqPageContent: React.FC<FaqPageContentProps> = ({ introNote, sections }) => {
  return (
    <div className="space-y-6">
      <FaqIntroCard note={introNote} />
      <FaqSectionList sections={sections} />
    </div>
  );
};

export default FaqPageContent;
