let gameManager = {
    game: new Game(),
    net: new Net(),
    ui: new Ui(),
    raycaster: '',
    playerCount: 0,
    interval: "",
}

window.onload = () => {
    document.getElementById("login-button").onclick = gameManager.net.sendUserData;
    document.getElementById("reset").onclick = gameManager.ui.resetNickname;
    window.onresize = gameManager.game.resizeRenderer;
}
