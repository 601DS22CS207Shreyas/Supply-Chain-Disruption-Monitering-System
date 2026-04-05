from fastapi import FastAPI, HTTPException
from dotenv import load_dotenv
from app.schemas import PredictionRequest, PredictionResponse
from app.model import predict
from app.explainer import generate_explanation

# ── Load environment variables from .env ─────────────────────────────────────
load_dotenv()

app = FastAPI(
    title="Supply Chain ML Service",
    description="Risk prediction microservice for supply chain disruption monitoring",
    version="1.0.0",
)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "supply-chain-ml"}


# ── Main prediction endpoint ──────────────────────────────────────────────────
@app.post("/predict", response_model=PredictionResponse)
def predict_risk(request: PredictionRequest):
    try:
        # Step 1: ML model prediction
        result = predict(request)

        # Step 2: LLM explanation via Claude API
        explanation = generate_explanation(
            request=request,
            delay_probability=result["delay_probability"],
            primary_cause=result["primary_cause"],
            risk_level=result["risk_level"],
            estimated_delay_hours=result["estimated_delay_hours"],
        )

        return PredictionResponse(
            shipment_id=request.shipment_id,
            delay_probability=result["delay_probability"],
            estimated_delay_hours=result["estimated_delay_hours"],
            primary_cause=result["primary_cause"],
            llm_explanation=explanation,
            model_version=result["model_version"],
            risk_level=result["risk_level"],
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── App entrypoint ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
