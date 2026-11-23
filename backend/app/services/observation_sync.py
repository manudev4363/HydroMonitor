from datetime import timedelta

from app.services.hubeau import get_observations
from app.services.observation_persistence import (
    get_latest_observation_dates,
    save_observations
)
from app.schemas.observation import Observation

async def synchronize_observations(
    overlap_hours: int = 24
) -> dict:
    """
    Synchronise les observations de toutes les stations.

    Récupère les nouvelles observations depuis Hub'Eau
    et actualise celles qui ont été modifiées.
    """

    latest_dates = get_latest_observation_dates()

    total_inserted = 0
    total_updated = 0
    total_unchanged = 0

    successful_stations = 0
    failed_stations = []

    for station_code, latest_date in latest_dates.items():

        print(f"Synchronisation de la station {station_code}")

        try:

            # 1. Calcul de la date de reprise

            if latest_date is not None:
                date_debut_obs = (
                    latest_date - timedelta(hours=overlap_hours)
                ).isoformat()
            else:
                date_debut_obs = None

            # 2. Récupération des observations Hub'Eau

            raw_observations = await get_observations(
                station_code=station_code,
                date_debut_obs=date_debut_obs
            )

            print(
                f"  {len(raw_observations)} observations récupérées"
            )

            # 3. Conversion Pydantic

            observations = [
                Observation.model_validate(item)
                for item in raw_observations
            ]

            # 4. Persistance PostgreSQL

            if observations:

                result = save_observations(observations)

                total_inserted += result["inserted"]
                total_updated += result["updated"]
                total_unchanged += result["unchanged"]

            successful_stations += 1

        except Exception as e:

            print(
                f"  ERREUR station {station_code} : {e}"
            )

            failed_stations.append({
                "station_code": station_code,
                "error": str(e)
            })

    # 5. Bilan de synchronisation

    return {
        "inserted": total_inserted,
        "updated": total_updated,
        "unchanged": total_unchanged,
        "total_processed": (
            total_inserted
            + total_updated
            + total_unchanged
        ),
        "successful_stations": successful_stations,
        "failed_stations": failed_stations,
        "total_stations": len(latest_dates)
    }