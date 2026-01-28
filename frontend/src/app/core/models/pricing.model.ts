// Pricing rule type enumeration
export enum PricingRuleType {
  FIXED_RATE = 'FIXED_RATE',
  MULTIPLIER = 'MULTIPLIER',
}

// Pricing rule model
export interface PricingRule {
  id: string;
  stationId: string;
  name: string;
  priority: number;
  conditions: PricingConditions;
  priceAction: PriceAction;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Pricing conditions
export interface PricingConditions {
  timeRange?: {
    startTime: string; // HH:mm format
    endTime: string; // HH:mm format
  };
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  gridLoadThreshold?: number; // 0-100
  demandThreshold?: number;
}

// Price action
export interface PriceAction {
  type: PricingRuleType;
  value: number;
  description?: string;
}

// Price update (for real-time updates)
export interface PriceUpdate {
  stationId: string;
  currentPrice: number; // $/kWh
  previousPrice: number;
  gridLoad: number; // 0-100
  renewableEnergy: number; // 0-100
  timestamp: Date;
}

// Price forecast
export interface PriceForecast {
  timestamp: Date;
  expectedPrice: number;
  gridLoadForecast: number;
  renewableEnergyForecast: number;
}

// Price history data
export interface PriceHistory {
  timestamp: Date;
  price: number;
  gridLoad: number;
  renewableEnergy: number;
}
