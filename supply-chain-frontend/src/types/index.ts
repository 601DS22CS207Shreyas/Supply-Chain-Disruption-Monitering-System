// ═══════════════════════════════════════════════════════════════════════════════
// Enums — mirror your Spring Boot enums exactly
// ═══════════════════════════════════════════════════════════════════════════════

export type ShipmentStatus = 'PENDING' | 'IN_TRANSIT' | 'AT_WAREHOUSE' | 'DELAYED' | 'DELIVERED' | 'CANCELLED';

export type TransportMode = 'AIR' | 'SEA' | 'ROAD' | 'RAIL' | 'MULTIMODAL';

export type EventType = 'NATURAL_DISASTER' | 'LABOR_STRIKE' | 'ACCIDENT' | 'GEOPOLITICAL' | 'INFRASTRUCTURE' | 'WEATHER' | 'OTHER';

export type EventSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertType = 'HIGH_RISK_SHIPMENT' | 'CRITICAL_RISK_SHIPMENT' | 'SHIPMENT_DELAYED' | 'DISRUPTION_NEAR_ROUTE' | 'DELIVERY_OVERDUE';

export type UserRole = 'USER' | 'ADMIN';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'UNKNOWN';

// ═══════════════════════════════════════════════════════════════════════════════
// Auth
// ═══════════════════════════════════════════════════════════════════════════════

export interface AuthResponse {
  token: string;
  email: string;
  fullName: string;
  role: UserRole;
  expiresInMs: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Shipments
// ═══════════════════════════════════════════════════════════════════════════════

export interface ShipmentResponse {
  id: number;
  trackingNumber: string;
  origin: string;
  destination: string;
  carrier: string;
  transportMode: TransportMode;
  status: ShipmentStatus;
  scheduledDeparture: string;
  scheduledArrival: string;
  actualArrival: string | null;
  latestRiskScore: number | null;
  riskLevel: RiskLevel;
  createdAt: string;
}

export interface WaypointResponse {
  waypointOrder: number;
  city: string;
  country: string;
  lat: number;
  lng: number;
  estimatedArrival: string;
  actualArrival: string | null;
}

export interface ShipmentDetailResponse {
  id: number;
  trackingNumber: string;
  origin: string;
  destination: string;
  carrier: string;
  transportMode: TransportMode;
  status: ShipmentStatus;
  cargoDescription: string;
  cargoWeightKg: number;
  cargoValueUsd: number;
  scheduledDeparture: string;
  scheduledArrival: string;
  actualDeparture: string | null;
  actualArrival: string | null;
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  waypoints: WaypointResponse[];
  latestPrediction: RiskPredictionResponse | null;
  recentAlerts: AlertResponse[];
}

export interface CreateShipmentRequest {
  origin: string;
  destination: string;
  carrier: string;
  transportMode: TransportMode;
  cargoDescription?: string;
  cargoWeightKg?: number;
  cargoValueUsd?: number;
  scheduledDeparture: string;
  scheduledArrival: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}

export interface UpdateShipmentStatusRequest {
  status: ShipmentStatus;
  actualDeparture?: string;
  actualArrival?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Disruption Events
// ═══════════════════════════════════════════════════════════════════════════════

export interface DisruptionEventResponse {
  id: number;
  title: string;
  description: string;
  eventType: EventType;
  severity: EventSeverity;
  location: string;
  lat: number;
  lng: number;
  impactRadiusKm: number;
  eventDate: string;
  sourceUrl: string;
  sourceName: string;
  isActive: boolean;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Risk Predictions
// ═══════════════════════════════════════════════════════════════════════════════

export interface RiskPredictionResponse {
  id: number;
  shipmentId: number;
  trackingNumber: string;
  delayProbability: number;
  riskLevel: RiskLevel;
  estimatedDelayHours: number;
  primaryCause: string;
  llmExplanation: string;
  modelVersion: string;
  predictedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Alerts
// ═══════════════════════════════════════════════════════════════════════════════

export interface AlertResponse {
  id: number;
  shipmentId: number;
  trackingNumber: string;
  alertType: AlertType;
  message: string;
  severity: string;
  isRead: boolean;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Dashboard
// ═══════════════════════════════════════════════════════════════════════════════

export interface DashboardSummaryResponse {
  totalShipments: number;
  inTransitCount: number;
  delayedCount: number;
  deliveredCount: number;
  pendingCount: number;
  averageRiskScore: number;
  highRiskCount: number;
  criticalRiskCount: number;
  activeDisruptionEvents: number;
  criticalDisruptionEvents: number;
  unreadAlertsCount: number;
}

// ═══════════════════════════════════════════════════════════════════════════════
// Pagination — Spring Boot Page<T> response wrapper
// ═══════════════════════════════════════════════════════════════════════════════

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;        // current page (0-indexed)
  first: boolean;
  last: boolean;
  empty: boolean;
}

// ═══════════════════════════════════════════════════════════════════════════════
// API Error — matches ApiErrorResponse from GlobalExceptionHandler
// ═══════════════════════════════════════════════════════════════════════════════

export interface ApiErrorResponse {
  status: number;
  error: string;
  message: string;
  path: string;
  timestamp: string;
  validationErrors?: Record<string, string>;
}
