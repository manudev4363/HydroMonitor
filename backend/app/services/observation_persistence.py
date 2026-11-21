
from sqlalchemy import select, tuple_
from datetime import timezone

from app.db.database import SessionLocal
from app.models.station import Station
from app.models.observation import Observation as ObservationModel
from app.schemas.observation import Observation as ObservationSchema


def save_observations(
    observations: list[ObservationSchema]
) -> dict:
    """
    Enregistre les observations hydrométriques dans PostgreSQL.

    Une observation est identifiée par :
    - sa station ;
    - sa date et heure ;
    - sa grandeur hydrologique.
    """

    if not observations:
        return {
            "inserted": 0,
            "updated": 0,
            "unchanged": 0
        }

    inserted = 0
    updated = 0
    unchanged = 0

    with SessionLocal() as db:
        try:
            # 1. Récupération des stations concernées

            station_codes = {
                observation.station_code
                for observation in observations
            }

            stations = db.scalars(
                select(Station).where(
                    Station.code.in_(station_codes)
                )
            ).all()

            stations_by_code = {
                station.code: station
                for station in stations
            }

            missing_stations = (
                station_codes - stations_by_code.keys()
            )

            if missing_stations:
                raise ValueError(
                    f"Stations inconnues : {sorted(missing_stations)}"
                )

            # 2. Construction des clés des observations

            observation_keys = {
                (
                    stations_by_code[item.station_code].id,
                    normalize_datetime(item.observed_at),
                    item.grandeur
                )
                for item in observations
            }

            # 3. Recherche des observations déjà enregistrées par lots de 500

            existing_observations = []

            observation_keys_list = list(observation_keys)

            batch_size = 500

            for i in range(0, len(observation_keys_list), batch_size):

                batch = observation_keys_list[i:i + batch_size]

                batch_observations = db.scalars(
                    select(ObservationModel).where(
                        tuple_(
                            ObservationModel.station_id,
                            ObservationModel.timestamp,
                            ObservationModel.measurement_type
                        ).in_(batch)
                    )
                ).all()

                existing_observations.extend(batch_observations)

            existing_by_key = {
                (
                    item.station_id,
                    normalize_datetime(item.timestamp),
                    item.measurement_type
                ): item
                for item in existing_observations
            }

            # 4. Insertion ou actualisation

            for item in observations:

                station = stations_by_code[item.station_code]

                normalized_timestamp = normalize_datetime(
                    item.observed_at
                )

                key = (
                    station.id,
                    normalized_timestamp,
                    item.grandeur
                )

                data = {
                    "site_code": item.site_code,
                    "timestamp": normalized_timestamp,
                    "result": item.value,
                    "unit": item.unit,
                    "measurement_type": item.grandeur,
                    "method": item.method,
                    "qualification": item.qualification
                }

                existing = existing_by_key.get(key)

                if existing is None:

                    new_observation = ObservationModel(
                        station_id=station.id,
                        **data
                    )

                    db.add(new_observation)
                    existing_by_key[key] = new_observation

                    inserted += 1

                else:

                    changed = False

                    for field, value in data.items():

                        if getattr(existing, field) != value:
                            setattr(existing, field, value)
                            changed = True

                    if changed:
                        updated += 1
                    else:
                        unchanged += 1

            # 5. Validation de la transaction

            db.commit()

        except Exception as e:
            db.rollback()

            import traceback

            traceback.print_exc()
            print("Type :", type(e).__name__)
            print("Message :", str(e))

            if e.__cause__:
                print("Cause PostgreSQL :", repr(e.__cause__))

            raise

    return {
        "inserted": inserted,
        "updated": updated,
        "unchanged": unchanged
    }

def normalize_datetime(value):
    """
    Normalise une date avec fuseau horaire en UTC.
    """
    if value.tzinfo is None:
        raise ValueError(
            "Une observation possède une date sans fuseau horaire."
        )

    return value.astimezone(timezone.utc)