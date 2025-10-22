import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Manga from "./pages/Manga";
import Reader from "./pages/Reader"; // Importe o componente Reader
import "./styles/main.scss";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/manga/:id" element={<Manga />} />
          <Route path="/manga/:mangaId/chapter/:chapterId" element={<Reader />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}

export default App;