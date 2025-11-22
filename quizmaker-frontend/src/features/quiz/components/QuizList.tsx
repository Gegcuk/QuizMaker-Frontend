// src/components/QuizList.tsx
// ---------------------------------------------------------------------------
// List layout for quiz listings
// ---------------------------------------------------------------------------

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QuizDto } from '@/types';
import { useQuizMetadata, useCreateGroup } from '../hooks';
import { Badge, Button, Checkbox } from '@/components';
import QuizGroupMenu from './QuizGroupMenu';
import CreateGroupModal from './CreateGroupModal';

interface QuizListProps {
  quizzes: QuizDto[];
  isLoading?: boolean;
  showActions?: boolean;
  selectedQuizzes?: string[];
  onEdit?: (quizId: string) => void;
  onDelete?: (quizId: string) => void;
  onExport?: (quizId: string) => void;
  onStart?: (quizId: string) => void;
  onSelect?: (quizId: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  className?: string;
}

const QuizList: React.FC<QuizListProps> = ({
  quizzes,
  isLoading = false,
  showActions = true,
  selectedQuizzes = [],
  onEdit,
  onDelete,
  onExport,
  onStart,
  onSelect,
  onSelectAll,
  className = ''
}) => {
  const { getTagName, getCategoryName } = useQuizMetadata();
  const [openMenuQuizId, setOpenMenuQuizId] = useState<string | null>(null);
  const [menuPositions, setMenuPositions] = useState<Record<string, { top: number; right: number }>>({});
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [createGroupQuizId, setCreateGroupQuizId] = useState<string | null>(null);
  const menuRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const buttonRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Use create group hook - quizId will be set when modal opens
  const { handleCreateGroup } = useCreateGroup({
    quizId: createGroupQuizId || undefined,
    onSuccess: () => {
      setShowCreateGroupModal(false);
      setCreateGroupQuizId(null);
    }
  });

  // Helper function to get difficulty badge variant
  const getDifficultyVariant = (difficulty: string): 'success' | 'warning' | 'danger' | 'neutral' => {
    switch (difficulty) {
      case 'EASY':
        return 'success';
      case 'MEDIUM':
        return 'warning';
      case 'HARD':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  // Helper function to get status badge variant
  const getStatusVariant = (status: string): 'success' | 'warning' | 'neutral' => {
    switch (status) {
      case 'PUBLISHED':
        return 'success';
      case 'DRAFT':
        return 'warning';
      case 'ARCHIVED':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  // Helper function to format time
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Toggle menu for a specific quiz (supports both mouse and touch events)
  const toggleMenu = (quizId: string, buttonElement?: HTMLElement | null, event?: React.MouseEvent | React.TouchEvent) => {
    if (event) {
      // Only stop propagation to prevent click-outside handler from firing
      // Don't prevent default - let the browser handle the click normally
      event.stopPropagation();
    }
    
    if (openMenuQuizId === quizId) {
      setOpenMenuQuizId(null);
      setMenuPositions(prev => {
        const next = { ...prev };
        delete next[quizId];
        return next;
      });
    } else {
      // Close any other open menu
      setOpenMenuQuizId(quizId);
      
      if (buttonElement) {
        const rect = buttonElement.getBoundingClientRect();
        
        // Get viewport dimensions - use visualViewport for mobile browser UI
        const visualViewport = window.visualViewport;
        const viewportWidth = visualViewport?.width || window.innerWidth;
        const viewportHeight = visualViewport?.height || window.innerHeight;
        
        const menuWidth = 224; // w-56 = 14rem = 224px
        const spacing = 4;
        const estimatedMenuHeight = 200;
        
        // Calculate position - rect is already relative to viewport
        let top = rect.bottom + spacing;
        let right = viewportWidth - rect.right;
        
        // Ensure menu doesn't go off-screen
        if (right < 8) {
          right = 8;
        } else if (right + menuWidth > viewportWidth) {
          right = Math.max(8, viewportWidth - menuWidth);
        }
        
        if (top + estimatedMenuHeight > viewportHeight) {
          top = rect.top - estimatedMenuHeight - spacing;
          if (top < 8) {
            top = 8;
          }
        }
        
        const minTop = 8;
        const maxTop = Math.max(minTop, viewportHeight - estimatedMenuHeight);
        
        setMenuPositions(prev => ({
          ...prev,
          [quizId]: {
            top: Math.max(minTop, Math.min(top, maxTop)),
            right: Math.max(8, Math.min(right, viewportWidth - menuWidth))
          }
        }));
      }
    }
  };
  

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside all menus and buttons
      let clickedOutside = true;
      
      Object.keys(menuRefs.current).forEach(quizId => {
        const menuRef = menuRefs.current[quizId];
        const buttonRef = buttonRefs.current[quizId];
        if (
          (menuRef && menuRef.contains(target)) ||
          (buttonRef && buttonRef.contains(target))
        ) {
          clickedOutside = false;
        }
      });
      
      if (clickedOutside && openMenuQuizId) {
        setOpenMenuQuizId(null);
        setMenuPositions(prev => {
          const next = { ...prev };
          delete next[openMenuQuizId];
          return next;
        });
      }
    };

    if (openMenuQuizId) {
      // On real mobile devices we rely on the full-screen backdrop
      // to handle outside clicks, so we skip global listeners to
      // avoid any chance of events leaking through to underlying UI.
      const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobileDevice) {
        return;
      }
      
      // Add a small delay to ensure menu is fully rendered
      const timeoutId = setTimeout(() => {
        document.addEventListener('click', handleClickOutside, false);
        document.addEventListener('touchend', handleClickOutside, false);
      }, 150);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside, false);
        document.removeEventListener('touchend', handleClickOutside, false);
      };
    }
  }, [openMenuQuizId]);

  // Cleanup: Close menu if the open quiz is no longer in the list
  useEffect(() => {
    if (openMenuQuizId && !quizzes.find(q => q.id === openMenuQuizId)) {
      setOpenMenuQuizId(null);
      setMenuPositions(prev => {
        const next = { ...prev };
        delete next[openMenuQuizId];
        return next;
      });
    }
  }, [quizzes, openMenuQuizId]);

  if (isLoading) {
    return (
      <div className={`bg-theme-bg-primary shadow overflow-hidden sm:rounded-md ${className}`}>
        <ul className="divide-y divide-theme-border-primary">
          {Array.from({ length: 5 }).map((_, index) => (
            <li key={index} className="animate-pulse">
              <div className="px-4 py-4 sm:px-6 group hover:bg-theme-bg-tertiary transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="h-5 bg-theme-bg-tertiary rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-theme-bg-tertiary rounded w-1/2"></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-6 bg-theme-bg-tertiary rounded w-16"></div>
                    <div className="h-6 bg-theme-bg-tertiary rounded w-20"></div>
                  </div>
                </div>
                <div className="mt-2 flex items-center space-x-4">
                  <div className="h-4 bg-theme-bg-tertiary rounded w-20"></div>
                  <div className="h-4 bg-theme-bg-tertiary rounded w-24"></div>
                  <div className="h-4 bg-theme-bg-tertiary rounded w-16"></div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <svg className="mx-auto h-12 w-12 text-theme-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-theme-text-primary">No quizzes found</h3>
        <p className="mt-1 text-sm text-theme-text-secondary">
          Get started by creating your first quiz.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-theme-bg-primary shadow overflow-hidden sm:rounded-md ${className}`}>
      {/* Select All Checkbox */}
      {onSelectAll && (
        <div className="px-4 py-3 border-b border-theme-border-primary bg-theme-bg-tertiary">
          <Checkbox
            checked={selectedQuizzes.length === quizzes.length && quizzes.length > 0}
            onChange={onSelectAll}
            label={`Select All (${selectedQuizzes.length}/${quizzes.length})`}
          />
        </div>
      )}
      
      <ul className="divide-y divide-theme-border-primary">
        {quizzes.map((quiz) => (
          <li key={quiz.id} className={`hover:bg-theme-bg-tertiary transition-colors duration-150 ${selectedQuizzes.includes(quiz.id) ? 'bg-theme-bg-info' : ''}`}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    {onSelect && (
                      <Checkbox
                        checked={selectedQuizzes.includes(quiz.id)}
                        onChange={(checked) => onSelect(quiz.id, checked)}
                      />
                    )}
                    <h3 
                      className="text-lg font-medium text-theme-text-primary truncate group-hover:text-theme-interactive-primary"
                      title={quiz.title}
                    >
                      {quiz.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant={getDifficultyVariant(quiz.difficulty)}
                        size="sm"
                      >
                        {quiz.difficulty}
                      </Badge>
                      <Badge
                        variant={getStatusVariant(quiz.status)}
                        size="sm"
                      >
                        {quiz.status}
                      </Badge>
                    </div>
                  </div>
                  {quiz.description && (
                    <p 
                      className="mt-1 text-sm text-theme-text-secondary line-clamp-2"
                      title={quiz.description}
                    >
                      {quiz.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {showActions && onStart && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => onStart(quiz.id)}
                      disabled={quiz.status === 'DRAFT'}
                      title={quiz.status === 'DRAFT' ? 'Quiz must be published before it can be started' : 'Start this quiz'}
                    >
                      Start Quiz
                    </Button>
                  )}
                  <Link to={`/quizzes/${quiz.id}`}>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                    >
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
              
              <div className="mt-2 flex items-center justify-between">
                                  <div className="flex items-center space-x-4 text-sm text-theme-text-secondary">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatTime(quiz.estimatedTime)}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{quiz.visibility}</span>
                    </div>
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span>{getCategoryName(quiz.categoryId)}</span>
                    </div>
                    {quiz.isRepetitionEnabled && (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Multiple attempts</span>
                      </div>
                    )}
                  </div>
                
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-theme-text-tertiary">
                    Created: {new Date(quiz.createdAt).toLocaleDateString()}
                  </div>
                  {showActions && (
                    <div className="flex items-center space-x-1 relative">
                      {/* 3-dots Menu Button */}
                      {(onEdit || onExport) && (
                        <div
                          ref={(el) => {
                            buttonRefs.current[quiz.id] = el;
                          }}
                          className="relative"
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              const buttonEl = buttonRefs.current[quiz.id];
                              toggleMenu(quiz.id, buttonEl || undefined, e);
                            }}
                            title="More options"
                            aria-label="More options"
                            className="touch-manipulation"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                            </svg>
                          </Button>

                          {/* Dropdown Menu */}
                          {openMenuQuizId === quiz.id && menuPositions[quiz.id] && (
                            <>
                              {/* Invisible backdrop to block clicks behind menu */}
                              <div
                                className="fixed inset-0 z-[999]"
                                style={{ 
                                  backgroundColor: 'transparent',
                                  pointerEvents: 'auto'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const target = e.target as HTMLElement;
                                  const menuRef = menuRefs.current[quiz.id];
                                  // Only close if clicking on the backdrop itself, not on menu
                                  if (!menuRef?.contains(target)) {
                                    setOpenMenuQuizId(null);
                                    setMenuPositions(prev => {
                                      const next = { ...prev };
                                      delete next[quiz.id];
                                      return next;
                                    });
                                  }
                                }}
                                onTouchStart={(e) => {
                                  e.stopPropagation();
                                  const target = e.target as HTMLElement;
                                  const menuRef = menuRefs.current[quiz.id];
                                  if (!menuRef?.contains(target)) {
                                    setOpenMenuQuizId(null);
                                    setMenuPositions(prev => {
                                      const next = { ...prev };
                                      delete next[quiz.id];
                                      return next;
                                    });
                                  }
                                }}
                              />
                              {/* Menu itself - higher z-index than backdrop */}
                              <div
                                ref={(el) => {
                                  menuRefs.current[quiz.id] = el;
                                }}
                                className="fixed w-56 bg-theme-bg-primary rounded-lg shadow-lg border border-theme-border-primary z-[1000] max-h-96 overflow-y-auto touch-manipulation"
                                style={{
                                  top: `${menuPositions[quiz.id].top}px`,
                                  right: `${menuPositions[quiz.id].right}px`,
                                  pointerEvents: 'auto'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                }}
                                onMouseDown={(e) => {
                                  e.stopPropagation();
                                }}
                                onTouchStart={(e) => {
                                  e.stopPropagation();
                                }}
                                onTouchEnd={(e) => {
                                  e.stopPropagation();
                                }}
                              >
                              <div className="py-1">
                                {/* Edit Quiz */}
                                {onEdit && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuQuizId(null);
                                      // Call immediately - onClick works on both mobile and desktop
                                      onEdit(quiz.id);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    className="!w-full !text-left !justify-start !px-4 !py-2 !rounded-none touch-manipulation"
                                    leftIcon={
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    }
                                  >
                                    Edit Quiz
                                  </Button>
                                )}

                                {/* Export Quiz */}
                                {onExport && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenMenuQuizId(null);
                                      // Call immediately - onClick works on both mobile and desktop
                                      onExport(quiz.id);
                                    }}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    className="!w-full !text-left !justify-start !px-4 !py-2 !rounded-none touch-manipulation"
                                    leftIcon={
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                      </svg>
                                    }
                                  >
                                    Export Quiz
                                  </Button>
                                )}

                                {/* Separator before Groups section */}
                                {(onEdit || onExport) && (
                                  <div className="border-t border-theme-border-primary my-1"></div>
                                )}

                                {/* Groups Menu */}
                                <div 
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()} 
                                  onTouchStart={(e) => e.stopPropagation()}
                                  onTouchEnd={(e) => e.stopPropagation()}
                                  className="touch-manipulation"
                                >
                                  <QuizGroupMenu 
                                    quizId={quiz.id}
                                    onGroupsChanged={() => {
                                      // Optionally refresh quiz data or close menu
                                    }}
                                    onOpenModal={() => {
                                      // Close dropdown menu first
                                      setOpenMenuQuizId(null);
                                      setMenuPositions(prev => {
                                        const next = { ...prev };
                                        delete next[quiz.id];
                                        return next;
                                      });
                                      // Set the quiz ID for creating the group
                                      setCreateGroupQuizId(quiz.id);
                                      // Then open create group modal after a brief delay
                                      setTimeout(() => {
                                        setShowCreateGroupModal(true);
                                      }, 50);
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                            </>
                          )}
                        </div>
                      )}

                      {/* Delete Button (always visible if available) */}
                      {onDelete && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(quiz.id)}
                          title="Delete quiz"
                          aria-label="Delete quiz"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {quiz.tagIds && quiz.tagIds.length > 0 && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-1">
                    {quiz.tagIds.slice(0, 5).map((tagId) => (
                      <span
                        key={tagId}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-theme-bg-tertiary text-theme-text-primary"
                      >
                        #{getTagName(tagId)}
                      </span>
                    ))}
                    {quiz.tagIds.length > 5 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-theme-bg-tertiary text-theme-text-secondary">
                        +{quiz.tagIds.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => {
          setShowCreateGroupModal(false);
          setCreateGroupQuizId(null);
        }}
        onCreate={handleCreateGroup}
      />
    </div>
  );
};

export default QuizList; 
