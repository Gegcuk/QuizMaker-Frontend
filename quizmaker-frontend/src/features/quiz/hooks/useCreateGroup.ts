// src/features/quiz/hooks/useCreateGroup.ts
// ---------------------------------------------------------------------------
// Hook for creating quiz groups with optional quiz addition
// Encapsulates the create-group flow logic
// ---------------------------------------------------------------------------

import { useCallback } from 'react';
import { CreateQuizGroupRequest } from '../types/quiz.types';
import { quizGroupService } from '../services';
import { useToast } from '@/components';

interface UseCreateGroupOptions {
  quizId?: string;
  onSuccess?: (groupId: string) => void;
}

interface UseCreateGroupReturn {
  handleCreateGroup: (data: CreateQuizGroupRequest) => Promise<string>;
}

/**
 * Hook for creating quiz groups
 * Handles group creation, ID validation, optional quiz addition, and toast notifications
 * 
 * @param options - Configuration options
 * @param options.quizId - Optional quiz ID to add to the group after creation
 * @param options.onSuccess - Optional callback called after successful group creation
 * @returns Object with handleCreateGroup function
 */
export const useCreateGroup = ({
  quizId,
  onSuccess
}: UseCreateGroupOptions = {}): UseCreateGroupReturn => {
  const { addToast } = useToast();

  const handleCreateGroup = useCallback(
    async (data: CreateQuizGroupRequest): Promise<string> => {
      // Create the group
      const groupId = await quizGroupService.createQuizGroup(data);

      // Validate groupId before proceeding
      if (!groupId || groupId === 'undefined' || groupId === 'null') {
        addToast({
          type: 'error',
          message: 'Failed to create group: Invalid group ID returned'
        });
        throw new Error('Invalid group ID returned from API');
      }

      // If quizId is provided, add the quiz to the group
      if (quizId) {
        try {
          await quizGroupService.addQuizzesToGroup(groupId, {
            quizIds: [quizId]
          });
          addToast({
            type: 'success',
            message: 'Group created and quiz added'
          });
        } catch (error: any) {
          // Show more detailed error message if available
          const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
          addToast({
            type: 'warning',
            message: `Group created but failed to add quiz: ${errorMessage}. You can add it manually.`
          });
        }
      } else {
        addToast({
          type: 'success',
          message: 'Group created successfully'
        });
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(groupId);
      }

      return groupId;
    },
    [quizId, onSuccess, addToast]
  );

  return { handleCreateGroup };
};

