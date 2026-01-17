// src/pages/QuizResultPage.tsx
// ---------------------------------------------------------------------------
// Displays the outcome of a completed quiz attempt with detailed question information.
// Route: /quizzes/:quizId/results?attemptId=<uuid>   (wrapped by ProtectedRoute)
// ---------------------------------------------------------------------------

import React, { useEffect, useState } from 'react';
import {
  useParams,
  useSearchParams,
  useNavigate,
} from 'react-router-dom';
import { AttemptService } from '@/services';
import { Spinner, Button, Badge, PageHeader } from '@/components';
import { Seo } from '@/features/seo';
import type { AttemptReviewDto, AnswerReviewDto } from '@/types';
import { api } from '@/services';
import { mediaService } from '@/features/media';
import { 
  CheckCircleIcon, 
  XCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const QuizResultPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const attemptService = new AttemptService(api);

  const attemptId = searchParams.get('attemptId');

  const [review, setReview] = useState<AttemptReviewDto | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
  const [resolvedMediaUrls, setResolvedMediaUrls] = useState<Record<string, string | null>>({});

  /* ------------------------------------------------------------------ */
  /*  Fetch attempt review with answers                                */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!attemptId) return;

    const fetchReview = async () => {
      setLoading(true);
      setError(null);
      try {
        const reviewData = await attemptService.getAttemptReview(attemptId, {
          includeUserAnswers: true,
          includeCorrectAnswers: true,
          includeQuestionContext: true
        });
        setReview(reviewData);
      } catch (e: any) {
        setError(
          e?.response?.data?.error || 'Failed to fetch results. Please retry.',
        );
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [attemptId]);

  useEffect(() => {
    if (!review) {
      return;
    }

    let isActive = true;
    const missingAssetIds = new Set<string>();

    review.answers.forEach((answer) => {
      const attachmentAssetId = answer.attachment?.assetId;
      if (attachmentAssetId && !answer.attachment?.cdnUrl && !Object.prototype.hasOwnProperty.call(resolvedMediaUrls, attachmentAssetId)) {
        missingAssetIds.add(attachmentAssetId);
      }

      const options = answer.questionSafeContent?.options;
      if (Array.isArray(options)) {
        options.forEach((option: any) => {
          const assetId = option?.media?.assetId;
          if (assetId && !option?.media?.cdnUrl && !Object.prototype.hasOwnProperty.call(resolvedMediaUrls, assetId)) {
            missingAssetIds.add(assetId);
          }
        });
      }
    });

    const uniqueAssetIds = Array.from(missingAssetIds);

    if (uniqueAssetIds.length === 0) {
      return;
    }

    const fetchAssets = async () => {
      const results = await Promise.all(
        uniqueAssetIds.map(async (assetId) => {
          try {
            const asset = await mediaService.getAsset(assetId);
            return { assetId, cdnUrl: asset.cdnUrl };
          } catch (error) {
            return { assetId, cdnUrl: null };
          }
        })
      );

      if (!isActive) {
        return;
      }

      setResolvedMediaUrls((prev) => {
        const next = { ...prev };
        results.forEach((result) => {
          if (result) {
            next[result.assetId] = result.cdnUrl;
          }
        });
        return next;
      });
    };

    fetchAssets();

    return () => {
      isActive = false;
    };
  }, [review, resolvedMediaUrls]);

  /* ------------------------------------------------------------------ */
  /*  Helper functions                                                  */
  /* ------------------------------------------------------------------ */
  const toggleQuestionExpansion = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const isQuestionExpanded = (questionId: string) => {
    return expandedQuestions.has(questionId);
  };

  const getScoreColor = (isCorrect: boolean) => {
    return isCorrect ? 'text-theme-interactive-success' : 'text-theme-interactive-danger';
  };

  const getScoreBackground = (correctCount: number, totalQuestions: number) => {
    const percentage = (correctCount / totalQuestions) * 100;
    if (percentage >= 80) return 'bg-theme-bg-success border-theme-border-success';
    if (percentage >= 60) return 'bg-theme-bg-warning border-theme-border-warning';
    return 'bg-theme-bg-danger border-theme-border-danger';
  };

  const renderOptionLabel = (option: any): React.ReactNode => {
    const mediaUrl = option?.media?.cdnUrl || (option?.media?.assetId ? resolvedMediaUrls[option.media.assetId] || undefined : undefined);
    const hasText = !!(option?.text && option.text.trim().length > 0);
    return (
      <div className="flex items-center gap-3">
        {mediaUrl && (
          <img
            src={mediaUrl}
            alt={`Option ${option?.id ?? ''} media`}
            className="h-8 w-auto rounded-md border border-theme-border-primary"
          />
        )}
        <span>
          {hasText ? option.text : mediaUrl ? 'Image option' : `Option ${option?.id ?? ''}`}
        </span>
      </div>
    );
  };

  // Format question text for FILL_GAP questions - replace {N} with underscores
  const formatQuestionText = (questionText: string, questionType: string): string => {
    if (questionType === 'FILL_GAP') {
      // Replace {1}, {2}, {3}, etc. with ______
      return questionText.replace(/\{\d+\}/g, '______');
    }
    return questionText;
  };

  // Format answer for display with context - resolves IDs to readable text using questionSafeContent
  const formatAnswerWithContext = (answer: any, type: string, safeContent: any): React.ReactNode => {
    if (!answer) return <span className="text-theme-text-tertiary italic">No answer provided</span>;
    
    switch (type) {
      case 'MCQ_SINGLE':
        // Answer: { selectedOptionId: string | number } - ID can be string!
        // SafeContent: { options: [{ id, text }] }
        if (answer.selectedOptionId !== undefined && safeContent?.options) {
          const option = safeContent.options.find((opt: any) => opt.id === answer.selectedOptionId);
          return option ? renderOptionLabel(option) : `Option ${answer.selectedOptionId}`;
        }
        return <span className="text-theme-text-tertiary">No answer</span>;
      
      case 'MCQ_MULTI':
        // Answer: { selectedOptionIds: [string | number, ...] } - IDs can be strings!
        // SafeContent: { options: [{ id, text }] }
        if (Array.isArray(answer.selectedOptionIds) && answer.selectedOptionIds.length > 0 && safeContent?.options) {
          return (
            <ul className="list-disc list-inside space-y-1">
              {answer.selectedOptionIds.map((optId: any, idx: number) => {
                const option = safeContent.options.find((opt: any) => opt.id === optId);
                return <li key={idx}>{option ? renderOptionLabel(option) : `Option ${optId}`}</li>;
              })}
            </ul>
          );
        }
        return <span className="text-theme-text-tertiary">No answer</span>;
      
      case 'TRUE_FALSE':
        // Answer: { answer: boolean }
        return answer.answer !== undefined ? (answer.answer ? 'True' : 'False') : <span className="text-theme-text-tertiary">No answer</span>;
      
      case 'OPEN':
        // Answer: { answer: "text" }
        return answer.answer ? (
          <div className="whitespace-pre-wrap">{answer.answer}</div>
        ) : <span className="text-theme-text-tertiary">No answer</span>;
      
      case 'FILL_GAP':
        // Answer: { answers: [{ gapId: number, answer: "text" }] }
        // SafeContent: { text: "...", gaps: [{ gapId, placeholder }] }
        if (Array.isArray(answer.answers) && answer.answers.length > 0) {
          return (
            <div className="space-y-1">
              {answer.answers.map((gap: any) => (
                <div key={gap.gapId} className="text-sm">
                  Gap {gap.gapId}: <span className="font-medium">{gap.answer || gap.text}</span>
                </div>
              ))}
            </div>
          );
        }
        return <span className="text-theme-text-tertiary">No answer</span>;
      
      case 'ORDERING':
        // Answer: { orderedItemIds: [number, ...] }
        // SafeContent: { items: [{ id, text }] }
        if (Array.isArray(answer.orderedItemIds) && answer.orderedItemIds.length > 0 && safeContent?.items) {
          return (
            <div className="flex items-center gap-2 flex-wrap">
              {answer.orderedItemIds.map((itemId: number, idx: number) => {
                const item = safeContent.items.find((i: any) => i.id === itemId);
                return (
                  <React.Fragment key={itemId}>
                    <span className="px-2 py-1 bg-theme-bg-tertiary rounded text-sm font-medium">
                      {item?.text || `Item ${itemId}`}
                    </span>
                    {idx < answer.orderedItemIds.length - 1 && <span className="text-theme-text-tertiary">→</span>}
                  </React.Fragment>
                );
              })}
            </div>
          );
        }
        return <span className="text-theme-text-tertiary">No answer</span>;
      
      case 'COMPLIANCE':
        // Answer: { selectedStatementIds: [number, ...] }
        // SafeContent: { statements: [{ id, text }] }
        if (Array.isArray(answer.selectedStatementIds) && answer.selectedStatementIds.length > 0 && safeContent?.statements) {
          return (
            <ul className="space-y-1">
              {answer.selectedStatementIds.map((stmtId: number) => {
                const statement = safeContent.statements.find((s: any) => s.id === stmtId);
                return (
                  <li key={stmtId} className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded text-xs bg-theme-bg-success text-theme-text-primary">
                      Compliant
                    </span>
                    <span className="text-sm">{statement?.text || `Statement ${stmtId}`}</span>
                  </li>
                );
              })}
            </ul>
          );
        }
        return <span className="text-theme-text-tertiary">No answer</span>;
      
      case 'HOTSPOT':
        // Answer: { regionId: number }
        // SafeContent: { imageUrl, regions: [{ id, label }] }
        if (answer.regionId && safeContent?.regions) {
          const region = safeContent.regions.find((r: any) => r.id === answer.regionId);
          return region?.label || `Region ${answer.regionId}`;
        }
        if (answer.regionId) return `Region ${answer.regionId}`;
        return <span className="text-theme-text-tertiary">No answer</span>;
      
      case 'MATCHING':
        // Answer: { matches: [{ leftId: number, rightId: number }] }
        // SafeContent: { left: [{ id, text }], right: [{ id, text }] }
        if (Array.isArray(answer.matches) && answer.matches.length > 0 && safeContent?.left && safeContent?.right) {
          return (
            <ul className="space-y-1">
              {answer.matches.map((match: any, idx: number) => {
                const leftItem = safeContent.left.find((l: any) => l.id === match.leftId);
                const rightItem = safeContent.right.find((r: any) => r.id === match.rightId);
                return (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 bg-theme-bg-tertiary rounded">{leftItem?.text || match.leftId}</span>
                    <span className="text-theme-text-tertiary">→</span>
                    <span className="px-2 py-1 bg-theme-bg-tertiary rounded font-medium">{rightItem?.text || match.rightId}</span>
                  </li>
                );
              })}
            </ul>
          );
        }
        return <span className="text-theme-text-tertiary">No answer</span>;
      
      default:
        return <span className="text-theme-text-tertiary">Unknown question type</span>;
    }
  };

  // Format correct answer - handles the actual API response structure
  const formatCorrectAnswer = (answer: any, type: string, safeContent: any): React.ReactNode => {
    if (!answer) return <span className="text-theme-text-tertiary italic">N/A</span>;
    
    switch (type) {
      case 'MCQ_SINGLE':
        // CorrectAnswer: { correctOptionId: string | number } - ID can be string!
        if (answer.correctOptionId !== undefined && safeContent?.options) {
          const option = safeContent.options.find((opt: any) => opt.id === answer.correctOptionId);
          return option ? renderOptionLabel(option) : `Option ${answer.correctOptionId}`;
        }
        return <span className="text-theme-text-tertiary">N/A</span>;
      
      case 'MCQ_MULTI':
        // CorrectAnswer: { correctOptionIds: [string | number, ...] } - IDs can be strings!
        if (Array.isArray(answer.correctOptionIds) && answer.correctOptionIds.length > 0 && safeContent?.options) {
          return (
            <ul className="list-disc list-inside space-y-1">
              {answer.correctOptionIds.map((optId: any, idx: number) => {
                const option = safeContent.options.find((opt: any) => opt.id === optId);
                return <li key={idx}>{option ? renderOptionLabel(option) : `Option ${optId}`}</li>;
              })}
            </ul>
          );
        }
        return <span className="text-theme-text-tertiary">N/A</span>;
      
      case 'TRUE_FALSE':
        // CorrectAnswer: { answer: boolean }
        return answer.answer !== undefined ? (answer.answer ? 'True' : 'False') : <span className="text-theme-text-tertiary">N/A</span>;
      
      case 'OPEN':
        // CorrectAnswer: { answer: "text" }
        return answer.answer ? (
          <div className="whitespace-pre-wrap">{answer.answer}</div>
        ) : <span className="text-theme-text-tertiary">N/A</span>;
      
      case 'FILL_GAP':
        // CorrectAnswer: { answers: [{ id: number, text: "answer" }] } - uses "text" not "answer"!
        if (Array.isArray(answer.answers) && answer.answers.length > 0) {
          return (
            <div className="space-y-1">
              {answer.answers.map((gap: any) => (
                <div key={gap.id || gap.gapId} className="text-sm">
                  Gap {gap.id || gap.gapId}: <span className="font-medium">{gap.text || gap.answer}</span>
                </div>
              ))}
            </div>
          );
        }
        return <span className="text-theme-text-tertiary">N/A</span>;
      
      case 'ORDERING':
        // CorrectAnswer: { order: [number, ...] } - field is "order" not "correctOrder"!
        if (Array.isArray(answer.order) && answer.order.length > 0 && safeContent?.items) {
          return (
            <div className="flex items-center gap-2 flex-wrap">
              {answer.order.map((itemId: number, idx: number) => {
                const item = safeContent.items.find((i: any) => i.id === itemId);
                return (
                  <React.Fragment key={itemId}>
                    <span className="px-2 py-1 bg-theme-bg-tertiary rounded text-sm font-medium">
                      {item?.text || `Item ${itemId}`}
                    </span>
                    {idx < answer.order.length - 1 && <span className="text-theme-text-tertiary">→</span>}
                  </React.Fragment>
                );
              })}
            </div>
          );
        }
        return <span className="text-theme-text-tertiary">N/A</span>;
      
      case 'COMPLIANCE':
        // CorrectAnswer: { compliantIds: [number, ...] } - field is "compliantIds"!
        if (Array.isArray(answer.compliantIds) && answer.compliantIds.length > 0 && safeContent?.statements) {
          return (
            <ul className="space-y-1">
              {answer.compliantIds.map((stmtId: number) => {
                const statement = safeContent.statements.find((s: any) => s.id === stmtId);
                return (
                  <li key={stmtId} className="flex items-center gap-2">
                    <span className="px-2 py-1 rounded text-xs bg-theme-bg-success text-theme-text-primary">
                      Compliant
                    </span>
                    <span className="text-sm">{statement?.text || `Statement ${stmtId}`}</span>
                  </li>
                );
              })}
            </ul>
          );
        }
        return <span className="text-theme-text-tertiary">N/A</span>;
      
      case 'HOTSPOT':
        // CorrectAnswer: { correctRegionId: number }
        if (answer.correctRegionId !== undefined && safeContent?.regions) {
          const region = safeContent.regions.find((r: any) => r.id === answer.correctRegionId);
          return region?.label || `Region ${answer.correctRegionId}`;
        }
        if (answer.correctRegionId !== undefined) return `Region ${answer.correctRegionId}`;
        return <span className="text-theme-text-tertiary">N/A</span>;
      
      case 'MATCHING':
        // CorrectAnswer: { pairs: [{ leftId: number, rightId: number }] }
        // SafeContent: { left: [{ id, text }], right: [{ id, text }] }
        if (Array.isArray(answer.pairs) && answer.pairs.length > 0 && safeContent?.left && safeContent?.right) {
          return (
            <ul className="space-y-1">
              {answer.pairs.map((pair: any, idx: number) => {
                const leftItem = safeContent.left.find((l: any) => l.id === pair.leftId);
                const rightItem = safeContent.right.find((r: any) => r.id === pair.rightId);
                return (
                  <li key={idx} className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 bg-theme-bg-tertiary rounded">{leftItem?.text || pair.leftId}</span>
                    <span className="text-theme-text-tertiary">→</span>
                    <span className="px-2 py-1 bg-theme-bg-tertiary rounded font-medium">{rightItem?.text || pair.rightId}</span>
                  </li>
                );
              })}
            </ul>
          );
        }
        return <span className="text-theme-text-tertiary">N/A</span>;
      
      default:
        return <span className="text-theme-text-tertiary">Unknown type</span>;
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Early exits                                                       */
  /* ------------------------------------------------------------------ */
  if (!attemptId) {
    return (
      <>
        <PageHeader
          title="Quiz Results"
          subtitle="No attempt ID provided"
          showBreadcrumb={true}
          customBreadcrumbItems={[
            { label: 'Home', path: '/my-quizzes' },
            { label: 'My Attempts', path: '/my-attempts' },
            { label: 'Quiz Results', path: '#', isCurrent: true }
          ]}
          showBackButton={true}
          backTo="/my-attempts"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-theme-interactive-danger">No attempt ID provided.</p>
          <Button
            variant="secondary"
            onClick={() => navigate('/my-attempts')}
            className="mt-4"
          >
            ← Back to My Attempts
          </Button>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <>
        <PageHeader
          title="Quiz Results"
          subtitle="Error loading results"
          showBreadcrumb={true}
          customBreadcrumbItems={[
            { label: 'Home', path: '/my-quizzes' },
            { label: 'My Attempts', path: '/my-attempts' },
            { label: 'Quiz Results', path: `/quizzes/${quizId}/results?attemptId=${attemptId}`, isCurrent: true }
          ]}
          showBackButton={true}
          backTo="/my-attempts"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-theme-bg-danger border border-theme-border-danger rounded-lg p-4">
            <div className="flex items-center">
              <XCircleIcon className="h-5 w-5 text-theme-interactive-danger flex-shrink-0" />
              <p className="ml-3 text-sm text-theme-interactive-danger">{error}</p>
            </div>
          </div>
          <div className="mt-4">
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (!review) {
    return (
      <>
        <PageHeader
          title="Quiz Results"
          subtitle="No results found"
          showBreadcrumb={true}
          customBreadcrumbItems={[
            { label: 'Home', path: '/my-quizzes' },
            { label: 'My Attempts', path: '/my-attempts' },
            { label: 'Quiz Results', path: `/quizzes/${quizId}/results?attemptId=${attemptId}`, isCurrent: true }
          ]}
          showBackButton={true}
          backTo="/my-attempts"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-theme-text-primary">No results found.</p>
        </div>
      </>
    );
  }

  const accuracyPercentage = Math.round((review.correctCount / review.totalQuestions) * 100);

  /* ------------------------------------------------------------------ */
  /*  Render results                                                    */
  /* ------------------------------------------------------------------ */
  return (
    <>
      <Seo title="Quiz Results | Quizzence" noindex />
      <PageHeader
        title="Quiz Results"
        subtitle={`Completed on ${new Date(review.completedAt).toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`}
        showBreadcrumb={true}
        customBreadcrumbItems={[
          { label: 'Home', path: '/my-quizzes' },
          { label: 'My Attempts', path: '/my-attempts' },
          { label: 'Quiz Results', path: `/quizzes/${quizId}/results?attemptId=${attemptId}`, isCurrent: true }
        ]}
        showBackButton={true}
        backTo="/my-attempts"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Card */}
        <div className={`bg-theme-bg-primary rounded-lg shadow-theme p-6 mb-8 border-2 ${getScoreBackground(review.correctCount, review.totalQuestions)}`}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-theme-text-primary">{review.totalScore}</div>
              <div className="text-sm text-theme-text-secondary mt-1">Total Score</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-theme-text-primary">
                {review.correctCount}/{review.totalQuestions}
              </div>
              <div className="text-sm text-theme-text-secondary mt-1">Correct Answers</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${accuracyPercentage >= 80 ? 'text-theme-interactive-success' : accuracyPercentage >= 60 ? 'text-theme-interactive-warning' : 'text-theme-interactive-danger'}`}>
                {accuracyPercentage}%
              </div>
              <div className="text-sm text-theme-text-secondary mt-1">Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-theme-text-primary">
                {review.totalQuestions}
              </div>
              <div className="text-sm text-theme-text-secondary mt-1">Questions</div>
            </div>
          </div>
        </div>

        {/* Question Breakdown */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-theme-text-primary mb-4">Answer Review</h2>
          
          {review.answers.map((answer, index) => {
            const isExpanded = isQuestionExpanded(answer.questionId);
            return (
              <div 
                key={answer.questionId} 
                className={`bg-theme-bg-primary rounded-lg border-2 transition-all duration-200 ${
                  answer.isCorrect ? 'border-l-theme-interactive-success' : 'border-l-theme-interactive-danger'
                } border-theme-border-primary`}
              >
                {/* Question Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-theme-bg-secondary transition-colors"
                  onClick={() => toggleQuestionExpansion(answer.questionId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="bg-theme-bg-tertiary text-theme-text-secondary px-3 py-1 rounded-full text-sm font-medium flex-shrink-0">
                        Q{index + 1}
                      </span>
                      <span 
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                          answer.isCorrect 
                            ? 'bg-theme-bg-success text-theme-text-success border border-theme-border-success' 
                            : 'bg-theme-bg-danger text-theme-text-danger border border-theme-border-danger'
                        }`}
                      >
                        {answer.isCorrect ? (
                          <>
                            <CheckCircleIcon className="h-3 w-3" />
                            Correct
                          </>
                        ) : (
                          <>
                            <XCircleIcon className="h-3 w-3" />
                            Incorrect
                          </>
                        )}
                      </span>
                      <Badge variant="neutral" size="sm" className="hidden md:inline-flex flex-shrink-0">
                        {answer.type.replace(/_/g, ' ')}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-theme-text-primary line-clamp-2">
                          {formatQuestionText(answer.questionText, answer.type)}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className={`text-sm font-medium ${getScoreColor(answer.isCorrect)}`}>
                        {answer.score} pt{answer.score !== 1 ? 's' : ''}
                      </div>
                      {isExpanded ? (
                        <ChevronDownIcon className="h-5 w-5 text-theme-text-tertiary" />
                      ) : (
                        <ChevronRightIcon className="h-5 w-5 text-theme-text-tertiary" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Question Details */}
                {isExpanded && (
                  <div className="border-t border-theme-border-primary p-6 space-y-4">
                    {/* Question Text */}
                    <div>
                      <h4 className="font-medium text-theme-text-primary mb-2">Question:</h4>
                      <div className="p-3 rounded-md bg-theme-bg-secondary border border-theme-border-primary">
                        <p className="text-sm text-theme-text-primary whitespace-pre-wrap">
                          {formatQuestionText(answer.questionText, answer.type)}
                        </p>
                      </div>
                    </div>

                    {(answer.attachment?.cdnUrl || answer.attachmentUrl) && (
                      <div>
                        <img
                          src={
                            answer.attachment?.cdnUrl
                            || (answer.attachment?.assetId ? resolvedMediaUrls[answer.attachment.assetId] : undefined)
                            || answer.attachmentUrl
                            || ''
                          }
                          alt="Question attachment"
                          className="max-w-full h-auto rounded-md border border-theme-border-primary"
                        />
                      </div>
                    )}

                    {/* User's Answer */}
                    <div>
                      <h4 className="font-medium text-theme-text-primary mb-2">Your Answer:</h4>
                      <div className={`p-3 rounded-md border ${
                        answer.isCorrect 
                          ? 'bg-theme-bg-success border-theme-border-success' 
                          : 'bg-theme-bg-danger border-theme-border-danger'
                      }`}>
                        <div className="text-sm text-theme-text-primary">
                          {formatAnswerWithContext(answer.userResponse, answer.type, answer.questionSafeContent)}
                        </div>
                      </div>
                    </div>

                    {/* Correct Answer */}
                    <div>
                      <h4 className="font-medium text-theme-text-primary mb-2">Correct Answer:</h4>
                      <div className="p-3 rounded-md bg-theme-bg-success border border-theme-border-success">
                        <div className="text-sm text-theme-text-primary">
                          {formatCorrectAnswer(answer.correctAnswer, answer.type, answer.questionSafeContent)}
                        </div>
                      </div>
                    </div>

                    {/* Explanation */}
                    {answer.explanation && (
                      <div>
                        <h4 className="font-medium text-theme-text-primary mb-2">Explanation:</h4>
                        <div className="p-3 rounded-md bg-theme-bg-secondary border border-theme-border-primary">
                          <p className="text-sm text-theme-text-secondary whitespace-pre-wrap">
                            {answer.explanation}
                          </p>
                        </div>
                      </div>
                    )}

                    {answer.hint && (
                      <div>
                        <h4 className="font-medium text-theme-text-primary mb-2">Hint:</h4>
                        <div className="p-3 rounded-md bg-theme-bg-secondary border border-theme-border-primary">
                          <p className="text-sm text-theme-text-secondary whitespace-pre-wrap">
                            {answer.hint}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Timing Info */}
                    <div className="flex items-center justify-between text-xs text-theme-text-tertiary pt-2 border-t border-theme-border-secondary">
                      <span>Answered: {new Date(answer.answeredAt).toLocaleString('en-GB', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</span>
                      <span>{answer.score} point{answer.score !== 1 ? 's' : ''} earned</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button
            variant="secondary"
            onClick={() => navigate('/my-attempts')}
          >
            ← Back to My Attempts
          </Button>
          {quizId && (
            <Button
              variant="primary"
              onClick={() => navigate(`/quizzes/${quizId}`)}
            >
              View Quiz Details
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default QuizResultPage;
