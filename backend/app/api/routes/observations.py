
import httpx

from fastapi import APIRouter, HTTPException, Query

from app.services.hubeau import get_observations
from app.schemas.observation import Observation


router = APIRouter(
    prefix="/stations",
    tags=["Observations hydrométriques"]
)


@router.get(
    "/{station_code}/observations",
    response_model=list[Observation],
    response_model_by_alias=False
)
async def list_observations(
    station_code: str,
    grandeur_hydro: str = Query(
        default="H,Q",
        pattern="^(H|Q|H,Q|Q,H)$"
    ),
    size: int = Query(default=100, ge=1, le=200)
):
    """
    Retourne les observations hydrométriques
    d'une station.
    """

    try:
        raw_observations = await get_observations(
            station_code=station_code,
            grandeur_hydro=grandeur_hydro,
            size=size
        )

        return [
            Observation.model_validate(item)
            for item in raw_observations
        ]

    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=502,
            detail=f"Erreur Hub'Eau : {error}"
        )
