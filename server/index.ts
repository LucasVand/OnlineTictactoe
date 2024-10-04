import express from "express"

import { createServer } from "http"
import { Server, Socket } from "socket.io"

import cors from 'cors'
import readline from 'readline/promises'

import { Player, Room } from './SharedTypes'
import { findIfIDIsInDataBase, findIfNameIsInDataBase, findPlayerIndexInRoom, findRoomIndexFromPlayer } from "./Helper"

import { readData, writeData } from "./FileIO"



const app: any = express()

app.use(cors)
const server = createServer(app)
const PORT = 5005

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true

    }
})
//Server Variables
export var playersOnline = 0

export var players: Player[] = []
players = readData()
players.forEach((value) => {
    value.roomId = ''
})


export var rooms: Room[] = []

var nextRoomId = 10

export var errorsArr: String[] = []

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function createInputPromise() {
    const userInputPromise = rl.question("")

    userInputPromise.then((answer: string) => {

        if (answer == 'c') {
            console.clear()
        }
        if (answer == 'p') {
            console.table(players)
        }
        if (answer == 'r') {
            console.table(rooms, ['id', 'players', 'available', 'turn', 'gameStarted', 'ready'])

        }
        if (answer == 'clear') {
            players = []
            writeData(players)
            console.log("Player Data Cleared")
        }



        createInputPromise()

    })
}

createInputPromise()
//setInterval(consoleDashBoard, 1000)
function consoleDashBoard() {

    console.clear()
    console.log(" Server is Active on port: " + PORT)
    console.log("-----------------------------")
    console.log("Users Connected: " + playersOnline)
    console.log("Room Count: " + rooms.length)
    console.log("-----------------------------")
    rooms.forEach((room) => {
        console.log("   Room Id: " + room.id)
        console.log("   Room Avaliable: " + room.available)
        console.log("   Players Connected: " + room.players.length)
        console.log("   Room Started: " + room.gameStarted)
        console.log("   Room Is Full: " + room.isRoomFull())
        console.log("   Players Ready: " + room.ready)
        console.log("   -----------------------------")
    })
    console.log("-----------------------------")
    console.log("Next Room Index: " + nextRoomId)
    console.log("Players in register: " + players.length)
    console.log("-----------------------------")
    console.table(players)
    console.log("-----------------------------")
    console.log("Error count: " + errorsArr.length)

    // errorsArr.forEach(value => console.log("Error 1: " + value))
}

