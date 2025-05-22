class Field extends THREE.Mesh {
    fieldWidth;
    fieldHeight;
    fieldDepth;
    texture;

    isPiece;
    isField;
    isPossibleToMove = false;

    indexes;

    MOVEABLE_COLOR = "#11eedd";

    constructor(texture, fieldWidth, fieldHeight, fieldDepth, x, y) {

        const boxGeometry = new THREE.BoxGeometry(fieldWidth, fieldHeight, fieldDepth);
        const boxMaterial = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load(texture)
        });
        super(boxGeometry, boxMaterial);
        this.fieldWidth = fieldWidth; // Oś x
        this.fieldDepth = fieldDepth; // Oś z
        this.fieldHeight = fieldHeight; // Oś y
        this.isPiece = false;
        this.isField = true;
        this.indexes = { x: x, y: y };
        this.texture = texture;
    }

    clearFieldMaterial = () => {
        this.material = new THREE.MeshBasicMaterial({
            map: new THREE.TextureLoader().load(this.texture),
        });
    }
}