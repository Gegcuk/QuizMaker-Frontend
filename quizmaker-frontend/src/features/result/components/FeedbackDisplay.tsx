// src/components/attempt/FeedbackDisplay.tsx
// ---------------------------------------------------------------------------
// Component for displaying personalized feedback and recommendations
// Shows performance insights, improvement suggestions, and learning tips
// ---------------------------------------------------------------------------

import React from 'react';
import { AttemptResultDto, AnswerSubmissionDto } from '@/types';

interface FeedbackDisplayProps {
  result: AttemptResultDto;
  answers: AnswerSubmissionDto[];
  className?: string;
}

const FeedbackDisplay: React.FC<FeedbackDisplayProps> = ({
  result,
  answers,
  className = ''
}) => {
  const accuracy = result.totalQuestions > 0 ? (result.correctCount / result.totalQuestions) * 100 : 0;
  const score = result.totalQuestions > 0 ? (result.totalScore / result.totalQuestions) * 100 : 0;
  const incorrectAnswers = answers.filter(answer => !answer.isCorrect);
  const correctAnswers = answers.filter(answer => answer.isCorrect);

  const getPerformanceLevel = (percentage: number): string => {
    if (percentage >= 90) return 'excellent';
    if (percentage >= 80) return 'very good';
    if (percentage >= 70) return 'good';
    if (percentage >= 60) return 'satisfactory';
    if (percentage >= 50) return 'needs improvement';
    return 'requires significant work';
  };

  const getFeedbackMessage = (percentage: number): string => {
    if (percentage >= 90) {
      return "Congratulations! You've demonstrated exceptional mastery of this material. Your performance shows deep understanding and excellent problem-solving skills.";
    }
    if (percentage >= 80) {
      return "Great job! You have a solid understanding of the material. Your performance indicates good comprehension with room for minor refinements.";
    }
    if (percentage >= 70) {
      return "Good work! You've shown a decent understanding of the concepts. Focus on the areas where you struggled to improve your performance.";
    }
    if (percentage >= 60) {
      return "You're on the right track! While you have a basic understanding, there are specific areas that need more attention and practice.";
    }
    if (percentage >= 50) {
      return "Keep practicing! You have some understanding of the material, but significant improvement is needed. Review the concepts thoroughly.";
    }
    return "This material requires more study time. Consider reviewing the foundational concepts before attempting the quiz again.";
  };

  const getImprovementSuggestions = (percentage: number): string[] => {
    const suggestions: string[] = [];
    
    if (percentage >= 90) {
      suggestions.push(
        "Consider helping others learn this material",
        "Try more challenging questions or advanced topics",
        "Share your knowledge through teaching or mentoring"
      );
    } else if (percentage >= 80) {
      suggestions.push(
        "Review the questions you missed carefully",
        "Focus on the specific topics that gave you trouble",
        "Practice similar questions to reinforce your understanding"
      );
    } else if (percentage >= 70) {
      suggestions.push(
        "Identify patterns in the questions you got wrong",
        "Review the fundamental concepts you struggled with",
        "Take notes on areas that need more attention"
      );
    } else if (percentage >= 60) {
      suggestions.push(
        "Break down complex topics into smaller parts",
        "Use different learning methods (videos, practice problems)",
        "Create study guides for difficult concepts"
      );
    } else {
      suggestions.push(
        "Start with the basics and build up gradually",
        "Use multiple resources to understand the material",
        "Consider seeking help from instructors or peers"
      );
    }
    
    return suggestions;
  };

  const getStudyRecommendations = (percentage: number): string[] => {
    const recommendations: string[] = [];
    
    if (percentage < 70) {
      recommendations.push(
        "Review the course material thoroughly",
        "Complete practice exercises and assignments",
        "Form study groups with classmates",
        "Use flashcards for memorization",
        "Take breaks between study sessions"
      );
    } else if (percentage < 80) {
      recommendations.push(
        "Focus on weak areas identified in the quiz",
        "Practice with similar question types",
        "Review explanations for incorrect answers",
        "Create summary notes of key concepts"
      );
    } else {
      recommendations.push(
        "Maintain your current study habits",
        "Challenge yourself with advanced problems",
        "Help others understand the material"
      );
    }
    
    return recommendations;
  };

  const getMotivationalMessage = (percentage: number): string => {
    if (percentage >= 90) {
      return "You're absolutely crushing it! Keep up the amazing work! 🚀";
    }
    if (percentage >= 80) {
      return "You're doing fantastic! You're so close to perfection! 💪";
    }
    if (percentage >= 70) {
      return "You're making great progress! Keep pushing forward! 🌟";
    }
    if (percentage >= 60) {
      return "You're getting there! Every mistake is a learning opportunity! 📚";
    }
    if (percentage >= 50) {
      return "Don't give up! Every expert was once a beginner! 💡";
    }
    return "Remember, learning is a journey, not a destination. You've got this! 🎯";
  };

  const formatDuration = (startTime: string, endTime: string): string => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = end.getTime() - start.getTime();
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const averageTimePerQuestion = result.totalQuestions > 0 
    ? Math.round((new Date(result.completedAt).getTime() - new Date(result.startedAt).getTime()) / result.totalQuestions / 1000)
    : 0;

  return (
    <div className={`bg-theme-bg-primary border border-theme-border-primary rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-theme-text-primary mb-2">Performance Feedback</h2>
        <p className="text-theme-text-secondary">Personalized insights and recommendations for improvement</p>
      </div>

      {/* Performance Overview */}
      <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-900 mb-2">
            {Math.round(score)}% - {getPerformanceLevel(score).toUpperCase()}
          </div>
          <div className="text-lg text-theme-interactive-primary">
            {getFeedbackMessage(score)}
          </div>
        </div>
      </div>

      {/* Motivational Message */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-medium text-yellow-800">
            {getMotivationalMessage(score)}
          </div>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{correctAnswers.length}</div>
            <div className="text-sm text-green-700 font-medium">Correct Answers</div>
            <div className="text-xs text-green-600 mt-1">
              {Math.round((correctAnswers.length / answers.length) * 100)}% success rate
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{incorrectAnswers.length}</div>
            <div className="text-sm text-red-700 font-medium">Areas for Improvement</div>
            <div className="text-xs text-red-600 mt-1">
              Focus on these topics
            </div>
          </div>
        </div>
        
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{formatDuration(result.startedAt, result.completedAt)}</div>
            <div className="text-sm text-purple-700 font-medium">Time Spent</div>
            <div className="text-xs text-purple-600 mt-1">
              {averageTimePerQuestion}s per question
            </div>
          </div>
        </div>
      </div>

      {/* Improvement Suggestions */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-theme-text-primary mb-3">Improvement Suggestions</h3>
        <div className="space-y-2">
          {getImprovementSuggestions(score).map((suggestion, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
              <span className="text-theme-interactive-primary mt-0.5">💡</span>
              <span className="text-sm text-blue-800">{suggestion}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Study Recommendations */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-theme-text-primary mb-3">Study Recommendations</h3>
        <div className="space-y-2">
          {getStudyRecommendations(score).map((recommendation, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
              <span className="text-green-600 mt-0.5">📚</span>
              <span className="text-sm text-green-800">{recommendation}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="mb-6 p-4 bg-theme-bg-secondary rounded-lg">
        <h3 className="text-sm font-medium text-theme-text-primary mb-3">Performance Insights</h3>
        <div className="space-y-2 text-sm text-theme-text-secondary">
          <div>• You answered {answers.length} out of {result.totalQuestions} questions</div>
          <div>• Your accuracy rate is {Math.round(accuracy)}%</div>
          <div>• You spent an average of {averageTimePerQuestion} seconds per question</div>
          {incorrectAnswers.length > 0 && (
            <div>• Focus on reviewing {incorrectAnswers.length} incorrect answers</div>
          )}
          {correctAnswers.length > 0 && (
            <div>• You demonstrated strong understanding in {correctAnswers.length} areas</div>
          )}
        </div>
      </div>

      {/* Next Steps */}
      <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
        <h3 className="text-sm font-medium text-indigo-900 mb-2">Next Steps</h3>
        <div className="space-y-2 text-sm text-theme-interactive-primary">
          {score >= 80 ? (
            <>
              <div>🎯 Consider taking advanced or related quizzes</div>
              <div>📖 Help others by explaining concepts you mastered</div>
              <div>⭐ Set higher goals for future attempts</div>
            </>
          ) : score >= 60 ? (
            <>
              <div>📝 Review the material and retake the quiz</div>
              <div>🔍 Focus on the specific topics you struggled with</div>
              <div>💪 Practice with similar questions</div>
            </>
          ) : (
            <>
              <div>📚 Review the foundational material thoroughly</div>
              <div>🔄 Take the quiz again after studying</div>
              <div>👥 Consider seeking help from instructors or peers</div>
            </>
          )}
        </div>
      </div>

      {/* Encouragement */}
      <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
        <div className="text-center">
          <div className="text-lg font-medium text-green-800 mb-2">
            Remember: Every attempt is progress! 🚀
          </div>
          <div className="text-sm text-green-700">
            Learning is a continuous journey. Each quiz helps you identify areas for growth and improvement.
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackDisplay; 
