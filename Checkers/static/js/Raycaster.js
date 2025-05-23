class Raycaster {
    raycaster;
    mouseVector;
    mouseMove;
    intersects;

    piece; // pole na obecnie podniesioną bierkę
    pieceToTake;
    pieces; // tablica obiektów bierek rodem z Game'a
    field;
    fields; // tablica obiektów pól rodem z Game'a
    fieldsToMove;
    fieldsToTake;

    // kolory figur
    heldPiecesColor; // żółty bądź czerwony w hexie
    originalPieceColor; // biały bądź czarny w hexie

    // kolor pola (1 - biały lub 2 - czarny)
    piecesColor;
    whoseTurn = true;
    color;

    constructor(pieces, fields, piecesColor) {
        this.raycaster = new THREE.Raycaster();
        this.mouseVector = new THREE.Vector2();
        this.mouseMove = new THREE.Vector2();
        this.intersects = [];
        this.piece = null;
        this.pieces = pieces;
        this.fields = fields;
        this.heldPiecesColor = piecesColor === 1 ? 0xffff00 : 0xff00ff;
        this.originalPieceColor = piecesColor === 1 ? 0xffffff : 0x4455aa;
        this.color = piecesColor === 1 ? true : false;

        this.piecesColor = piecesColor;
        console.log("stworzono Raycaster");
        window.onclick = this.clickOnBoard;
        window.onmousemove = this.moveMouse;
    }

    clickOnBoard = (event) => {
        let ray = this.raycaster;
        let intersects = ray.intersects;

        this.mouseVector.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouseVector.y = -(event.clientY / window.innerHeight) * 2 + 1;

        ray.setFromCamera(this.mouseVector, gameManager.game.camera);
        intersects = ray.intersectObjects(gameManager.game.scene.children);

        if (this.piece)
            this.makeMove(intersects);


        if (intersects.length > 0 && intersects[0].object.isPiece) {
            this.piece = intersects[0].object;
            if (this.piece.pieceColor !== this.piecesColor) {
                this.piece = null;
                return;
            }

            this.highlightPossibleFieldsToMove(this.piece.position);
            this.piece.material.color.set(this.heldPiecesColor);
            return;
        }
    }

    makeMove = (intersects) => {
        if (intersects.length > 0 && intersects[0].object.isField) {
            if (this.piece.pieceColor !== this.piecesColor) return;
            if (this.whoseTurn !== this.color) return;

            this.field = this.findSquareForThePiece(intersects[0].point);
            if (this.field === undefined) return;
            if (!this.field.isPossibleToMove) return;

            // trzeba sprawdzić, czy pionek nie zbił pionka
            // porównanie pozycji pierwotnej pionka i połowy wektora ruchu z pozycją zbijanego
            let takenPiecePosition = {
                x: this.field.position.x - (this.field.position.x - this.piece.position.x) / 2,
                z: this.field.position.z - (this.field.position.z - this.piece.position.z) / 2
            }

            if (this.pieceToTake)
                if (takenPiecePosition.x === this.pieceToTake.position.x && takenPiecePosition.z === this.pieceToTake.position.z)
                    this.pieceToTake.isTaken = true;

            // zmiana pozycji bierki
            let oldPiecePositionInArray = this.piece.positionInPiecesArray; // Przed ruchem pobieranie pozycji bierki w tablicy
            let newPiecePositionInArray = this.field.indexes;// Przekazanie nowej pozycji do konwersji na współrzędne w tablicy bierek
            this.piece.updatePositionInArray(newPiecePositionInArray);

            // Wysłanie do serwera nowej pozycji
            gameManager.net.sendNewPosition(oldPiecePositionInArray, newPiecePositionInArray, this.piece.position, this.field.position);

            // wykonanie ruchu -> TWEEN
            const move = new MovementAnimation(this.piece, this.field.position.x, this.field.position.z);
            move.startMove();
        }

        this.piece.material.color.set(this.originalPieceColor);
        this.piece = null;
        this.clearInnormalFieldColor(this.fieldsToMove);
        this.removeTakenPieces();
    }

    moveMouse = (event) => {
        this.mouseMove.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouseMove.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    highlightPossibleFieldsToMove = (piecePosition) => {
        // potrzebujemy:
        // pozycji pionka,
        // musimy znaleźć pozycje pól po przekątnych, 'do przodu'
        // uwzględniając pionki stojące na przeszkodzie
        // a także możliwe bicia
        // białe chodzą na skos po współrzędnych
        // (x+, z+) v (x-, z+)
        // czarne
        // (x+, z-) v (x-, z-)
        let fields = this.checkForNormalMoves(piecePosition); // zawsze zwraca dwa pola po przekątnych
        if (fields === undefined) return;

        let takeFields = this.checkForTakeMoves(fields);
        fields = this.checkForPiecesInNormalMove(fields);
        // console.log("możliwe pola ruchu:", fields);

        fields.forEach((field) => {
            field.isPossibleToMove = true;
            field.material.color.set(field.MOVEABLE_COLOR);
        })
        this.fieldsToMove = fields;
        this.fieldsToTake = takeFields;
    }

    checkForPiecesInNormalMove = (fields) => {
        return fields.filter((field) => {
            let piece = this.findSquaresWithPieces(field.position);
            if (!piece) return field;
        })
    }

    checkForNormalMoves = (piecePosition) => {
        let directions = [];

        if (this.piece.pieceColor === 2) {
            // czarny
            directions = [{ x: -20, z: -20 }, { x: 20, z: -20 }];
        } else {
            // biały
            directions = [{ x: -20, z: 20 }, { x: 20, z: 20 }];
        }

        return directions
            .map(dir => this.findFieldByPosition({ x: piecePosition.x + dir.x, z: piecePosition.z + dir.z }))
            .filter(field => field !== undefined);
        // return this.fields.filter((field) => {
        //     if (field.position.x + 20 === piecePosition.x || field.position.x - 20 === piecePosition.x)
        //         if (this.piece.pieceColor === 1) {
        //             if (field.position.z - 20 === piecePosition.z) return field;
        //         } else
        //             if (field.position.z + 20 === piecePosition.z) return field;
        // })
    }

    checkForTakeMoves = (fields) => {
        return fields.filter((field) => {
            let piece = this.findSquaresWithPieces(field.position);
            if (piece && piece.pieceColor !== this.piece.pieceColor) {
                let vector = { x: field.position.x - this.piece.position.x, z: field.position.z - this.piece.position.z }; // to jest wektor ruchu
                let position = { x: this.piece.position.x + 2 * vector.x, z: this.piece.position.z + 2 * vector.z };

                fields.push(this.findFieldByPosition(position)); // xd, to działa na oryginalnej tablicy
                this.pieceToTake = this.findPieceByPosition(position.x - vector.x, position.z - vector.z);
                return field;
            }
        })
    }

    clearInnormalFieldColor = (fields) => {
        if (fields === undefined) return;
        fields.forEach((field) => {
            field.isPossibleToMove = false;
            field.clearFieldMaterial();
        })
    }

    findSquaresWithPieces = (position) => {
        return this.pieces.find((piece) => {
            if (piece.position.x === position.x && piece.position.z === position.z) return piece;
        })
    }
    // niby to samo xd
    // ale co tam
    findPieceByPosition = (x, z) => {
        return this.pieces.find((piece) => {
            if (x == piece.position.x && z == piece.position.z) return piece;
        })
    }

    findFieldByPosition = (position) => {
        return this.fields.find((field) => {
            if (field.position.x === position.x && field.position.z === position.z) return field;
        })
    }

    findSquareForThePiece = (point) => {
        return this.fields.find((field) => {
            // Wyznaczenie odległosci miejsca kliknięcia od pozycji pola
            const DISTANCE_FROM_MOUSE_X_TO_THE_MIDDLE_POINT = Math.abs(point.x - field.position.x);
            const DISTANCE_FROM_MOUSE_Y_TO_THE_MIDDLE_POINT = Math.abs(point.z - field.position.z);
            let halfOfWidth = field.fieldWidth / 2;
            let halfOfDepth = field.fieldDepth / 2;

            // Zwrot fielda, jest który koloru czarnego i jest w odległości mniejszej niż połowa szerokości/głębi pola
            if (DISTANCE_FROM_MOUSE_X_TO_THE_MIDDLE_POINT <= halfOfWidth && DISTANCE_FROM_MOUSE_Y_TO_THE_MIDDLE_POINT <= halfOfDepth)
                if (field.fieldColor === 1)
                    return field;
        });
    }

    removeTakenPieces = () => {
        // console.log("ostatnio zbity pionek:", this.pieceToTake);
        if (this.pieceToTake && this.pieceToTake.isTaken) {
            gameManager.game.removePieceObject(this.pieceToTake);
            if (this.fieldsToTake) gameManager.net.takePieceChange(this.fieldsToTake[0].indexes, this.pieceToTake.position);
            this.pieceToTake.isTaken = false;
            this.fieldsToTake = null;
        };
    }
}