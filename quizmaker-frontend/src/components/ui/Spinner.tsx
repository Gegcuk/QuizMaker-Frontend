// src/components/Spinner.tsx
// ---------------------------------------------------------------------------
// Tiny SVG loader. Uses Tailwind’s animate-spin utility.
// ---------------------------------------------------------------------------

import React from 'react';

const Spinner: React.FC = () => (
  <div className="flex justify-center items-center py-20">
    <svg
      className="animate-spin h-8 w-8 text-indigo-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v8H4z"
      />
    </svg>
  </div>
);

export default Spinner;
