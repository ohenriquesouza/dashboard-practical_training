import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Proprietario from './pages/Proprietario'
import Geral from './pages/Geral'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/"                      element={<Home />} />
        <Route path="/proprietario/:id"      element={<Proprietario />} />
        {/* <Route path="/geral"                 element={<Geral />} /> */}
      </Routes>
    </BrowserRouter>
  </StrictMode>
)