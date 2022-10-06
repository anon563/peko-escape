class Computer extends Faction {

    unitIndex = 0;
    waitFrame = 50;

    constructor(type) {
        super(type);
    }

    switchUnit = () => {
        this.unitIndex++;
        this.waitFrame = 50;
        if (this.unitIndex < this.units.length) {
            this.unit = this.units[this.unitIndex];
        } else {
            this.unitIndex = 0;
            this.isTurn = false;
        }
    }

    updateControls = game => {

        if (this.waitFrame) {
            this.waitFrame--;
            return;
        }

        if (!this.unit) this.unit = this.units[this.unitIndex];

        if (this.unit.action || this.unit.nextAction) return;

        //get target
        let target = null;
        game.player.units.forEach(unit => {
            const astar = new Astar(game.scene.tiles, this.unit.tile.pos, unit.tile.pos);
            if (astar.isSolvable && (!target || target.length > astar.path.length)) {
                target = astar.path;
            }
        });

        if (target) {
            // Attack action
            if (target.length === 2 && this.unit.energy - this.unit.attack > this.unit.fatigue) {
                const otherUnit = target[1].unit;
                this.unit.action = new AttackAction(otherUnit);
                otherUnit.action = new ReceiveAttackAction(this.unit);
            } else if (this.unit.maxMove - this.unit.move) {
                const maxDist = Math.min(this.unit.maxMove - this.unit.move + 1, target.length);
                let path = null;
                for (let i = 0; i < maxDist; i++) {
                    if (!target[i].unit) path = target.slice(0, i+1);
                }
                if (path) this.unit.action = new MoveAction(path);
                else this.switchUnit();
            } else {
                this.switchUnit();
            }
        } else this.switchUnit();
        //if full energy, attack

        //if not full energy but enemy soon dead, attack even if fatigue

        //if not last unit, increment index
        
        // else end turn

        // this.isTurn = false;
    }
}