// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Pages
import Home from './Pages/Home';
import Virtualclassroom from './Pages/Virtualclassroom';
import About from './Pages/About';
import Contact from './Pages/Contact';
import Dashboard from './Pages/Dashboard';
import Aiclassroom from './Pages/Aiclassroom';
import Admin from './Pages/Admin';
import Approuter from './Routes/Approuter';


const App = () => {
  return (
    <div className='h-screen w-screen'>
      <Approuter />
    </div>
  );
};

export default App;
