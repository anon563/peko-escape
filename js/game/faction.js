class Faction {
    units = [];
    unit = null;

    isTurn = false;
    turnDone = false;
    turnActions = [];

    constructor(type) {
        this.type = type;
    }

    startTurn = game => {
        this.isTurn = true;
        // this.unit = this.units[0];
        this.units.forEach(unit => unit.energy = unit.maxEnergy);
    }

    endTurn = () => {
        this.turnDone = true;
        this.units.forEach(unit => unit.move = 0);
    }

    update = game => {
        // Update units
        this.units.forEach(unit => unit.update(game));
        
        if (this.isTurn) {
            this.updateControls(game);
            if (!this.isTurn) this.endTurn();
        }
    }

    addUnit = unit => {
        this.units.push(unit);
        unit.faction = this;
    }

    drawUnits = (game, cx) => {
        // Units HUD
        cx.save();
        if (game.scene.animView) cx.translate(game.scene.animView.x, game.scene.animView.y);
        this.units.forEach(unit => {
            if (unit.health !== unit.maxHealth || unit.energy !== unit.maxEnergy) {
                cx.save();
                cx.translate(Math.round(unit.posAnim.x * 16), Math.round(unit.posAnim.y * 16));

                cx.fillStyle = '#000';
                cx.fillRect(1, 10, 14, 4);

                // Health bar
                game.scene.drawBar(cx, unit.healthBarAnim, '#ff007f',
                    new Vector2(2, 11), new Vector2(12, 1),
                    unit.maxHealth, unit.health);
                
                // Energy bar
                game.scene.drawBar(cx, unit.energyBarAnim, '#00ff7f',
                    new Vector2(2, 12), new Vector2(12, 1),
                    unit.maxEnergy, unit.energy);
                    
                // Fatigue
                cx.fillStyle = '#0000007f';
                cx.fillRect(2, 12, Math.round(12 * (unit.fatigue / unit.maxEnergy)), 1);
                cx.restore();
            }
        });
        cx.restore();
    }

    draw = (game, cx) => {}
}