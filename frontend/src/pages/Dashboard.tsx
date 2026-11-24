
import { useEffect, useState } from 'react'
import { getStations } from '../services/stationService'
import type { Station } from '../services/stationService'
import {
  getObservationStatistics,
  getObservationLast24h
} from '../services/observationService'
import type {
  ObservationStatistics,
  ObservationLast24h
} from '../services/observationService'

function Dashboard() {
  const [stations, setStations] = useState<Station[]>([])
  const [statistics, setStatistics] = useState<ObservationStatistics | null>(null)
  const [observationsLast24h, setObservationsLast24h] =
    useState<ObservationLast24h | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)
        setError(null)

        const [
          stationsData,
          statisticsData,
          last24hData
        ] = await Promise.all([
          getStations(),
          getObservationStatistics(),
          getObservationLast24h()
        ])

        setStations(stationsData)
        setStatistics(statisticsData)
        setObservationsLast24h(last24hData)

      } catch (err) {
        console.error(err)
        setError('Impossible de récupérer les données du tableau de bord.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const totalStations = stations.length

  const activeStations = stations.filter(
    station => station.is_active
  ).length

  const inactiveStations = totalStations - activeStations

  const formattedLastObservation = statistics?.last_observation_at
    ? new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short'
      }).format(new Date(statistics.last_observation_at))
    : 'Non disponible'

  const indicators = [
    {
      title: 'Stations totales',
      value: totalStations.toLocaleString('fr-FR'),
      description: 'Stations enregistrées',
      color: 'text-blue-600',
      background: 'bg-blue-50',
    },
    {
      title: 'Stations actives',
      value: activeStations.toLocaleString('fr-FR'),
      description: 'Stations opérationnelles',
      color: 'text-green-600',
      background: 'bg-green-50',
    },
    {
      title: 'Stations inactives',
      value: inactiveStations.toLocaleString('fr-FR'),
      description: 'Stations non opérationnelles',
      color: 'text-gray-600',
      background: 'bg-gray-100',
    },
    {
      title: 'Observations enregistrées',
      value: statistics?.total_observations?.toLocaleString('fr-FR') ?? '-',
      description: 'Observations stockées dans PostgreSQL',
      color: 'text-purple-600',
      background: 'bg-purple-50',
    },
    {
      title: 'Observations (24h)',
      value: observationsLast24h?.observations_last_24h?.toLocaleString('fr-FR') ?? '-',
      description: 'Observations enregistrées sur les dernières 24 heures',
      color: 'text-indigo-600',
      background: 'bg-indigo-50',
    },
    {
      title: 'Dernière observation',
      value: formattedLastObservation,
      description: 'Date et heure de la dernière mesure',
      color: 'text-orange-600',
      background: 'bg-orange-50',
    },
  ]

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Tableau de bord
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Vue d'ensemble du réseau hydrométrique HydroMonitor.
        </p>
      </div>

      {loading ? (
        <p className="text-gray-500">
          Chargement des indicateurs...
        </p>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {indicators.map(indicator => (
            <div
              key={indicator.title}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className={`inline-flex rounded-lg p-3 ${indicator.background}`}>
                <span className={`text-2xl font-bold ${indicator.color}`}>
                  {indicator.value}
                </span>
              </div>

              <h2 className="mt-4 font-semibold text-gray-900">
                {indicator.title}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {indicator.description}
              </p>
            </div>
          ))}
        </div>
      )}

    </div>
  )
}

export default Dashboard
