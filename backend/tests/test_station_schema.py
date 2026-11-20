
from app.schemas.station import Station


def test_station_mapping():
    raw_data = {
        "code_station": "K123456001",
        "libelle_station": "La Loire à Exemple",
        "libelle_cours_eau": "La Loire",
        "libelle_site": "La Loire à Exemple",
        "code_commune_station": "43157",
        "libelle_commune": "LE PUY-EN-VELAY",
        "longitude_station": 3.88,
        "latitude_station": 45.04,
        "en_service": True
    }

    station = Station.model_validate(raw_data)

    assert station.code == "K123456001"
    assert station.name == "La Loire à Exemple"
    assert station.river == "La Loire"
    assert station.municipality_code == "43157"
    assert station.is_active is True


def test_station_optional_fields():
    raw_data = {
        "code_station": "K123456001",
        "libelle_station": "Station test"
    }

    station = Station.model_validate(raw_data)

    assert station.code == "K123456001"
    assert station.river is None
    assert station.longitude is None
