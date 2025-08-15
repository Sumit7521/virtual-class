import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Game from "./pages/Game";
import AIClassroom from "./pages/AIClassroom";
import VirtualClassroom from "./pages/VirtualClassroom";
import Home from "../Pages/Home";
import Aiclassroom from "../Pages/Aiclassroom";
import Virtualclassroom from "../Pages/Virtualclassroom";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/ai-classroom" element={<Aiclassroom />} />
        <Route path="/virtual-classroom" element={<Virtualclassroom />} />
      </Routes>
    </Router>
  );
}
