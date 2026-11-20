from fastapi import APIRouter, HTTPException
import httpx

from app.services.hubeau import get_stations
from app.schemas.station import Station

router = APIRouter(
    prefix="/stations",
    tags=["Stations hydrométriques"]
)

@router.get(
    "", 
    response_model=list[Station],
    response_model_by_alias=False
)
async def list_stations(department_code: str = "43"):
    """Retourne les stations hydrométriques du département de la Haute-Loire"""
    try:
        raw_stations = await get_stations(department_code)

        stations = [
            Station.model_validate(item)
            for item in raw_stations
        ]

        return stations
    
    except httpx.HTTPError as error:
        raise HTTPException (
            status_code=502,
            detail=f"Erreur lors de la communication avec l'APi Hub'Eau : {error}"
        )
