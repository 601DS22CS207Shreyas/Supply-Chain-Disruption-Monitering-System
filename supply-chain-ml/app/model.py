import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from datetime import datetime
from typing import List
from app.schemas import PredictionRequest, NearbyEvent

# ── Model version ─────────────────────────────────────────────────────────────
MODEL_VERSION = "rf-v1.0"

# ── Encoders for categorical features ────────────────────────────────────────
transport_encoder = LabelEncoder()
transport_encoder.fit(['AIR', 'SEA', 'ROAD', 'RAIL', 'MULTIMODAL'])

severity_weights = {
    'LOW':      0.1,
    'MEDIUM':   0.3,
    'HIGH':     0.6,
    'CRITICAL': 0.9,
}

event_type_weights = {
    'NATURAL_DISASTER': 0.8,
    'LABOR_STRIKE':     0.7,
    'ACCIDENT':         0.6,
    'INFRASTRUCTURE':   0.5,
    'GEOPOLITICAL':     0.6,
    'WEATHER':          0.4,
    'OTHER':            0.2,
}

# ── Generate synthetic training data ─────────────────────────────────────────
def generate_training_data(n_samples: int = 1000):
    np.random.seed(42)

    transport_modes = ['AIR', 'SEA', 'ROAD', 'RAIL', 'MULTIMODAL']
    months          = np.random.randint(1, 13, n_samples)
    modes           = np.random.choice(transport_modes, n_samples)
    route_distances = np.random.uniform(100, 15000, n_samples)
    event_counts    = np.random.randint(0, 6, n_samples)
    max_severities  = np.random.uniform(0, 1, n_samples)
    carrier_rates   = np.random.uniform(0.05, 0.5, n_samples)
    days_to_arrival = np.random.randint(1, 30, n_samples)

    # Build label: delay more likely with high severity, sea/road, peak months
    delay_probability = (
        0.1
        + max_severities * 0.4
        + (np.isin(modes, ['SEA', 'ROAD']).astype(float) * 0.1)
        + (np.isin(months, [6, 7, 8, 10, 11, 12]).astype(float) * 0.1)
        + carrier_rates * 0.2
        + (event_counts > 2).astype(float) * 0.1
        + np.random.normal(0, 0.05, n_samples)
    ).clip(0, 1)

    labels = (delay_probability > 0.4).astype(int)

    mode_encoded = transport_encoder.transform(modes)

    X = pd.DataFrame({
        'transport_mode':   mode_encoded,
        'month':            months,
        'route_distance':   route_distances,
        'event_count':      event_counts,
        'max_severity':     max_severities,
        'carrier_delay_rate': carrier_rates,
        'days_to_arrival':  days_to_arrival,
    })

    return X, labels, delay_probability


# ── Train the model once at startup ──────────────────────────────────────────
X_train, y_train, _ = generate_training_data()

rf_model = RandomForestClassifier(
    n_estimators=100,
    max_depth=8,
    random_state=42,
    class_weight='balanced',
)
rf_model.fit(X_train, y_train)


# ── Feature extraction from request ──────────────────────────────────────────
def extract_features(request: PredictionRequest) -> pd.DataFrame:
    # Transport mode
    try:
        mode_encoded = transport_encoder.transform([request.transport_mode])[0]
    except ValueError:
        mode_encoded = 0

    # Month from scheduled departure
    try:
        departure_date = datetime.fromisoformat(request.scheduled_departure)
        month = departure_date.month
    except Exception:
        month = datetime.now().month

    # Days until arrival
    try:
        arrival_date = datetime.fromisoformat(request.scheduled_arrival)
        days_to_arrival = max(1, (arrival_date - datetime.now()).days)
    except Exception:
        days_to_arrival = 7

    # Route distance (approximate from string — real system would use geocoding)
    route_distance = 1000.0

    # Event features
    event_count = len(request.nearby_events)
    max_severity = max(
        [severity_weights.get(e.severity, 0.1) for e in request.nearby_events],
        default=0.0
    )

    # Carrier delay rate (static mapping — expand as needed)
    carrier_delay_rates = {
        'Blue Dart':        0.12,
        'GATI':             0.18,
        'Maersk':           0.22,
        'IndiGo Cargo':     0.10,
        'Thai Airways':     0.15,
        'Emirates SkyCargo':0.08,
        'Qantas Freight':   0.09,
        'SCI Shipping':     0.25,
        'Lufthansa Cargo':  0.11,
        'MSC Shipping':     0.20,
    }
    carrier_delay_rate = carrier_delay_rates.get(request.carrier, 0.15)

    return pd.DataFrame([{
        'transport_mode':     mode_encoded,
        'month':              month,
        'route_distance':     route_distance,
        'event_count':        event_count,
        'max_severity':       max_severity,
        'carrier_delay_rate': carrier_delay_rate,
        'days_to_arrival':    days_to_arrival,
    }])


# ── Determine primary cause ───────────────────────────────────────────────────
def get_primary_cause(request: PredictionRequest, delay_prob: float) -> str:
    if not request.nearby_events:
        if delay_prob > 0.6:
            return f"High historical delay rate for {request.transport_mode} shipments on this route"
        return "No significant disruptions detected"

    # Find highest impact event
    best_event = max(
        request.nearby_events,
        key=lambda e: (
            severity_weights.get(e.severity, 0) +
            event_type_weights.get(e.type, 0)
        )
    )
    return f"{best_event.type.replace('_', ' ').title()} near {best_event.location}"


# ── Risk level from probability ───────────────────────────────────────────────
def get_risk_level(prob: float) -> str:
    if prob >= 0.9: return "CRITICAL"
    if prob >= 0.7: return "HIGH"
    if prob >= 0.4: return "MEDIUM"
    return "LOW"


# ── Main prediction function ──────────────────────────────────────────────────
def predict(request: PredictionRequest) -> dict:
    features = extract_features(request)

    # Probability of delay (class 1)
    delay_prob = float(rf_model.predict_proba(features)[0][1])

    # Adjust upward if severe events nearby
    for event in request.nearby_events:
        if event.severity == 'CRITICAL':
            delay_prob = min(delay_prob + 0.25, 0.97)
        elif event.severity == 'HIGH':
            delay_prob = min(delay_prob + 0.15, 0.90)

    estimated_delay_hours = delay_prob * 72  # max 72 hours estimated delay

    primary_cause = get_primary_cause(request, delay_prob)
    risk_level    = get_risk_level(delay_prob)

    return {
        "delay_probability":     round(delay_prob, 4),
        "estimated_delay_hours": round(estimated_delay_hours, 1),
        "primary_cause":         primary_cause,
        "risk_level":            risk_level,
        "model_version":         MODEL_VERSION,
    }
