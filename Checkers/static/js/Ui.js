class Ui {
    interval;
    pieceColor;
    opponentMoveIntervalWorking = false;
    infoShowed = false;
    maxTurnTime = 10;

    constructor() {
        console.log("stworzono obiekt UI");
    }

    displayLoginStatusResponse(data) {
        // element z odpowiedzią serwera
        let serverResponseStatus = document.createElement("h1");
        serverResponseStatus.id = "status";
        serverResponseStatus.innerHTML = data.status; // wyświetla komunikat, czy dodano użytkownika do gry

        // dodanie elementu do dokumentu
        document.getElementById("scene").appendChild(serverResponseStatus);
    }

    resetNickname() {
        document.getElementById("login").value = "";
    }

    welcomeUser(userName, pieceColor, color) {
        console.log(pieceColor);
        // decycja o kolorze bierek

        if (pieceColor == 1) pieceColor = "białymi";
        else {
            pieceColor = "czarnymi";
            this.setCameraOnBlackPieces();
        }

        this.pieceColor = color;

        // element z nickiem gracza
        let userNameWelcome = document.createElement("h2");
        userNameWelcome.id = "user-welcome";
        userNameWelcome.innerHTML = `Witaj <span style="color:yellow">${userName}</span>, grasz ${pieceColor}`;

        // dodanie elementu do dokumentu
        document.getElementById("scene").appendChild(userNameWelcome);

        this.displayInfoButton();
    }

    displayInfoButton = () => {
        let infoButton = document.createElement("div");
        infoButton.onclick = this.displayGameTable;
        infoButton.innerHTML = "info";
        infoButton.classList.add("info-button");

        document.getElementById("info").append(infoButton);
    }

    displayGameTable = () => {
        let info = document.getElementById("info");
        info.classList.add("board-table");

        info.innerHTML = "";

        let board = JSON.stringify(gameManager.game.pieces);
        board = board.slice(1, board.length);

        info.innerHTML = board;

        this.infoShowed = true;
    }

    displayWaitingScreen(dotsNumber) {
        const loginScene = document.getElementById("login-scene");
        loginScene.innerHTML = "";

        let waitingScreen = document.createElement("div");
        waitingScreen.id = "wait";
        waitingScreen.classList.add('wait');

        let dots = "";
        for (let i = 0; i <= dotsNumber; i++)
            dots += ".";

        waitingScreen.innerHTML = "waiting for second player" + dots;

        // dodanie elementu do dokumentu
        loginScene.appendChild(waitingScreen);
    }

    removeLoginPage = () => {
        let scene = document.getElementById("scene");
        scene.removeChild(document.getElementById("login-scene"));

        // stworzenie bierek
        gameManager.game.createPieces();

        // Stworzenie raycastera
        gameManager.raycaster = new Raycaster(gameManager.game.piecesObjects, gameManager.game.fieldsObjects, this.pieceColor);

        // Rozpoczęcie wysyłania zapytania o nową pozycję
        this.interval = setInterval(() => { gameManager.net.waitForChange() }, 500);
    }

    displayOpponentTurnScreen = () => {
        if (this.opponentMoveIntervalWorking) return;

        let opponentMoveScreen = document.createElement("div");
        opponentMoveScreen.innerHTML = this.maxTurnTime;
        opponentMoveScreen.id = "opponentTurn";
        opponentMoveScreen.classList.add("counter");
        document.getElementById("scene").append(opponentMoveScreen);

        this.opponentMoveIntervalWorking = true;
        this.setOpponentTurnInterval();
    }

    setOpponentTurnInterval = () => {
        let opponentMoveScreen = document.getElementById("opponentTurn");
        this.opponentMoveInterval = setInterval(() => {
            opponentMoveScreen.innerHTML -= 1;
            if (gameManager.net.color === gameManager.net.whoseTurn) this.clearOpponentTurnInterval();

            if (opponentMoveScreen.innerHTML == 0) {
                gameManager.net.win();
                this.win();
            };
        }, 1000)
    }

    win = () => {
        clearInterval(this.opponentMoveInterval);
        document.getElementById("opponentTurn").innerHTML = "wygrana";
    }

    lose = () => {
        let opponentMoveScreen = document.createElement("div");
        opponentMoveScreen.id = "opponentTurn";
        opponentMoveScreen.classList.add("counter-red");
        document.getElementById("scene").append(opponentMoveScreen);
        document.getElementById("opponentTurn").innerHTML = "przegrana";
    }

    clearOpponentTurnInterval = () => {
        document.getElementById("opponentTurn").remove();
        this.opponentMoveIntervalWorking = false;
        clearInterval(this.opponentMoveInterval);
    }

    setCameraOnBlackPieces() {
        gameManager.game.camera.position.set(0, 90, 180); // czarne
        gameManager.game.camera.lookAt(gameManager.game.scene.position);
        gameManager.game.camera.updateProjectionMatrix();
    }
}