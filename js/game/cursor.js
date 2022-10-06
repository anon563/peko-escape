class Cursor {
    frameCount = 0;

    unitAction = null;
    paths = null;
    path = null;
    tile = null;
    unit = null;

    canSelectUnit = false;
    selectedUnit = null;

    pos = null;
    posAnim = null;

    isLocked = false;

    constructor() {}

    selectUnit = (game, unit) => {
        game.playSound('select');
        this.selectedUnit = unit;
        this.selectedUnit.updatePaths(game);
    }

    deselectUnit = game => {
        this.selectedUnit = null;
        this.path = null;
    }

    update = game => {
        const scene = game.scene;

        this.isLocked = this.selectedUnit && (this.selectedUnit.action || this.selectedUnit.nextAction);

        // Position
        if (!this.isLocked) {
            const mousePos = !game.mouse.pos || game.mouse.pos.x < 2 * 16 || game.mouse.pos.y >= 14 * 16 || !scene.view ? null : game.mouse.pos.plus(scene.view.times(-1));
            this.pos = !mousePos ? null : new Vector2(
                mousePos.x / 16,
                mousePos.y / 16).floor();
        }

        // Animation pos
        if (this.pos) {
            if (this.posAnim && !this.posAnim.equals(this.pos)) {
                this.posAnim = this.posAnim.lerp(this.pos, .5);
                if (Math.abs(this.posAnim.x - this.pos.x) < .1) this.posAnim.x = this.pos.x;
                if (Math.abs(this.posAnim.y - this.pos.y) < .1) this.posAnim.y = this.pos.y;
            } else this.posAnim = this.pos;
        } else this.posAnim = null;

        // Tile
        const newTile = this.pos ? scene.tiles.find(tile => tile.pos.equals(this.pos)) : null;
        if (newTile !== this.tile) {
            this.tile = newTile;

            if (this.tile) {
                // Unit
                const newUnit = this.tile.unit ? this.tile.unit : null;
                if (newUnit !== this.unit) {
                    this.unit = newUnit;
                    if (this.unit) this.unit.updatePaths(game);
                }
            }
        }

        this.canSelectUnit = this.unit && this.unit.faction === game.player && this.unit !== this.selectedUnit;

        if (this.selectedUnit && game.mouse.click === 'release-right') {
            this.deselectUnit(game);
        }

        if (!this.tile && this.path) this.path = null;
        this.unitAction = null;

        if (!this.isLocked && this.tile) {

            if (this.canSelectUnit && game.mouse.click === 'release-left') {
                // Select unit
                this.selectUnit(game, this.unit);
            } else {
                // Select action
                if (this.selectedUnit) {
                    const diff = this.selectedUnit.pos.plus(this.tile.pos.times(-1));
                    const attackDiff = Math.abs(diff.x) + Math.abs(diff.y) === 1;
                    const canAttack = this.selectedUnit.energy && attackDiff && this.unit && !this.unit.action && this.unit.faction !== this.selectedUnit.faction
        
                    // Attack action
                    if (canAttack) {
                        let otherUnitAction = null;
                        this.unitAction = new AttackAction(this.unit);
                        otherUnitAction = new ReceiveAttackAction(this.selectedUnit);
                        
                        if (game.mouse.click === 'release-left') {
                            this.selectedUnit.action = this.unitAction;
                            this.unit.action = otherUnitAction;
                        }
                    }

                    // Move action
                    const pathTile = this.selectedUnit.paths.find(path => this.tile === path[path.length-1]);
                    if (!this.tile.unit && pathTile && pathTile.length - 1 <= this.selectedUnit.maxMove - this.selectedUnit.move) {
                        this.path = new Astar(game.scene.tiles, this.selectedUnit.tile.pos, this.tile.pos, true).path;
                        if (game.mouse.click === 'release-left') {
                            this.unitAction = new MoveAction(this.path);
                            this.selectedUnit.action = this.unitAction;
                            this.paths = null;
                            this.path = null;
                        }
                    } else this.path = null;
                }
            }
        }

        if (!this.isLocked) {
            // Units buttons
            if (game.mouse.pos && game.mouse.pos.x < 2 * 16) {
                const top = game.height / 2 - game.player.units.length * 16;
                game.player.units.forEach((unit, i) => {
                    if (game.mouse.pos.y >= top + i * 32 && game.mouse.pos.y < top + (i + 1) * 32 && game.mouse.click === 'release-left') {
                        if (unit !== this.selectedUnit) this.selectUnit(game, unit);
                        else this.deselectUnit(game);
                    }
                });
            }
            // End turn button
            if (game.mouse.pos && game.mouse.pos.x >= 14 * 16 && game.mouse.pos.y >= 14 * 16 && game.mouse.click === 'release-left') {
                game.playSound('select');
                this.paths = null;
                game.player.isTurn = false;
                this.selectedUnit = null;
            }
        }

        this.frameCount++;
    }

    drawLevelUp = (game, cx) => {
        if (this.selectedUnit.action instanceof LevelUpAction) {
            cx.save();
            cx.translate(game.width / 2 + 16 - 48, game.height / 2 - 16);
            cx.drawImage(game.assets.images['ui_level_up'], 0, 0);
            
            cx.fillStyle = '#000';
            ['maxHealth', 'attack', 'maxMove', 'maxEnergy', 'defense', 'fatigue'].forEach((stat, i) => {
                drawDigits(game, cx, this.selectedUnit[stat], 2, new Vector2(i < 3 ? 17 : 65, 5 + (i % 3) * 8));
                if (!this.selectedUnit.action[stat]) cx.fillRect(i < 3 ? 28 : 76, 6 + (i % 3) * 8, 13, 5);
            });
            
            cx.restore();
        }
    }

    drawUnitData = (game, cx) => {
        const unit = this.unit;

        cx.save();
        cx.translate(game.width / 2, game.height - 72);
        
        cx.drawImage(game.assets.images['ui_unit_main'], 0, 0);

        // Title
        if (unit.title) cx.drawImage(game.assets.images[unit.title], 8, 3);

        // Mugshot
        if (unit.mugshot) {
            cx.save();
            if (unit.shakeBuffer) cx.translate(Math.floor(Math.random() * 6) - 3, 0);
            cx.drawImage(game.assets.images[unit.mugshot], 52, -32 - 2);
            cx.restore();
        }
        
        // Level
        const digits = Array.from(String(Math.ceil(unit.level)), num => Number(num));
        while (digits.length < 2) digits.unshift(0);
        digits.forEach((digit, i) => {
            cx.drawImage(game.assets.images['ui_digit_lcd'], 4 * digit, 0, 4, 7, 16 + 6 * i, 27, 4, 7);
        });
        
        // Defense
        drawDigits(game, cx, unit.defense, 2, new Vector2(49, 29));

        // Attack
        drawDigits(game, cx, unit.attack, 2, new Vector2(81, 29));
        
        // Health bar
        game.scene.drawBar(cx, unit.healthBarAnim, '#ff007f',
            new Vector2(39, 22), new Vector2(20, 4),
            unit.maxHealth);

        // Health bar digits
        drawFraction(game, cx, unit.health, unit.maxHealth, 2, new Vector2(39, 16));
        
        // Energy bar
        game.scene.drawBar(cx, unit.energyBarAnim, '#00ff7f',
            new Vector2(69, 22), new Vector2(20, 4),
            unit.maxEnergy);
        
        // Fatigue
        cx.fillStyle = '#0000007f';
        cx.fillRect(69, 22, Math.round(20 * (unit.fatigue / unit.maxEnergy)), 4);
        
        // Energy bar digits
        drawFraction(game, cx, unit.energy, unit.maxEnergy, 2, new Vector2(69, 16));

        cx.restore();
    }

    drawPaths = (game, cx) => {
        const unit = this.selectedUnit ? this.selectedUnit : this.unit ? this.unit : null;
        // Unit actions
        if (unit && unit.paths) {
            cx.save();
            cx.globalAlpha = .5;
            if (unit.maxMove - unit.move > 0) {
                cx.fillStyle = '#3f3fff';
                unit.paths.forEach(path => {
                    cx.fillRect(path[path.length-1].pos.x * 16, path[path.length-1].pos.y * 16, 16, 16);
                });
            }
            if (unit.energy) {
                cx.fillStyle = '#ff3f3f';
                unit.attackTiles.forEach(attackTile => {
                    cx.fillRect(attackTile.pos.x * 16, attackTile.pos.y * 16, 16, 16);
                })
            }
            cx.restore();
        }
    }

    drawCursorUnit = (game, cx, unit) => {
        cx.save();

        cx.translate(game.width / 2 - 96, game.height - 32);

        // Back
        cx.drawImage(game.assets.images['ui_main'], 0, 0);

        // Mugshot
        game.scene.drawUnitMugshot(game, cx, unit);

        // Health bar
        game.scene.drawBar(cx, unit.healthBarAnim, '#ff007f',
            new Vector2(32, 6), new Vector2(64, 5),
            unit.maxHealth);

        // Health bar digits
        drawFraction(game, cx, unit.health, unit.maxHealth, 2, new Vector2(53, 2));

        // Energy bar
        game.scene.drawBar(cx, unit.energyBarAnim, '#00ff7f',
            new Vector2(32, 15), new Vector2(64, 5),
            unit.maxEnergy);
        
        // Fatigue
        cx.fillStyle = '#0000007f';
        cx.fillRect(32, 15, Math.round(64 * (unit.fatigue / unit.maxEnergy)), 5);

        // Energy cost preview
        if (!this.isLocked && this.unitAction) {
            const cost = this.unitAction instanceof AttackAction ? unit.attack : 0;
            if (cost && Math.floor(unit.frameCount / 4) % 2) {
                const length = Math.min(Math.round((64 * unit.energy) / unit.maxEnergy), Math.round((64 * cost) / unit.maxEnergy));
                cx.fillStyle = '#fff';
                cx.fillRect(Math.round(96 - length - (unit.maxEnergy - unit.energy) * 64 / unit.maxEnergy), 15,  length, 5);
            }
        }

        // Energy bar digits
        drawFraction(game, cx, unit.energy, unit.maxEnergy, 2, new Vector2(53, 11));

        // Experience bar
        game.scene.drawBar(cx, unit.experienceBarAnim, '#7f7fff',
            new Vector2(32, 24), new Vector2(64, 2),
            unit.maxExperiencce);

        // Experience bar digits
        drawDigits(game, cx, Math.round(unit.experienceBarAnim), 2, new Vector2(59, 22));

        // Level
        const digits = Array.from(String(Math.ceil(unit.level)), num => Number(num));
        while (digits.length < 2) digits.unshift(0);
        digits.forEach((digit, i) => {
            cx.drawImage(game.assets.images['ui_digit_lcd'], 4 * digit, 0, 4, 7, 112 + 6 * i, 6, 4, 7);
        });

        // Attack
        drawDigits(game, cx, unit.attack, 2, new Vector2(145, 5));

        // Defense
        if (unit.isFatigue) drawDigits(game, cx, 0, 2, new Vector2(177, 5), 'red');
        else drawDigits(game, cx, unit.defense, 2, new Vector2(177, 5));

        // Fatigue
        drawDigits(game, cx, unit.fatigue, 2, new Vector2(177, 13));

        // Move
        const moveValue = Math.max(0, unit.maxMove - unit.move);
        if (moveValue === unit.maxMove) drawDigits(game, cx, moveValue, 2, new Vector2(177, 21));
        else drawDigits(game, cx, moveValue, 2, new Vector2(177, 21), 'red');

        // Item
        if (unit.item) {
            cx.drawImage(game.assets.images['ui_item'], unit.item.id * 12, 0, 12, 12, 138, 14, 12, 12);
        }

        cx.restore();
    }
    
    draw = (game, cx) => {
        cx.save();

        if (game.scene.animView) cx.translate(game.scene.animView.x, game.scene.animView.y);

        if (!this.isLocked) {

            if (this.posAnim) {
                cx.save();
                cx.translate(Math.round(this.posAnim.x * 16), Math.round(this.posAnim.y * 16));
                cx.fillStyle = '#f00';
                const isActive = this.unitAction || this.canSelectUnit || this.path;
                cx.drawImage(game.assets.images['ui_cursor'],
                    Math.floor(this.frameCount / 20) % 2 * 24, isActive ? 24 : 0, 24, 24,
                    -4, -4, 24, 24);
                cx.restore();
            }

            if (this.path) {
                this.path.forEach((tile, i) => {
                    if (i === this.path.length - 1) {
                        const diff = (this.path.length === 1 ? this.selectedUnit : this.path[i - 1]).pos.plus(tile.pos.times(-1));
                        const j = this.selectedUnit.moveTiles.findIndex(a => a.equals(diff));
                        cx.drawImage(game.assets.images['ui_cursor_action'],
                            0, 16 * j, 16, 16,
                            tile.pos.x * 16, tile.pos.y * 16 + (Math.floor((this.frameCount + i * 10) / 20) % 2), 16, 16);
                    } else {
                        cx.drawImage(game.assets.images['ui_cursor_action'],
                            16, 2 * 16, 16, 16,
                            tile.pos.x * 16, tile.pos.y * 16 + (Math.floor((this.frameCount + i * 10) / 20) % 2), 16, 16);
                    }
                })
            }

            if (this.tile && this.unitAction) {
                cx.save();
                if (this.unitAction instanceof AttackAction) {
                    cx.translate(Math.floor(this.tile.pos.x) * 16, Math.floor(this.tile.pos.y) * 16);
                    const diff = this.selectedUnit.pos.plus(this.tile.pos.times(-1));
                    const offset = Math.floor(this.frameCount / 20) % 2 ? diff : new Vector2(0, 0);
                    cx.drawImage(game.assets.images['ui_cursor_action'],
                        16, 0, 16, 16,
                        0, Math.floor(this.frameCount / 20) % 2, 16, 16);
                }
                cx.restore();
            }
        }

        cx.restore();
        if (this.selectedUnit && this.unit && this.unit !== this.selectedUnit) this.drawUnitData(game, cx);
    }
}