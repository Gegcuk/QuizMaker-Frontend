export type FaqAnswerBlock =
  | { type: 'paragraph'; content: string }
  | { type: 'list'; items: string[] }
  | { type: 'subheading'; content: string };

export interface FaqNote {
  title: string;
  content: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}

export interface FaqItem {
  id: string;
  question: string;
  answer: FaqAnswerBlock[];
  note?: FaqNote;
}

export interface FaqSection {
  id: string;
  title: string;
  description?: string;
  items: FaqItem[];
}
