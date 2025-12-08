import React from 'react';

export interface BulletListItem {
  id: string | number;
  content: React.ReactNode;
}

export interface BulletListProps {
  items?: BulletListItem[];
  children?: React.ReactNode;
  className?: string;
}

const BulletList: React.FC<BulletListProps> = ({ items, children, className = '' }) => {
  return (
    <ul className={`bullet-list ${className}`.trim()}>
      {items
        ? items.map(item => <li key={item.id}>{item.content}</li>)
        : children}
    </ul>
  );
};

export default BulletList;
