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

    const [queueStat, setQueueStat] = useState('waiting')

    useEffect(() => {
        socket.emit("player_data_request", playerData.name)
    }, [])


    useEffect(() => {
        socket.on('start_game', () => {
            navigator('/game', { state: { playerData: playerData } })
        })

        socket.on("player_data", (data: Player) => {
            setPlayerData(data)
            setDataGot(true)
            console.log(data.roomId)
            if (data.roomId != '') {
                socket.emit('room_data_request', data.roomId)
                socket.emit('is_room_full', data)
                console.log('checked if room ' + data.roomId + " is full")
            }

            console.log(data)
        })

        socket.on('room_data', (data: Room) => {
            setroomData(data)
            const myIndex = data.players[0].name == playerData.name ? 0 : 1
            setMyIndex(myIndex)
            console.log(roomData)

            if (data.players.length == 0) {
                navigator('/menu', { replace: true, state: { user: playerData.name } })
            }
        })



        socket.on('opponent_left', () => {
            setQueueStat("leaving")
            setTimeout(() => {
                navigator('/menu', { replace: true, state: { user: playerData.name } })
            }, 1000)
        })


        socket.on('leave_queue_response', (res: string) => {
            if (res == 'good') {
                socket.emit('leave_game', playerData)
                navigator('/menu', { replace: true, state: { user: playerData.name } })
            } else {
                setQueueStat("failed")
            }
        })


    }, [socket, playerData, dataGot, queueStat])

    const opponentName = () => {
        const oppIndex = myIndex == 0 ? 1 : 0
        if (roomData.players.length == 2) {
            return roomData.players[oppIndex].name
        } else {
            return '-'
        }
    }

    const queueMessage = () => {
        if (queueStat == 'waiting') {
            return 'Waiting For Opponent...'
        } else if (queueStat == 'leaving') {
            return "Opponet Left, Leaving Queue"
        } else if (queueStat == 'failed') {
            return "Unable To Leave Room"
        }
        return ''
    }
    const leaveQueue = () => {
        socket.emit('leave_queue_request', playerData)
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
                    <div className='queueTitle'>{queueMessage()}</div>
                    <div className='queueLoadingFront'> </div>
                    <div style={{ height: '1em' }}></div>
                    <button className='submitNameButton' onClick={leaveQueue}>Leave Queue</button>
                </div>
            </div>
        </>
    )
}

export default Queue