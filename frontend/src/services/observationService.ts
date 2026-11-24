
import api from './api'

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

export interface ObservationResponse {
  station_code: string
  total: number
  size: number
  offset: number
  observations: Observation[]
}

export type ObservationGrandeur = 'H' | 'Q' | 'H,Q' | 'Q,H'

export async function getObservationsByStation(
  stationCode: string,
  grandeurHydro: ObservationGrandeur = 'H,Q',
  size: number = 100,
  offset: number = 0
): Promise<Observation[]> {

  const response = await api.get<ObservationResponse>(
    `/stations/${stationCode}/observations`,
    {
      params: {
        grandeur_hydro: grandeurHydro,
        size,
        offset
      }
    }
  )

  return response.data.observations
}

export interface ObservationStatistics {
  total_observations: number
  last_observation_at: string | null
  
}

export interface ObservationLast24h {
  observations_last_24h: number
}

export async function getObservationLast24h(): Promise<ObservationLast24h> {
  const response = await api.get<ObservationLast24h>(
    '/stations/observations/statistics/last-24h'
  )

  return response.data
}

export async function getObservationStatistics(): Promise<ObservationStatistics> {
  const response = await api.get<ObservationStatistics>(
    '/stations/observations/statistics'
  )

  return response.data
}

