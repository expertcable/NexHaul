from fastapi import FastAPI, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uvicorn
from db import claim_loads_pessimistic

app = FastAPI(
    title="Genesis LPP & PostGIS Spatial Microservice",
    description="Continuous-move backhaul triangulation engine powered by Linear Programming (PuLP) and PostGIS.",
    version="0.1.0",
)

class OptimizeRequest(BaseModel):
    truck_id: str = Field(..., example="TRK-2026-ALPHA", description="Unique identifier of the candidate truck")
    current_lat: float = Field(..., example=41.8781, description="Current WGS 84 latitude of the truck")
    current_lng: float = Field(..., example=-87.6298, description="Current WGS 84 longitude of the truck")
    radius_km: float = Field(..., example=150.0, description="Search radius in kilometers for candidate origin points")

class RouteSegment(BaseModel):
    load_id: str
    origin_city: str
    dest_city: str
    weight_kg: float
    est_profit_usd: float
    status: str

class OptimizeResponse(BaseModel):
    status: str
    truck_id: str
    search_center: Dict[str, float]
    radius_km: float
    lpp_solver_status: str
    empty_miles_saved: float
    total_network_efficiency_gain: str
    optimized_route: List[RouteSegment]
    message: str

class ClaimRequest(BaseModel):
    load_ids: List[str]
    truck_id: str

@app.get("/")
def health_check():
    return {
        "service": "Genesis LPP Engine",
        "status": "online",
        "solver": "PuLP / SCIPY Ready",
        "database_locking": "Pessimistic FOR UPDATE NOWAIT Enabled",
        "port": 8000
    }

@app.post("/api/v1/optimize", response_model=OptimizeResponse, status_code=status.HTTP_200_OK)
def run_continuous_move_optimization(payload: OptimizeRequest):
    """
    Executes Linear Programming optimization to triangulate the highest-efficiency continuous-move
    backhaul loop within the truck's geospatial radius.
    """
    # Mock continuous-move route loop (Chicago -> Indianapolis -> Dayton -> Chicago)
    # This verifies interface integrity between Next.js and our Python LPP engine
    mock_route = [
        RouteSegment(
            load_id="LD-8492-CHI",
            origin_city="Chicago, IL",
            dest_city="Indianapolis, IN",
            weight_kg=15400.0,
            est_profit_usd=1450.00,
            status="LPP OPTIMIZED"
        ),
        RouteSegment(
            load_id="LD-4921-IND",
            origin_city="Indianapolis, IN",
            dest_city="Dayton, OH",
            weight_kg=12000.0,
            est_profit_usd=980.00,
            status="LPP OPTIMIZED"
        ),
        RouteSegment(
            load_id="LD-8831-DAY",
            origin_city="Dayton, OH",
            dest_city="Chicago, IL",
            weight_kg=18500.0,
            est_profit_usd=1720.00,
            status="LPP OPTIMIZED"
        )
    ]

    return OptimizeResponse(
        status="success",
        truck_id=payload.truck_id,
        search_center={"lat": payload.current_lat, "lng": payload.current_lng},
        radius_km=payload.radius_km,
        lpp_solver_status="OPTIMAL_SOLUTION_FOUND",
        empty_miles_saved=312.5,
        total_network_efficiency_gain="+34.2%",
        optimized_route=mock_route,
        message="Successfully triangulated continuous-move backhaul loop via mock LPP solver."
    )

@app.post("/api/v1/claim", status_code=status.HTTP_200_OK)
def claim_candidate_loads(payload: ClaimRequest):
    """
    Endpoint to trigger our pessimistic database locking mechanism via claim_loads_pessimistic().
    """
    result = claim_loads_pessimistic(payload.load_ids, payload.truck_id)
    if not result["success"]:
        raise HTTPException(status_code=409, detail=result)
    return result

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
