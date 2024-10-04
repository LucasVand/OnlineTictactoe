"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.readData = exports.writeData = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const fs_1 = __importDefault(require("fs"));
const SharedTypes_1 = require("./SharedTypes");
const writeData = (playerData) => {
    const writable = JSON.stringify(playerData);
    new Promise((resolve, reject) => {
        promises_1.default.writeFile('playerData.json', writable);
    });
};
exports.writeData = writeData;
const readData = () => {
    var read = fs_1.default.readFileSync('playerData.json', 'utf8');
    const sendable = JSON.parse(read);
    const actually = [];
    sendable.forEach((player) => {
        const p = new SharedTypes_1.Player(player.name, player.id);
        p.draws = player.draws;
        p.gamesPlayed = player.gamesPlayed;
        p.loses = player.loses;
        p.online = player.online;
        p.roomId = player.roomId;
        p.wins = player.wins;
        player = p;
    });
    return actually;
};
exports.readData = readData;
const resolve = () => {
};
const reject = () => {
    console.log("Error: Unable to write player data");
};
//# sourceMappingURL=FileIO.js.map