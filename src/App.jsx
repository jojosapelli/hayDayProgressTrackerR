import { HashRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";

// Páginas
import Home from "./pages/Home";
import ProductionBuildings from "./pages/ProductionBuildings";
import Products from "./pages/Products";
import Animals from "./pages/Animals";
import AnimalHomes from "./pages/AnimalHomes";
import Crops from "./pages/Crops";
import Expansion from "./pages/Expansion";
import FishingArea from "./pages/FishingArea";
import Town from "./pages/Town";
import Achievements from "./pages/Achievements";        // ojo a la ortografía del archivo
import TreesAndBushes from "./pages/TreesAndBushes";     // el nombre del archivo tiene &

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="production" element={<ProductionBuildings />} />
          <Route path="products" element={<Products />} />
          <Route path="animals" element={<Animals />} />
          <Route path="animal-homes" element={<AnimalHomes />} />
          <Route path="crops" element={<Crops />} />
          <Route path="expansion" element={<Expansion />} />
          <Route path="fishing-area" element={<FishingArea />} />
          <Route path="town" element={<Town />} />
          <Route path="achievements" element={<Achievements />} />
          <Route path="trees-bushes" element={<TreesAndBushes />} />

          {/* fallback 404 simple */}
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
