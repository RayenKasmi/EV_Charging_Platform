// Queue status enumeration
export enum QueueStatus {
  WAITING = 'WAITING',
  READY = 'READY',
  NOTIFIED = 'NOTIFIED',
  EXPIRED = 'EXPIRED',
}

// Queue priority tier
export enum QueuePriorityTier {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  VIP = 'VIP',
}

// Queue position model
export interface QueuePosition {
  id: string;
  queueId: string;
  userId: string;
  stationId: string;
  position: number;
  priorityTier: QueuePriorityTier;
  status: QueueStatus;
  estimatedWaitTime: number; // minutes
  joinedAt: Date;
  notifiedAt?: Date;
}

// Queue update (for real-time updates)
export interface QueueUpdate {
  stationId: string;
  queueLength: number;
  averageWaitTime: number; // minutes
  positionChanges: Array<{
    userId: string;
    newPosition: number;
    oldPosition: number;
  }>;
  timestamp: Date;
}

// Queue status model
export interface QueueStatusModel {
  stationId: string;
  totalInQueue: number;
  averageWaitTime: number; // minutes
  priorityDistribution: {
    standard: number;
    premium: number;
    vip: number;
  };
  peakTimes?: Array<{
    hour: number;
    averageQueueLength: number;
  }>;
}

// Join queue DTO
export interface JoinQueueDto {
  stationId: string;
  priorityTier: QueuePriorityTier;
}
