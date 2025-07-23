// ---------------------------------------------------------------------------
// QuestionForm.tsx - Main question creation form
// Based on CreateQuestionRequest from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CreateQuestionRequest, QuestionType, QuestionDifficulty } from '../../types/question.types';
import { createQuestion, updateQuestion } from '../../api/question.service';
import QuestionTypeSelector from './QuestionTypeSelector';
import QuestionEditor from './QuestionEditor';
import QuestionPreview from './QuestionPreview';
import { Spinner } from '../ui';

interface QuestionFormProps {
  questionId?: string; // If provided, we're editing an existing question
  quizId?: string; // If provided, we're creating a question for a specific quiz
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  questionId,
  quizId,
  onSuccess,
  onCancel,
  className = ''
}) => {
  const navigate = useNavigate();
  const { quizId: urlQuizId } = useParams<{ quizId: string }>();
  const actualQuizId = quizId || urlQuizId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Form state
  const [formData, setFormData] = useState<CreateQuestionRequest>({
    type: 'MCQ_SINGLE',
    questionText: '',
    content: {
      options: [
        { id: 'a', text: '', correct: false },
        { id: 'b', text: '', correct: false },
        { id: 'c', text: '', correct: false },
        { id: 'd', text: '', correct: false }
      ]
    },
    difficulty: 'MEDIUM',
    explanation: '',
    tagIds: []
  });

  // Load existing question data if editing
  useEffect(() => {
    if (questionId) {
      loadQuestionData();
    }
  }, [questionId]);

  const loadQuestionData = async () => {
    if (!questionId) return;
    
    setLoading(true);
    setError(null);
    try {
      // TODO: Implement getQuestionById in question.service.ts
      // const question = await getQuestionById(questionId);
      // setFormData(question);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load question');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateQuestionRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (questionId) {
        // Update existing question
        await updateQuestion(questionId, formData);
      } else {
        // Create new question
        await createQuestion(formData);
      }

      // Success handling
      if (onSuccess) {
        onSuccess();
      } else if (actualQuizId) {
        navigate(`/quizzes/${actualQuizId}/questions`);
      } else {
        navigate('/questions');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (actualQuizId) {
      navigate(`/quizzes/${actualQuizId}/questions`);
    } else {
      navigate('/questions');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {questionId ? 'Edit Question' : 'Create New Question'}
        </h1>
        <p className="mt-2 text-gray-600">
          {questionId ? 'Update the question details below.' : 'Fill in the details to create a new question.'}
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
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

      {/* Preview Toggle */}
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={() => setPreviewMode(!previewMode)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {previewMode ? 'Edit Mode' : 'Preview Mode'}
        </button>
      </div>

      {previewMode ? (
        /* Preview Mode */
        <div className="bg-white shadow rounded-lg border border-gray-200">
          <div className="px-6 py-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Question Preview</h3>
            <div className="prose max-w-none">
              <p className="text-gray-700">{formData.questionText}</p>
              <p className="text-sm text-gray-500 mt-2">
                Type: {formData.type} | Difficulty: {formData.difficulty}
              </p>
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setPreviewMode(false)}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Back to Edit
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white shadow rounded-lg border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Question Details</h3>
            </div>
            <div className="px-6 py-6 space-y-6">
                             {/* Question Type */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Question Type
                 </label>
                 <select
                   value={formData.type}
                   onChange={(e) => handleInputChange('type', e.target.value as QuestionType)}
                   className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                 >
                   <option value="MCQ_SINGLE">Multiple Choice (Single Answer)</option>
                   <option value="MCQ_MULTI">Multiple Choice (Multiple Answers)</option>
                   <option value="TRUE_FALSE">True/False</option>
                   <option value="OPEN">Open Ended</option>
                   <option value="FILL_GAP">Fill in the Blank</option>
                   <option value="COMPLIANCE">Compliance</option>
                   <option value="ORDERING">Ordering</option>
                   <option value="HOTSPOT">Hotspot</option>
                 </select>
               </div>

                             {/* Question Text */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Question Text
                 </label>
                 <textarea
                   value={formData.questionText}
                   onChange={(e) => handleInputChange('questionText', e.target.value)}
                   rows={4}
                   className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                   placeholder="Enter your question here..."
                 />
               </div>

               {/* Difficulty */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Difficulty Level
                 </label>
                 <select
                   value={formData.difficulty}
                   onChange={(e) => handleInputChange('difficulty', e.target.value as QuestionDifficulty)}
                   className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                 >
                   <option value="EASY">Easy</option>
                   <option value="MEDIUM">Medium</option>
                   <option value="HARD">Hard</option>
                 </select>
               </div>

               {/* Explanation */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Explanation (Optional)
                 </label>
                 <textarea
                   value={formData.explanation || ''}
                   onChange={(e) => handleInputChange('explanation', e.target.value)}
                   rows={3}
                   className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                   placeholder="Provide an explanation for the correct answer..."
                 />
               </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.questionText.trim()}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Spinner />
                  <span className="ml-2">Saving...</span>
                </>
              ) : (
                questionId ? 'Update Question' : 'Create Question'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default QuestionForm; 