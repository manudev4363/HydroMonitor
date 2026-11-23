
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { getStations } from '../services/stationService'
import type { Station } from '../services/stationService'

function Stations() {
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Récupération des stations
  useEffect(() => {
    async function loadStations() {
      try {
        setLoading(true)
        const data = await getStations()
        setStations(data)
      } catch (err) {
        console.error(err)
        setError('Impossible de récupérer les stations.')
      } finally {
        setLoading(false)
      }
    }

    loadStations()
  }, [])

  // Normalisation pour ignorer les accents et la casse
  function normalize(value: string | null | undefined) {
    return (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  }

  // Filtrage des stations
  const filteredStations = useMemo(() => {
    const searchValue = normalize(search.trim())

    return stations.filter((station) => {
      const matchesSearch =
        !searchValue ||
        [
          station.code,
          station.name,
          station.river,
          station.municipality,
        ].some((value) => normalize(value).includes(searchValue))

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && station.is_active) ||
        (statusFilter === 'inactive' && !station.is_active)

      return matchesSearch && matchesStatus
    })
  }, [stations, search, statusFilter])

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredStations.length / pageSize)
  )

  const currentPage = Math.min(page, totalPages)

  const paginatedStations = useMemo(() => {
    const start = (currentPage - 1) * pageSize

    return filteredStations.slice(start, start + pageSize)
  }, [filteredStations, currentPage, pageSize])

  const startIndex =
    filteredStations.length === 0
      ? 0
      : (currentPage - 1) * pageSize + 1

  const endIndex = Math.min(
    currentPage * pageSize,
    filteredStations.length
  )

  const activeCount = stations.filter(
    (station) => station.is_active
  ).length

  // Réinitialisation des filtres
  function resetFilters() {
    setSearch('')
    setStatusFilter('all')
    setPage(1)
  }

  return (
    <div className="space-y-6">

      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Stations hydrométriques
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Consultez et recherchez les stations hydrométriques.
        </p>
      </div>

      {/* Chargement */}
      {loading && (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          Chargement des stations...
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Indicateurs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Total des stations
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {stations.length}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Stations actives
              </p>
              <p className="mt-2 text-2xl font-bold text-green-600">
                {activeCount}
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Résultats affichés
              </p>
              <p className="mt-2 text-2xl font-bold text-blue-600">
                {filteredStations.length}
              </p>
            </div>

          </div>

          {/* Tableau */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">

            {/* Barre de recherche et filtres */}
            <div className="flex flex-col gap-4 border-b border-gray-200 p-5 lg:flex-row lg:items-center lg:justify-between">

              <div>
                <h2 className="font-semibold text-gray-900">
                  Liste des stations
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  {filteredStations.length} résultat(s)
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">

                {/* Recherche */}
                <input
                  type="text"
                  placeholder="Rechercher une station..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-72"
                />

                {/* Filtre statut */}
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(1)
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-blue-500"
                >
                  <option value="all">Toutes les stations</option>
                  <option value="active">Stations actives</option>
                  <option value="inactive">Stations inactives</option>
                </select>

                {/* Réinitialisation */}
                <button
                  onClick={resetFilters}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 transition hover:bg-gray-50"
                >
                  Réinitialiser
                </button>

              </div>
            </div>

            {/* Tableau des stations */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">

                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Code</th>
                    <th className="px-6 py-4 font-semibold">Station</th>
                    <th className="px-6 py-4 font-semibold">Cours d'eau</th>
                    <th className="px-6 py-4 font-semibold">Commune</th>
                    <th className="px-6 py-4 font-semibold">Statut</th>
                    <th className="px-6 py-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">

                  {paginatedStations.map((station) => (
                    <tr
                      key={station.code}
                      className="transition-colors hover:bg-blue-50/50"
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-xs text-gray-500">
                        {station.code}
                      </td>

                      <td className="min-w-64 px-6 py-4 font-medium text-gray-900">
                        {station.name}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                        {station.river || '—'}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                        {station.municipality || '—'}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4">
                        {station.is_active ? (
                          <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <Link
                          to={`/stations/${station.code}`}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          Consulter →
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {paginatedStations.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-10 text-center text-gray-500"
                      >
                        Aucune station ne correspond à votre recherche.
                      </td>
                    </tr>
                  )}

                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col gap-4 border-t border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Afficher</span>

                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value))
                    setPage(1)
                  }}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 outline-none focus:border-blue-500"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>

                <span>par page</span>
              </div>

              <div className="text-sm text-gray-500">
                {startIndex}–{endIndex} sur {filteredStations.length}
              </div>

              <div className="flex items-center gap-2">

                <button
                  onClick={() => setPage(1)}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  «
                </button>

                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Précédent
                </button>

                <span className="px-2 text-sm text-gray-700">
                  {currentPage} / {totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Suivant
                </button>

                <button
                  onClick={() => setPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  »
                </button>

              </div>
            </div>

          </div>
        </>
      )}
    </div>
  )
}

export default Stations
