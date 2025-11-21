// src/features/quiz/components/QuizGroupMenu.tsx
// ---------------------------------------------------------------------------
// Groups section in the 3-dots menu for QuizCard
// Shows list of groups and allows adding/removing quiz from groups
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuizGroupSummaryDto, CreateQuizGroupRequest } from '../types/quiz.types';
import { QuizGroupService } from '../services/quiz-group.service';
import { useToast } from '@/components';
import { api } from '@/services';
import CreateGroupModal from './CreateGroupModal';

interface QuizGroupMenuProps {
  quizId: string;
  onGroupsChanged?: () => void;
}

const QuizGroupMenu: React.FC<QuizGroupMenuProps> = ({
  quizId,
  onGroupsChanged
}) => {
  const [groups, setGroups] = useState<QuizGroupSummaryDto[]>([]);
  const [quizGroupIds, setQuizGroupIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { addToast } = useToast();

  const groupService = new QuizGroupService(api);

  // Load groups and check which ones contain this quiz
  useEffect(() => {
    loadGroups();
  }, [quizId]);

  const loadGroups = async () => {
    setIsLoading(true);
    try {
      // Load all groups with quiz previews
      const response = await groupService.getQuizGroups({
        includeQuizzes: true,
        previewSize: 1000,
        size: 1000
      });

      setGroups(response.content);

      // Find which groups contain this quiz
      const groupsWithQuiz = new Set<string>();
      response.content.forEach(group => {
        if (group.quizPreviews?.some(q => q.id === quizId)) {
          groupsWithQuiz.add(group.id);
        }
      });
      setQuizGroupIds(groupsWithQuiz);
    } catch (error) {
      console.error('Failed to load groups:', error);
      addToast({
        type: 'error',
        message: 'Failed to load groups'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleGroup = async (groupId: string) => {
    if (isToggling.has(groupId)) return;

    const isInGroup = quizGroupIds.has(groupId);
    setIsToggling(prev => new Set(prev).add(groupId));

    try {
      if (isInGroup) {
        // Remove from group
        await groupService.removeQuizFromGroup(groupId, quizId);
        setQuizGroupIds(prev => {
          const next = new Set(prev);
          next.delete(groupId);
          return next;
        });
        addToast({
          type: 'success',
          message: 'Quiz removed from group'
        });
      } else {
        // Add to group
        await groupService.addQuizzesToGroup(groupId, {
          quizIds: [quizId]
        });
        setQuizGroupIds(prev => new Set(prev).add(groupId));
        addToast({
          type: 'success',
          message: 'Quiz added to group'
        });
      }

      if (onGroupsChanged) {
        onGroupsChanged();
      }
    } catch (error: any) {
      console.error('Failed to toggle group membership:', error);
      addToast({
        type: 'error',
        message: error.message || 'Failed to update group membership'
      });
    } finally {
      setIsToggling(prev => {
        const next = new Set(prev);
        next.delete(groupId);
        return next;
      });
    }
  };

  const handleCreateGroup = async (data: CreateQuizGroupRequest): Promise<string> => {
    const groupId = await groupService.createQuizGroup(data);
    
    // Reload groups to get the new one
    await loadGroups();

    // Automatically add current quiz to the new group
    try {
      await groupService.addQuizzesToGroup(groupId, {
        quizIds: [quizId]
      });
      setQuizGroupIds(prev => new Set(prev).add(groupId));
      addToast({
        type: 'success',
        message: 'Group created and quiz added'
      });
      
      if (onGroupsChanged) {
        onGroupsChanged();
      }
    } catch (error) {
      // Group was created but failed to add quiz - not critical
      console.warn('Failed to add quiz to new group:', error);
      addToast({
        type: 'warning',
        message: 'Group created but failed to add quiz. You can add it manually.'
      });
    }

    return groupId;
  };

  if (isLoading) {
    return (
      <div className="py-1">
        <div className="px-4 py-2 text-sm text-theme-text-secondary">
          Loading groups...
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="py-1">
        {/* Groups Section Header */}
        <div className="px-4 py-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-theme-text-secondary">
            Groups
          </div>
        </div>

        {/* Groups List */}
        {groups.length > 0 ? (
          groups.map((group) => {
            const isInGroup = quizGroupIds.has(group.id);
            const isTogglingThis = isToggling.has(group.id);

            return (
              <button
                key={group.id}
                type="button"
                onClick={() => handleToggleGroup(group.id)}
                disabled={isTogglingThis}
                className="w-full text-left px-4 py-2 text-sm text-theme-text-primary hover:bg-theme-bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
              >
                {/* Checkbox Icon */}
                <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                  {isInGroup ? (
                    <svg className="w-4 h-4 text-theme-interactive-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <div className="w-4 h-4 border-2 border-theme-border-primary rounded"></div>
                  )}
                </div>

                {/* Group Name with optional icon/color */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  {group.icon && (
                    <span className="text-theme-text-secondary">{group.icon}</span>
                  )}
                  {group.color && (
                    <div 
                      className="w-3 h-3 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: group.color }}
                    />
                  )}
                  <span className="truncate">{group.name}</span>
                  {group.quizCount > 0 && (
                    <span className="text-xs text-theme-text-tertiary">
                      ({group.quizCount})
                    </span>
                  )}
                </div>

                {isTogglingThis && (
                  <div className="flex-shrink-0">
                    <svg className="animate-spin h-4 w-4 text-theme-text-tertiary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </button>
            );
          })
        ) : (
          <div className="px-4 py-2 text-sm text-theme-text-secondary">
            No groups yet
          </div>
        )}

        {/* Separator */}
        <div className="border-t border-theme-border-primary my-1"></div>

        {/* Create New Group Button */}
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="w-full text-left px-4 py-2 text-sm text-theme-text-primary hover:bg-theme-bg-secondary transition-colors flex items-center gap-3"
        >
          <svg className="w-4 h-4 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create New Group</span>
        </button>
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateGroup}
      />
    </>
  );
};

export default QuizGroupMenu;
