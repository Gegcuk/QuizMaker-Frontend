// src/features/seo/Seo.tsx
import React from 'react';
import { SeoConfig, useSeo } from './useSeo';

export const Seo: React.FC<SeoConfig> = (props) => {
  useSeo(props);
  return null;
};
