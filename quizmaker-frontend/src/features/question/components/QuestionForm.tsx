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
import { McqAnswer, TrueFalseAnswer, OpenAnswer, FillGapAnswer, ComplianceAnswer, OrderingAnswer, HotspotAnswer, MatchingAnswer, QuestionForAttemptDto, HintDisplay } from '@/features/attempt';
import McqQuestionEditor from './McqQuestionEditor';
import TrueFalseEditor from './TrueFalseEditor';
import OpenQuestionEditor from './OpenQuestionEditor';
import FillGapEditor from './FillGapEditor';
import ComplianceEditor from './ComplianceEditor';
import OrderingEditor from './OrderingEditor';
import HotspotEditor from './HotspotEditor';
import { MatchingQuestionForm } from './MatchingQuestionForm';
import { Spinner, Alert, Dropdown } from '@/components';
import { PlusIcon, XMarkIcon, QuestionMarkCircleIcon, LightBulbIcon } from '@heroicons/react/24/outline';

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
  const [showHint, setShowHint] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [editorKey, setEditorKey] = useState(0); // Key to force editor remount on reset
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
      // Show hint/explanation sections if they have values
      if (question.hint) setShowHint(true);
      if (question.explanation) setShowExplanation(true);
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

    // Validate question text
    if (formData.type === 'FILL_GAP') {
      // For FILL_GAP, validate content.text
      const fillGapText = (formData.content as any)?.text || '';
      if (!fillGapText || fillGapText.trim().length < 3) {
        setError('Question text must be at least 3 characters long.');
        setSaving(false);
        return;
      }
    } else {
      // For other types, validate questionText
      if (!formData.questionText || formData.questionText.trim().length < 3) {
        setError('Question text must be at least 3 characters long.');
        setSaving(false);
        return;
      }
    }

    try {
      // For FILL_GAP, copy content.text to questionText before submitting
      const submissionData = formData.type === 'FILL_GAP' 
        ? { ...formData, questionText: (formData.content as any)?.text || '' }
        : formData;

      if (questionId) {
        // Update existing question
        await questionService.updateQuestion(questionId, submissionData);
        if (onSuccess) {
          onSuccess();
        } else if (actualQuizId) {
          navigate(`/quizzes/${actualQuizId}?tab=questions`);
        } else {
          navigate('/questions');
        }
      } else {
        // Create new question
        const questionData = {
          ...submissionData,
          quizIds: actualQuizId ? [actualQuizId] : []
        };
        const res = await questionService.createQuestion(questionData);
        if (onSuccess) {
          onSuccess({ questionId: res.questionId });
        } else if (actualQuizId) {
          navigate(`/quizzes/${actualQuizId}?tab=questions`);
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
      case 'MATCHING':
        return { 
          left: [
            { id: 1, text: '', matchId: 10 },
            { id: 2, text: '', matchId: 11 }
          ],
          right: [
            { id: 10, text: '' },
            { id: 11, text: '' }
          ]
        } as CreateQuestionRequest['content'];
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
    // Reset hint/explanation visibility when type changes
    setShowHint(false);
    setShowExplanation(false);
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
      case 'MATCHING':
        safeContent = {
          left: content?.left || [],
          right: content?.right || []
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
    
    // Validate question text
    if (formData.type === 'FILL_GAP') {
      // For FILL_GAP, validate content.text
      const fillGapText = (formData.content as any)?.text || '';
      if (!fillGapText || fillGapText.trim().length < 3) {
        setError('Question text must be at least 3 characters long.');
        setSaving(false);
        return;
      }
    } else {
      // For other types, validate questionText
      if (!formData.questionText || formData.questionText.trim().length < 3) {
        setError('Question text must be at least 3 characters long.');
        setSaving(false);
        return;
      }
    }
    
    try {
      // For FILL_GAP, copy content.text to questionText before submitting
      const submissionData = formData.type === 'FILL_GAP' 
        ? { ...formData, questionText: (formData.content as any)?.text || '' }
        : formData;

      const questionData = {
        ...submissionData,
        quizIds: actualQuizId ? [actualQuizId] : []
      };
      const res = await questionService.createQuestion(questionData);
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
        hint: '',
        explanation: '',
        tagIds: []
      });
      // Reset hint/explanation visibility, preview answer, error state, and force editor remount
      setShowHint(false);
      setShowExplanation(false);
      setPreviewAnswer(null);
      setError(null);
      setEditorKey(prev => prev + 1);
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
      navigate(`/quizzes/${actualQuizId}?tab=questions`);
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
          <h1 className="text-3xl font-bold text-theme-text-primary">
            {questionId ? 'Edit Question' : 'Create New Question'}
          </h1>
          <p className="mt-2 text-theme-text-secondary">
            {questionId ? 'Update the question details below.' : 'Fill in the details to create a new question.'}
          </p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert 
          type="error" 
          dismissible 
          onDismiss={() => setError(null)}
          className="mb-6"
        >
          {error}
        </Alert>
      )}

      {/* Edit Mode with Live Preview */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6">
          <h4 className="text-md font-medium text-theme-text-primary mb-4">Question Details</h4>
          <div>
            <div className="space-y-6">
                {/* Question Type - Only shown when creating */}
                {!questionId && (
                  <div>
                    <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                      Question Type
                    </label>
                    <QuestionTypeSelector
                      selectedType={formData.type}
                      onTypeChange={handleTypeChange}
                    />
                  </div>
                )}

                             {/* Question Text - Hidden for FILL_GAP as it's part of the content */}
               {formData.type !== 'FILL_GAP' && (
                 <div>
                   <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                     Question Text
                   </label>
                   <textarea
                     value={formData.questionText}
                     onChange={(e) => handleInputChange('questionText', e.target.value)}
                     rows={4}
                     className="mt-1 block w-full border border-theme-border-primary rounded-md shadow-sm bg-theme-bg-primary text-theme-text-primary focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm"
                     placeholder="Enter your question here..."
                   />
                   <p className={`mt-1 text-xs ${
                     formData.questionText.trim().length < 3 && formData.questionText.length > 0
                       ? 'text-theme-interactive-danger'
                       : 'text-theme-text-tertiary'
                   }`}>
                     {formData.questionText.length} characters
                     {formData.questionText.trim().length < 3 && formData.questionText.length > 0 && ' (minimum 3 required)'}
                   </p>
                 </div>
               )}

               {/* Difficulty */}
               <div>
                 <label className="block text-sm font-medium text-theme-text-secondary mb-2">
                   Difficulty Level
                 </label>
                 <Dropdown
                   value={formData.difficulty}
                   onChange={(value) => handleInputChange('difficulty', value as QuestionDifficulty)}
                   options={[
                     { label: 'Easy', value: 'EASY' },
                     { label: 'Medium', value: 'MEDIUM' },
                     { label: 'Hard', value: 'HARD' }
                   ]}
                 />
               </div>

               {/* Hint & Explanation - Collapsible */}
               <div className="space-y-4">
                 {/* Add Buttons (when both collapsed) */}
                 {(!showHint || !showExplanation) && (
                   <div className="flex items-center gap-4">
                     {!showHint && (
                       <button
                         type="button"
                         onClick={() => setShowHint(true)}
                         className="inline-flex items-center text-sm text-theme-interactive-primary hover:text-theme-interactive-primary-hover transition-colors"
                       >
                         <LightBulbIcon className="w-4 h-4 mr-1.5" />
                         Add hint
                       </button>
                     )}
                     {!showExplanation && (
                       <button
                         type="button"
                         onClick={() => setShowExplanation(true)}
                         className="inline-flex items-center text-sm text-theme-interactive-primary hover:text-theme-interactive-primary-hover transition-colors"
                       >
                         <QuestionMarkCircleIcon className="w-4 h-4 mr-1.5" />
                         Add explanation
                       </button>
                     )}
                   </div>
                 )}

                 {/* Hint Field */}
                 {showHint && (
                   <div>
                     <div className="flex items-center justify-between mb-2">
                       <label className="block text-sm font-medium text-theme-text-secondary">
                         Hint (Optional)
                       </label>
                       <button
                         type="button"
                         onClick={() => {
                           setShowHint(false);
                           handleInputChange('hint', '');
                         }}
                         className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors"
                         title="Remove hint"
                       >
                         <XMarkIcon className="w-4 h-4" />
                       </button>
                     </div>
                     <textarea
                       value={formData.hint || ''}
                       onChange={(e) => handleInputChange('hint', e.target.value)}
                       rows={2}
                       className="mt-1 block w-full border border-theme-border-primary rounded-md shadow-sm bg-theme-bg-primary text-theme-text-primary focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm"
                       placeholder="Provide a hint..."
                     />
                   </div>
                 )}

                 {/* Explanation Field */}
                 {showExplanation && (
                   <div>
                     <div className="flex items-center justify-between mb-2">
                       <label className="block text-sm font-medium text-theme-text-secondary">
                         Explanation (Optional)
                       </label>
                       <button
                         type="button"
                         onClick={() => {
                           setShowExplanation(false);
                           handleInputChange('explanation', '');
                         }}
                         className="text-theme-text-tertiary hover:text-theme-text-primary transition-colors"
                         title="Remove explanation"
                       >
                         <XMarkIcon className="w-4 h-4" />
                       </button>
                     </div>
                     <textarea
                       value={formData.explanation || ''}
                       onChange={(e) => handleInputChange('explanation', e.target.value)}
                       rows={3}
                       className="mt-1 block w-full border border-theme-border-primary rounded-md shadow-sm bg-theme-bg-primary text-theme-text-primary focus:ring-theme-interactive-primary focus:border-theme-interactive-primary sm:text-sm"
                       placeholder="Provide an explanation for the correct answer..."
                     />
                   </div>
                 )}
               </div>

                {/* Type-specific Content */}
                <div>
                  <label className="block text-sm font-medium text-theme-text-secondary mb-4">
                    {formData.type === 'MCQ_SINGLE' ? 'Single Choice' : 
                     formData.type === 'MCQ_MULTI' ? 'Multiple Choice' :
                     formData.type === 'TRUE_FALSE' ? 'True/False' :
                     formData.type === 'OPEN' ? 'Open Ended' :
                     formData.type === 'FILL_GAP' ? 'Fill in the Blank' :
                     formData.type === 'COMPLIANCE' ? 'Compliance' :
                     formData.type === 'ORDERING' ? 'Ordering' :
                     formData.type === 'HOTSPOT' ? 'Hotspot' :
                     formData.type === 'MATCHING' ? 'Matching' : formData.type}
                  </label>
                  {(() => {
                    switch (formData.type) {
                      case 'MCQ_SINGLE':
                        return (
                          <McqQuestionEditor
                            key={editorKey}
                            content={formData.content as any}
                            onChange={handleContentChange}
                            isMultiSelect={false}
                          />
                        );
                      case 'MCQ_MULTI':
                        return (
                          <McqQuestionEditor
                            key={editorKey}
                            content={formData.content as any}
                            onChange={handleContentChange}
                            isMultiSelect={true}
                          />
                        );
                      case 'TRUE_FALSE':
                        return (
                          <TrueFalseEditor
                            key={editorKey}
                            content={formData.content as any}
                            onChange={handleContentChange}
                            showPreview={false}
                          />
                        );
                      case 'OPEN':
                        return (
                          <OpenQuestionEditor
                            key={editorKey}
                            content={formData.content as any}
                            onChange={handleContentChange}
                            showPreview={false}
                          />
                        );
                      case 'FILL_GAP':
                        return (
                          <FillGapEditor
                            key={editorKey}
                            content={formData.content as any}
                            onChange={handleContentChange}
                            showPreview={false}
                          />
                        );
                      case 'COMPLIANCE':
                        return (
                          <ComplianceEditor
                            key={editorKey}
                            content={formData.content as any}
                            onChange={handleContentChange}
                            showPreview={false}
                          />
                        );
                    case 'ORDERING':
                      return (
                        <OrderingEditor
                          key={editorKey}
                          content={formData.content as any}
                          onChange={handleContentChange}
                          showPreview={false}
                        />
                      );
                    case 'HOTSPOT':
                      return (
                        <HotspotEditor
                          key={editorKey}
                          content={formData.content as any}
                          onChange={handleContentChange}
                          showPreview={false}
                        />
                      );
                    case 'MATCHING':
                      return (
                        <MatchingQuestionForm
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
              <div className="border border-theme-border-primary rounded-lg p-4 bg-theme-bg-secondary bg-theme-bg-primary text-theme-text-primary">
                <h4 className="text-sm font-medium text-theme-text-secondary mb-4">Live Preview (Attempt-like)</h4>
                
                {/* Question Text - matches QuizAttemptPage */}
                {formData.type !== 'FILL_GAP' && formData.questionText && (
                  <h2 className="text-xl font-semibold mb-4 text-theme-text-primary">
                    {formData.questionText}
                  </h2>
                )}
                
                {/* Hint Display - matches QuizAttemptPage */}
                {formData.hint && (
                  <HintDisplay hint={formData.hint} />
                )}
                
                {/* Question Options */}
                <div className="space-y-2 mb-6">
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
                    case 'MATCHING':
                      return (
                        <MatchingAnswer
                          question={q}
                          currentAnswer={previewAnswer as { matches: Array<{ leftId: number; rightId: number }> }}
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

        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border border-theme-border-primary text-theme-text-secondary bg-theme-bg-primary hover:bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-bg-primary focus:ring-theme-interactive-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          {!questionId && (
            <button
              type="button"
              onClick={handleSaveAndAddAnother}
              disabled={saving || (formData.type === 'FILL_GAP' ? !(formData.content as any)?.text?.trim() : !formData.questionText.trim())}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 border border-theme-border-primary text-theme-text-secondary bg-theme-bg-primary hover:bg-theme-bg-tertiary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-bg-primary focus:ring-theme-interactive-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
            disabled={saving || (formData.type === 'FILL_GAP' ? !(formData.content as any)?.text?.trim() : !formData.questionText.trim())}
            className="inline-flex justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 bg-theme-interactive-primary text-theme-text-inverse hover:bg-theme-interactive-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-theme-bg-primary focus:ring-theme-interactive-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
