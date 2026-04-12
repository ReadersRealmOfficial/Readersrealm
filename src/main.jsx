import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import Landing from './pages/Landing.jsx'
import BookApp from './pages/BookApp.jsx'
import Campfire from './pages/Campfire.jsx'
import Admin from './pages/Admin.jsx'
import Welcome from './pages/Welcome.jsx'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<BookApp />} />
          <Route path="/campfire" element={<Campfire />} />
          <Route path="/adminaccess" element={<Admin />} />
          <Route path="/welcome" element={<Welcome />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
