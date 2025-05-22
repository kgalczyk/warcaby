var express = require("express");
const PORT = 3000;
var app = express();
app.use(express.static('Checkers/static/'));
app.use(express.json());


app.listen(PORT, function () {
    console.log("start serwera na porcie " + PORT)
})

app.post("/addUser", function (req, res) {
    let user = req.body;
    const STATUS = playerManager.checkUserValidity(user);
    res.end(JSON.stringify(STATUS));
})

app.post("/playerCount", function (req, res) {
    console.log("ilu:", playerManager.users.length);
    const data = { "playersInGame": playerManager.users.length };
    res.end(JSON.stringify(data));
})

app.post("/position", function (req, res) {
    const json = req.body;
    if (json.who !== positionManager.whoseTurn) return;// jeśli ruch wykonał gracz, który akurat ma ruch odsyłamy dane
    // zmiana pozycji w tablicy
    // aktualizacja danych na serwerze
    positionManager.swapFields(json.old.x, json.old.y, json.new.x, json.new.y);
    positionManager.nextMoveStartPosition = json.start;
    positionManager.nextMoveFinalPosition = json.target;
    positionManager.previousIndexes = json.old;
    positionManager.currentIndexes = json.new;
    positionManager.whoseTurn = !positionManager.whoseTurn;
    // odesłanie json-a z nowymi indexami, nową pozycją bierki
    res.end(JSON.stringify(json));
})

app.post("/change", (req, res) => {
    let request = req.body;

    let data = {
        status: playerManager.status,
        winner: playerManager.winner,
        old: positionManager.previousIndexes,
        new: positionManager.currentIndexes,
        start: positionManager.nextMoveStartPosition,
        target: positionManager.nextMoveFinalPosition,
        whoseTurn: positionManager.whoseTurn,
        taken: positionManager.taken,
        indexesOfTakenPiece: positionManager.indexesOfTakenPiece,
        takenPiecePosition: positionManager.positionOfTakenPiece
    };

    console.log(data);
    res.end(JSON.stringify(data));
    if (positionManager.taken) {
        if (positionManager.whoTakes != request.who)
            positionManager.taken = false;
    }
})

app.post("/take", (req, res) => {
    let body = req.body;
    let data = {
        indexes: body.pieceIndexes,
        position: body.piecePosition,
        whoTakes: body.whoTakes
    }
    positionManager.removePiece(data.indexes);
    positionManager.indexesOfTakenPiece = data.indexes;
    positionManager.positionOfTakenPiece = data.position;
    positionManager.taken = true;
    positionManager.whoTakes = data.whoTakes;
    res.end(JSON.stringify(positionManager.currentPositionTable));
})

app.post("/win", (req, res) => {
    let data = req.body;
    playerManager.status = data.status;
    playerManager.winner = data.winner;
    res.end(JSON.stringify(data));
})

// Obiekt do zarządzania logowaniem, użytkownikami
let playerManager = {
    winner: null,
    status: -1,
    users: [],

    checkUserValidity: function (newUser) {
        if (newUser.login === "") return { status: "INVALID_NICKNAME" };
        if (this.users.length === 2) return { status: "MAX_AMOUNT_OF_PLAYERS_REACHED" };
        if (this.users.length === 1 && newUser.login == this.users[0].login) return { status: "LOGIN_ALREADY_USED" };

        this.users.push(newUser);
        console.log("obecni użytkownicy:", playerManager.users);
        console.log("ilu:", playerManager.users.length);
        return {
            status: "PLAYER_ADDED",
            player: newUser.login,
            color: playerManager.setPlayerPieceColor(),
            pieceColor: playerManager.users.length
        };
    },

    findUserNameIndex: function (user) {
        for (let i in this.users)
            if (user === this.users[i]) return i;
    },

    setPlayerPieceColor: () => {
        if (playerManager.users.length === 1) return true;
        return false;
    }
}

// Obiekt do zarządzania pozycją na planszy i przebiegiem gry
let positionManager = {
    whoTakes: null,
    taken: false,
    indexesOfTakenPiece: 0,
    positionOfTakenPiece: 0,
    previousIndexes: 0,
    currentIndexes: 0,
    whoseTurn: true,
    nextMoveStartPosition: 0,
    nextMoveFinalPosition: 0,
    currentPositionTable: [
        [0, 1, 0, 1, 0, 1, 0, 1],
        [1, 0, 1, 0, 1, 0, 1, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0],
        [0, 2, 0, 2, 0, 2, 0, 2],
        [2, 0, 2, 0, 2, 0, 2, 0]
    ],

    swapFields: function (x1, y1, x2, y2) {
        const temp = this.currentPositionTable[x1][y1];
        this.currentPositionTable[x1][y1] = this.currentPositionTable[x2][y2];
        this.currentPositionTable[x2][y2] = temp;
    },

    removePiece: function (indexes) {
        this.currentPositionTable[indexes.x][indexes.y] = 0;
    },

    getPositionTable: () => {
        return this.currentPositionTable;
    }
}