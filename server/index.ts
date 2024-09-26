import express from "express"

import { createServer } from "http"
import { Server, Socket } from "socket.io"

import cors from 'cors'

import { Player, Room } from '../client/src/SharedTypes'


const app = express()

app.use(cors)
const server = createServer(app)

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true

    }
})

//Server Variables
var playersOnline = 0

var players: Player[] = []

var rooms: Room[] = []

var nextRoomId = 10





io.on("connection", (socket) => {
    socket.on('player_registered', (name: string) => {

        if (findIfNameIsInDataBase(name) == -1) {
            registerPlayer(name, socket)
        }
        const index = findIfNameIsInDataBase(name)

        players[index].roomId = ''
        if (players[index].online) {
            io.to(socket.id).emit("successful_login", { condition: 'alreadyOnline', name: name })
        } else {
            login(index, socket)

            io.to(socket.id).emit("successful_login", { condition: 'success', name: name })
        }


    })
    socket.on('player_data_request', (data: string) => {
        const index = findIfNameIsInDataBase(data)
        if (index != -1) {
            if (!players[index].online) {
                login(index, socket)
            }
        } else {
            console.log("unable to find " + data + " in database")
        }
        io.to(socket.id).emit("player_data", players[index])

        io.emit('player_connected', playersOnline)
    })


    socket.on('matchmake', (playerName) => {
        var roomAvailableIndex: number = rooms.findIndex(room => room.available == true)
        const currentPlayer: Player | undefined = players.find(value => value.id == socket.id)
        if (roomAvailableIndex != -1 && rooms[roomAvailableIndex].players.length < 2) {

            socket.join(rooms[roomAvailableIndex].id)
            if (currentPlayer != undefined) {
                rooms[roomAvailableIndex].players.push(currentPlayer)
            }
        }
        else {

            const newRoom: Room = new Room(nextRoomId.toString())
            roomAvailableIndex = rooms.length
            nextRoomId++
            if (currentPlayer != undefined) {
                newRoom.players.push(currentPlayer)
            }

            rooms.push(newRoom)
            socket.join(newRoom.id)

            console.log(currentPlayer?.name + ' joined new room' + newRoom.id)
        }


        if (currentPlayer == undefined) {
            console.log("unable to find player")
        } else {
            console.log("tried to access " + roomAvailableIndex)
            currentPlayer.roomId = rooms[roomAvailableIndex].id
        }

        io.to(socket.id).emit('room_found', rooms[roomAvailableIndex].id)
    })

    socket.on('is_room_full', (player: Player) => {
        const roomIndex = rooms.findIndex(value => value.id == player.roomId)
        if (roomIndex != -1) {
            console.log(rooms[roomIndex])
            const playerIndex = rooms[roomIndex].players.findIndex(value => value.name == player.name)

            if (playerIndex != undefined) {

                rooms[roomIndex].ready[playerIndex] = true
                if (rooms[roomIndex].ready[0] == true && rooms[roomIndex].ready[1] == true) {

                    rooms[roomIndex].available = false

                    io.in(rooms[roomIndex].id).emit('start_game')

                }
            } else {
                console.log("the player that checked to see if full does not exist")
            }
        } else {
            console.log('unable to find room when seeing if it is full')
        }
    })


    socket.on('opponent_data_request', (playerName) => {
        const currentPlayer: Player = players[findIfNameIsInDataBase(playerName)]
        const room = rooms.find(value => value.id == currentPlayer.roomId)
        if (room != undefined && currentPlayer != undefined) {
            var opponent = room.players[0].name == playerName ? players[1] : players[0]
            io.to(socket.id).emit('opponent_data', opponent)
        } else {
            console.log("unable to find the room or other player in the opponent data request")
        }
    })

    socket.on('room_data_request', (roomId) => {
        const currentRoom = rooms.find(value => value.id == roomId)

        if (currentRoom != undefined) {
            const roomIndex = rooms.findIndex(value => currentRoom.id == value.id)
            io.to(socket.id).emit('room_data', currentRoom)
            if (!rooms[roomIndex].gameStarted && rooms[roomIndex].ready[0] == true && rooms[roomIndex].ready[1] == true) {
                console.log("weird thing happened dont know why its here")
                startRoom(currentRoom.id)
            }

        } else {
            console.log("requested room data for room: " + roomId + " :that doesnt exist")
        }
    })


    socket.on('move_played', (newGameData: Room) => {
        const indexRoom = rooms.findIndex(value => value.id == newGameData.id)
        if (indexRoom != -1) {
            rooms[indexRoom].board = newGameData.board
            rooms[indexRoom].turn = rooms[indexRoom].turn == 'x' ? 'o' : 'x'

            checkWin(indexRoom)

            io.in(rooms[indexRoom].id).emit('player_moved', rooms[indexRoom])
        }
    })

    socket.on('time_out', (lostPlayer: Player) => {
        const indexRoom = rooms.findIndex(value => value.id == lostPlayer.roomId)
        if (indexRoom != -1) {
            const lostIndex = rooms[indexRoom].players.findIndex(value => value.name == lostPlayer.name)
            const wonSymbol = rooms[indexRoom].playerAssignments[lostIndex == 0 ? 1 : 0]

            rooms[indexRoom].score[rooms[indexRoom].playerAssignments.findIndex(value => value == wonSymbol)] += 0.5

            io.in(rooms[indexRoom].id).emit('player_won', wonSymbol)
        } else {
            // console.log("tried to access as room: " + lostPlayer.roomId + " :that dosent exist when player timed out, indexRoom: " + indexRoom)
        }

    })

    socket.on('leave_game', (leftPlayer: Player) => {
        const indexRoom = rooms.findIndex(value => value.id == leftPlayer.roomId)
        const leaveIndex = rooms[indexRoom].players.findIndex(value => value.name == leftPlayer.name)
        if (indexRoom != -1) {

            io.in(rooms[indexRoom].id).emit('opponent_left')
            io.socketsLeave(rooms[indexRoom].id)
            rooms[indexRoom].players = []
            rooms[indexRoom].available = true
            rooms[indexRoom].score = [0, 0]
            resetRoom(indexRoom)
        } else {
            console.log("unable to leave room, no room found")
        }
    })

    socket.on('reset_room', (roomId: string) => {
        const indexRoom = rooms.findIndex(value => value.id == roomId)

        if (rooms[indexRoom].countDown < 2) {
            resetRoom(indexRoom)
        }
    })

    socket.on('disconnect', () => {
        if (findIfIDIsInDataBase(socket.id) != -1) {
            const index = findIfIDIsInDataBase(socket.id)
            players[index].online = false
            const roomIndex = rooms.findIndex(value => value.id == players[index].roomId)
            const playerIndex = rooms[roomIndex].players.findIndex(value => value.name == players[index].name)

            rooms[roomIndex].playerAssignments = rooms[roomIndex].playerAssignments.filter(value => value != rooms[roomIndex].playerAssignments[playerIndex])


            rooms[roomIndex].players = rooms[roomIndex].players.filter(value => value.name != players[playerIndex].name)
            socket.leave(rooms[roomIndex].id)

            playersOnline--
            io.emit("player_disconnected", playersOnline)

        }
    })

})


