// src/features/quiz/components/QuizGroupMenu.tsx
// ---------------------------------------------------------------------------
// Groups section in the 3-dots menu for QuizCard
// Shows list of groups and allows adding/removing quiz from groups
// ---------------------------------------------------------------------------

import React, { useState, useEffect } from 'react';
import { QuizGroupSummaryDto } from '../types/quiz.types';
import { QuizGroupService } from '../services/quiz-group.service';
import { useToast, Spinner, Checkbox } from '@/components';
import { api } from '@/services';

interface QuizGroupMenuProps {
  quizId: string;
  onGroupsChanged?: () => void;
  onOpenModal?: () => void;
}

const QuizGroupMenu: React.FC<QuizGroupMenuProps> = ({
  quizId,
  onGroupsChanged,
  onOpenModal
}) => {
  const [groups, setGroups] = useState<QuizGroupSummaryDto[]>([]);
  const [quizGroupIds, setQuizGroupIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState<Set<string>>(new Set());
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

      // Defensive check: ensure content is an array
      const groupsList = response.content || [];
      setGroups(groupsList);

      // Find which groups contain this quiz
      const groupsWithQuiz = new Set<string>();
      groupsList.forEach(group => {
        if (group.quizPreviews?.some(q => q.id === quizId)) {
          groupsWithQuiz.add(group.id);
        }
      });
      setQuizGroupIds(groupsWithQuiz);
    } catch (error) {
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

        {/* Groups List - Scrollable when more than 4 groups */}
        {groups.length > 0 ? (
          <div 
            className={groups.length > 4 ? 'max-h-40 overflow-y-auto' : ''}
          >
            {groups.map((group) => {
              const isInGroup = quizGroupIds.has(group.id);
              const isTogglingThis = isToggling.has(group.id);

              return (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => handleToggleGroup(group.id)}
                  disabled={isTogglingThis}
                  className="w-full text-left px-4 py-2 text-sm text-theme-text-primary hover:bg-theme-bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 cursor-pointer"
                >
                  {/* Checkbox Indicator */}
                  <div className="flex-shrink-0">
                    <Checkbox
                      checked={isInGroup}
                      onChange={() => {}} // Controlled by button click
                      label=""
                      size="sm"
                      disabled={false} // Enabled but controlled by button
                      className="!flex-row items-center cursor-pointer"
                    />
                  </div>

                  {/* Group Name with color, icon */}
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    {group.color && (
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ backgroundColor: group.color }}
                      />
                    )}
                    {group.icon && (
                      <span className="text-theme-text-secondary">{group.icon}</span>
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
                      <Spinner size="sm" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
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
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Notify parent to open modal
            if (onOpenModal) {
              onOpenModal();
            }
          }}
          className="w-full text-left px-4 py-2 text-sm text-theme-text-primary hover:bg-theme-bg-secondary transition-colors flex items-center gap-3 cursor-pointer"
        >
          <svg className="w-4 h-4 text-theme-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Create New Group</span>
        </button>
      </div>
    </>
  );
};

export default QuizGroupMenu;
