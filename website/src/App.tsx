import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Watchtower } from "./pages/Watchtower";
import { Skills } from "./pages/Skills";
import { Personas } from "./pages/Personas";
import { Agents } from "./pages/Agents";
import { Install } from "./pages/Install";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="watchtower" element={<Watchtower />} />
          <Route path="skills" element={<Skills />} />
          <Route path="personas" element={<Personas />} />
          <Route path="agents" element={<Agents />} />
          <Route path="install" element={<Install />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
