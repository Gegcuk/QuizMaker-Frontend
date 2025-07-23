import React, { useState, useEffect } from 'react';
import { AiService } from '../../api/ai.service';
import api from '../../api/axiosInstance';
import { 
  ChatRequestDto,
  ChatResponseDto
} from '../../types/ai.types';

interface AiSuggestionsProps {
  context?: 'quiz-creation' | 'question-improvement' | 'difficulty-adjustment' | 'engagement' | 'general';
  quizData?: {
    title?: string;
    description?: string;
    difficulty?: string;
    questionCount?: number;
    questionTypes?: string[];
  };
  onSuggestionClick?: (suggestion: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: string;
  action?: string;
  icon: string;
}

const AiSuggestions: React.FC<AiSuggestionsProps> = ({ 
  context = 'general',
  quizData,
  onSuggestionClick,
  onError,
  className = '' 
}) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const aiService = new AiService(api);

  useEffect(() => {
    generateSuggestions();
  }, [context, quizData]);

  const generateSuggestions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Generate context-specific suggestions
      const contextSuggestions = getContextSuggestions();
      setSuggestions(contextSuggestions);

      // If we have quiz data, try to get AI-powered suggestions
      if (quizData && Object.keys(quizData).length > 0) {
        await generateAISuggestions();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate suggestions';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAISuggestions = async () => {
    if (!quizData) return;

    try {
      const prompt = generateAIPrompt();
      const request: ChatRequestDto = {
        message: prompt
      };

      const response = await aiService.sendChatMessage(request);
      
      // Parse AI response and add to suggestions
      const aiSuggestions = parseAIResponse(response.message);
      setSuggestions(prev => [...prev, ...aiSuggestions]);
    } catch (err) {
      // Silently fail for AI suggestions - fallback to static suggestions
      console.warn('AI suggestions failed, using static suggestions:', err);
    }
  };

  const generateAIPrompt = (): string => {
    const basePrompt = `Based on this quiz information, provide 3-5 specific, actionable suggestions for improvement:`;
    
    const quizInfo = [
      quizData?.title && `Title: ${quizData.title}`,
      quizData?.description && `Description: ${quizData.description}`,
      quizData?.difficulty && `Difficulty: ${quizData.difficulty}`,
      quizData?.questionCount && `Question Count: ${quizData.questionCount}`,
      quizData?.questionTypes && `Question Types: ${quizData.questionTypes.join(', ')}`
    ].filter(Boolean).join('\n');

    return `${basePrompt}\n\n${quizInfo}\n\nPlease provide suggestions in this format:\n- [Category]: [Specific suggestion with actionable steps]`;
  };

