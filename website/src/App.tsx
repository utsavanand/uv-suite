import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { UVIndex } from './pages/UVIndex'
import { UVActs } from './pages/UVActs'
import { UVGuard } from './pages/UVGuard'
import { Agents } from './pages/Agents'
import { Collaboration } from './pages/Collaboration'
import { Install } from './pages/Install'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="uv-index" element={<UVIndex />} />
          <Route path="uv-acts" element={<UVActs />} />
          <Route path="uv-guard" element={<UVGuard />} />
          <Route path="agents" element={<Agents />} />
          <Route path="collaboration" element={<Collaboration />} />
          <Route path="install" element={<Install />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
