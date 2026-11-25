
import { useEffect, useState } from 'react'

import {
  getObservationsByStation,
  type Observation,
  type ObservationGrandeur
} from '../../services/observationService'

import { getStations } from '../../services/stationService'
import type { Station } from '../../services/stationService'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts'

function ObservationChart() {
  const [stations, setStations] = useState<Station[]>([])
  const [selectedStation, setSelectedStation] = useState('')
  const [grandeur, setGrandeur] = useState<ObservationGrandeur>('H')
  const [observations, setObservations] = useState<Observation[]>([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Filtres temporels
  const [dateDebut, setDateDebut] = useState('')
  const [dateFin, setDateFin] = useState('')

  // Vérification de la période
  const periodeInvalide =
    dateDebut !== '' &&
    dateFin !== '' &&
    dateDebut > dateFin

  // Récupération des stations
  useEffect(() => {
    async function loadStations() {
      try {
        const data = await getStations()
        setStations(data)

        if (data.length > 0) {
          setSelectedStation(data[0].code)
        }
      } catch (err) {
        console.error(err)
        setError('Impossible de récupérer les stations.')
      }
    }

    loadStations()
  }, [])

  // Récupération des observations
  // Une nouvelle requête est déclenchée dès qu'un filtre change.
    useEffect(() => {
    if (!selectedStation || periodeInvalide) {
      return
    }

    let cancelled = false

    async function loadObservations() {
      try {
        setLoading(true)
        setError(null)
        setObservations([])

        const data = await getObservationsByStation(
          selectedStation,
          grandeur,
          1000,
          0,
          dateDebut || undefined,
          dateFin || undefined
        )

        if (!cancelled) {
          setObservations(data)
        }
      } catch (err) {
        console.error(err)

        if (!cancelled) {
          setError('Impossible de récupérer les observations.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadObservations()

    return () => {
      cancelled = true
    }
  }, [
    selectedStation,
    grandeur,
    dateDebut,
    dateFin,
    periodeInvalide
  ])

  // Préparation des données pour Recharts
  // Le filtrage temporel est désormais effectué par le backend.
  const chartData = observations
    .map(observation => ({
      date: observation.observed_at,
      timestamp: new Date(observation.observed_at).getTime(),
      valeur: Number(observation.value)
    }))
    .filter(observation =>
      Number.isFinite(observation.timestamp) &&
      Number.isFinite(observation.valeur)
    )
    .sort((a, b) => a.timestamp - b.timestamp)

  const unite = grandeur === 'H' ? 'm' : 'm³/s'

  const selectedStationName =
    stations.find(station => station.code === selectedStation)?.name

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">

      {/* En-tête */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Évolution des observations hydrométriques
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Suivi des hauteurs d'eau et des débits par station.
        </p>
      </div>

      {/* Sélection station et grandeur */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Station hydrométrique
          </label>

          <select
            value={selectedStation}
            onChange={event => setSelectedStation(event.target.value)}
            disabled={stations.length === 0}
            className="w-full rounded-lg border border-gray-300 p-2 text-sm"
          >
            {stations.map(station => (
              <option key={station.code} value={station.code}>
                {station.name} ({station.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Grandeur hydrologique
          </label>

          <select
            value={grandeur}
            onChange={event =>
              setGrandeur(event.target.value as ObservationGrandeur)
            }
            className="w-full rounded-lg border border-gray-300 p-2 text-sm"
          >
            <option value="H">Hauteur d'eau (H)</option>
            <option value="Q">Débit (Q)</option>
          </select>
        </div>

      </div>

      {/* Filtres temporels */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-800">
          Période d'observation
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Date de début
            </label>

            <input
              type="date"
              value={dateDebut}
              max={dateFin || undefined}
              onChange={event => setDateDebut(event.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Date de fin
            </label>

            <input
              type="date"
              value={dateFin}
              min={dateDebut || undefined}
              onChange={event => setDateFin(event.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2 text-sm"
            />
          </div>

        </div>

        <button
          type="button"
          onClick={() => {
            setDateDebut('')
            setDateFin('')
          }}
          className="mt-3 text-sm text-blue-600 hover:underline"
        >
          Réinitialiser les dates
        </button>
      </div>

      {/* Chargement */}
      {loading && (
        <p className="text-sm text-gray-500">
          Chargement des observations...
        </p>
      )}

      {/* Erreur */}
      {error && (
        <p className="text-sm text-red-600">
          {error}
        </p>
      )}

      {/* Période invalide */}
      {periodeInvalide && (
        <p className="text-sm text-red-600">
          La date de début doit être antérieure ou égale à la date de fin.
        </p>
      )}

      {/* Graphique */}
      {!loading && !error && !periodeInvalide && chartData.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">

            <div>
              <h3 className="font-semibold text-gray-800">
                {selectedStationName}
              </h3>

              <p className="text-sm text-gray-500">
                {chartData.length} observations affichées
              </p>
            </div>

            <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
              {grandeur === 'H' ? 'Hauteur (m)' : 'Débit (m³/s)'}
            </span>

          </div>

          <div className="h-[350px] w-full">

            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 20,
                  left: 10,
                  bottom: 10
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                />

                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={value =>
                    new Date(String(value)).toLocaleDateString('fr-FR')
                  }
                />

                <YAxis
                  tick={{ fontSize: 12 }}
                  width={65}
                  label={{
                    value: unite,
                    angle: -90,
                    position: 'insideLeft'
                  }}
                />

                <Tooltip
                  labelFormatter={value =>
                    new Date(String(value)).toLocaleString('fr-FR')
                  }
                  formatter={value => [
                    `${Number(value).toLocaleString('fr-FR')} ${unite}`,
                    grandeur === 'H' ? 'Hauteur' : 'Débit'
                  ]}
                />

                <Line
                  type="monotone"
                  dataKey="valeur"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5 }}
                  name={grandeur === 'H' ? 'Hauteur' : 'Débit'}
                />

              </LineChart>
            </ResponsiveContainer>

          </div>
        </>
      )}

      {/* Aucune observation */}
      {!loading &&
        !error &&
        !periodeInvalide &&
        chartData.length === 0 && (
          <p className="text-sm text-gray-500">
            Aucune observation disponible pour cette station sur la période sélectionnée.
          </p>
        )}

    </div>
  )
}

export default ObservationChart
