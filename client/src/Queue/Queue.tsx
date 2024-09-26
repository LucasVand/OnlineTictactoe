import { useLocation, useNavigate } from 'react-router-dom'
import { GameStats } from '../Game/Game'
import './Queue.css'
import { Player, Room } from '../SharedTypes'
import { useEffect, useState } from 'react'
import { socket } from '../App'
function Queue() {
    const location = useLocation()
    const navigator = useNavigate()
    const [playerData, setPlayerData] = useState<Player>(location.state.playerData)
    const [dataGot, setDataGot] = useState(false)

    const [roomData, setroomData] = useState<Room>(new Room(''))
    const [myIndex, setMyIndex] = useState(0)

    useEffect(() => {
        socket.emit("player_data_request", playerData.name)
        if (playerData.roomId != '') {
            socket.emit('room_data_request', playerData.roomId)
        }
    }, [])


    useEffect(() => {
        socket.on('start_game', () => {
            navigator('/game', { state: { playerData: playerData } })
        })

        socket.on("player_data", (data) => {
            setPlayerData(data)
            setDataGot(true)
            if (playerData.roomId != '') {
                socket.emit('is_room_full', playerData)
                console.log('checked if room ' + playerData.roomId + " is full")
            }
            console.log(playerData)
        })

        socket.on('room_data', (data: Room) => {
            setroomData(data)
            const myIndex = data.players[0].name == playerData.name ? 0 : 1
            setMyIndex(myIndex)
            console.log(roomData)
        })


    }, [socket, playerData, dataGot])

    const opponentName = () => {
        const oppIndex = myIndex == 0 ? 1 : 0
        if (roomData.players.length == 2) {
            return roomData.players[oppIndex].name
        } else {
            return '-'
        }
    }


    return (
        <>
            <div className='wholeScreenQueue'>
                <div className='queueTopCont'>
                    <div className='topCont'>

                        <div className='score'>{roomData.score[myIndex]}</div>
                        <GameStats mySymbol='x' name={playerData.name} player='O' timeRemaining={(15.0).toString()} dir='left'></GameStats>
                        <div style={{ width: '4em' }}></div>
                        <GameStats mySymbol='o' name={opponentName()} player='X' timeRemaining={(15.0).toString()} dir='right'></GameStats>
                        <div className='score'>{roomData.score[myIndex == 0 ? 1 : 0]}</div>

                    </div>
                </div>
                <div className='queueCont'>
                    <div className='queueTitle'>Waiting For Opponent...</div>
                    <div className='queueLoadingFront'> </div>
                </div>
            </div>
        </>
    )
}

export default Queue