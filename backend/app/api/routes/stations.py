from fastapi import APIRouter, HTTPException
import httpx

from app.services.hubeau import get_stations

router = APIRouter(
    prefix="/stations",
    tags=["Stations hydrométriques"]
)

@router.get("")
async def list_stations(department_code: str = "43"):
    """Retourne les stations hydrométriques du département de la Haute-Loire"""
    try:
        stations = await get_stations(department_code)
        return {
            "Nombre de stations":len(stations),
            "Département": department_code,
            "stations": stations
        }
    except httpx.HTTPError as error:
        raise HTTPException (
            status_code=502,
            detail=f"Erreur lors de la communication avec l'APi Hub'Eau : {error}"
        )
