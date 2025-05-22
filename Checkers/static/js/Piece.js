class Piece extends THREE.Mesh {
    pieceRadiusTop;
    pieceRadiusBottom;
    pieceHeight;
    segments;

    positionInPiecesArray;
    pieceColor;

    isPiece;
    isTaken = false;
    constructor(color, texture, pieceColor, pieceRadiusTop, pieceRadiusBottom, pieceHeight, segments) {
        // geometria, materiał
        const cylinderGeometry = new THREE.CylinderGeometry(pieceRadiusTop, pieceRadiusBottom, pieceHeight, segments);
        const cylinderMaterial = new THREE.MeshBasicMaterial({
            color: color,
            map: new THREE.TextureLoader().load(texture)
        })
        // stworzenie bierki
        super(cylinderGeometry, cylinderMaterial);
        // wymiary cylindra
        this.pieceRadiusTop = pieceRadiusTop;
        this.pieceRadiusBottom = pieceRadiusBottom;
        this.pieceHeight = pieceHeight;
        this.segments = segments;

        // dodane pola definiującego obiekt jako bierka
        this.isPiece = true;

        // dodanie pola definiującego kolor bierki (1 lub 2);
        this.pieceColor = pieceColor;
    }

    updatePositionInArray = (newPosition) => {
        this.positionInPiecesArray = { x: newPosition.x, y: newPosition.y };
    };
}