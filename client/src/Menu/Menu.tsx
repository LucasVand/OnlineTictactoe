
import { useEffect, useState } from 'react'
import './Menu.css'
import { Player } from '../SharedTypes'


import { useLocation, useNavigate } from 'react-router-dom';
import { socket } from '../App';


function Menu() {
    const navigator = useNavigate()
    const location = useLocation()
    const [playersOnline, setPlayersOnline] = useState(0)

    const [playerData, setPlayerData] = useState<Player>(new Player('', ''))
    useEffect(() => {

        socket.on('player_connected', (data) => {
            setPlayersOnline(data)
        })

        socket.on('player_disconnected', (data) => {
            setPlayersOnline(data)
        })

        socket.on('player_data', (data: Player) => {
            setPlayerData(data)
        })

        socket.on('room_found', () => {
            navigator('/queue', { state: { playerData: playerData } })
        })

    }, [socket, playersOnline, playerData])
    useEffect(() => {
        socket.emit("player_data_request", location.state.user)
    }, [])

    const getWinRate = () => {
        const winRate = Number.isNaN(playerData.wins / playerData.gamesPlayed) ? 0 : playerData.wins / playerData.gamesPlayed
        return winRate.toFixed(2) + '%'
    }

    const matchmake = () => {
        socket.emit("matchmake", playerData.name)
    }

    return (
        <>
            <div className='menuCont'>
                <div className='menuDescCont'>
                    <div className='menuIntroCont'>
                        <div className='menuTitle'>Online <br /> Tictactoe</div>
                        <div className='menuGreeting'>Whats Up {playerData.name}!!</div>
                        <div className='menuDesc'>This is an online tictactoe that was made with react, tpyescript, css, and socket.io.<br /> Press the matchmake button to find a match</div>
                        <button className='matchmakeButton' onClick={matchmake}>Find Game</button>
                    </div>
                </div>
                <div className='menuStatsCont'>
                    <div className='playersOnlineCounter'>  <span style={{ color: '#32CD32' }}>●</span> {playersOnline} Online Player(s)</div>

                    <Stats title='Win Rate' stat={getWinRate()} background='rgb(193,22,140)'></Stats>
                    <Stats title='Loses' stat={playerData.loses.toString()} background='rgb(163,32,120)'></Stats>
                    <Stats title='Wins' stat={playerData.wins.toString()} background='rgb(143,32,110)'></Stats>
                    <Stats title='Draws' stat={playerData.draws.toString()} background='rgb(123,25,100)'></Stats>
                    <Stats title='Games Played' stat={playerData.gamesPlayed.toString()} background='rgb(100,22,100)'></Stats>
                </div>
            </div>
        </>
    )
}
interface StatsProp {
    background: string
    title: string
    stat: string

}

function Stats(props: StatsProp) {

    return (
        <>
            <div className='statsCont' style={{ backgroundColor: props.background }}>
                <div className='statsTitle'>{props.title}</div>
                <div className='stat'>{props.stat}</div>
            </div>
        </>
    )
}

export default Menu