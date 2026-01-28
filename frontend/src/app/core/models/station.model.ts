// Station status enumeration
export enum StationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

// Charger type enumeration
export enum ChargerType {
  LEVEL_2 = 'LEVEL_2',
  DC_FAST = 'DC_FAST',
  LEVEL_1 = 'LEVEL_1',
}

// Charger status enumeration
export enum ChargerStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  OFFLINE = 'OFFLINE',
  MAINTENANCE = 'MAINTENANCE',
}

// Connector type enumeration
export enum ConnectorType {
  TYPE_1 = 'TYPE_1',
  TYPE_2 = 'TYPE_2',
  CCS = 'CCS',
  CHAdeMO = 'CHAdeMO',
  Tesla = 'TESLA',
}

// Charger model
export interface Charger {
  id: string;
  stationId: string;
  chargerNumber: number;
  type: ChargerType;
  powerOutput: number; // kW
  status: ChargerStatus;
  connectorType: ConnectorType;
  createdAt: Date;
  lastStatusUpdate: Date;
}

// Station Location coordinates
export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Station pricing configuration
export interface PricingConfig {
  baseRate: number; // $/kWh
  peakRate: number; // $/kWh
  peakHoursStart: string; // HH:mm format
  peakHoursEnd: string; // HH:mm format
  offPeakRate?: number; // $/kWh
}

// Grid integration settings
export interface GridSettings {
  maxPowerDraw: number; // kW
  renewableEnergyPercentage: number; // 0-100
  smartChargingEnabled: boolean;
}

// Station model
export interface Station {
  id: string;
  name: string;
  location: Location;
  operatorId: string;
  status: StationStatus;
  totalChargers: number;
  availableChargers: number;
  pricing: PricingConfig;
  gridSettings: GridSettings;
  createdAt: Date;
  updatedAt: Date;
}

// Station with chargers (for detail view)
export interface StationDetail extends Station {
  chargers: Charger[];
  todayRevenue?: number;
  todaySessionsCompleted?: number;
  currentActiveSessions?: number;
}
