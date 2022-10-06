class Unit extends Actor {
    maxExperiencce = 100;
    // maxExperiencce = 10;
    experienceBarAnim = 0;
    experience = 0;

    level = 1;
    shakeBuffer = 0;

    move = 0;

    action = null;

    // item = new Item(CARROT_ITEM);

    attackRange = 1;
    moveTiles = [
        new Vector2(0, -1),
        new Vector2(1, 0),
        new Vector2(0, 1),
        new Vector2(-1, 0)
    ];

    faction = null;

    paths = null;

    constructor(data) {
        super();
        Object.entries(data).forEach(([key, value]) => this[key] = value);
        Object.entries(this.baseStats).forEach(([key, value]) => {
            switch (key) {
                case 'maxHealth':
                    this.healthBarAnim = value;
                    this.maxHealth = value;
                    this.health = value;
                    break;
                case 'maxEnergy':
                    this.energyBarAnim = value;
                    this.maxEnergy = value;
                    this.energy = value;
                    break;
                default:
                    this[key] = value;
                    break;
            }
        });
    }

    updatePaths = game => {
        this.paths = game.scene.tiles.map(tile => {
            const astar = new Astar(game.scene.tiles, this.pos, tile.pos, true);
            return astar.isSolvable && astar.path.length ? astar.path : null;
        }).filter(path => path !== null);

        const moveTiles = this.paths.map(a => a[a.length-1]);
        const attackTiles = [];
        moveTiles.forEach(moveTile => {
            [new Vector2(0, -1), new Vector2(1, 0), new Vector2(0, 1), new Vector2(-1, 0)].forEach(direction => {
                const neighbor = game.scene.tiles.find(tile => tile.pos.x === moveTile.pos.x + direction.x && tile.pos.y === moveTile.pos.y + direction.y);
                if (neighbor && neighbor.unit !== this && neighbor.floor !== '--' && !moveTiles.includes(neighbor)) attackTiles.push(neighbor);
            });
        });
        this.attackTiles =  [...new Set(attackTiles)];

    }

    takeDamage = (game, other) => {
        const otherUnit = other instanceof Unit ? other : null;

        const damage = otherUnit ? otherUnit.attack : other;

        this.health = Math.max(0, this.health - (this.isFatigue ? damage : Math.max(0, damage - this.defense)));

        if (otherUnit) {
            game.scene.particles.ray(this.pos.times(16).plus(new Vector2(8, 8)));
            game.scene.particles.impact(this.pos.times(16).plus(new Vector2(8, 8)));
        }
        
        this.shakeBuffer = 16;
        game.playSound('damage');
    }

    useEnergy = (game, cost) => {
        this.energy -= cost;
        if (this.energy < 0) {
            // this.takeDamage(game, -this.energy);
            this.energy = 0;
        }
    }

    endAction = (game, nextAction) => {
        this.action = nextAction;
        this.updatePaths(game);

        if (!this.health) {
            // Death
            this.tile.unit = null;
            this.tile = null;

            game.scene.units = game.scene.units.filter(a => a !== this);
            this.faction.units = this.faction.units.filter(a => a !== this);
            if (this.faction.unit === this) this.faction.unit = null;
            if (this.faction.isTurn && this.faction.units.length) this.faction.unit = this.faction.units[0];
            
            if (this === game.player.cursor.selectedUnit) {
                game.player.cursor.selectedUnit = null;
            }

            if (this === game.player.cursor.unit) {
                game.player.cursor.unit = null;
            }
        }
    }

    update = game => {
        const scene = game.scene;
        this.isFatigue = this.fatigue >= this.energy;

        if (this.action) this.action.update(game, this);

        // Position animation
        if (!this.posAnim.equals(this.pos)) {
            if (this.action instanceof MoveAction && Math.random() > .75) scene.particles.smoke_white(this.posAnim.times(16).plus(new Vector2(8, 8)), new Vector2(0, 0), 0);

            this.posAnim = this.posAnim.lerp(this.pos, .2);
            if (Math.abs(this.posAnim.x - this.pos.x) < .01) this.posAnim.x = this.pos.x;
            if (Math.abs(this.posAnim.y - this.pos.y) < .01) this.posAnim.y = this.pos.y;
        }

        // HUD animations
        ['health', 'energy', 'experience'].forEach(stat => {
            this[`${stat}BarAnim`] = (1 - .1) * this[`${stat}BarAnim`] + .1 * this[stat];
            if (Math.abs(this[`${stat}BarAnim`] - this[stat]) < .1) this[`${stat}BarAnim`] = this[stat];
        });

        if (this.shakeBuffer) this.shakeBuffer--;
        this.frameCount++;
    }

    draw = (game, cx) => {
        cx.save();
        cx.translate(Math.round(this.posAnim.x * 16) + 4, Math.round(this.posAnim.y * 16) + 6);
        if (this.shakeBuffer) cx.translate(Math.floor(Math.random() * 6) - 3, 0);
        cx.drawImage(game.assets.images[this.sprite], (Math.floor(this.frameCount / 20) % 2) * 24, 0, 24, 24, -8, -18, 24, 24);
        cx.restore();
    }
}