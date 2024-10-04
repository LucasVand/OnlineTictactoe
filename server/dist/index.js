"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.countDownSetTimeOut = exports.errorsArr = exports.rooms = exports.players = exports.playersOnline = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const promises_1 = __importDefault(require("readline/promises"));
const SharedTypes_1 = require("./SharedTypes");
const Helper_1 = require("./Helper");
const FileIO_1 = require("./FileIO");
const app = (0, express_1.default)();
app.use(cors_1.default);
const server = (0, http_1.createServer)(app);
const PORT = 5005;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        credentials: true
    }
});
//Server Variables
exports.playersOnline = 0;
exports.players = [];
exports.players = (0, FileIO_1.readData)();
exports.players.forEach((value) => {
    value.roomId = '';
});
exports.rooms = [];
var nextRoomId = 10;
exports.errorsArr = [];
const rl = promises_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
function createInputPromise() {
    const userInputPromise = rl.question("");
    userInputPromise.then((answer) => {
        if (answer == 'c') {
            console.clear();
        }
        if (answer == 'p') {
            console.table(exports.players);
        }
        if (answer == 'r') {
            console.table(exports.rooms, ['id', 'players', 'available', 'turn', 'gameStarted', 'ready']);
        }
        if (answer == 'clear') {
            exports.players = [];
            (0, FileIO_1.writeData)(exports.players);
            console.log("Player Data Cleared");
        }
        createInputPromise();
    });
}
createInputPromise();
//setInterval(consoleDashBoard, 1000)
function consoleDashBoard() {
    console.clear();
    console.log(" Server is Active on port: " + PORT);
    console.log("-----------------------------");
    console.log("Users Connected: " + exports.playersOnline);
    console.log("Room Count: " + exports.rooms.length);
    console.log("-----------------------------");
    exports.rooms.forEach((room) => {
        console.log("   Room Id: " + room.id);
        console.log("   Room Avaliable: " + room.available);
        console.log("   Players Connected: " + room.players.length);
        console.log("   Room Started: " + room.gameStarted);
        console.log("   Room Is Full: " + room.isRoomFull());
        console.log("   Players Ready: " + room.ready);
        console.log("   -----------------------------");
    });
    console.log("-----------------------------");
    console.log("Next Room Index: " + nextRoomId);
    console.log("Players in register: " + exports.players.length);
    console.log("-----------------------------");
    console.table(exports.players);
    console.log("-----------------------------");
    console.log("Error count: " + exports.errorsArr.length);
    // errorsArr.forEach(value => console.log("Error 1: " + value))
}
io.on("connection", (socket) => {
    //called when player attempts to login from the login screen
    socket.on('player_registered', (name) => {
        //if the player is not in the data base then we add them to it
        if ((0, Helper_1.findIfNameIsInDataBase)(name) == -1) {
            registerPlayer(name, socket);
        }
        //this is the index of the player just logged-in/registered
        const index = (0, Helper_1.findIfNameIsInDataBase)(name);
        if (exports.players[index].online) {
            //this send the client that the player they tried to login is already logged in
            io.to(socket.id).emit("successful_login", { condition: 'alreadyOnline', name: name });
        }
        else {
            exports.players[index].login(socket);
            exports.playersOnline++;
            //send the client that they successfully logged in and to redirect to menu page
            io.to(socket.id).emit("successful_login", { condition: 'success', name: name });
        }
    });
    //every file requests this when it is rendered so it acts as a way to see when a player has reconnected
    socket.on('player_data_request', (data) => {
        const index = (0, Helper_1.findIfNameIsInDataBase)(data);
        if (index != -1) {
            if (!exports.players[index].online) {
                exports.players[index].login(socket);
                exports.playersOnline++;
                (0, FileIO_1.writeData)(exports.players);
            }
        }
        else {
            exports.errorsArr.push("unable to find " + data + " in database");
        }
        // errorsArr.push(players[index].sendable().roomId)
        io.to(socket.id).emit("player_data", exports.players[index]);
        io.emit('player_connected', exports.playersOnline);
    });
    socket.on('matchmake', (playerName) => {
        var roomAvailableIndex = exports.rooms.findIndex(room => room.available == true);
        if (roomAvailableIndex == -1) {
            const newRoom = new SharedTypes_1.Room(nextRoomId.toString());
            roomAvailableIndex = exports.rooms.length;
            nextRoomId++;
            exports.rooms.push(newRoom);
        }
        const currentPlayerIndex = (0, Helper_1.findIfNameIsInDataBase)(playerName);
        exports.rooms[roomAvailableIndex].addPlayer(exports.players[currentPlayerIndex]);
        // console.log(currentPlayer.name + "'s Room id was set to " + rooms[roomAvailableIndex].id)
        exports.players[currentPlayerIndex].setRoomId(exports.rooms[roomAvailableIndex].id);
        socket.join(exports.rooms[roomAvailableIndex].id);
        io.to(socket.id).emit('room_found', exports.rooms[roomAvailableIndex].id);
    });
    socket.on('is_room_full', (player) => {
        const roomIndex = (0, Helper_1.findRoomIndexFromPlayer)(player);
        if (roomIndex != -1) {
            const playerIndex = (0, Helper_1.findPlayerIndexInRoom)(exports.rooms[roomIndex], player.name);
            if (playerIndex != -1) {
                exports.rooms[roomIndex].setPlayerReady(exports.players[(0, Helper_1.findIfNameIsInDataBase)(player.name)]);
                if (exports.rooms[roomIndex].isRoomFull()) {
                    exports.rooms[roomIndex].closeRoom();
                    io.in(exports.rooms[roomIndex].id).emit('start_game');
                }
                else {
                }
            }
            else {
                exports.errorsArr.push("the player that checked to see if full does not exist");
            }
        }
        else {
            exports.errorsArr.push('unable to find room when seeing if it is full, player: ' + player.name);
        }
    });
    socket.on('room_data_request', (roomId) => {
        const roomIndex = exports.rooms.findIndex(value => value.id == roomId);
        if (roomIndex != -1) {
            io.to(socket.id).emit('room_data', exports.rooms[roomIndex]);
            if (!exports.rooms[roomIndex].gameStarted && exports.rooms[roomIndex].isRoomFull()) {
                exports.errorsArr.push("weird thing happened dont know why its here");
                exports.rooms[roomIndex].startRoom(roomIndex);
            }
        }
        else {
            exports.errorsArr.push("requested room data for room: " + roomId + " :that doesnt exist");
        }
    });
    socket.on('move_played', (newGameData) => {
        const indexRoom = exports.rooms.findIndex(value => value.id == newGameData.id);
        if (indexRoom != -1) {
            exports.rooms[indexRoom].playerMove(newGameData);
            const winner = exports.rooms[indexRoom].checkWin();
            if (winner != ' ') {
                (0, FileIO_1.writeData)(exports.players);
                io.in(exports.rooms[indexRoom].id).emit('player_won', winner);
            }
            io.in(exports.rooms[indexRoom].id).emit('player_moved', exports.rooms[indexRoom]);
        }
    });
    socket.on('time_out', (lostPlayer) => {
        const indexRoom = exports.rooms.findIndex(value => value.id == lostPlayer.roomId);
        if (indexRoom != -1) {
            const lostIndex = exports.rooms[indexRoom].players.findIndex(value => value.name == lostPlayer.name);
            const wonSymbol = exports.rooms[indexRoom].playerAssignments[lostIndex == 0 ? 1 : 0];
            exports.rooms[indexRoom].playerTimeOut(lostPlayer);
            io.in(exports.rooms[indexRoom].id).emit('player_won', wonSymbol);
        }
        else {
            // console.log("tried to access as room: " + lostPlayer.roomId + " :that dosent exist when player timed out, indexRoom: " + indexRoom)
        }
    });
    socket.on('leave_game', (leftPlayer) => {
        const indexRoom = exports.rooms.findIndex(value => value.id == leftPlayer.roomId);
        if (indexRoom != -1) {
            const leaveIndex = exports.rooms[indexRoom].players.findIndex(value => value.name == leftPlayer.name);
            io.in(exports.rooms[indexRoom].id).emit('opponent_left');
            exports.rooms = exports.rooms.filter(value => value.id != exports.rooms[indexRoom].id);
        }
        else {
            exports.errorsArr.push("unable to leave room, no room found");
        }
    });
    socket.on("leave_queue_request", (player) => {
        const roomIndex = (0, Helper_1.findRoomIndexFromPlayer)(player);
        if (roomIndex != -1) {
            exports.rooms[roomIndex].playerDisconnect(player);
            exports.players[(0, Helper_1.findIfNameIsInDataBase)(player.name)].resetRoomId();
            io.to(socket.id).emit("leave_queue_response", "good");
        }
        else {
            io.to(socket.id).emit("leave_queue_response", "error");
            exports.errorsArr.push("Unable to leave queue becasue it cannont find the room");
        }
    });
    socket.on('reset_room', (roomId) => {
        const indexRoom = exports.rooms.findIndex(value => value.id == roomId);
        if (exports.rooms[indexRoom].countDown < 2) {
            exports.rooms[indexRoom].resetRoom();
        }
    });
    socket.on('disconnect', () => {
        if ((0, Helper_1.findIfIDIsInDataBase)(socket.id) != -1) {
            const index = (0, Helper_1.findIfIDIsInDataBase)(socket.id);
            exports.players[index].disconnect();
            const roomIndex = exports.rooms.findIndex(value => value.id == exports.players[index].roomId);
            if (roomIndex != -1) {
                exports.rooms[roomIndex].playerDisconnect(exports.players[index]);
                io.to(exports.rooms[roomIndex].id).emit("opponent_left");
                socket.leave(exports.rooms[roomIndex].id);
            }
            exports.playersOnline--;
            io.emit("player_disconnected", exports.playersOnline);
            (0, FileIO_1.writeData)(exports.players);
        }
    });
});
server.listen(PORT, () => {
    console.log("This Server is Running on Port " + PORT);
});
const countDownSetTimeOut = (roomIndex) => {
    io.in(exports.rooms[roomIndex].id).emit('count_down', exports.rooms[roomIndex].countDown);
    exports.rooms[roomIndex].countDown--;
    if (exports.rooms[roomIndex].countDown >= 0) {
        setTimeout(() => { (0, exports.countDownSetTimeOut)(roomIndex); }, 1000);
    }
};
exports.countDownSetTimeOut = countDownSetTimeOut;
//adds player to database
function registerPlayer(user, socket) {
    var temp = new SharedTypes_1.Player(user, socket.id);
    exports.players.push(temp);
    (0, FileIO_1.writeData)(exports.players);
}
//logs the player in
//# sourceMappingURL=index.js.map