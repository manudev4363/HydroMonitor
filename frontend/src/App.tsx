import { BrowserRouter, Routes, Route } from 'react-router'
import Dashboard from './pages/Dashboard'
import Stations from './pages/Stations'
import StationDetail from './pages/StationDetail'
import MainLayout from './components/layout/MainLayout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/stations" element={<Stations />} />
          <Route
            path="/stations/:code"
            element={<StationDetail />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App