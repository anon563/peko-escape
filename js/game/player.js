class Player extends Faction {

    constructor() {
        super();
        this.type = 'player';
        this.cursor = new Cursor();
    }

    updateControls = game => this.cursor.update(game);

    drawSideUnits = (game, cx) => {
        cx.save();
        cx.translate(0, game.height / 2 - this.units.length * 16);
        cx.drawImage(game.assets.images['ui_side'], 0, 0, 32, 4, 0, -8, 32, 4);
        this.units.forEach(unit => {
            cx.drawImage(game.assets.images['ui_unit_side'], unit === this.cursor.selectedUnit ? 32 : 0, 0, 32, 32, 0, 0, 32, 32);
            game.scene.drawUnitMugshot(game, cx, unit);
            cx.translate(0, 32);
        });
        cx.drawImage(game.assets.images['ui_side'], 0, 4, 32, 4, 0, 4, 32, 4);
        cx.restore();

        cx.save();
        cx.translate(0, game.height / 2 - this.units.length * 16);
        if (game.mouse.pos && game.mouse.pos.x < 2 * 16) {
            const top = game.height / 2 - game.player.units.length * 16;
            game.player.units.forEach((unit, i) => {
                if (game.mouse.pos.y >= top + i * 32 && game.mouse.pos.y < top + (i + 1) * 32) {
                    cx.drawImage(game.assets.images['ui_cursor_large'],
                        Math.floor(game.scene.frameCount / 20) % 2 * 40, !this.cursor.isLocked && unit !== this.cursor.selectedUnit ? 40 : 0, 40, 40,
                        -4, -4 + i * 32, 40, 40);
                }
            });
        }
        cx.restore();
    }

    drawButtons = (game, cx) => {
        
        // End turn button
        cx.save();
        cx.translate(game.width - 32, game.height - 32);
        cx.drawImage(game.assets.images['ui_end_turn'], 0, 0);
        if (game.mouse.pos && game.mouse.pos.x >= 14 * 16 && game.mouse.pos.y >= 14 * 16) {
            cx.drawImage(game.assets.images['ui_cursor_large'],
                Math.floor(game.scene.frameCount / 20) % 2 * 40, this.cursor.isLocked ? 0 : 40, 40, 40,
                -4, -4, 40, 40);
        }
        cx.restore();
    }

    drawAttackPreview = (game, cx) => {
        cx.save();
        cx.translate(0, game.height - 32);
        const action = this.cursor.unitAction;
        if (action instanceof AttackAction && action.otherUnit.health) {
            const unit = this.cursor.selectedUnit;

            const offset = Math.round(game.scene.frameCount / 20) % 3;
            cx.drawImage(game.assets.images['ui_cursor_action'],
                0, 32, 16, 16,
                173, -7 - offset, 16, 16);
            if (!unit.isFatigue && unit.fatigue >= unit.energy - unit.attack) {
                // Negate potential defense
                drawDigits(game, cx, 0, 2, new Vector2(209, 5), 'red');
            }
            if (action.otherUnit.isFatigue) {
                // Negate enemy defense
                drawDigits(game, cx, 0, 2, new Vector2(177, -11), 'red');
            } else {
                cx.drawImage(game.assets.images['ui_cursor_action'],
                    0, 0, 16, 16,
                    205, -9 + offset, 16, 16);
            }
        }
        cx.restore();
    }

    draw = (game, cx) => {
        if (this.isTurn) this.cursor.draw(game, cx);
    }
}