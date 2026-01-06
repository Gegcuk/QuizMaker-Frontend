import React from 'react';
import { ImagePlaceholder } from './ImagePlaceholder';

/**
 * Hero image placeholder for values page
 * 
 * Image A — HERO (Top of the page, wide banner)
 * Preferred size: 1920 × 600px (16:5 aspect ratio)
 * 
 * What to show:
 * - Left: a chaotic cloud / feed of content fragments representing "information noise"
 * - Center: a clean filter / funnel / lens symbol representing "processing"
 * - Right: structured outputs — a neat stack of cards/pages plus 3–6 quiz cards connected by a clear path
 * - Include a tiny bright accent element (e.g., a small red dot) that represents a "signal / meaning" point
 * 
 * Constraints: flat vector, crisp shapes, lots of whitespace, no embedded text
 */
const HeroImagePlaceholder: React.FC = () => {
  return (
    <div className="w-full">
      <ImagePlaceholder
        name="Image A: Hero Banner"
        width={1920}
        height={600}
        description="Left: chaotic content cloud (noise). Center: filter/funnel (processing). Right: structured cards/pages + quiz cards. Small accent dot (signal/meaning)."
        className="w-full h-auto"
      />
    </div>
  );
};

export default HeroImagePlaceholder;
