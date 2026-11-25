
import ObservationChart from "../components/observations/ObservationChart"

function Observation() {
  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Observations hydrométriques
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Consultez et analysez l'évolution des hauteurs d'eau et des débits.
        </p>
      </div>

      <ObservationChart />

    </div>
  )
}

export default Observation
