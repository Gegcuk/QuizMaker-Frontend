import React, { useState, useEffect } from 'react';
import { QuizService } from '../../api/quiz.service';
import { DocumentService } from '../../api/document.service';
import api from '../../api/axiosInstance';
import { 
  GenerateQuizFromDocumentRequest,
  QuizGenerationResponse,
  QuizScope,
  QuizQuestionType,
  Difficulty
} from '../../types/quiz.types';
import { DocumentDto } from '../../types/document.types';

interface AiQuizGeneratorProps {
  onGenerationStart?: (response: QuizGenerationResponse) => void;
  onGenerationError?: (error: string) => void;
  className?: string;
}

const AiQuizGenerator: React.FC<AiQuizGeneratorProps> = ({ 
  onGenerationStart, 
  onGenerationError, 
  className = '' 
}) => {
  const [documents, setDocuments] = useState<DocumentDto[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string>('');
  const [quizScope, setQuizScope] = useState<QuizScope>('ENTIRE_DOCUMENT');
  const [chunkIndices, setChunkIndices] = useState<number[]>([]);
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterNumber, setChapterNumber] = useState<number | undefined>();
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDescription, setQuizDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [estimatedTimePerQuestion, setEstimatedTimePerQuestion] = useState(2);
  const [categoryId, setCategoryId] = useState<string>('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [questionsPerType, setQuestionsPerType] = useState<Record<QuizQuestionType, number>>({
    MCQ_SINGLE: 3,
    MCQ_MULTI: 2,
    OPEN: 1,
    FILL_GAP: 1,
    COMPLIANCE: 1,
    TRUE_FALSE: 2,
    ORDERING: 1,
    HOTSPOT: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quizService = new QuizService(api);
  const documentService = new DocumentService(api);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setIsLoadingDocuments(true);
      setError(null);
      const response = await documentService.getDocuments({ size: 100 });
      setDocuments(response.content.filter(doc => doc.status === 'PROCESSED'));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load documents';
      setError(errorMessage);
      onGenerationError?.(errorMessage);
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const handleQuestionTypeChange = (type: QuizQuestionType, value: number) => {
    setQuestionsPerType(prev => ({
      ...prev,
      [type]: Math.max(0, Math.min(10, value)) // Limit 0-10 questions per type
    }));
  };

  const handleGenerateQuiz = async () => {
    if (!selectedDocument) {
      setError('Please select a document');
      return;
    }

    const totalQuestions = Object.values(questionsPerType).reduce((sum, count) => sum + count, 0);
    if (totalQuestions === 0) {
      setError('Please specify at least one question type with a count greater than 0');
      return;
    }

    // Validate scope-specific requirements
    if (quizScope === 'SPECIFIC_CHUNKS' && chunkIndices.length === 0) {
      setError('Please select at least one chunk for SPECIFIC_CHUNKS scope');
      return;
    }

    if ((quizScope === 'SPECIFIC_CHAPTER' || quizScope === 'SPECIFIC_SECTION') && 
        !chapterTitle && !chapterNumber) {
      setError('Please specify either chapter title or chapter number for this scope');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const request: GenerateQuizFromDocumentRequest = {
        documentId: selectedDocument,
        quizScope,
        questionsPerType,
        difficulty,
        estimatedTimePerQuestion,
        ...(quizScope === 'SPECIFIC_CHUNKS' && { chunkIndices }),
        ...(quizScope === 'SPECIFIC_CHAPTER' && { chapterTitle, chapterNumber }),
        ...(quizScope === 'SPECIFIC_SECTION' && { chapterTitle, chapterNumber }),
        ...(quizTitle && { quizTitle }),
        ...(quizDescription && { quizDescription }),
        ...(categoryId && { categoryId }),
        ...(tagIds.length > 0 && { tagIds })
      };

      const response = await quizService.generateQuizFromDocument(request);
      onGenerationStart?.(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start quiz generation';
      setError(errorMessage);
      onGenerationError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalQuestions = () => {
    return Object.values(questionsPerType).reduce((sum, count) => sum + count, 0);
  };

  const getEstimatedTime = () => {
    return getTotalQuestions() * estimatedTimePerQuestion;
  };

  const selectedDocumentData = documents.find(doc => doc.id === selectedDocument);

  return (
    <div className={`bg-white border rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">AI Quiz Generator</h3>
        <p className="text-sm text-gray-600 mt-1">
          Generate quizzes automatically from your documents using AI
        </p>
      </div>

      {/* Document Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Document *
        </label>
        {isLoadingDocuments ? (
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        ) : (
          <select
            value={selectedDocument}
            onChange={(e) => setSelectedDocument(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Choose a document...</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.originalFilename} ({doc.totalChunks} chunks)
              </option>
            ))}
          </select>
        )}
        {selectedDocumentData && (
          <div className="mt-2 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Selected:</strong> {selectedDocumentData.originalFilename}
              {selectedDocumentData.title && ` - ${selectedDocumentData.title}`}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              {selectedDocumentData.totalPages} pages • {selectedDocumentData.totalChunks} chunks • 
              {(selectedDocumentData.fileSize / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        )}
      </div>

      {/* Quiz Scope */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quiz Scope
        </label>
        <select
          value={quizScope}
          onChange={(e) => setQuizScope(e.target.value as QuizScope)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="ENTIRE_DOCUMENT">Entire Document</option>
          <option value="SPECIFIC_CHUNKS">Specific Chunks</option>
          <option value="SPECIFIC_CHAPTER">Specific Chapter</option>
          <option value="SPECIFIC_SECTION">Specific Section</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          {quizScope === 'ENTIRE_DOCUMENT' && 'Generate questions from the entire document'}
          {quizScope === 'SPECIFIC_CHUNKS' && 'Generate questions from selected document chunks'}
          {quizScope === 'SPECIFIC_CHAPTER' && 'Generate questions from a specific chapter'}
          {quizScope === 'SPECIFIC_SECTION' && 'Generate questions from a specific section'}
        </p>
      </div>

      {/* Scope-specific inputs */}
      {quizScope === 'SPECIFIC_CHUNKS' && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chunk Indices (comma-separated)
          </label>
          <input
            type="text"
            value={chunkIndices.join(', ')}
            onChange={(e) => {
              const values = e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v));
              setChunkIndices(values);
            }}
            placeholder="0, 1, 2, 3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Enter chunk indices separated by commas (e.g., 0, 1, 2)
          </p>
        </div>
      )}

      {(quizScope === 'SPECIFIC_CHAPTER' || quizScope === 'SPECIFIC_SECTION') && (
        <div className="mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chapter Title
            </label>
            <input
              type="text"
              value={chapterTitle}
              onChange={(e) => setChapterTitle(e.target.value)}
              placeholder="Enter chapter title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chapter Number (optional)
            </label>
            <input
              type="number"
              value={chapterNumber || ''}
              onChange={(e) => setChapterNumber(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Enter chapter number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      )}

      {/* Quiz Configuration */}
      <div className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quiz Title (optional)
          </label>
          <input
            type="text"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            placeholder="Enter custom quiz title"
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quiz Description (optional)
          </label>
          <textarea
            value={quizDescription}
            onChange={(e) => setQuizDescription(e.target.value)}
            placeholder="Enter quiz description"
            maxLength={500}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty Level
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estimated Time per Question (minutes)
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={estimatedTimePerQuestion}
            onChange={(e) => setEstimatedTimePerQuestion(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Question Type Configuration */}
      <div className="mb-6">
        <h4 className="font-medium text-gray-900 mb-4">Question Types & Counts</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(questionsPerType).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </label>
                <p className="text-xs text-gray-500">
                  {type === 'MCQ_SINGLE' && 'Multiple choice, single answer'}
                  {type === 'MCQ_MULTI' && 'Multiple choice, multiple answers'}
                  {type === 'OPEN' && 'Open-ended questions'}
                  {type === 'FILL_GAP' && 'Fill in the blank'}
                  {type === 'COMPLIANCE' && 'Compliance questions'}
                  {type === 'TRUE_FALSE' && 'True/False questions'}
                  {type === 'ORDERING' && 'Ordering questions'}
                  {type === 'HOTSPOT' && 'Hotspot questions'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleQuestionTypeChange(type as QuizQuestionType, count - 1)}
                  disabled={count === 0}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                >
                  -
                </button>
                <span className="w-8 text-center font-medium">{count}</span>
                <button
                  type="button"
                  onClick={() => handleQuestionTypeChange(type as QuizQuestionType, count + 1)}
                  disabled={count === 10}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-700">
            <strong>Total Questions:</strong> {getTotalQuestions()} • 
            <strong>Estimated Time:</strong> {getEstimatedTime()} minutes
          </p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={loadDocuments}
          disabled={isLoadingDocuments}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoadingDocuments ? 'Loading...' : 'Refresh Documents'}
        </button>
        <button
          type="button"
          onClick={handleGenerateQuiz}
          disabled={isLoading || !selectedDocument || getTotalQuestions() === 0}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Starting Generation...
            </>
          ) : (
            'Generate Quiz'
          )}
        </button>
      </div>
    </div>
  );
};

export default AiQuizGenerator; 