import os
import google.generativeai as genai
from app.schemas import PredictionRequest

# ── Configure Gemini ──────────────────────────────────────────────────────────
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
gemini_model = genai.GenerativeModel("gemini-1.5-flash")


def generate_explanation(
    request: PredictionRequest,
    delay_probability: float,
    primary_cause: str,
    risk_level: str,
    estimated_delay_hours: float,
) -> str:

    # Build events summary for the prompt
    events_summary = "None"
    if request.nearby_events:
        events_summary = "; ".join([
            f"{e.type.replace('_', ' ')} ({e.severity}) near {e.location}"
            for e in request.nearby_events
        ])

    prompt = f"""You are a supply chain risk analyst. Analyze this shipment and provide a concise 2-3 sentence explanation of the risk assessment.

Shipment details:
- Route: {request.origin} → {request.destination}
- Transport mode: {request.transport_mode}
- Carrier: {request.carrier}
- Nearby disruption events: {events_summary}

Risk assessment:
- Delay probability: {round(delay_probability * 100)}%
- Risk level: {risk_level}
- Primary cause: {primary_cause}
- Estimated delay: {round(estimated_delay_hours)} hours

Provide a clear, actionable explanation in 2-3 sentences. Focus on the main risk factor and what action should be taken. Be specific and professional."""

    try:
        response = gemini_model.generate_content(prompt)
        return response.text.strip()

    except Exception as e:
        # Fallback explanation if Gemini API fails
        return (
            f"This shipment from {request.origin} to {request.destination} "
            f"has a {round(delay_probability * 100)}% probability of delay "
            f"({risk_level} risk). Primary factor: {primary_cause}. "
            f"Estimated potential delay: {round(estimated_delay_hours)} hours."
        )
