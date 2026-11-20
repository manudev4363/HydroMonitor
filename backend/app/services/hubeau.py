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