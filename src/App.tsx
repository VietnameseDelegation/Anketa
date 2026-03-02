import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import PollApp from './components/PollApp'
import Admin from './components/Admin'
import './App.css'

function App() {
  return (
    <Router>
      <div className="main-wrapper">
        <Routes>
          <Route path="/" element={<PollApp />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
