// src/features/roadmap/components/TimelineView.tsx
// ---------------------------------------------------------------------------
// Timeline view component for roadmap - displays features in a vertical timeline
// ---------------------------------------------------------------------------

import React from 'react';
import { Card, CardHeader, CardBody } from '@/components';
import { Badge } from '@/components';
import { mockMilestones } from '../data/mockRoadmapData';
import { RoadmapStatus, RoadmapPriority } from '../types/roadmap.types';

const getStatusVariant = (status: RoadmapStatus): 'primary' | 'success' | 'warning' | 'info' | 'neutral' => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in-progress':
      return 'primary';
    case 'planned':
      return 'info';
    case 'on-hold':
      return 'warning';
    default:
      return 'neutral';
  }
};

const getPriorityVariant = (priority: RoadmapPriority): 'primary' | 'success' | 'warning' | 'danger' | 'neutral' => {
  switch (priority) {
    case 'critical':
      return 'danger';
    case 'high':
      return 'warning';
    case 'medium':
      return 'primary';
    case 'low':
      return 'neutral';
    default:
      return 'neutral';
  }
};

export const TimelineView: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-theme-border-primary" />

        {/* Milestones */}
        {mockMilestones.map((milestone, milestoneIndex) => (
          <div key={milestone.id} className="relative pl-20 pb-12">
            {/* Timeline dot */}
            <div className="absolute left-6 top-2 w-4 h-4 rounded-full border-4 border-theme-bg-secondary bg-theme-interactive-primary z-10" />

            {/* Milestone Card */}
            <Card variant="elevated" className="mb-6">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-theme-text-primary mb-2">
                      {milestone.title}
                    </h3>
                    <p className="text-sm text-theme-text-secondary">
                      {milestone.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant={getStatusVariant(milestone.status)}>
                      {milestone.status.replace('-', ' ')}
                    </Badge>
                    <span className="text-xs text-theme-text-tertiary">
                      {new Date(milestone.targetDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {milestone.features.map((feature) => (
                      <Card
                        key={feature.id}
                        variant="outlined"
                        padding="sm"
                        className="bg-theme-bg-secondary"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-medium text-theme-text-primary">
                              {feature.title}
                            </h5>
                            <Badge
                              variant={getPriorityVariant(feature.priority)}
                              size="sm"
                            >
                              {feature.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-theme-text-secondary">
                            {feature.description}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};
