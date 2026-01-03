import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import OwnerProfile from './pages/OwnerProfile'
import BookingsStatus from './pages/BookingsStatus'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />
        <Routes>
          <Route path="/" element={<OwnerProfile />} />
          <Route path="/bookings" element={<BookingsStatus />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
