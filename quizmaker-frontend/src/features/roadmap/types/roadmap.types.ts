// src/features/roadmap/types/roadmap.types.ts
// ---------------------------------------------------------------------------
// Type definitions for roadmap features and milestones
// ---------------------------------------------------------------------------

export type RoadmapStatus = 'planned' | 'in-progress' | 'completed' | 'on-hold';

export type RoadmapPriority = 'low' | 'medium' | 'high' | 'critical';

export interface RoadmapFeature {
  id: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  priority: RoadmapPriority;
  quarter?: string;
  estimatedDate?: string;
  category?: string;
  tags?: string[];
  dependencies?: string[];
  progress?: number;
}

export interface RoadmapMilestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  status: RoadmapStatus;
  features: RoadmapFeature[];
}
