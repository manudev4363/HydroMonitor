import httpx

HUBEAU_BASE_URL = "https://hubeau.eaufrance.fr/api/v2/hydrometrie"

async def get_stations(department_code: str = "43"):
    """ Récupère les station hydrométriques du département de la Haute-Loire depuis Hub'Eau"""
    url = f"{HUBEAU_BASE_URL}/referentiel/stations"

    params = {
        "code_departement":department_code,
        "en_service": 1,
        "format":"json",
        "size":100
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()

    data = response.json()

    return data.get("data", [])



async def get_observations(
    station_code: str,
    grandeur_hydro: str = "H,Q",
    size: int = 100
):
    """
    Récupère toutes les pages d'observations hydrométriques
    d'une station depuis Hub'Eau.
    """

    url = f"{HUBEAU_BASE_URL}/observations_tr"

    params = {
        "code_entite": station_code,
        "grandeur_hydro": grandeur_hydro,
        "sort": "desc",
        "size": size,
        "format": "json"
    }

    observations = []

    async with httpx.AsyncClient(timeout=30.0) as client:

        while url:

            response = await client.get(
                url,
                params=params
            )

            try:
                response.raise_for_status()

            except httpx.HTTPStatusError as e:
                raise RuntimeError(
                    f"Erreur Hub'Eau HTTP {e.response.status_code} "
                    f"pour la station {station_code}. "
                    f"Réponse : {e.response.text[:1000]}"
                ) from e

            data = response.json()

            # Ajout des observations de la page actuelle
            observations.extend(data.get("data", []))

            # Récupération de l'URL de la page suivante
            url = data.get("next")

            # Les paramètres sont déjà présents dans l'URL suivante
            params = None

    return observations