  const parseAIResponse = (response: string): Suggestion[] => {
    const lines = response.split('\n').filter(line => line.trim().startsWith('-'));
    
    return lines.slice(0, 5).map((line, index) => {
      const match = line.match(/^- \[([^\]]+)\]: (.+)$/);
      if (match) {
        return {
          id: `ai-${index}`,
          title: match[1],
          description: match[2],
          category: 'ai-powered',
          icon: '🤖'
        };
      }
      return null;
    }).filter(Boolean) as Suggestion[];
  };

  const getContextSuggestions = (): Suggestion[] => {
    const baseSuggestions: Suggestion[] = [
      {
        id: 'structure',
        title: 'Quiz Structure',
        description: 'Organize questions from easy to hard, group by topic, and include a mix of question types',
        category: 'structure',
        action: 'Learn about quiz structure best practices',
        icon: '📊'
      },
      {
        id: 'timing',
        title: 'Time Management',
        description: 'Set appropriate time limits: 1-2 minutes for MCQs, 3-5 minutes for open questions',
        category: 'timing',
        action: 'Calculate optimal timing for your quiz',
        icon: '⏱️'
      },
      {
        id: 'difficulty',
        title: 'Difficulty Balance',
        description: 'Aim for 60% medium, 20% easy, 20% hard questions for optimal engagement',
        category: 'difficulty',
        action: 'Analyze your difficulty distribution',
        icon: '⚖️'
      },
      {
        id: 'feedback',
        title: 'Provide Feedback',
        description: 'Include explanations for correct answers and helpful hints for learning',
        category: 'feedback',
        action: 'Add explanations to your questions',
        icon: '💡'
      },
      {
        id: 'variety',
        title: 'Question Variety',
        description: 'Mix different question types to maintain engagement and test various skills',
        category: 'variety',
        action: 'Explore different question types',
        icon: '🎯'
      }
    ];

    const contextSpecificSuggestions: Record<string, Suggestion[]> = {
      'quiz-creation': [
        {
          id: 'start-simple',
          title: 'Start Simple',
          description: 'Begin with basic multiple choice questions and gradually add complexity',
          category: 'creation',
          action: 'Create your first question',
          icon: '🚀'
        },
        {
          id: 'clear-objectives',
          title: 'Define Objectives',
          description: 'Clearly state what learners should know after completing the quiz',
          category: 'creation',
          action: 'Write learning objectives',
          icon: '🎯'
        }
      ],
      'question-improvement': [
        {
          id: 'avoid-ambiguity',
          title: 'Avoid Ambiguity',
          description: 'Ensure questions have only one correct answer and are crystal clear',
          category: 'improvement',
          action: 'Review question clarity',
          icon: '🔍'
        },
        {
          id: 'realistic-options',
          title: 'Realistic Options',
          description: 'Make all multiple choice options plausible to avoid obvious answers',
          category: 'improvement',
          action: 'Improve answer options',
          icon: '🎲'
        }
      ],
      'difficulty-adjustment': [
        {
          id: 'assess-current',
          title: 'Assess Current Level',
          description: 'Analyze existing question difficulty and identify gaps',
          category: 'difficulty',
          action: 'Review difficulty levels',
          icon: '📈'
        },
        {
          id: 'progressive-difficulty',
          title: 'Progressive Difficulty',
          description: 'Start with easier questions to build confidence, then increase challenge',
          category: 'difficulty',
          action: 'Reorder questions by difficulty',
          icon: '📊'
        }
      ],
      'engagement': [
        {
          id: 'interactive-elements',
          title: 'Interactive Elements',
          description: 'Use images, scenarios, and real-world examples to make questions engaging',
          category: 'engagement',
          action: 'Add multimedia elements',
          icon: '🖼️'
        },
        {
          id: 'storytelling',
          title: 'Storytelling Approach',
          description: 'Frame questions in scenarios or stories to increase relevance',
          category: 'engagement',
          action: 'Create scenario-based questions',
          icon: '📖'
        }
      ]
    };

    return [
      ...baseSuggestions,
      ...(contextSpecificSuggestions[context] || [])
    ];
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    onSuggestionClick?.(suggestion.description);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'structure': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'timing': return 'bg-green-50 text-green-700 border-green-200';
      case 'difficulty': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'feedback': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'variety': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'creation': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'improvement': return 'bg-red-50 text-red-700 border-red-200';
      case 'engagement': return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'ai-powered': return 'bg-gray-50 text-gray-700 border-gray-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const filteredSuggestions = selectedCategory === 'all' 
    ? suggestions 
    : suggestions.filter(s => s.category === selectedCategory);

  const categories = ['all', ...new Set(suggestions.map(s => s.category))];

  return (
    <div className={`bg-white border rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">AI Suggestions</h3>
          <p className="text-sm text-gray-600 mt-1">
            {context === 'quiz-creation' && 'Get started with quiz creation best practices'}
            {context === 'question-improvement' && 'Improve your existing questions'}
            {context === 'difficulty-adjustment' && 'Optimize quiz difficulty levels'}
            {context === 'engagement' && 'Make your quiz more engaging'}
            {context === 'general' && 'General quiz improvement suggestions'}
          </p>
        </div>
        <button
          type="button"
          onClick={generateSuggestions}
          disabled={isLoading}
          className="text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {isLoading ? 'Generating...' : 'Refresh'}
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'All' : category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions List */}
      {!isLoading && (
        <div className="space-y-4">
          {filteredSuggestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No suggestions available for this category</p>
            </div>
          ) : (
            filteredSuggestions.map((suggestion) => (
              <div
                key={suggestion.id}
                className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                  getCategoryColor(suggestion.category)
                }`}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl">{suggestion.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{suggestion.title}</h4>
                    <p className="text-sm opacity-90">{suggestion.description}</p>
                    {suggestion.action && (
                      <button
                        type="button"
                        className="text-xs underline mt-2 hover:no-underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSuggestionClick(suggestion);
                        }}
                      >
                        {suggestion.action}
                      </button>
                    )}
                  </div>
                  {suggestion.category === 'ai-powered' && (
                    <div className="text-xs bg-white bg-opacity-50 px-2 py-1 rounded">
                      AI
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
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

      {/* Footer */}
      <div className="mt-6 pt-4 border-t">
        <p className="text-xs text-gray-500 text-center">
          Suggestions are based on educational best practices and AI analysis
        </p>
      </div>
    </div>
  );
};

export default AiSuggestions; 