// ---------------------------------------------------------------------------
// QuestionForm.tsx - Main question creation form
// Based on CreateQuestionRequest from API documentation
// ---------------------------------------------------------------------------

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CreateQuestionRequest, QuestionType, QuestionDifficulty } from '@/types';
import { QuestionService } from '@/services';
import { api } from '@/services';
import QuestionTypeSelector from './QuestionTypeSelector';
import { QuestionRenderer } from './';
import { McqAnswer, TrueFalseAnswer, OpenAnswer, FillGapAnswer, ComplianceAnswer, OrderingAnswer, HotspotAnswer, QuestionForAttemptDto } from '@/features/attempt';
import McqQuestionEditor from './McqQuestionEditor';
import TrueFalseEditor from './TrueFalseEditor';
import OpenQuestionEditor from './OpenQuestionEditor';
import FillGapEditor from './FillGapEditor';
import ComplianceEditor from './ComplianceEditor';
import OrderingEditor from './OrderingEditor';
import HotspotEditor from './HotspotEditor';
import { Spinner } from '@/components';

interface QuestionFormProps {
  questionId?: string; // If provided, we're editing an existing question
  quizId?: string; // If provided, we're creating a question for a specific quiz
  onSuccess?: (res?: { questionId?: string; keepOpen?: boolean }) => void;
  onCancel?: () => void;
  className?: string;
  compact?: boolean; // Hide large page header when embedded in a modal
  defaultDifficulty?: QuestionDifficulty; // Pre-fill difficulty when creating
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  questionId,
  quizId,
  onSuccess,
  onCancel,
  className = '',
  compact = false,
  defaultDifficulty
}) => {
  const questionService = new QuestionService(api);
  const navigate = useNavigate();
  const { quizId: urlQuizId } = useParams<{ quizId: string }>();
  const actualQuizId = quizId || urlQuizId;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Live preview is rendered alongside the form; no toggle needed

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
    difficulty: defaultDifficulty || 'MEDIUM',
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
      const question = await questionService.getQuestionById(questionId);
      setFormData({
        type: question.type,
        questionText: question.questionText,
        content: question.content,
        difficulty: question.difficulty,
        explanation: question.explanation || '',
        hint: question.hint || '',
        tagIds: question.tagIds || []
      });
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
    // Prevent bubbling to parent forms (e.g., QuizForm) through React portals
    e.stopPropagation();
    setSaving(true);
    setError(null);

    try {
      if (questionId) {
        // Update existing question
        await questionService.updateQuestion(questionId, formData);
        if (onSuccess) {
          onSuccess();
        } else if (actualQuizId) {
          navigate(`/quizzes/${actualQuizId}/edit?tab=questions`);
        } else {
          navigate('/questions');
        }
      } else {
        // Create new question
        const res = await questionService.createQuestion(formData);
        if (onSuccess) {
          onSuccess({ questionId: res.questionId });
        } else if (actualQuizId) {
          navigate(`/quizzes/${actualQuizId}/edit?tab=questions`);
        } else {
          navigate('/questions');
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save question');
    } finally {
      setSaving(false);
    }
  };

  const initContentForType = (type: QuestionType) => {
    switch (type) {
      case 'MCQ_SINGLE':
      case 'MCQ_MULTI':
        return {
          options: [
            { id: 'a', text: '', correct: false },
            { id: 'b', text: '', correct: false },
            { id: 'c', text: '', correct: false },
            { id: 'd', text: '', correct: false },
          ],
        } as CreateQuestionRequest['content'];
      case 'TRUE_FALSE':
        return { answer: true } as CreateQuestionRequest['content'];
      case 'OPEN':
        return { answer: '' } as CreateQuestionRequest['content'];
      case 'FILL_GAP':
        return { text: '', gaps: [] } as CreateQuestionRequest['content'];
      case 'COMPLIANCE':
        return { statements: [] } as CreateQuestionRequest['content'];
      case 'ORDERING':
        return { items: [] } as CreateQuestionRequest['content'];
      case 'HOTSPOT':
        return { imageUrl: '', regions: [] } as CreateQuestionRequest['content'];
      default:
        return { options: [] } as any;
    }
  };

  // Stable callbacks for child editors to prevent infinite re-renders
  const handleContentChange = useCallback((content: any) => {
    setFormData((prev) => ({ ...prev, content }));
  }, []);

  const handleTypeChange = useCallback((type: QuestionType) => {
    setFormData((prev) => ({
      ...prev,
      type,
      content: initContentForType(type),
    }));
  }, []);

  // Build attempt-like question with safeContent (no correct answers)
  const toAttemptQuestion = (): QuestionForAttemptDto => {
    const { type, difficulty, questionText, content } = formData as any;
    let safeContent: any = {};
    switch (type) {
      case 'MCQ_SINGLE':
      case 'MCQ_MULTI':
        safeContent = {
          options: (content?.options || []).map((opt: any) => ({ id: opt.id, text: opt.text }))
        };
        break;
      case 'FILL_GAP':
        safeContent = {
          text: content?.text || '',
          gaps: (content?.gaps || []).map((g: any) => ({ id: g.id }))
        };
        break;
      case 'COMPLIANCE':
        safeContent = {
          statements: (content?.statements || []).map((s: any) => ({ id: s.id, text: s.text }))
        };
        break;
      case 'ORDERING':
        safeContent = {
          items: (content?.items || []).map((it: any) => ({ id: it.id, text: it.text }))
        };
        break;
      case 'HOTSPOT':
        safeContent = {
          imageUrl: content?.imageUrl || '',
          regions: content?.regions || []
        };
        break;
      case 'TRUE_FALSE':
      case 'OPEN':
      default:
        safeContent = {};
    }
    return {
      id: 'preview',
      type,
      difficulty,
      questionText: questionText || '',
      safeContent,
      hint: (formData as any).hint || undefined,
      attachmentUrl: (formData as any).attachmentUrl || undefined,
    } as QuestionForAttemptDto;
  };

  const [previewAnswer, setPreviewAnswer] = useState<any>(null);

  const handleSaveAndAddAnother = async () => {
    if (questionId) return; // Only for create flow
    setSaving(true);
    setError(null);
    try {
      const res = await questionService.createQuestion(formData);
      // Inform parent but keep the modal open
      if (onSuccess) {
        onSuccess({ questionId: res.questionId, keepOpen: true });
      }
      // Reset inputs for a new question, preserving type and difficulty
      const prevType = formData.type;
      const prevDifficulty = formData.difficulty;
      setFormData({
        type: prevType,
        questionText: '',
        content: initContentForType(prevType),
        difficulty: prevDifficulty,
        explanation: '',
        tagIds: []
      });
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
      navigate(`/quizzes/${actualQuizId}/edit?tab=questions`);
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
      {!compact && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {questionId ? 'Edit Question' : 'Create New Question'}
          </h1>
          <p className="mt-2 text-gray-600">
            {questionId ? 'Update the question details below.' : 'Fill in the details to create a new question.'}
          </p>
        </div>
      )}

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

      {/* Edit Mode with Live Preview */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white shadow rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Question Details</h3>
          </div>
          <div className="px-6 py-6">
            <div className="space-y-6">
                {/* Question Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type
                  </label>
                  <QuestionTypeSelector
                    selectedType={formData.type}
                    onTypeChange={handleTypeChange}
                  />
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
                   className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                 >
                   <option value="EASY">Easy</option>
                   <option value="MEDIUM">Medium</option>
                   <option value="HARD">Hard</option>
                 </select>
               </div>

               {/* Hint */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">
                   Hint (Optional)
                 </label>
                 <textarea
                   value={formData.hint || ''}
                   onChange={(e) => handleInputChange('hint', e.target.value)}
                   rows={2}
                   className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                   placeholder="Provide a hint for students..."
                 />
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

                {/* Type-specific Content */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {formData.type.replace('_', ' ')} Content
                  </label>
                  {(() => {
                    switch (formData.type) {
                      case 'MCQ_SINGLE':
                        return (
                          <McqQuestionEditor
                            content={formData.content as any}
                            onChange={handleContentChange}
                            isMultiSelect={false}
                          />
                        );
                      case 'MCQ_MULTI':
                        return (
                          <McqQuestionEditor
                            content={formData.content as any}
                            onChange={handleContentChange}
                            isMultiSelect={true}
                          />
                        );
                      case 'TRUE_FALSE':
                        return (
                          <TrueFalseEditor
                            content={formData.content as any}
                            onChange={handleContentChange}
                            showPreview={false}
                          />
                        );
                      case 'OPEN':
                        return (
                          <OpenQuestionEditor
                            content={formData.content as any}
                            onChange={handleContentChange}
                            showPreview={false}
                          />
                        );
                      case 'FILL_GAP':
                        return (
                          <FillGapEditor
                            content={formData.content as any}
                            onChange={handleContentChange}
                            showPreview={false}
                          />
                        );
                      case 'COMPLIANCE':
                        return (
                          <ComplianceEditor
                            content={formData.content as any}
                            onChange={handleContentChange}
                            showPreview={false}
                          />
                        );
                    case 'ORDERING':
                      return (
                        <OrderingEditor
                          content={formData.content as any}
                          onChange={handleContentChange}
                          showPreview={false}
                        />
                      );
                    case 'HOTSPOT':
                      return (
                        <HotspotEditor
                          content={formData.content as any}
                          onChange={handleContentChange}
                          showPreview={false}
                        />
                      );
                      default:
                        return null;
                    }
                  })()}
                </div>
              {/* Live Preview at bottom */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Live Preview (Attempt-like)</h4>
                {(() => {
                  const q = toAttemptQuestion();
                  switch (q.type) {
                    case 'MCQ_SINGLE':
                      return (
                        <McqAnswer
                          question={q}
                          currentAnswer={previewAnswer as string}
                          onAnswerChange={setPreviewAnswer}
                          singleChoice
                        />
                      );
                    case 'MCQ_MULTI':
                      return (
                        <McqAnswer
                          question={q}
                          currentAnswer={previewAnswer as string[]}
                          onAnswerChange={setPreviewAnswer}
                        />
                      );
                    case 'TRUE_FALSE':
                      return (
                        <TrueFalseAnswer
                          question={q}
                          currentAnswer={previewAnswer as boolean}
                          onAnswerChange={setPreviewAnswer}
                        />
                      );
                    case 'OPEN':
                      return (
                        <OpenAnswer
                          question={q}
                          currentAnswer={previewAnswer as string}
                          onAnswerChange={setPreviewAnswer}
                        />
                      );
                    case 'FILL_GAP':
                      return (
                        <FillGapAnswer
                          question={q}
                          currentAnswer={previewAnswer as Record<number, string>}
                          onAnswerChange={setPreviewAnswer}
                        />
                      );
                    case 'COMPLIANCE':
                      return (
                        <ComplianceAnswer
                          question={q}
                          currentAnswer={Array.isArray(previewAnswer) ? (previewAnswer as number[]) : []}
                          onAnswerChange={setPreviewAnswer}
                        />
                      );
                    case 'ORDERING':
                      return (
                        <OrderingAnswer
                          question={q}
                          currentAnswer={previewAnswer as number[]}
                          onAnswerChange={setPreviewAnswer}
                        />
                      );
                    case 'HOTSPOT':
                      return (
                        <HotspotAnswer
                          question={q}
                          currentAnswer={previewAnswer as any}
                          onAnswerChange={setPreviewAnswer}
                        />
                      );
                    default:
                      return null;
                  }
                })()}
              </div>
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
          {!questionId && (
            <button
              type="button"
              onClick={handleSaveAndAddAnother}
              disabled={saving || !formData.questionText.trim()}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Spinner />
                  <span className="ml-2">Saving...</span>
                </>
              ) : (
                'Save & Add Another'
              )}
            </button>
          )}
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
    </div>
  );
};

export default QuestionForm; 
