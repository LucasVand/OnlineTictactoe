import './Game.css'
import O from '../assets/OLogo.png'
import X from '../assets/XLogo.png'
import Redo from '../assets/Redo.png'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { Player, Room } from '../SharedTypes'
import { socket } from '../App'


function Game() {
    const navigator = useNavigate()
    const location = useLocation()
    const [myTurn, setMyTurn] = useState(true)
    const [started, setStarted] = useState(false)
    const [oppTimeLeft, setOppTimeLeft] = useState(15.0)
    const [myTimeLeft, setMyTimeLeft] = useState(15.0)
    const [countDown, setCountDown] = useState(0)
    const [mySymbol, setMySymbol] = useState('')
    const [myIndex, setMyIndex] = useState(0)
    const [won, setWon] = useState(' ')
    const [opponentLeft, setOpponentLeft] = useState(false)


    const [playerData, setPlayerData] = useState<Player>(location.state.playerData)
    const [opponentData, setOpponentData] = useState<Player>(new Player('', ''))
    const [roomData, setroomData] = useState<Room>(new Room(''))

    var oldTime = Date.now()

    useEffect(() => {
        console.clear()
        socket.emit("player_data_request", playerData.name)
        socket.emit('opponent_data_request', playerData.roomId)
        socket.emit('room_data_request', playerData.roomId)



    }, [])

    useEffect(() => {
        const timeoutId = setInterval(() => {
            if (started && won == ' ') {
                const timeBetween = Number(((Date.now() - oldTime) / 1000).toFixed(1))
                oldTime = Date.now()
                console.log(timeBetween)

                if (myTurn) {
                    setMyTimeLeft(myTimeLeft - timeBetween)
                } else {
                    setOppTimeLeft(oppTimeLeft - timeBetween)
                }

                if (myTimeLeft < 0) {
                    socket.emit('time_out', playerData)
                }

            }
        }, 100)
        return () => clearTimeout(timeoutId);
    }, [myTimeLeft, oppTimeLeft, started, myTurn]);

    useEffect(() => {
        socket.on('player_data', (data) => {
            setPlayerData(data)
            console.log(playerData)
        })

        socket.on('room_data', (data: Room) => {
            setroomData(data)
            const myIndex = data.players[0].name == playerData.name ? 0 : 1
            setMyIndex(myIndex)
            const symbol = data.playerAssignments[myIndex]
            setMySymbol(symbol)
            setMyTurn(symbol == data.turn ? true : false)

            setOpponentData(data.players[myIndex == 1 ? 0 : 1])

            if (data.countDown < 1) {
                setStarted(true)
                oldTime = Date.now()
            }


        })
        socket.on('count_down', (data: number) => {
            setCountDown(data)

            if (data == 0) {
                setStarted(true)
                oldTime = Date.now()
            }
        })

        socket.on("player_moved", (data: Room) => {
            setMyTurn(mySymbol == data.turn ? true : false)
            setroomData(data)
        })

        socket.on('player_won', (data: string) => {
            setWon(data)

        })

        socket.on('opponent_left', () => {
            setOpponentLeft(true)
        })



    }, [socket, playerData, opponentData, countDown, roomData, mySymbol, myTurn, myIndex, won, oppTimeLeft, myTimeLeft])


    const tileClick = (index: number) => {
        const newData = roomData

        if (newData.board[index] == ' ' && myTurn && won == ' ') {
            console.log('valid Move')
            newData.board[index] = mySymbol
            socket.emit('move_played', newData)
        }

    }
    const playAgain = () => {
        if (!opponentLeft) {
            socket.emit('reset_room', roomData.id)
            navigator('/queue', { state: { playerData: playerData } })

        }
    }

    const leaveGame = () => {
        socket.emit('leave_game', playerData)
        navigator('/menu', { state: { user: playerData.name } })
    }

    const gameTiles = roomData.board.map((value: string, index: number) => {
        return <GameTile img={value} key={`${index} Tile`} onClickFunc={() => { tileClick(index) }} index={index}></GameTile>
    })
    return (
        <>
            <div style={{ position: 'relative', width: '100vw', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className='gameCont' style={{ pointerEvents: `${started || !won ? 'all' : 'none'}` }}>
                    <div className='topCont'>

                        <div className='score'>{roomData.score[myIndex]}</div>
                        <GameStats mySymbol={mySymbol} name={playerData.name} player={mySymbol} timeRemaining={myTimeLeft > 0 ? myTimeLeft.toFixed(1) : '0.0'} dir='left' ></GameStats>
                        <div style={{ width: '4em' }}></div>
                        <GameStats mySymbol={(mySymbol == 'o' ? 'x' : 'o')} name={opponentData.name} player={mySymbol == 'x' ? 'o' : 'x'} timeRemaining={oppTimeLeft > 0 ? oppTimeLeft.toFixed(1) : '0.0'} dir='right'></GameStats>
                        <div className='score'>{roomData.score[myIndex == 0 ? 1 : 0]}</div>

                    </div>


                    <div className='boardCont'>
                        {gameTiles}
                    </div>
                </div >
                <div className={`${!started ? 'gameStartOverlay' : ''}`}>
                    <div className={`${!started ? 'gameStartTimer' : ''}`}>{!started ? countDown : ''}</div>
                </div>
                <div className={`${won != ' ' ? 'gameWonCont' : 'die'}`}>
                    <div className={`${won != ' ' ? 'wonText' : ''}`}>{won == mySymbol ? 'You Won!' : won == 'n' ? 'Tie' : "You lost"} </div>
                    <div className='opponentLeftText'>{opponentLeft ? "Other Player Left Please Return To Menu" : ''} </div>
                    <button className={`${won != ' ' ? 'leaveButton' : ''}`} onClick={leaveGame} >
                        <img src={X} className='playAgainImg' style={{ width: '1.2em' }}></img>
                    </button>
                    <button className={`${won != ' ' ? 'playAgainButton' : ''}`} style={{ opacity: `${opponentLeft ? '0.5' : '1'}` }} onClick={playAgain}>
                        <img src={Redo} className='playAgainImg'></img>
                    </button>
                </div >
            </div >
        </>
    )
}
export interface GameStatsProps {
    name: string
    player: string
    timeRemaining: string
    dir: string
    mySymbol: string
}

export function GameStats(props: GameStatsProps) {
    const first = () => {
        if (props.dir == 'left') {
            return <img className='gameSymbol' style={{ marginRight: '1em' }} src={props.mySymbol == 'o' ? O : X} />
        } else {
            return <div className='timeLeft' >{props.timeRemaining}</div>
        }
    }
    const second = () => {
        if (props.dir == 'right') {
            return <img className='gameSymbol' style={{ marginLeft: '1em' }} src={props.mySymbol == 'o' ? O : X} />
        } else {
            return <div className='timeLeft'>{props.timeRemaining}</div>
        }
    }
    return (
        <>
            <div className='gameStatsCont' style={{ alignItems: (props.dir == 'right' ? 'flex-end' : 'left') }}>
                <div className='timeSymbolCont'>
                    {first()}
                    {second()}
                </div>

                <GameProgressBar progress={Number(props.timeRemaining) / 15} orientation={props.dir == "left" ? 'left' : 'right'}></GameProgressBar>
                <div className='gameName'>{props.name}</div>
            </div>
        </>
    )
}

function GameProgressBar(props: { progress: number, orientation: string }) {

    return (
        <>
            <div className='progressBarCont'>
                <div className='progressBG'></div>
                <div className='progressFront' style={{ width: `${props.progress * 100}%`, left: `${props.orientation == 'right' ? (1 - props.progress) * 100 : 0}%` }}></div>
            </div >
        </>
    )
}

function GameTile({ img, onClickFunc = () => { }, index }: { img: string, onClickFunc: Function, index: number }) {
    const symbol = () => {
        if (img.toLowerCase() == 'o') {
            return <img src={O} className='tileImg' key={index + 'O tile'}></img>
        } else if (img.toLowerCase() == 'x') {
            return <img src={X} className='tileImg' key={index + 'X tile'}></img>
        } else {
            return <img src={''} className='tileImg' key={index + 'Null tile'}></img>
        }
    }
    return (
        <>
            <div className='tileCont' onClick={() => { onClickFunc() }}>
                {symbol()}
            </div>
        </>
    )
}


export default Game

