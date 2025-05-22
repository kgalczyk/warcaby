class MovementAnimation {
    constructor(piece, x, z) {
        this.piece = piece;
        // animacja ruchu
        this.normalMove = new TWEEN.Tween(this.piece.position) // co
            .to({ x: x, z: z }, 500) // do jakiej pozycji, w jakim czasie
            .repeat(0) // liczba powtórzeń
            .easing(TWEEN.Easing.Sinusoidal.Out) // typ easingu (zmiana w czasie) 
    }

    startMove = () => {
        // start animacji
        this.normalMove.start();
    }
}