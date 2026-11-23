
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import {
  getStationByCode,
} from '../services/stationService'
import type { Station } from '../services/stationService'
import {
  getObservationsByStation,
} from '../services/observationService'
import type { Observation } from '../services/observationService'

function StationDetail() {
  const { code } = useParams<{ code: string }>()

  const [station, setStation] = useState<Station | null>(null)
  const [heightObservation, setHeightObservation] =
    useState<Observation | null>(null)
  const [flowObservation, setFlowObservation] =
    useState<Observation | null>(null)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadStation() {
      if (!code) {
        setError('Code station manquant.')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        setStation(null)
        setHeightObservation(null)
        setFlowObservation(null)

        const data = await getStationByCode(code)

        if (!data) {
          setError('Station introuvable.')
          return
        }

        setStation(data)

        // Récupération indépendante des dernières observations H et Q
        const [heightData, flowData] = await Promise.all([
          getObservationsByStation(code, 'H', 1).catch(err => {
            console.error('Erreur récupération hauteur H :', err)
            return []
          }),
          getObservationsByStation(code, 'Q', 1).catch(err => {
            console.error('Erreur récupération débit Q :', err)
            return []
          })
        ])

        setHeightObservation(heightData[0] ?? null)
        setFlowObservation(flowData[0] ?? null)

      } catch (err) {
        console.error(err)
        setError('Impossible de récupérer la station.')
      } finally {
        setLoading(false)
      }
    }

    loadStation()
  }, [code])

  if (loading) {
    return <p className="text-gray-500">Chargement de la station...</p>
  }

  if (error || !station) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
        {error || 'Station introuvable.'}
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">
            {station.name}
          </h1>

          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              station.is_active
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {station.is_active ? 'Active' : 'Inactive'}
          </span>
        </div>

        <p className="mt-2 text-sm text-gray-500">
          Station hydrométrique · {station.code}
        </p>
      </div>

      {/* Dernières observations */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* Hauteur d'eau */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Dernière hauteur d'eau (H)
          </p>

          {heightObservation ? (
            <>
              <p className="mt-3 text-3xl font-bold text-blue-600">
                {(heightObservation.value / 1000).toFixed(3)}
                <span className="ml-2 text-lg font-medium">m</span>
              </p>

              <p className="mt-2 text-xs text-gray-400">
                Mesure du{' '}
                {new Date(heightObservation.observed_at).toLocaleString('fr-FR')}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-gray-400">
              Aucune mesure disponible
            </p>
          )}
        </div>

        {/* Débit */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Dernier débit (Q)
          </p>

          {flowObservation ? (
            <>
              <p className="mt-3 text-3xl font-bold text-cyan-600">
                {flowObservation.value.toLocaleString('fr-FR')}
                <span className="ml-2 text-lg font-medium">l/s</span>
              </p>

              <p className="mt-2 text-xs text-gray-400">
                Mesure du{' '}
                {new Date(flowObservation.observed_at).toLocaleString('fr-FR')}
              </p>
            </>
          ) : (
            <p className="mt-3 text-sm text-gray-400">
              Aucune mesure disponible
            </p>
          )}
        </div>

      </div>

      {/* Informations générales */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Informations générales
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">

          <div>
            <p className="text-sm text-gray-500">Code station</p>
            <p className="mt-1 font-medium text-gray-900">
              {station.code}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Cours d'eau</p>
            <p className="mt-1 font-medium text-gray-900">
              {station.river || 'Non renseigné'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Commune</p>
            <p className="mt-1 font-medium text-gray-900">
              {station.municipality || 'Non renseignée'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Code commune</p>
            <p className="mt-1 font-medium text-gray-900">
              {station.municipality_code || 'Non renseigné'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Latitude</p>
            <p className="mt-1 font-medium text-gray-900">
              {station.latitude ?? 'Non renseignée'}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Longitude</p>
            <p className="mt-1 font-medium text-gray-900">
              {station.longitude ?? 'Non renseignée'}
            </p>
          </div>

        </div>
      </div>

    </div>
  )
}

export default StationDetail
