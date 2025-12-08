import React from 'react';

export interface ChecklistItem {
  id?: string | number;
  content: React.ReactNode;
}

export interface ChecklistProps {
  items: ChecklistItem[];
  className?: string;
}

const CheckIcon: React.FC = () => (
  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-theme-border-primary bg-theme-bg-primary">
    <svg
      className="h-3.5 w-3.5 text-theme-interactive-success"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-hidden="true"
    >
      <path d="M5 10.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </span>
);

const Checklist: React.FC<ChecklistProps> = ({ items, className = '' }) => {
  return (
    <ul className={`checklist ${className}`.trim()}>
      {items.map(item => (
        <li key={item.id ?? String(item.content)} className="flex items-start gap-3">
          <CheckIcon />
          <span className="text-theme-text-secondary leading-relaxed">{item.content}</span>
        </li>
      ))}
    </ul>
  );
};

export default Checklist;
