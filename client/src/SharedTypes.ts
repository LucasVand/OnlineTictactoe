export class Room {
    available: boolean = true
    id: string = ''
    players: Player[] = []
    turn: string = 'x'
    board: string[] = [" ", " ", " ", " ", " ", " ", " ", " ", " "]
    playerAssignments: string[] = ['x', 'o']
    countDown: number = 5
    gameStarted: boolean = false
    score: number[] = [0, 0]
    ready: boolean[] = [false, false]
    constructor(id: string) {
        this.id = id
    }
}



export class Player {
    name: string
    id: string
    wins: number = 0
    loses: number = 0
    draws: number = 0
    gamesPlayed: number = 0
    online: boolean = false
    roomId: string = ''
    constructor(n: string, id: string) {
        this.name = n
        this.id = id
    }
}


