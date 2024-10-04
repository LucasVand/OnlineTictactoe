
import { rooms, players, errorsArr } from './index'
import { Player, Room } from './SharedTypes';

export function findPlayerIndexInRoom(room: Room, name: string): number {
    var index = -1
    index = room.players.findIndex(value => value.name == name)

    return index
}

export function findRoomIndexFromPlayer(player: Player) {
    var index = -1
    index = rooms.findIndex(value => value.id == player.roomId)

    return index
}

export function findIfNameIsInDataBase(name: string) {
    var indexRet = -1
    players.forEach((value, index) => {
        if (value.name == name) {
            indexRet = index
        }
    })
    return indexRet
}

export function findIfIDIsInDataBase(id: string) {
    var indexRet = -1
    players.forEach((value, index) => {
        if (value.id == id) {
            indexRet = index
        }
    })

    return indexRet
}