server.listen(3000, () => {
    console.log("This Server is Running on Port " + 3000)
})

const login = (index: number, socket: Socket) => {
    players[index].online = true
    players[index].id = socket.id
    socket.join(players[index].roomId)
    const roomIndex = rooms.findIndex(value => value.id == players[index].roomId)
    if (roomIndex != -1) {
        rooms[roomIndex].players.push(players[index])
        if (rooms[roomIndex].playerAssignments[0] == 'x') {
            rooms[roomIndex].playerAssignments.push('o')
        } else {
            rooms[roomIndex].playerAssignments.push('x')
        }
    }

    playersOnline++
}

const findIfNameIsInDataBase = (data: string) => {
    var temp = -1
    players.forEach((value, index) => {
        if (value.name == data) {
            temp = index
        }
    })

    return temp
}
const findIfIDIsInDataBase = (id: string) => {
    var temp = -1
    players.forEach((value, index) => {
        if (value.id == id) {
            temp = index
        }
    })

    return temp
}

const registerPlayer = (user: string, socket: Socket) => {
    var temp: Player = new Player(user, socket.id)
    players.push(temp)
}

const startRoom = (roomId: string) => {
    const roomIndex = rooms.findIndex(value => value.id == roomId)
    rooms[roomIndex].gameStarted = true
    countDownSetTimeOut(roomIndex)

}

const countDownSetTimeOut = (roomIndex: number) => {

    io.in(rooms[roomIndex].id).emit('count_down', rooms[roomIndex].countDown)

    rooms[roomIndex].countDown--
    if (rooms[roomIndex].countDown >= 0) {
        setTimeout(() => { countDownSetTimeOut(roomIndex) }, 1000)
    }
}

const checkWin = (roomIndex: number) => {
    const mappedArr = rooms[roomIndex].board.map(value => value == 'x' ? 1 : value == 'o' ? 5 : 0)
    var flag = ' '

    for (let i = 0; i < 3; i++) {
        var tallyH = 0
        var tallyV = 0
        for (let j = 0; j < 3; j++) {
            tallyH += mappedArr[i * 3 + j]
            tallyV += mappedArr[j * 3 + i]
        }
        if (tallyH == 3 || tallyV == 3) {
            flag = 'x'
        }
        if (tallyH == 15 || tallyV == 15) {
            flag = 'o'
        }

    }
    const dig1 = mappedArr[0] + mappedArr[4] + mappedArr[8]
    const dig2 = mappedArr[2] + mappedArr[4] + mappedArr[6]
    if (dig1 == 3 || dig2 == 3) {
        flag = 'x'
    }
    if (dig1 == 15 || dig2 == 15) {
        flag = 'o'
    }


    if (flag != ' ') {
        rooms[roomIndex].score[rooms[roomIndex].playerAssignments.findIndex(value => value == flag)]++
        io.in(rooms[roomIndex].id).emit('player_won', flag)

    }
}

const resetRoom = (roomIndex: number) => {
    rooms[roomIndex].gameStarted = false
    rooms[roomIndex].playerAssignments = Math.random() > 0.5 ? ['x', 'o'].reverse() : ['x', 'o']
    rooms[roomIndex].board = [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ']
    rooms[roomIndex].ready = [false, false]
    rooms[roomIndex].turn = 'x'
    rooms[roomIndex].countDown = 5
    rooms[roomIndex].playerAssignments = [rooms[roomIndex].playerAssignments[1], rooms[roomIndex].playerAssignments[0]]
}