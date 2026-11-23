
from sqlalchemy import select

from app.db.database import SessionLocal
from app.models.station import Station


def save_stations(stations: list) -> dict:
    """
    Enregistre les stations dans PostgreSQL.

    Une station est identifiée par son code.
    Si elle existe déjà, ses informations sont actualisées.
    """

    inserted = 0
    updated = 0
    unchanged = 0

    with SessionLocal() as db:
        try:
            for station_data in stations:

                data = station_data.model_dump()

                existing_station = db.scalar(
                    select(Station).where(
                        Station.code == data["code"]
                    )
                )

                if existing_station is None:

                    db.add(Station(**data))
                    inserted += 1

                else:

                    changed = False

                    for field, value in data.items():

                        if getattr(existing_station, field) != value:
                            setattr(existing_station, field, value)
                            changed = True

                    if changed:
                        updated += 1
                    else:
                        unchanged += 1

            db.commit()

        except Exception:
            db.rollback()
            raise

    return {
        "inserted": inserted,
        "updated": updated,
        "unchanged": unchanged
    }
