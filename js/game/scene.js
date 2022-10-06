class Scene {
    frameCount = 0;
    
    particles = new ParticleManager();

    shakeBuffer = 0;
    
    turnCount = 1;
    floor = 1;

    factions = [];
    units = [];

    view = null;

    constructor(game, room) {
        game.resetCanvas();

        this.size = room.size;

        // Tiles
        this.tiles = [];
        for (let y = 0; y < this.size.y; y++) {
            for (let x = 0; x < this.size.x; x++) {
                const floor = room.floor[y][x];
                const wall = room.wall[y][x];
                const ceiling = room.ceiling[y][x];
                if (floor !== '--' || wall !== '--' || ceiling !== '--') {
                    this.tiles.push({
                        floor: floor,
                        wall: wall,
                        ceiling: ceiling,
                        pos: new Vector2(x, y),
                        unit: null
                    });
                }
            }
        }
        
        // Factions
        room.factions.forEach(factionData => {
            if (factionData.name === 'player') {
                this.factions.push(game.player);
                factionData.unitPos.forEach((pos, i) => {
                    if (i < game.player.units.length) this.spawnUnit(game.player.units[i], pos);
                });
            } else {
                const faction = new Computer(factionData.name);
                this.factions.push(faction);
                factionData.units.forEach(({ data, pos }) => {
                    const unit = new Unit(data);
                    faction.addUnit(unit);
                    this.spawnUnit(unit, pos);
                });
            }
        });
    }

    spawnUnit = (unit, pos) => {
        const tile = this.tiles.find(tile => tile.pos.equals(pos));
        tile.unit = unit;
        unit.tile = tile;
        unit.pos = pos;
        unit.posAnim = pos;
        this.units.push(unit);
    }

    update = game => {
        this.factions.forEach(faction => faction.update(game));

        const factions = this.factions.filter(faction => faction.units.length);
        if (factions.some(faction => !faction.turnDone)) {
            if (!factions.some(faction => faction.isTurn && !faction.turnDone)) {
                const faction = factions.find(faction => !faction.isTurn && !faction.turnDone);
                faction.startTurn(game);
            }
            this.updateView(game);
        } else {
            factions.forEach(faction => faction.turnDone = false);
            this.turnCount++
        }

        this.particles.update(game);

        if (this.shakeBuffer) this.shakeBuffer--;
        this.frameCount++;
    }

    updateView = game => {
        // const unit = this.factions.find(faction => faction.isTurn).unit;
        // const target = (unit ? unit.posAnim : this.size.times(.5)).times(-16).plus(new Vector2(game.width / 2 + 16, game.height / 2 - 16)).round();
        const target = this.size.times(-8).plus(new Vector2(game.width / 2 + 16, game.height / 2 - 16)).round();
        this.view = !this.view ? target : this.view.distance(target) < 1 ? target : this.view.lerp(target, .5);
        this.animView = this.view.round();
    }
    
    drawBar = (cx, animBar, color, pos, size, max) => {
        cx.fillStyle = '#000';
        cx.fillRect(pos.x, pos.y, size.x, size.y);
        cx.fillStyle = color;
        cx.fillRect(pos.x, pos.y, Math.round(animBar * size.x / max), size.y);
        
        if (size.y > 2) {
            cx.fillStyle = '#0000007f';
            cx.fillRect(pos.x, pos.y, size.x, 1);
            cx.fillRect(pos.x, pos.y + size.y - 1, size.x, 1);
        }
    }

    drawUnitMugshot = (game, cx, unit) => {
        cx.save();
        cx.scale(-1, 1);
        cx.translate(-32, 0);
        if (unit.shakeBuffer) cx.translate(Math.floor(Math.random() * 6) - 3, 0);
        cx.drawImage(game.assets.images[unit.mugshot], -8, -18);
        cx.restore();
    }

    draw = game => {
        for (let layer = 0; layer < 4; layer++) {
            const cx = game[`ctx${layer}`];
            cx.save();
            cx.clearRect(0, 0, game.width, game.height);
            if (layer !== 3 && this.shakeBuffer) cx.translate(Math.floor(Math.random() * 6) - 3, 0);
            switch (layer) {
                case 0:
                    cx.save();
                    if (this.animView) cx.translate(this.animView.x, this.animView.y);
                    // Floor
                    // cx.fillStyle = '#f008';
                    // cx.fillRect(0, 0, this.size.x * 16, this.size.y * 16);

                    this.tiles.forEach(tile => {
                        const floor = parseInt(tile.floor, 16);
                        const floorOffset = new Vector2(floor % 4, Math.floor(floor / 4)).times(16);
                        cx.drawImage(game.assets.images['ts_default'], floorOffset.x, floorOffset.y, 16, 16, tile.pos.x * 16, tile.pos.y * 16, 16, 16);
                        
                        const wall = parseInt(tile.wall, 16);
                        const wallOffset = new Vector2(wall % 4 + 4, Math.floor(wall / 4)).times(16);
                        cx.drawImage(game.assets.images['ts_default'], wallOffset.x, wallOffset.y, 16, 16, tile.pos.x * 16, tile.pos.y * 16, 16, 16);
                        
                        const ceiling = parseInt(tile.ceiling, 16);
                        const ceilingOffset = new Vector2(ceiling % 4 + 8, Math.floor(ceiling / 4)).times(16);
                        cx.drawImage(game.assets.images['ts_default'], ceilingOffset.x, ceilingOffset.y, 16, 16, tile.pos.x * 16, tile.pos.y * 16, 16, 16);
                    });

                    // Path tiles
                    if (game.player.isTurn && !game.player.cursor.isLocked) {
                        game.player.cursor.drawPaths(game, cx);
                    }
                    cx.restore();

                    // Fog
                    cx.save();
                    cx.globalAlpha = .125;
                    cx.translate(-Math.floor(this.frameCount / 10) % 256, -Math.floor(this.frameCount / 10) % 256);
                    cx.drawImage(game.assets.images['vfx_fog'], 0, 0);
                    cx.drawImage(game.assets.images['vfx_fog'], 256, 0);
                    cx.drawImage(game.assets.images['vfx_fog'], 0, 256);
                    cx.drawImage(game.assets.images['vfx_fog'], 256, 256);
                    cx.restore();
                    break;
                case 1:
                    if (this.animView) cx.translate(this.animView.x, this.animView.y);
                    // Unit shadow
                    this.units.forEach(unit => {
                        cx.save();
                        cx.translate(Math.round(unit.posAnim.x * 16) + 4, Math.round(unit.posAnim.y * 16) + 7);
                        cx.fillStyle = '#0000007f';
                        cx.beginPath();
                        cx.ellipse(4, 4, 6, 3, 0, 0, Math.PI * 2);
                        cx.fill();
                        if (unit === game.player.cursor.selectedUnit && !unit.action) {
                            cx.strokeStyle = '#FFFF7E';
                            cx.lineWidth = 1.25;
                            cx.beginPath();
                            cx.ellipse(4, 4, 6, 3, 0, 0, Math.PI * 2);
                            cx.stroke();
                        }
                        cx.restore();
                    });

                    this.particles.draw(cx, game.assets, 0);

                    this.units.sort((a, b) => a.pos.y - b.pos.y).forEach(unit => unit.draw(game, cx));

                    this.particles.draw(cx, game.assets, 1);
                    break;
                case 2:
                    // Scene HUD
                    this.factions.forEach(faction => faction.drawUnits(game, cx));
                    this.factions.forEach(faction => faction.draw(game, cx));
                    break;
                case 3:
                    // Game HUD

                    // Borders
                    // cx.fillStyle = '#000';
                    // cx.fillRect(0, 0, 32, game.height);
                    // cx.fillRect(0, game.height - 32, game.width, 32);

                    // Player turn
                    if (game.player.isTurn) {
                        game.player.drawSideUnits(game, cx);
                        game.player.drawButtons(game, cx);

                        const unit = game.player.cursor.selectedUnit ? game.player.cursor.selectedUnit : game.player.cursor.unit ? game.player.cursor.unit : null;
                        if (unit) game.player.cursor.drawCursorUnit(game, cx, unit);
                        if (game.player.cursor.selectedUnit) {
                            if (game.player.cursor.unitAction && !game.player.cursor.isLocked) game.player.drawAttackPreview(game, cx);
                            game.player.cursor.drawLevelUp(game, cx);
                        }
                    }

                    // Game info
                    cx.save();
                    cx.translate(0, 0);
                    cx.drawImage(game.assets.images['ui_scene'], 0, 0);
                    // Floor
                    const floorDigits = Array.from(String(Math.min(99, this.floor)), num => Number(num));
                    while (floorDigits.length < 2) floorDigits.unshift(0);
                    floorDigits.forEach((digit, i) => {
                        cx.drawImage(game.assets.images['ui_digit_lcd'], 4 * digit, 0, 4, 7, 5 + 6 * i, 5, 4, 7);
                    });
                    // Turn
                    const turnDigits = Array.from(String(Math.min(99, this.turnCount)), num => Number(num));
                    while (turnDigits.length < 2) turnDigits.unshift(0);
                    turnDigits.forEach((digit, i) => {
                        cx.drawImage(game.assets.images['ui_digit_lcd'], 4 * digit, 0, 4, 7, 5 + 6 * i, 21, 4, 7);
                    });
                    cx.restore();

                    // Start transition
                    if (this.frameCount < 30) {
                        cx.fillStyle = '#000';
                        cx.globalAlpha = 1 - this.frameCount / 30;
                        cx.fillRect(0, 0, game.width, game.height);
                    }
                    break;
            }
            cx.restore();
        }
    }
}