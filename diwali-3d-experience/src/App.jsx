import { Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import DiyaGarden from "./pages/DiyaGarden";
import RangoliPainter from "./pages/RangoliPainter";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/diya" element={<DiyaGarden />} />
      <Route path="/rangoli" element={<RangoliPainter />} />
    </Routes>
  );
}
