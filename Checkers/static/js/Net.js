class Net {
    pieceColor; // biały - 1 lub czarny - 2
    color; // biały - true lub czarny - false
    whoseTurn = true;
    constructor() {
        console.log("stworzono obiekt Net");
        this.player = "";
        this.dotsCounter = 0;
    }

    // Metoda wysyła login użytkownika do serwera w celu zweryfikowania jego poprawności
    sendUserData = async () => {
        // Przygotowanie danych do fetcha
        const data = { "login": document.getElementById("login").value }
        const options = {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }

        // Fetch 
        let json = await gameManager.net.fetchAsync(options, "/addUser");

        // Wyświetlenie statusu uzyskanego z serwera
        gameManager.ui.displayLoginStatusResponse(json);

        // Return jeśli nick gracza nie został podany
        if (json.player === undefined) return;

        this.checkUserCount(json.player);

        // Przypisanie nazwy użytkownika
        gameManager.net.player = data.login;

        // Zapisanie koloru bierek gracza
        this.pieceColor = json.pieceColor;
        this.color = json.color;

        // I wyświetlamy powitanie gracza na stronie
        gameManager.ui.welcomeUser(json.player, json.color, json.pieceColor);
    }

    // Metoda, która wysyła zapytanie o liczbę graczy w grze do serwera
    checkUserCount = async (player) => {
        gameManager.interval = setInterval(async function () {
            // kropki w innerHTML-u waiting screen-u
            gameManager.net.dotsCounter++;
            let dots = gameManager.net.dotsCounter % 3;

            // Jeśli serwer nie odeśle nicku z powodu pustego nicku, powielonego nicku bądź trzeciego wprowadzonego gracza do rozgrywki, wychodzimy z funkcji :)
            if (player === undefined) return;

            const options = {
                method: "POST",
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player: gameManager.net.player })
            }

            // Fetch zwracający liczbę graczy na serwerze
            let json = await gameManager.net.fetchAsync(options, "/playerCount");
            console.log(json);

            //
            gameManager.playerCount = json.playersInGame;
            if (gameManager.playerCount === 1) gameManager.ui.displayWaitingScreen(dots);
            else if (gameManager.playerCount === 2) {
                clearInterval(gameManager.interval);
                gameManager.ui.removeLoginPage();
            }
        }, 200);
    }

    sendNewPosition = async (oldPosition, newPosition, piecePosition, fieldPosition) => {
        const body = {
            old: oldPosition,
            new: newPosition,
            start: piecePosition,
            target: fieldPosition,
            who: this.color
        }

        const options = {
            method: 'POST',
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body)
        }

        // wysłanie pozycji sprzed i po ruchu
        // w odpowiedzi to samo, żeby uaktualnić planszę u obu graczy 
        let json = await gameManager.net.fetchAsync(options, "/position");

        // klient w sumie nie potrzebuje tych danych z powrotem :(
    }

    waitForChange = async () => {
        const options = {
            method: 'POST',
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ who: this.color })
        }
        let json = await this.fetchAsync(options, "/change");

        this.executeChanges(json);
    }

    executeChanges = (json) => {
        // sprawdzenie statusu gry. Jeśli status jest równy 1, to znaczy że gra się skończyła
        let status = this.endTheGame(json);
        if (status) return;

        // zmiana eventów -> wyłączenie jeśli nie jest nasza tura
        // włączenie, jeśli nasza tura
        this.changeEvents(json);

        // aktualizacja tury
        this.updateTurn(json);

        // wykonanie ruchu
        this.executeMove(json);
    }

    executeMove = (json) => {
        if (json.target !== 0) {
            this.executeTakeMove(json);
            this.executeNormalMove(json);
        }
    }

    executeTakeMove = (json) => {
        if (json.taken) {
            let pieceToRemove = gameManager.game.findPieceByPosition(json.takenPiecePosition.x, json.takenPiecePosition.z);

            gameManager.raycaster.pieces = gameManager.raycaster.pieces.filter((piece) => {
                if (piece.position.x != pieceToRemove.position.x || piece.position.z != pieceToRemove.position.z) return piece;
            });

            console.log("tablica pionków:", gameManager.raycaster.pieces);
            console.log("czy zbito pionka:", json.taken);
            console.log("dane o ruchu:", json);
            console.log("bierka zbita: ", pieceToRemove); /// nie widzi tego, pytanie, dlaczego

            gameManager.game.removePieceFromArray(json.indexesOfTakenPiece);
            gameManager.game.removePieceObject(pieceToRemove);
        };
    }

    executeNormalMove = (json) => {
        gameManager.game.handleNewMove(json.start, json.target);
        gameManager.game.swap(json.old, json.new);
        if (gameManager.ui.infoShowed) gameManager.ui.displayGameTable();
    }

    updateTurn = (json) => {
        this.whoseTurn = json.whoseTurn;
        gameManager.net.whoseTurn = json.whoseTurn;
        gameManager.raycaster.whoseTurn = json.whoseTurn;
    }

    changeEvents = (json) => {
        if (json.whoseTurn !== this.color) {
            window.onclick = () => { return; };
            window.onmousemove = () => { return; };
            gameManager.ui.displayOpponentTurnScreen();
        } else {
            window.onclick = gameManager.raycaster.clickOnBoard;
            window.onmousemove = gameManager.raycaster.moveMouse;
        }
    }

    endTheGame = (json) => {
        if (json.status !== -1) {
            window.onclick = () => { console.log("koniec gry"); };
            window.onmousemove = () => { console.log("koniec gry"); };
            clearInterval(gameManager.ui.interval);

            if (json.winner !== this.color) {
                gameManager.ui.lose();
            }
            return true;
        }
        return false;
    }

    takePieceChange = async (pieceIndexes, piecePosition) => {
        let color = this.color;
        const json = JSON.stringify({
            pieceIndexes: pieceIndexes,
            piecePosition: piecePosition,
            whoTakes: color,
        })

        const options = {
            method: 'POST',
            headers: { "content-type": "application/json" },
            body: json
        }

        let response = await this.fetchAsync(options, "/take");
        // console.log(response);
    }

    win = async () => {
        console.log("win");
        const data = {
            status: 1,
            winner: this.color
        }

        const options = {
            method: 'POST',
            headers: { "content-type": "application/json" },
            body: JSON.stringify(data)
        }

        let response = await this.fetchAsync(options, "/win");
        console.log(response);
    }

    // fetch asynchroniczny 
    async fetchAsync(options, url) {
        let response = await fetch(url, options);
        if (!response.ok) return response.status;
        else return await response.json(); // response.json
    }

} 