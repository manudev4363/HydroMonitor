
import api from './api'

export interface Station {
  code: string
  name: string
  river: string | null
  site_name: string | null
  municipality_code: string | null
  municipality: string | null
  longitude: number | null
  latitude: number | null
  is_active: boolean
}

export interface Observation {
  station_code: string
  site_code: string | null
  grandeur: 'H' | 'Q'
  observed_at: string
  value: number
  method: string | null
  qualification: string | null
  longitude: number | null
  latitude: number | null
  unit: string
}

export interface ObservationPaginated {
  station_code: string
  total: number
  size: number
  offset: number
  observations: Observation[]
}


export async function getStations(): Promise<Station[]> {
  const response = await api.get<Station[]>('/stations')

  return response.data
}


export async function getStationByCode(
  code: string
): Promise<Station | undefined> {
  const stations = await getStations()

  return stations.find((station) => station.code === code)
}


export async function getStationObservations(
  code: string,
  grandeurHydro: string = 'H,Q',
  size: number = 100,
  offset: number = 0
): Promise<ObservationPaginated> {
  const response = await api.get<ObservationPaginated>(
    `/stations/${code}/observations`,
    {
      params: {
        grandeur_hydro: grandeurHydro,
        size,
        offset,
      },
    }
  )

  return response.data
}
