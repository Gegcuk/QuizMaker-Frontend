// src/components/ui/GroupedList.tsx
// ---------------------------------------------------------------------------
// Reusable component for displaying items grouped by a category
// Can be used for grouping attempts by quiz, quizzes by category, etc.
// ---------------------------------------------------------------------------

import React, { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export interface GroupedListGroup<T> {
  key: string;
  label: string;
  items: T[];
  count?: number;
  metadata?: any;
}

export interface GroupedListProps<T> {
  groups: GroupedListGroup<T>[];
  renderItem: (item: T, index: number) => React.ReactNode;
  defaultExpandedGroups?: string[];
  expandAll?: boolean;
  className?: string;
  emptyMessage?: string;
  showCount?: boolean;
  itemLabel?: string; // e.g., "attempt", "quiz", "document"
  itemLabelPlural?: string; // e.g., "attempts", "quizzes", "documents"
}

function GroupedListInner<T>(props: GroupedListProps<T>) {
  const {
    groups,
    renderItem,
    defaultExpandedGroups = [],
    expandAll = false,
    className = '',
    emptyMessage = 'No items found',
    showCount = true,
    itemLabel = 'item',
    itemLabelPlural = 'items'
  } = props;

  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(expandAll ? groups.map(g => g.key) : defaultExpandedGroups)
  );

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const expandAllGroups = () => {
    setExpandedGroups(new Set(groups.map(g => g.key)));
  };

  const collapseAllGroups = () => {
    setExpandedGroups(new Set());
  };

  if (groups.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-theme-text-secondary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Expand/Collapse All */}
      {groups.length > 1 && (
        <div className="flex items-center justify-end gap-2 mb-4">
          <button
            type="button"
            onClick={expandAllGroups}
            className="text-xs text-theme-interactive-primary hover:underline"
          >
            Expand All
          </button>
          <span className="text-theme-text-tertiary">•</span>
          <button
            type="button"
            onClick={collapseAllGroups}
            className="text-xs text-theme-interactive-primary hover:underline"
          >
            Collapse All
          </button>
        </div>
      )}

      {/* Groups */}
      <div className="space-y-3">
        {groups.map((group) => {
          const isExpanded = expandedGroups.has(group.key);
          const itemCount = group.count ?? group.items.length;

          return (
            <div key={group.key} className="border border-theme-border-primary rounded-lg overflow-hidden">
              {/* Group Header */}
              <button
                type="button"
                onClick={() => toggleGroup(group.key)}
                className="w-full flex items-center justify-between p-4 bg-theme-bg-secondary hover:bg-theme-bg-tertiary transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDownIcon className="h-5 w-5 text-theme-text-secondary flex-shrink-0" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5 text-theme-text-secondary flex-shrink-0" />
                  )}
                  <h3 className="font-medium text-theme-text-primary">{group.label}</h3>
                </div>
                {showCount && (
                  <span className="text-sm text-theme-text-tertiary">
                    {itemCount} {itemCount === 1 ? itemLabel : itemLabelPlural}
                  </span>
                )}
              </button>

              {/* Group Items */}
              {isExpanded && (
                <div className="divide-y divide-theme-border-secondary">
                  {group.items.map((item, index) => (
                    <div key={index} className="bg-theme-bg-primary">
                      {renderItem(item, index)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Wrapper to handle generic types properly
export function GroupedList<T>(props: GroupedListProps<T>) {
  return <GroupedListInner {...props} />;
}

export default GroupedList;

