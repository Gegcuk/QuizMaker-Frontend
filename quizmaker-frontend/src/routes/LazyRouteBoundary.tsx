import React, { Suspense } from 'react';
import Spinner from '../components/ui/Spinner';

interface LazyRouteBoundaryProps {
  children: React.ReactNode;
}

const RouteLoadingFallback: React.FC = () => (
  <div className="flex min-h-[16rem] items-center justify-center bg-theme-bg-secondary px-4 py-8">
    <Spinner size="lg" />
  </div>
);

const LazyRouteBoundary: React.FC<LazyRouteBoundaryProps> = ({ children }) => (
  <Suspense fallback={<RouteLoadingFallback />}>{children}</Suspense>
);

export default LazyRouteBoundary;
