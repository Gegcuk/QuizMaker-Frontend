import React, { useState } from 'react';
import { Alert, BulletList, Button, SafeContent } from '@/components';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import type { FaqAnswerBlock, FaqItem, FaqNote } from '../types/faq.types';

interface FaqAccordionProps {
  items: FaqItem[];
  defaultExpandedIds?: string[];
}

const FaqAnswerBlocks: React.FC<{ blocks: FaqAnswerBlock[] }> = ({ blocks }) => {
  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'paragraph':
            return (
              <SafeContent
                key={`faq-paragraph-${index}`}
                content={block.content}
                allowHtml={true}
                className="text-theme-text-secondary"
              />
            );
          case 'subheading':
            return (
              <SafeContent
                key={`faq-subheading-${index}`}
                content={block.content}
                className="text-sm font-semibold text-theme-text-primary"
              />
            );
          case 'list':
            return (
              <BulletList
                key={`faq-list-${index}`}
                className="text-theme-text-secondary"
                items={block.items.map((item, itemIndex) => ({
                  id: `${index}-${itemIndex}`,
                  content: item,
                }))}
              />
            );
          default:
            return null;
        }
      })}
    </div>
  );
};

const FaqNoteBlock: React.FC<{ note: FaqNote }> = ({ note }) => {
  return (
    <Alert type={note.type || 'info'} title={note.title} className="mt-4">
      {note.content}
    </Alert>
  );
};

const FaqAccordion: React.FC<FaqAccordionProps> = ({
  items,
  defaultExpandedIds = [],
}) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(defaultExpandedIds)
  );

  const toggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="divide-y divide-theme-border-primary">
      {items.map((item) => {
        const isExpanded = expandedIds.has(item.id);
        const buttonId = `${item.id}-toggle`;
        const contentId = `${item.id}-content`;

        return (
          <div key={item.id} className="py-0">
            <Button
              id={buttonId}
              type="button"
              variant="ghost"
              size="md"
              fullWidth
              aria-expanded={isExpanded}
              aria-controls={contentId}
              onClick={() => toggle(item.id)}
              className="!w-full !flex !items-center !justify-between !py-3 !text-left !hover:bg-theme-bg-secondary !transition-colors !rounded-md !px-2 !-mx-2 !text-theme-text-primary !text-base"
            >
              <span className="font-semibold text-theme-text-primary pr-4">
                {item.question}
              </span>
              <ChevronRightIcon
                className={`h-5 w-5 text-theme-text-secondary flex-shrink-0 transition-transform ${
                  isExpanded ? 'rotate-90' : ''
                }`}
              />
            </Button>
            {isExpanded && (
              <div
                id={contentId}
                role="region"
                aria-labelledby={buttonId}
                className="pb-3 px-2 article-content"
              >
                <FaqAnswerBlocks blocks={item.answer} />
                {item.note && <FaqNoteBlock note={item.note} />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FaqAccordion;
