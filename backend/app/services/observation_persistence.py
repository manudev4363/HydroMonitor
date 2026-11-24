
from sqlalchemy import select, tuple_, func
from datetime import datetime, timedelta, timezone

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

def get_latest_observation_dates() -> dict:
    """
    Retourne la dernière date d'observation
    enregistrée pour chaque station.

    Résultat :
    {
        "K004551001": datetime(...),
        "K004552001": datetime(...),
    }
    """

    with SessionLocal() as db:

        results = db.execute(
            select(
                Station.code,
                func.max(ObservationModel.timestamp)
            )
            .outerjoin(
                ObservationModel,
                Station.id == ObservationModel.station_id
            )
            .group_by(Station.code)
        ).all()

        return {
            station_code: normalize_datetime(latest_timestamp)
            if latest_timestamp is not None
            else None
            for station_code, latest_timestamp in results
        }

def get_observations_by_station(
    station_code: str,
    grandeur_hydro: str = "H,Q",
    size: int = 100,
    offset: int = 0
) -> list:
    """
    Récupère les observations d'une station depuis PostgreSQL.
    """

    with SessionLocal() as db:

        station = db.scalar(
            select(Station).where(
                Station.code == station_code
            )
        )

        if station is None:
            raise ValueError(
                f"Station inconnue : {station_code}"
            )

        grandeurs = grandeur_hydro.split(",")

        observations = db.scalars(
            select(ObservationModel)
            .where(
                ObservationModel.station_id == station.id,
                ObservationModel.measurement_type.in_(grandeurs)
            )
            .order_by(
                ObservationModel.timestamp.desc()
            )
            .limit(size)
            .offset(offset)
        ).all()

        total = db.scalar(
            select(func.count(ObservationModel.id))
            .where(
                ObservationModel.station_id == station.id,
                ObservationModel.measurement_type.in_(grandeurs)
            )
        )

        return {
            "station_code": station.code,
            "total": total,
            "size": size,
            "offset": offset,
            "observations": [
                ObservationSchema(
                    station_code=station.code,
                    site_code=item.site_code,
                    grandeur=item.measurement_type,
                    observed_at=item.timestamp,
                    value=item.result,
                    method=item.method,
                    qualification=item.qualification
                )
                for item in observations
            ]
        }

def get_observation_statistics() -> dict:
    """
    Retourne les statistiques globales des observations stockées.
    """

    with SessionLocal() as db:

        total = db.scalar(
            select(func.count()).select_from(ObservationModel)
        ) or 0

        latest = db.scalar(
            select(func.max(ObservationModel.timestamp))
        )

        return {
            "total_observations": total,
            "last_observation_at": latest
        }

def get_observations_last_24h() -> int:
    """
    Retourne le nombre d'observations enregistrées
    au cours des dernières 24 heures.
    """

    now = datetime.now(timezone.utc)
    last_24h = now - timedelta(hours=24)

    with SessionLocal() as db:

        total = db.scalar(
            select(func.count())
            .select_from(ObservationModel)
            .where(
                ObservationModel.timestamp >= last_24h
            )
        )

        return total or 0