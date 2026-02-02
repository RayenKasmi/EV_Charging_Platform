export const STATION_STATUSES = ['ACTIVE', 'INACTIVE', 'MAINTENANCE', 'OFFLINE'] as const;
export type StationStatus = (typeof STATION_STATUSES)[number];

export const CHARGER_STATUSES = ['AVAILABLE', 'OCCUPIED', 'OFFLINE', 'MAINTENANCE'] as const;
export type ChargerStatus = (typeof CHARGER_STATUSES)[number];

export const CHARGER_TYPES = ['LEVEL_2', 'DC_FAST'] as const;
export type ChargerType = (typeof CHARGER_TYPES)[number];

export const CONNECTOR_TYPES = ['CCS', 'CHADEMO', 'TYPE_2', 'J1772'] as const;
export type ConnectorType = (typeof CONNECTOR_TYPES)[number];

export interface StationOperator {
  id: string;
  email: string;
  fullName: string;
}

export interface Charger {
  id: string;
  chargerId: string;
  stationId: string;
  type: ChargerType;
  status: ChargerStatus;
  connectorType: ConnectorType;
  powerKW: number;
  currentRate?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Station {
  id: string;
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  status: StationStatus;
  operatorId: string;
  isActive: boolean;
  chargers: Charger[];
  operator?: StationOperator;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  distance?: number;
}

export interface StationAvailability {
  stationId: string;
  total: number;
  available: number;
  occupied: number;
  offline: number;
  maintenance: number;
  updatedAt?: Date;
}

/**
 * WebSocket Event interfaces
 */
export interface ChargerStatusUpdate {
  chargerId: string;
  stationId: string;
  status: string;
  updatedAt: Date;
}

export interface SlotUpdate {
  chargerId: string;
  stationId: string;
  reservedFrom: Date;
  reservedTo: Date;
  action: 'created' | 'cancelled' | 'expired';
}

export interface StationQuery {
  page?: number;
  limit?: number;
  status?: StationStatus;
  operatorName?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  chargerType?: ChargerType;
  city?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface StationListResponse {
  data: Station[];
  meta: PaginationMeta;
}

export interface CreateChargerPayload {
  chargerId: string;
  type: ChargerType;
  connectorType: ConnectorType;
  powerKW: number;
  currentRate?: number | null;
  status?: ChargerStatus;
}

export interface UpdateChargerPayload {
  type?: ChargerType;
  connectorType?: ConnectorType;
  powerKW?: number;
  currentRate?: number | null;
  status?: ChargerStatus;
}

export interface CreateStationPayload {
  name: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  status?: StationStatus;
  isActive?: boolean;
  chargers: CreateChargerPayload[];
}

export interface UpdateStationPayload {
  name?: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  status?: StationStatus;
  isActive?: boolean;
}