// src/pages/AiAnalysisPage.tsx
// ---------------------------------------------------------------------------
// A simple page that calls /api/v1/ai-analysis and displays the received JSON
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { Seo } from '@/features/seo';
import { api } from '@/services';

const AiAnalysisPage: React.FC = () => {
  console.log('AiAnalysisPage: Component rendering');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('AiAnalysisPage: Component mounted, starting API call');
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('AiAnalysisPage: Making POST request to /v1/ai-analysis/analyze');
        const response = await api.post('/v1/ai-analysis/analyze');
        console.log('AiAnalysisPage: Response received:', response.data);
        setData(response.data);
      } catch (err: any) {
        console.error('AiAnalysisPage: Error occurred:', err);
        setError(err.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-theme-interactive-danger text-lg">Error: {error}</div>
      </div>
    );
  }

  return (
    <>
      <Seo title="AI Analysis | Quizzence" noindex />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">AI Analysis Results</h1>
      
      <div className="bg-theme-bg-tertiary p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Response Data:</h2>
        <pre className="bg-theme-bg-primary p-4 rounded border overflow-auto text-sm">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
      </div>
    </>
  );
};

export default AiAnalysisPage; 