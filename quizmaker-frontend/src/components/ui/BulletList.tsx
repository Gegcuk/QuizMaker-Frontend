import React from 'react';

export interface BulletListProps {
  items?: React.ReactNode[];
  children?: React.ReactNode;
  className?: string;
}

const BulletList: React.FC<BulletListProps> = ({ items, children, className = '' }) => {
  return (
    <ul className={`bullet-list ${className}`.trim()}>
      {items
        ? items.map((item, idx) => <li key={idx}>{item}</li>)
        : children}
    </ul>
  );
};

export default BulletList;