io.on("connection", (socket) => {

    //called when player attempts to login from the login screen
    socket.on('player_registered', (name: string) => {

        //if the player is not in the data base then we add them to it
        if (findIfNameIsInDataBase(name) == -1) {
            registerPlayer(name, socket)
        }
        //this is the index of the player just logged-in/registered
        const index = findIfNameIsInDataBase(name)


        if (players[index].online) {
            //this send the client that the player they tried to login is already logged in
            io.to(socket.id).emit("successful_login", { condition: 'alreadyOnline', name: name })
        } else {
            players[index].login(socket)
            playersOnline++
            //send the client that they successfully logged in and to redirect to menu page
            io.to(socket.id).emit("successful_login", { condition: 'success', name: name })
        }

    })
    //every file requests this when it is rendered so it acts as a way to see when a player has reconnected
    socket.on('player_data_request', (data: string) => {
        const index = findIfNameIsInDataBase(data)
        if (index != -1) {
            if (!players[index].online) {
                players[index].login(socket)
                playersOnline++
                writeData(players)
            }
        } else {
            errorsArr.push("unable to find " + data + " in database")

        }
        // errorsArr.push(players[index].sendable().roomId)

        io.to(socket.id).emit("player_data", players[index])

        io.emit('player_connected', playersOnline)
    })


    socket.on('matchmake', (playerName) => {
        var roomAvailableIndex: number = rooms.findIndex(room => room.available == true)

        if (roomAvailableIndex == -1) {
            const newRoom: Room = new Room(nextRoomId.toString())
            roomAvailableIndex = rooms.length
            nextRoomId++
            rooms.push(newRoom)
        }
        const currentPlayerIndex: number = findIfNameIsInDataBase(playerName)

        rooms[roomAvailableIndex].addPlayer(players[currentPlayerIndex])
        // console.log(currentPlayer.name + "'s Room id was set to " + rooms[roomAvailableIndex].id)
        players[currentPlayerIndex].setRoomId(rooms[roomAvailableIndex].id)
        socket.join(rooms[roomAvailableIndex].id)

        io.to(socket.id).emit('room_found', rooms[roomAvailableIndex].id)
    })

    socket.on('is_room_full', (player: Player) => {

        const roomIndex = findRoomIndexFromPlayer(player)

        if (roomIndex != -1) {
            const playerIndex = findPlayerIndexInRoom(rooms[roomIndex], player.name)

            if (playerIndex != -1) {


                rooms[roomIndex].setPlayerReady(players[findIfNameIsInDataBase(player.name)])


                if (rooms[roomIndex].isRoomFull()) {

                    rooms[roomIndex].closeRoom()

                    io.in(rooms[roomIndex].id).emit('start_game')
                } else {

                }
            } else {
                errorsArr.push("the player that checked to see if full does not exist")
            }
        } else {
            errorsArr.push('unable to find room when seeing if it is full, player: ' + player.name)
        }
    })


    socket.on('room_data_request', (roomId) => {
        const roomIndex = rooms.findIndex(value => value.id == roomId)

        if (roomIndex != -1) {

            io.to(socket.id).emit('room_data', rooms[roomIndex])
            if (!rooms[roomIndex].gameStarted && rooms[roomIndex].isRoomFull()) {
                errorsArr.push("weird thing happened dont know why its here")
                rooms[roomIndex].startRoom(roomIndex)
            }

        } else {
            errorsArr.push("requested room data for room: " + roomId + " :that doesnt exist")
        }
    })


    socket.on('move_played', (newGameData: Room) => {
        const indexRoom = rooms.findIndex(value => value.id == newGameData.id)
        if (indexRoom != -1) {
            rooms[indexRoom].playerMove(newGameData)
            const winner = rooms[indexRoom].checkWin()
            if (winner != ' ') {
                writeData(players)
                io.in(rooms[indexRoom].id).emit('player_won', winner)
            }

            io.in(rooms[indexRoom].id).emit('player_moved', rooms[indexRoom])
        }
    })

    socket.on('time_out', (lostPlayer: Player) => {
        const indexRoom = rooms.findIndex(value => value.id == lostPlayer.roomId)
        if (indexRoom != -1) {
            const lostIndex = rooms[indexRoom].players.findIndex(value => value.name == lostPlayer.name)
            const wonSymbol = rooms[indexRoom].playerAssignments[lostIndex == 0 ? 1 : 0]


            rooms[indexRoom].playerTimeOut(lostPlayer)

            io.in(rooms[indexRoom].id).emit('player_won', wonSymbol)
        } else {
            // console.log("tried to access as room: " + lostPlayer.roomId + " :that dosent exist when player timed out, indexRoom: " + indexRoom)
        }

    })

    socket.on('leave_game', (leftPlayer: Player) => {
        const indexRoom = rooms.findIndex(value => value.id == leftPlayer.roomId)

        if (indexRoom != -1) {
            const leaveIndex = rooms[indexRoom].players.findIndex(value => value.name == leftPlayer.name)
            io.in(rooms[indexRoom].id).emit('opponent_left')

            rooms = rooms.filter(value => value.id != rooms[indexRoom].id)

        } else {
            errorsArr.push("unable to leave room, no room found")
        }
    })

    socket.on("leave_queue_request", (player: Player) => {
        const roomIndex = findRoomIndexFromPlayer(player)

        if (roomIndex != -1) {
            rooms[roomIndex].playerDisconnect(player)
            players[findIfNameIsInDataBase(player.name)].resetRoomId()
            io.to(socket.id).emit("leave_queue_response", "good")
        } else {
            io.to(socket.id).emit("leave_queue_response", "error")
            errorsArr.push("Unable to leave queue becasue it cannont find the room")
        }
    })

    socket.on('reset_room', (roomId: string) => {
        const indexRoom = rooms.findIndex(value => value.id == roomId)

        if (rooms[indexRoom].countDown < 2) {
            rooms[indexRoom].resetRoom()
        }
    })

    socket.on('disconnect', () => {
        if (findIfIDIsInDataBase(socket.id) != -1) {
            const index = findIfIDIsInDataBase(socket.id)
            players[index].disconnect()
            const roomIndex = rooms.findIndex(value => value.id == players[index].roomId)
            if (roomIndex != -1) {

                rooms[roomIndex].playerDisconnect(players[index])
                io.to(rooms[roomIndex].id).emit("opponent_left")
                socket.leave(rooms[roomIndex].id)
            }
            playersOnline--
            io.emit("player_disconnected", playersOnline)
            writeData(players)

        }
    })

})


server.listen(PORT, () => {
    console.log("This Server is Running on Port " + PORT)

})

export const countDownSetTimeOut = (roomIndex: number) => {

    io.in(rooms[roomIndex].id).emit('count_down', rooms[roomIndex].countDown)

    rooms[roomIndex].countDown--
    if (rooms[roomIndex].countDown >= 0) {
        setTimeout(() => { countDownSetTimeOut(roomIndex) }, 1000)
    }
}

//adds player to database
function registerPlayer(user: string, socket: Socket) {
    var temp: Player = new Player(user, socket.id)
    players.push(temp)
    writeData(players)
}

//logs the player in
