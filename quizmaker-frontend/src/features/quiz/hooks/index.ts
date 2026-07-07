// Quiz feature hooks exports
// This allows importing quiz hooks from a single location

export {
  metadataKeys,
  useCategories,
  useQuizMetadata,
  useTags,
} from './useQuizMetadataQueries';
export { useQuizFiltering, useQuizPagination } from './useQuizFiltering';
export { useCreateGroup } from './useCreateGroup';
export {
  quizKeys,
  useDeleteQuiz,
  useQuiz,
  useQuizLeaderboard,
  useQuizStats,
  useUpdateQuiz,
} from './useQuizQueries';
