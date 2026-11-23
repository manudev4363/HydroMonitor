
import httpx

from fastapi import APIRouter, HTTPException, Query

from app.services.hubeau import get_observations
from app.services.observation_persistence import (
    save_observations,
    get_observations_by_station
)
from app.schemas.observation import (
    Observation,
    ObservationPaginated
)
from app.services.observation_import import import_all_observations


router = APIRouter(
    prefix="/stations",
    tags=["Observations hydrométriques"]
)


@router.get(
    "/{station_code}/observations",
    response_model=ObservationPaginated,
    response_model_by_alias=False
)
async def list_observations(
    station_code: str,
    grandeur_hydro: str = Query(
        default="H,Q",
        pattern="^(H|Q|H,Q|Q,H)$"
    ),
    size: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0)
):
    """
    Retourne les observations hydrométriques
    d'une station depuis PostgreSQL.
    """

    try:
        return get_observations_by_station(
            station_code=station_code,
            grandeur_hydro=grandeur_hydro,
            size=size,
            offset=offset
        )

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        )

@router.post("/{station_code}/observations/import")
async def import_observations(
    station_code: str,
    grandeur_hydro: str = Query(
        default="H,Q",
        pattern="^(H|Q|H,Q|Q,H)$"
    ),
    size: int = Query(default=100, ge=1, le=200)
):
    """
    Récupère les observations depuis Hub'Eau
    et les enregistre dans PostgreSQL.
    """

    try:
        raw_observations = await get_observations(
            station_code=station_code,
            grandeur_hydro=grandeur_hydro,
            size=size
        )

        observations = [
            Observation.model_validate(item)
            for item in raw_observations
        ]

        result = save_observations(observations)

        return {
            "station_code": station_code,
            "total_received": len(observations),
            **result
        }

    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=502,
            detail=f"Erreur Hub'Eau : {error}"
        )

    except ValueError as error:
        raise HTTPException(
            status_code=404,
            detail=str(error)
        )

@router.post("/observations/import-all")
async def import_all_stations_observations():
    """
    Importe les observations de toutes les stations
    enregistrées dans PostgreSQL.
    """

    try:
        return await import_all_observations()

    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=502,
            detail=f"Erreur Hub'Eau : {error}"
        )