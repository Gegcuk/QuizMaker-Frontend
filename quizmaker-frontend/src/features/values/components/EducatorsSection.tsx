import React from 'react';
import { Card, CardBody, CardHeader } from '@/components';
import { ImagePlaceholder } from './ImagePlaceholder';

const EducatorsSection: React.FC = () => {
  return (
    <Card padding="lg">
      <CardHeader>
        <h2 className="text-2xl font-bold text-theme-text-primary">How Quizzence helps teachers and educators</h2>
      </CardHeader>
      <CardBody className="space-y-6">
        {/* Image F: Helps teachers workflow */}
        <div className="flex justify-center">
          <ImagePlaceholder
            name="Image F: Teacher Workflow"
            width={700}
            height={300}
            description="Left: messy stack of repetitive sheets/tasks. Center: clean tool/process. Right: neat quiz cards + clock icon (time saved). Small accent on done."
            className="w-full max-w-xl h-auto rounded-xl border border-theme-border-primary"
            src="/values_teachers_workflow.png"
            alt="Workflow graphic showing quizzes simplifying teacher prep."
          />
        </div>

        <div className="space-y-4 text-theme-text-secondary leading-relaxed">
          <p>
            Quizzence isn't only for learners. It also supports teachers by speeding up routine parts of the workflow: creating practice, generating question sets, and preparing review materials — so more time stays available for explanation, mentoring, and real teaching.
          </p>
        </div>

        <div className="bg-theme-bg-secondary rounded-lg p-4 border border-theme-border-primary">
          <p className="text-sm text-theme-text-secondary">
            <strong className="text-theme-text-primary">Educational note:</strong> Technology is most useful when it <strong>removes repetitive work</strong>, not when it replaces thinking or responsibility.
          </p>
        </div>

        {/* Image G: Footer emblem */}
        <div className="flex justify-center pt-8">
          <ImagePlaceholder
            name="Image G: Footer Emblem"
            width={300}
            height={150}
            description="Abstract emblem: clean signal line + small accent dot + minimal stack of cards/pages."
            className="w-full max-w-xs h-auto rounded-lg border border-theme-border-primary"
            src="/footer_emplem.png"
            alt="Minimal emblem with signal line and cards."
          />
        </div>
      </CardBody>
    </Card>
  );
};

export default EducatorsSection;
