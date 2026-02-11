import { Routes, Route } from 'react-router-dom'
import './App.css'
import Login from './page/login'
import Register from './page/register'
import Home from './page/home'
import Admin from './page/admin'
import Orders from './page/order'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<Home />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/orders" element={<Orders />} />
    </Routes>
  )
}

export default App
