// src/components/QuizCard.tsx
// ---------------------------------------------------------------------------
// Individual quiz display card based on QuizDto
// Uses base Card component for consistent styling
// ---------------------------------------------------------------------------

import React from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { QuizDto } from '@/types';
import { useQuizMetadata, useCreateGroup } from '../hooks';
import { Button, Card, CardBody, Checkbox } from '@/components';
import QuizGroupMenu from './QuizGroupMenu';
import CreateGroupModal from './CreateGroupModal';

interface QuizCardProps {
  quiz: QuizDto;
  showActions?: boolean;
  isSelected?: boolean;
  onEdit?: (quizId: string) => void;
  onDelete?: (quizId: string) => void;
  onExport?: (quizId: string) => void;
  onStart?: (quizId: string) => void;
  onSelect?: (quizId: string, selected: boolean) => void;
  className?: string;
}

const QuizCard: React.FC<QuizCardProps> = ({
  quiz,
  showActions = true,
  isSelected = false,
  onEdit,
  onDelete,
  onExport,
  onStart,
  onSelect,
  className = ''
}) => {
  const { getTagName, getCategoryName } = useQuizMetadata();
  const [showMobileMenu, setShowMobileMenu] = React.useState(false);
  const [menuPosition, setMenuPosition] = React.useState<{ top: number; right: number } | null>(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = React.useState(false);
  const mobileMenuRef = React.useRef<HTMLDivElement>(null);
  const desktopMenuRef = React.useRef<HTMLDivElement>(null);
  const mobileButtonContainerRef = React.useRef<HTMLDivElement>(null);
  const desktopButtonContainerRef = React.useRef<HTMLDivElement>(null);
  const canUseDom = typeof window !== 'undefined';
  const [isMobileViewport, setIsMobileViewport] = React.useState(() => {
    if (!canUseDom) {
      return false;
    }
    return window.matchMedia('(max-width: 767px)').matches;
  });

  const isTargetInsideMenu = (target: Node | null) => {
    if (!target) {
      return false;
    }
    if (mobileMenuRef.current && mobileMenuRef.current.contains(target)) {
      return true;
    }
    if (desktopMenuRef.current && desktopMenuRef.current.contains(target)) {
      return true;
    }
    return false;
  };

  const isTargetInsideMenuButton = (target: Node | null) => {
    if (!target) {
      return false;
    }
    if (mobileButtonContainerRef.current && mobileButtonContainerRef.current.contains(target)) {
      return true;
    }
    if (desktopButtonContainerRef.current && desktopButtonContainerRef.current.contains(target)) {
      return true;
    }
    return false;
  };

  // Use create group hook
  const { handleCreateGroup } = useCreateGroup({
    quizId: quiz.id,
    onSuccess: () => {
      // Optionally refresh groups or close menu
    }
  });

  React.useEffect(() => {
    if (!canUseDom) {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileViewport(event.matches);
    };

    // Sync the state with the current viewport width
    setIsMobileViewport(mediaQuery.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Safari <14 fallback
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [canUseDom]);

  // Calculate menu position when opening (supports both mouse and touch events)
  const handleMenuToggle = (event: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    // Only stop propagation to prevent click-outside handler from firing
    // Don't prevent default - let the browser handle the click normally
    event.stopPropagation();
    
    if (!showMobileMenu) {
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      
      // Get viewport dimensions - use visualViewport for mobile browser UI (address bar, etc.)
      const visualViewport = window.visualViewport;
      const viewportWidth = visualViewport?.width || window.innerWidth;
      const viewportHeight = visualViewport?.height || window.innerHeight;
      
      // For fixed positioning, getBoundingClientRect() already gives viewport-relative coordinates
      // rect values are already relative to the visual viewport on mobile
      const menuWidth = 224; // w-56 = 14rem = 224px
      const spacing = 4;
      const estimatedMenuHeight = 200; // Approximate height
      
      // Calculate position - rect is already relative to viewport
      // Position below button by default
      let top = rect.bottom + spacing;
      let right = viewportWidth - rect.right;
      
      // Ensure menu doesn't go off-screen to the right
      if (right < 8) {
        right = 8; // 8px from right edge
      } else if (right + menuWidth > viewportWidth) {
        right = Math.max(8, viewportWidth - menuWidth); // Keep menu visible
      }
      
      // Ensure menu doesn't go off-screen to the bottom
      if (top + estimatedMenuHeight > viewportHeight) {
        // If menu would go off bottom, position above button
        top = rect.top - estimatedMenuHeight - spacing;
        if (top < 8) {
          // If still off-screen at top, use minimum spacing
          top = 8;
        }
      }
      
      // Final bounds check - ensure menu stays within viewport
      const minTop = 8;
      const maxTop = Math.max(minTop, viewportHeight - estimatedMenuHeight);
      
      setMenuPosition({
        top: Math.max(minTop, Math.min(top, maxTop)),
        right: Math.max(8, Math.min(right, viewportWidth - menuWidth))
      });
    } else {
      setMenuPosition(null);
    }
    setShowMobileMenu(!showMobileMenu);
  };
  
  // Note: No need for separate touch handler - onClick works on both mobile and desktop
  // Mobile browsers automatically synthesize click events from touch events


  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking inside any version of the menu
      if (isTargetInsideMenu(target)) {
        return;
      }
      
      // Don't close if clicking the button that opened the menu
      // Always allow button clicks to handle menu toggle themselves
      if (isTargetInsideMenuButton(target)) {
        return;
      }
      
      // Close the menu
      setShowMobileMenu(false);
      setMenuPosition(null);
    };

    if (showMobileMenu) {
      // On small viewports we rely on the full-screen backdrop
      // to handle outside clicks, so we skip global listeners.
      if (isMobileViewport) {
        return;
      }

      // Use click event (bubble phase) so button onClick handlers fire first
      // Add a small delay to ensure menu is fully rendered and handlers attached
      const timeoutId = setTimeout(() => {
        // Use bubble phase (false) so button clicks fire before this handler
        document.addEventListener('click', handleClickOutside, false);
        document.addEventListener('touchend', handleClickOutside, false);
      }, 150);

      return () => {
        clearTimeout(timeoutId);
        document.removeEventListener('click', handleClickOutside, false);
        document.removeEventListener('touchend', handleClickOutside, false);
      };
    }
  }, [showMobileMenu, isMobileViewport]);
  
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

  // Helper function to truncate text
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <>
    <Card 
      variant="elevated" 
      padding="md" 
      hoverable 
      selected={isSelected}
      className={className}
    >
      <CardBody>
        {/* Mobile Layout - Simplified */}
        <div className="md:hidden">
          {/* Header with checkbox, title and 3-dots menu */}
          <div className="flex items-start gap-3 mb-1">
            {onSelect && (
              <Checkbox
                checked={isSelected}
                onChange={(checked) => onSelect(quiz.id, checked)}
                label=""
                className="mt-1"
              />
            )}
            <h3 
              className="text-lg font-semibold text-theme-text-primary truncate flex-1"
              title={quiz.title}
            >
              {quiz.title}
            </h3>

            {/* 3-Dots Menu in Top Right */}
            {(onEdit || onExport) && (
              <div
                className="relative"
                ref={mobileButtonContainerRef}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMenuToggle}
                  title="More options"
                  className="!p-1 !min-w-0 touch-manipulation"
                  leftIcon={
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  }
                />

                {/* Dropdown Menu - Fixed positioning to escape card overflow */}
                {showMobileMenu && menuPosition && isMobileViewport && canUseDom
                  ? createPortal(
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
                            // Only close if clicking on the backdrop itself, not on menu
                            if (!isTargetInsideMenu(target)) {
                              setShowMobileMenu(false);
                              setMenuPosition(null);
                            }
                          }}
                          onTouchStart={(e) => {
                            e.stopPropagation();
                            const target = e.target as HTMLElement;
                            if (!isTargetInsideMenu(target)) {
                              setShowMobileMenu(false);
                              setMenuPosition(null);
                            }
                          }}
                        />
                        {/* Menu itself - higher z-index than backdrop */}
                        <div
                          ref={mobileMenuRef}
                          className="fixed w-56 bg-theme-bg-primary rounded-lg shadow-lg border border-theme-border-primary z-[1000] max-h-96 overflow-y-auto touch-manipulation"
                          style={{
                            top: `${menuPosition.top}px`,
                            right: `${menuPosition.right}px`,
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
                          {onEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowMobileMenu(false);
                                setMenuPosition(null);
                                // Call onEdit immediately - no need for timeout
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
                          {onExport && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowMobileMenu(false);
                                setMenuPosition(null);
                                // Call onExport immediately - no need for timeout
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
                              // Close dropdown menu first on mobile to prevent blocking
                              setShowMobileMenu(false);
                              setMenuPosition(null);
                              // Then open create group modal after a brief delay to ensure dropdown closes
                              setTimeout(() => {
                                setShowCreateGroupModal(true);
                              }, 50);
                            }}
                            />
                          </div>
                        </div>
                      </div>
                      </>,
                      document.body
                    )
                  : null}
              </div>
            )}
          </div>

          {/* Estimated Time and Question Count */}
          <div className="flex items-center gap-3 text-sm text-theme-text-secondary mb-2">
            <span>{formatTime(quiz.estimatedTime)}</span>
            {quiz.questionCount !== undefined && (
              <>
                <span>•</span>
                <span>{quiz.questionCount} question{quiz.questionCount !== 1 ? 's' : ''}</span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-2">
              {onStart && (
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
                <Button type="button" variant="outline" size="sm">View Details</Button>
              </Link>
              {onDelete && (
                <Button 
                  type="button" 
                  variant="danger" 
                  size="sm" 
                  onClick={() => onDelete(quiz.id)}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  }
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Desktop Layout - Full details */}
        <div className="hidden md:block">
          {/* Header Section */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
              {onSelect && (
                <Checkbox
                  checked={isSelected}
                  onChange={(checked) => onSelect(quiz.id, checked)}
                  label=""
                  className="mt-1"
                />
              )}
              <div className="flex-1 min-w-0 h-[3.75rem] flex items-start">
                <h3 
                  className="text-lg font-semibold text-theme-text-primary line-clamp-2"
                  title={quiz.title}
                >
                  {quiz.title}
                </h3>
              </div>
            </div>
            {/* 3-Dots Menu in Top Right */}
            {(onEdit || onExport) && (
              <div
                className="relative ml-2 flex-shrink-0"
                ref={desktopButtonContainerRef}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMenuToggle}
                  title="More options"
                  className="!p-1 !min-w-0 touch-manipulation"
                  leftIcon={
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  }
                />

                {/* Dropdown Menu - Fixed positioning to escape card overflow */}
                {showMobileMenu && menuPosition && !isMobileViewport && (
                  <div
                    ref={desktopMenuRef}
                    className="fixed w-56 bg-theme-bg-primary rounded-lg shadow-lg border border-theme-border-primary z-[100] max-h-96 overflow-y-auto touch-manipulation"
                    style={{
                      top: `${menuPosition.top}px`,
                      right: `${menuPosition.right}px`
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    onTouchEnd={(e) => e.stopPropagation()}
                  >
                    <div className="py-1">
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMobileMenu(false);
                            setMenuPosition(null);
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
                      {onExport && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowMobileMenu(false);
                            setMenuPosition(null);
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
                      <QuizGroupMenu 
                        quizId={quiz.id}
                        onGroupsChanged={() => {
                          // Optionally refresh quiz data or close menu
                        }}
                        onOpenModal={() => {
                          // Open create group modal immediately (modal will overlay dropdown)
                          setShowCreateGroupModal(true);
                          // Close dropdown menu after modal opens to avoid flicker
                          setTimeout(() => {
                            setShowMobileMenu(false);
                            setMenuPosition(null);
                          }, 150);
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quiz Stats - Single Line */}
          <div className="flex items-center gap-3 text-sm text-theme-text-secondary mb-4">
            <span>{formatTime(quiz.estimatedTime)}</span>
            <span>•</span>
            <span>{quiz.visibility}</span>
            <span>•</span>
            <span>AI Generated</span>
          </div>

          {/* Tags */}
          {quiz.tagIds && quiz.tagIds.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {quiz.tagIds.slice(0, 3).map((tagId) => (
                  <span
                    key={tagId}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-theme-bg-tertiary text-theme-text-primary"
                  >
                    #{getTagName(tagId)}
                  </span>
                ))}
                {quiz.tagIds.length > 3 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-theme-bg-tertiary text-theme-text-secondary">
                    +{quiz.tagIds.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Created Info */}
          <div className="text-xs text-theme-text-tertiary mb-4">
            <div>Created: {new Date(quiz.createdAt).toLocaleDateString()}</div>
          </div>

          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-2 pt-4 border-t border-theme-border-primary">
              {onStart && (
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
                <Button type="button" variant="outline" size="sm">View Details</Button>
              </Link>
              {onDelete && (
                <Button 
                  type="button" 
                  variant="danger" 
                  size="sm" 
                  onClick={() => onDelete(quiz.id)}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  }
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </CardBody>
    </Card>

    {/* Create Group Modal - Rendered at QuizCard level to persist when dropdown closes */}
    <CreateGroupModal
      isOpen={showCreateGroupModal}
      onClose={() => {
        setShowCreateGroupModal(false);
      }}
      onCreate={async (data) => {
        try {
          const groupId = await handleCreateGroup(data);
          setShowCreateGroupModal(false);
          return groupId;
        } catch (error) {
          throw error;
        }
      }}
    />
  </>
  );
};

export default QuizCard; 
