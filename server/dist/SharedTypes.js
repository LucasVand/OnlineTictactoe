"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientPlayer = exports.Player = exports.ClientRoom = exports.Room = void 0;
const _1 = require(".");
class Room {
    constructor(id) {
        this.available = true;
        this.id = '';
        this.players = [];
        this.turn = 'x';
        this.board = [" ", " ", " ", " ", " ", " ", " ", " ", " "];
        this.playerAssignments = ['x', 'o'];
        this.countDown = 5;
        this.gameStarted = false;
        this.score = [0, 0];
        this.ready = [false, false];
        this.id = id;
    }
    addPlayer(player) {
        this.players.push(player);
    }
    setPlayerReady(player) {
        const readyPlayerIndex = this.players.findIndex(value => value.name == player.name);
        this.ready[readyPlayerIndex] = true;
    }
    isRoomFull() {
        var flag = true;
        this.ready.forEach((bool) => {
            if (!bool) {
                flag = false;
            }
        });
        if (this.players.length == 2) {
            return flag;
        }
        else {
            return false;
        }
    }
    closeRoom() {
        this.available = false;
    }
    startRoom(roomIndex) {
        this.gameStarted = true;
        (0, _1.countDownSetTimeOut)(roomIndex);
    }
    checkWin() {
        const mappedArr = this.board.map(value => value == 'x' ? 1 : value == 'o' ? 5 : 0);
        var flag = ' ';
        var tie = 0;
        mappedArr.forEach((value) => {
            if (value != 0) {
                tie++;
            }
        });
        if (tie == 9) {
            flag = 'n';
        }
        for (let i = 0; i < 3; i++) {
            var tallyH = 0;
            var tallyV = 0;
            for (let j = 0; j < 3; j++) {
                tallyH += mappedArr[i * 3 + j];
                tallyV += mappedArr[j * 3 + i];
            }
            if (tallyH == 3 || tallyV == 3) {
                flag = 'x';
            }
            if (tallyH == 15 || tallyV == 15) {
                flag = 'o';
            }
        }
        const dig1 = mappedArr[0] + mappedArr[4] + mappedArr[8];
        const dig2 = mappedArr[2] + mappedArr[4] + mappedArr[6];
        if (dig1 == 3 || dig2 == 3) {
            flag = 'x';
        }
        if (dig1 == 15 || dig2 == 15) {
            flag = 'o';
        }
        if (flag != ' ') {
            const playerAssignmentIndex = this.playerAssignments.findIndex(value => value == flag);
            if (playerAssignmentIndex != -1) {
                this.players.forEach(value => value.gamesPlayed++);
                if (flag != 'n') {
                    this.players[playerAssignmentIndex].wins++;
                    this.players[playerAssignmentIndex == 0 ? 1 : 0].loses++;
                    this.score[playerAssignmentIndex]++;
                }
            }
        }
        return flag;
    }
    playerMove(newGameData) {
        this.board = newGameData.board;
        this.turn = this.turn == 'x' ? 'o' : 'x';
    }
    playerTimeOut(lostPlayer) {
        const lostIndex = this.players.findIndex(value => value.name == lostPlayer.name);
        const wonIndex = lostIndex == 0 ? 1 : 0;
        if (lostIndex != -1) {
            // if (isThisThem) {
            this.score[wonIndex]++;
            this.players[lostIndex].loses++;
            this.players[lostIndex].gamesPlayed++;
            //} else {
            this.players[wonIndex].gamesPlayed++;
            this.players[wonIndex].wins++;
            // }
        }
    }
    resetRoom() {
        this.gameStarted = false;
        this.board = [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '];
        this.ready = [false, false];
        this.turn = this.turn == 'x' ? 'o' : 'x';
        this.countDown = 5;
        this.playerAssignments = [this.playerAssignments[1], this.playerAssignments[0]];
    }
    playerDisconnect(player) {
        const playerIndex = this.players.findIndex(value => value.name == player.name);
        this.players = this.players.filter(value => value.name != player.name);
        this.playerAssignments = [this.playerAssignments[playerIndex == 1 ? 0 : 1]];
    }
    sendable() {
        const send = new ClientRoom(this.id);
        send.available = this.available;
        send.board = this.board;
        send.countDown = this.countDown;
        send.gameStarted = this.gameStarted;
        send.playerAssignments = this.playerAssignments;
        send.players = this.players;
        send.ready = this.ready;
        send.score = this.score;
        send.turn = this.turn;
        return send;
    }
}
exports.Room = Room;
class ClientRoom {
    constructor(id) {
        this.available = true;
        this.id = '';
        this.players = [];
        this.turn = 'x';
        this.board = [" ", " ", " ", " ", " ", " ", " ", " ", " "];
        this.playerAssignments = ['x', 'o'];
        this.countDown = 5;
        this.gameStarted = false;
        this.score = [0, 0];
        this.ready = [false, false];
        this.id = id;
    }
}
exports.ClientRoom = ClientRoom;
class Player {
    constructor(n, id) {
        this.wins = 0;
        this.loses = 0;
        this.draws = 0;
        this.gamesPlayed = 0;
        this.online = false;
        this.roomId = '';
        this.name = n;
        this.id = id;
    }
    resetRoomId() {
        // console.log(this.name + "'s room id was reset")
        this.roomId = '';
    }
    login(socket) {
        this.online = true;
        this.id = socket.id;
        socket.join(this.roomId);
    }
    disconnect() {
        this.online = false;
    }
    setRoomId(id) {
        if (id != '') {
            this.roomId = id;
        }
    }
    sendable() {
        const send = new ClientPlayer(this.name, this.id);
        send.draws = this.draws;
        send.loses = this.loses;
        send.online = this.online;
        send.roomId = this.roomId;
        send.wins = this.wins;
        send.gamesPlayed = this.gamesPlayed;
        return send;
    }
}
exports.Player = Player;
class ClientPlayer {
    constructor(n, id) {
        this.wins = 0;
        this.loses = 0;
        this.draws = 0;
        this.gamesPlayed = 0;
        this.online = false;
        this.roomId = '';
        this.name = n;
        this.id = id;
    }
}
exports.ClientPlayer = ClientPlayer;
//# sourceMappingURL=SharedTypes.js.map