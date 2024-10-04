import fs from 'fs/promises'
import fsr from 'fs'
import { Player } from './SharedTypes';



export const writeData = (playerData: Player[]) => {
    const writable = JSON.stringify(playerData)
    new Promise((resolve, reject) => {
        fs.writeFile('playerData.json', writable)
    })
}

export const readData = (): Player[] => {
    var read = fsr.readFileSync('playerData.json', 'utf8')
    const sendable: Player[] = JSON.parse(read)
    const actually: Player[] = []
    sendable.forEach((player) => {
        const p = new Player(player.name, player.id)
        p.draws = player.draws
        p.gamesPlayed = player.gamesPlayed
        p.loses = player.loses
        p.online = player.online
        p.roomId = player.roomId
        p.wins = player.wins
        player = p
    })
    return actually
}

const resolve = () => {

}

const reject = () => {
    console.log("Error: Unable to write player data")
}