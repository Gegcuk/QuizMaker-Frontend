import React from 'react';
import FounderNote from './FounderNote';
import ValuesSection from './ValuesSection';
import MissionSection from './MissionSection';
import VisionSection from './VisionSection';
import ManipulationSection from './ManipulationSection';
import EducatorsSection from './EducatorsSection';

const ValuesPageContent: React.FC = () => {
  return (
    <div className="space-y-12">
      <FounderNote />
      <ValuesSection />
      <MissionSection />
      <VisionSection />
      <ManipulationSection />
      <EducatorsSection />
    </div>
  );
};

export default ValuesPageContent;
