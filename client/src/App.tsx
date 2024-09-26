
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Login from './Login/Login'
import Menu from './Menu/Menu'
import { io } from 'socket.io-client'
import Game from './Game/Game'
import Queue from './Queue/Queue'

export const socket = io('http://LucasVand-40774.portmap.host:40774')

function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<Login></Login>} />
        <Route path='/menu' element={<Menu></Menu>} />
        <Route path='/game' element={<Game></Game>} />
        <Route path='/queue' element={<Queue></Queue>} />
      </Routes>
    </>
  )

}

export default App
