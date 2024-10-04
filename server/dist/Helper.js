"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPlayerIndexInRoom = findPlayerIndexInRoom;
exports.findRoomIndexFromPlayer = findRoomIndexFromPlayer;
exports.findIfNameIsInDataBase = findIfNameIsInDataBase;
exports.findIfIDIsInDataBase = findIfIDIsInDataBase;
const index_1 = require("./index");
function findPlayerIndexInRoom(room, name) {
    var index = -1;
    index = room.players.findIndex(value => value.name == name);
    return index;
}
function findRoomIndexFromPlayer(player) {
    var index = -1;
    index = index_1.rooms.findIndex(value => value.id == player.roomId);
    return index;
}
function findIfNameIsInDataBase(name) {
    var indexRet = -1;
    index_1.players.forEach((value, index) => {
        if (value.name == name) {
            indexRet = index;
        }
    });
    return indexRet;
}
function findIfIDIsInDataBase(id) {
    var indexRet = -1;
    index_1.players.forEach((value, index) => {
        if (value.id == id) {
            indexRet = index;
        }
    });
    return indexRet;
}
//# sourceMappingURL=Helper.js.map