import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getQuizById, deleteQuiz, updateQuiz } from '@/services';
import { QuizDto, QuizResultSummaryDto } from '@/types';
import { logger } from '@/utils';

// Query keys
export const quizKeys = {
  all: ['quizzes'] as const,
  lists: () => [...quizKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...quizKeys.lists(), { filters }] as const,
  details: () => [...quizKeys.all, 'detail'] as const,
  detail: (id: string) => [...quizKeys.details(), id] as const,
  stats: (id: string) => [...quizKeys.detail(id), 'stats'] as const,
  leaderboard: (id: string) => [...quizKeys.detail(id), 'leaderboard'] as const,
};

// Quiz detail query
export const useQuiz = (quizId: string) => {
  return useQuery({
    queryKey: quizKeys.detail(quizId),
    queryFn: () => getQuizById(quizId),
    enabled: !!quizId,
    staleTime: 2 * 60 * 1000, // 2 minutes for quiz details
  });
};

// Quiz statistics query
export const useQuizStats = (quizId: string) => {
  return useQuery({
    queryKey: quizKeys.stats(quizId),
    queryFn: async (): Promise<QuizResultSummaryDto> => {
      // TODO: Replace with actual API call when backend is ready
      logger.debug('Fetching quiz stats', 'useQuizStats', { quizId });
      
      // Mock data for now
      return {
        quizId,
        attemptsCount: 156,
        averageScore: 78.5,
        bestScore: 95.0,
        worstScore: 45.0,
        passRate: 82.3,
        questionStats: []
      };
    },
    enabled: !!quizId,
    staleTime: 5 * 60 * 1000, // 5 minutes for stats
  });
};

// Quiz leaderboard query
export const useQuizLeaderboard = (quizId: string) => {
  return useQuery({
    queryKey: quizKeys.leaderboard(quizId),
    queryFn: async () => {
      // TODO: Replace with actual API call when backend is ready
      logger.debug('Fetching quiz leaderboard', 'useQuizLeaderboard', { quizId });
      
      // Mock data for now
      return [
        { userId: '1', username: 'John Doe', bestScore: 95 },
        { userId: '2', username: 'Jane Smith', bestScore: 92 },
        { userId: '3', username: 'Bob Johnson', bestScore: 88 },
        { userId: '4', username: 'Alice Brown', bestScore: 85 },
        { userId: '5', username: 'Charlie Wilson', bestScore: 82 }
      ];
    },
    enabled: !!quizId,
    staleTime: 10 * 60 * 1000, // 10 minutes for leaderboard
  });
};

// Delete quiz mutation
export const useDeleteQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteQuiz,
    onSuccess: (_, quizId) => {
      logger.info('Quiz deleted successfully', 'useDeleteQuiz', { quizId });
      
      // Invalidate and remove quiz-related queries
      queryClient.removeQueries({ queryKey: quizKeys.detail(quizId) });
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
    },
    onError: (error: any, quizId) => {
      logger.error('Failed to delete quiz', 'useDeleteQuiz', { 
        quizId, 
        error: error?.response?.data?.message || error.message 
      });
    },
  });
};

// Update quiz mutation
export const useUpdateQuiz = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ quizId, data }: { quizId: string; data: Partial<QuizDto> }) => 
      updateQuiz(quizId, data),
    onSuccess: (updatedQuiz, { quizId }) => {
      logger.info('Quiz updated successfully', 'useUpdateQuiz', { quizId });
      
      // Update the cache with the new data
      queryClient.setQueryData(quizKeys.detail(quizId), updatedQuiz);
      queryClient.invalidateQueries({ queryKey: quizKeys.lists() });
    },
    onError: (error: any, { quizId }) => {
      logger.error('Failed to update quiz', 'useUpdateQuiz', { 
        quizId, 
        error: error?.response?.data?.message || error.message 
      });
    },
  });
};
