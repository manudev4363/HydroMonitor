
from fastapi import APIRouter, HTTPException
import httpx

from app.services.hubeau import get_stations
from app.services.stations_persistence import (
    get_all_stations,
    save_stations
)
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
async def list_stations():
    """
    Retourne les stations enregistrées dans PostgreSQL.
    """

    return get_all_stations()


@router.post("/import")
async def import_stations(department_code: str = "43"):
    """
    Importe les stations Hub'Eau dans PostgreSQL.
    """

    try:
        raw_stations = await get_stations(
            department_code=department_code
        )

        stations = [
            Station.model_validate(item)
            for item in raw_stations
        ]

        result = save_stations(stations)

        return {
            "department_code": department_code,
            "total_received": len(stations),
            **result
        }

    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=502,
            detail=f"Erreur Hub'Eau : {error}"
        )
