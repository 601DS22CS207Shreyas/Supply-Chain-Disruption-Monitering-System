from pydantic import BaseModel
from typing import List, Optional


# ── Incoming event from Spring Boot ──────────────────────────────────────────
class NearbyEvent(BaseModel):
    type: str
    severity: str
    location: str
    impact_radius_km: float = 200.0


# ── Prediction request from Spring Boot ──────────────────────────────────────
class PredictionRequest(BaseModel):
    shipment_id: int
    origin: str
    destination: str
    transport_mode: str
    carrier: str
    scheduled_departure: str
    scheduled_arrival: str
    nearby_events: List[NearbyEvent] = []


# ── Prediction response sent back to Spring Boot ──────────────────────────────
class PredictionResponse(BaseModel):
    shipment_id: int
    delay_probability: float
    estimated_delay_hours: float
    primary_cause: str
    llm_explanation: str
    model_version: str
    risk_level: str
