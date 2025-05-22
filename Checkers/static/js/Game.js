// warcaby:
//     problemy do pokonania:
//          2. zbijanie, czyli ruch o dwa pola nad bierką przeciwnika
//          3. przymus bicia, jeśli bicie jest możliwe
//          4. funkcje + fetch, które ogarną zmianę pozycji na planszy dla obu graczy
//          5. przemiana w hetmana na ósmej linii -> ruch hetmana

class Game { // Klasa generuje planszę do gry oraz posiada metodę tworzącą bierki.
    constructor() {
        console.log("stworzono obiekt Game");
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setClearColor(0x123456);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        document.getElementById("root").append(this.renderer.domElement);

        // Moment stworzenia bierek jest potrzebny do odpalenia funkcji, która rusza figury.
        this.piecesCreated = false;

        this.camera.position.set(0, 90, -180); // Punkt widzenia bierek białych
        this.camera.lookAt(this.scene.position);
        this.axes = new THREE.AxesHelper(1000);
        this.scene.add(this.axes);

        // Tablica zawiera wartości reprezentujące kolory pól szachownicy ( 1 - czarne pole, 0 - białe pole).
        this.gameTable = [
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0],
        ]
        this.createBoard(); // Stworzenie pól szachownicy

        // Tablica jest początkowym ułożeniem bierek, jedynki to bierki białe, dwójki to bierki czarne.
        this.pieces = [
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0],
            [0, 2, 0, 2, 0, 2, 0, 2],
            [2, 0, 2, 0, 2, 0, 2, 0]
        ]

        this.render() // Wywołanie metody render

    }

    // Metoda tworząca planszę do gry
    createBoard() {
        this.fieldsObjects = [];

        for (let i = -4; i < 4; i++) {
            for (let j = -4; j < 4; j++) {
                if (this.gameTable[i + 4][j + 4] == 1) {
                    this.field = new Field('textures/blackField.jpg', 20, 5, 20, j + 4, i + 4);
                    // Dodanie informacji o kolorze pola 
                    this.field.fieldColor = 1;
                } else {
                    this.field = new Field('textures/whiteField.png', 20, 5, 20, j + 4, i + 4);
                    // Dodanie informacji o kolorze pola 
                    this.field.fieldColor = 0;
                }

                // Ustawienia pozycji pola wg algorytmu: ilość kroków od środka osi (i lub j) * półtora szerokości (width) lub głębi (depth) pola szachownicy
                this.field.position.x = (i + 0.5) * this.field.fieldWidth; // Wartość szerokości pola jest pobierana z 
                this.field.position.z = (j + 0.5) * this.field.fieldDepth;// Pola geometry obiektu stworzonego przez THREEjs

                // Dodanie elementu do sceny oraz do tablicy przechowującej kolejne pola.
                this.scene.add(this.field);
                this.fieldsObjects.push(this.field);
            }
        }

        // Stałe zawierające szerokość i wysokość planszy
        this.BOARD_WIDTH = this.gameTable.length * this.field.fieldWidth;
        this.BOARD_DEPTH = this.gameTable[0].length * this.field.fieldDepth;
    }

    // Metoda tworząca bierki w początkowym ułożeniu
    createPieces() {
        this.piecesObjects = [];
        this.piece = '';

        for (let i = -4; i < 4; i++) {
            for (let j = -4; j < 4; j++) {
                if (this.pieces[i + 4][j + 4] === 1)
                    this.piece = new Piece(0xffffff, 'textures/whitePiece.jpg', this.pieces[i + 4][j + 4], 7, 7, 5, 25);// Nową bierkę tworzy klasa Piece pobierająca za parametry kolor tekstury i ścieżkę do pliku tekstury.
                else if (this.pieces[i + 4][j + 4] === 2)
                    this.piece = new Piece(0x4455aa, 'textures/blackField.jpg', this.pieces[i + 4][j + 4], 7, 7, 5, 25);
                else continue;
                // Dodanie elementu do sceny
                gameManager.game.scene.add(this.piece);
                // Dodanie elementu do tablicy bierek
                this.piecesObjects.push(this.piece);

                const parameters = this.fieldsObjects[this.piecesObjects.length - 1].geometry.parameters; // Pobranie wymiarów fielda
                this.piece.position.set((j + 0.5) * parameters.width, 3.5, (i + 0.5) * parameters.depth); // Bierkę należy stosownie ustawić -> obliczamy odstęp podobnie jak z polami szachownicy
                // powiązanie bierki z jej ustawieniem w tablicy game.pieces
                this.piece.positionInPiecesArray = {
                    x: i + 4,
                    y: j + 4,
                };
            }
        }
        this.piecesCreated = true;
    }

    swap = (oldIndexes, newIndexes) => {
        const temp = this.pieces[oldIndexes.x][oldIndexes.y];
        if (temp === 0) return;
        this.pieces[oldIndexes.x][oldIndexes.y] = this.pieces[newIndexes.x][newIndexes.y];
        this.pieces[newIndexes.x][newIndexes.y] = temp;
    }

    removePieceFromArray = (indexes) => {
        this.pieces[indexes.x][indexes.y] = 0;
    }

    removePieceObject = (piece) => {
        this.scene.remove(piece);
    }

    findPieceByPosition = (x, z) => {
        return this.piecesObjects.find((piece) => {
            if (x === piece.position.x && z === piece.position.z) {
                return piece;
            };
            return null;
        })
    }

    renderNewPosition = (piece, newPosition) => {
        const move = new MovementAnimation(piece, newPosition.x, newPosition.z);
        move.startMove();
    }

    handleNewMove = (start, target) => {
        let piece = this.findPieceByPosition(start.x, start.z);
        if (piece === undefined) return;
        this.renderNewPosition(piece, target);
    }

    resizeRenderer() {
        // W przypadku zmniejszenia, zwiększenia, rozszerzenia czy zwężenia okna jest ustawiana ponownie kamera i renderer
        gameManager.game.camera.aspect = window.innerWidth / window.innerHeight;
        gameManager.game.camera.updateProjectionMatrix();
        gameManager.game.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render = () => {
        requestAnimationFrame(this.render);
        TWEEN.update();
        this.renderer.render(this.scene, this.camera);
    }
}

