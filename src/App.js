import React from 'react'
import './App.css';
import Home from './Home';
import TargetPage from './TargetPage';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path='/target-page' element={<TargetPage/>} />
        </Routes>
    </BrowserRouter>
  );
}

export default App;
