// Analytics time period enumeration
export enum AnalyticsPeriod {
  TODAY = 'TODAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  ALL_TIME = 'ALL_TIME',
  CUSTOM = 'CUSTOM',
}

// Revenue data model
export interface RevenueData {
  period: AnalyticsPeriod;
  total: number;
  byStation: Array<{
    stationId: string;
    stationName: string;
    revenue: number;
  }>;
  byChargerType: Array<{
    chargerType: string;
    revenue: number;
  }>;
  trend: Array<{
    timestamp: Date;
    revenue: number;
  }>;
}

// Utilization data model
export interface UtilizationData {
  period: AnalyticsPeriod;
  averageUtilization: number; // 0-100
  byStation: Array<{
    stationId: string;
    stationName: string;
    utilization: number;
  }>;
  heatmap: Array<{
    dayOfWeek: number;
    hour: number;
    utilization: number;
  }>;
  downtimeData: Array<{
    chargerId: string;
    downtime: number; // hours
  }>;
}

// User behavior data model
export interface UserBehaviorData {
  newUsers: number;
  returningUsers: number;
  geographicDistribution: Array<{
    location: string;
    userCount: number;
    latitude: number;
    longitude: number;
  }>;
  sessionDurationDistribution: Array<{
    duration: string; // e.g., "0-30 min", "30-60 min"
    count: number;
  }>;
  peakUsageTimes: Array<{
    hour: number;
    count: number;
  }>;
  customerLifetimeValue: Array<{
    userId: string;
    value: number;
  }>;
}

// Custom report configuration
export interface CustomReportConfig {
  id?: string;
  name: string;
  metrics: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  filters: {
    stations?: string[];
    operators?: string[];
    chargerTypes?: string[];
  };
  groupBy?: string;
  chartType?: 'line' | 'bar' | 'pie' | 'area';
  createdAt?: Date;
}

// Report data for export
export interface ReportData {
  config: CustomReportConfig;
  data: any[];
  generatedAt: Date;
}
