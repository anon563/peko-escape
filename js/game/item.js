class Item extends Actor {
    constructor(data) {
        super();
        Object.entries(data).forEach(([key, value]) => this[key] = value);
    }

    // draw = (game, cx) => {
    //     cx.save();
    //     cx.translate(Math.round(this.posAnim.x * 16) + 4, Math.round(this.posAnim.y * 16) + 6);
    //     cx.drawImage(game.assets.images[this.sprite], (Math.floor(this.frameCount / 20) % 2) * 24, 0, 24, 24, -8, -18, 24, 24);
    //     cx.restore();
    // }
}