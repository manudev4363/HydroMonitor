
from pydantic import BaseModel, ConfigDict, Field


class Station(BaseModel):
    """
    Modèle métier représentant une station hydrométrique.
    """

    model_config = ConfigDict(
        populate_by_name=True
    )

    code: str = Field(alias="code_station")
    name: str = Field(alias="libelle_station")

    river: str | None = Field(
        default=None,
        alias="libelle_cours_eau"
    )

    site_name: str | None = Field(
        default=None,
        alias="libelle_site"
    )

    municipality_code: str | None = Field(
        default=None,
        alias="code_commune_station"
    )

    municipality: str | None = Field(
        default=None,
        alias="libelle_commune"
    )

    longitude: float | None = Field(
        default=None,
        alias="longitude_station"
    )

    latitude: float | None = Field(
        default=None,
        alias="latitude_station"
    )

    is_active: bool | None = Field(
        default=None,
        alias="en_service"
    )
