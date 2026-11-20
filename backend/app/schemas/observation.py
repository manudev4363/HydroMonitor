
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field, computed_field

class Observation(BaseModel):
    """
    Modèle métier représentant une observation hydrométrique.
    """

    model_config = ConfigDict(
        populate_by_name=True
    )

    station_code: str = Field(alias="code_station")

    site_code: str | None = Field(
        default=None,
        alias="code_site"
    )

    grandeur: Literal["H", "Q"] = Field(
        alias="grandeur_hydro"
    )

    observed_at: datetime = Field(
        alias="date_obs"
    )

    value: float = Field(
        alias="resultat_obs"
    )

    method: str | None = Field(
        default=None,
        alias="libelle_methode_obs"
    )

    qualification: str | None = Field(
        default=None,
        alias="libelle_qualification_obs"
    )

    longitude: float | None = None
    latitude: float | None = None

    @computed_field
    @property
    def unit(self) -> str:
        """Unité de la mesure selon sa grandeur."""
        return "mm" if self.grandeur == "H" else "l/s"
