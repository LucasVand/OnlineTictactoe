
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Login from './Login/Login'
import Menu from './Menu/Menu'
import { io } from 'socket.io-client'
import Game from './Game/Game'
import Queue from './Queue/Queue'

export const socket = io('http://172.30.236.150:5005')
//http://LucasVand-40774.portmap.host:40774/
//http://3.145.104.154:3000
//https://ec2-3-145-104-154.us-east-2.compute.amazonaws.com:3000
//http://172.30.235.88:5005
//https://19c9-129-100-205-229.ngrok-free.app

function App() {
  return (
    <>
      <div style={{ position: 'absolute' }}> v0.18</div>

      <Routes >

        <Route path='/OnlineTTT' element={<Login></Login>} />
        <Route path='/queue' element={<Queue></Queue>} />
        <Route path='/menu' element={<Menu></Menu>} />
        <Route path='/game' element={<Game></Game>} />

      </Routes>

    </>
  )

}

export default App
