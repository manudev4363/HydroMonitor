
from sqlalchemy import select

from app.db.database import SessionLocal
from app.models.station import Station
from app.schemas.observation import Observation
from app.services.hubeau import get_observations
from app.services.observation_persistence import save_observations
from tqdm import tqdm


async def import_all_observations(
    grandeur_hydro: str = "H,Q",
    size: int = 100
) -> dict:
    """
    Importe les observations de toutes les stations
    enregistrées dans PostgreSQL.
    """

    # 1. Récupération des codes des stations
    with SessionLocal() as db:
        station_codes = db.scalars(
            select(Station.code)
        ).all()

    total_received = 0
    total_inserted = 0
    total_updated = 0
    total_unchanged = 0
    stations_processed = 0

    # 2. Import des observations station par station
    for station_code in tqdm(
            station_codes,
            desc="Import des observations",
            unit="station"
        ):

        raw_observations = await get_observations(
            station_code=station_code,
            grandeur_hydro=grandeur_hydro,
            size=size
        )

        observations = [
            Observation.model_validate(item)
            for item in raw_observations
        ]

        import traceback
        from pathlib import Path

        try:
            print(
            f"Station {station_code} : "
            f"{len(observations)} observations reçues"
            )
            result = save_observations(observations)

        except Exception:
            error_details = traceback.format_exc()

            Path("import_error.log").write_text(
                f"Station : {station_code}\n\n{error_details}",
                encoding="utf-8"
            )

            raise

        total_received += len(observations)
        total_inserted += result["inserted"]
        total_updated += result["updated"]
        total_unchanged += result["unchanged"]

        stations_processed += 1

    return {
        "stations_processed": stations_processed,
        "total_received": total_received,
        "inserted": total_inserted,
        "updated": total_updated,
        "unchanged": total_unchanged
    }
