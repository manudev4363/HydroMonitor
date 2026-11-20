
from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.schemas.observation import Observation


def test_height_observation():

    raw_data = {
        "code_station": "K418001001",
        "code_site": "K4180010",
        "grandeur_hydro": "H",
        "date_obs": "2026-11-20T10:00:00Z",
        "resultat_obs": 1250,
        "libelle_methode_obs": "Mesurée",
        "libelle_qualification_obs": "Non qualifiée"
    }

    observation = Observation.model_validate(raw_data)

    assert observation.station_code == "K418001001"
    assert observation.grandeur == "H"
    assert observation.value == 1250
    assert observation.unit == "mm"


def test_discharge_observation():

    raw_data = {
        "code_station": "K418001001",
        "grandeur_hydro": "Q",
        "date_obs": "2026-11-20T10:00:00Z",
        "resultat_obs": 3500
    }

    observation = Observation.model_validate(raw_data)

    assert observation.grandeur == "Q"
    assert observation.value == 3500
    assert observation.unit == "l/s"


def test_invalid_grandeur():

    raw_data = {
        "code_station": "K418001001",
        "grandeur_hydro": "X",
        "date_obs": "2026-11-20T10:00:00Z",
        "resultat_obs": 100
    }

    with pytest.raises(ValidationError):
        Observation.model_validate(raw_data)
