import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import VirtualClassroom from "../Pages/Virtualclassroom";
import Home from "../Pages/Home";
import Aiclassroom from "../Pages/Aiclassroom";
import Virtualclassroom from "../Pages/Virtualclassroom";
import About from "../Pages/About";
import Contact from "../Pages/Contact";
import Dashboard from "../Pages/Dashboard";
import Admin from "../Pages/Admin";

export default function Approuter() {
  return (
    <Router>
      <div className="h-screen w-screen">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/virtual-classroom" element={<Virtualclassroom />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/ai-classroom" element={<Aiclassroom />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  );
}
