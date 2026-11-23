import { NavLink } from 'react-router'

function Sidebar() {
  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-2xl font-bold mb-10">
        HydroMonitor
      </h1>

      <nav className="flex flex-col gap-3">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `p-3 rounded-lg ${
              isActive ? 'bg-blue-600' : 'hover:bg-slate-700'
            }`
          }
        >
          Tableau de bord
        </NavLink>

        <NavLink
          to="/stations"
          className={({ isActive }) =>
            `p-3 rounded-lg ${
              isActive ? 'bg-blue-600' : 'hover:bg-slate-700'
            }`
          }
        >
          Stations
        </NavLink>
      </nav>
    </aside>
  )
}

export default Sidebar