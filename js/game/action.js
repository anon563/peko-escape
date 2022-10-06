class Action {
    frameCount = 0;

    update = (game, unit) => this.frameCount++;
}
class MoveAction extends Action {
    duration = 10;
    i = 0;

    constructor(path) {
        super();
        this.path = path.slice(1);
    }

    update = (game, unit) => {
        if (!this.frameCount) {
            if (unit.tile.unit === unit) unit.tile.unit = null;
            unit.tile = this.path[this.i];
            if (!unit.tile.unit) unit.tile.unit = unit;
            unit.pos = unit.tile.pos;

            game.playSound('step');
            unit.move++;
            this.i++;
        }

        if (this.frameCount === this.duration) {
            if (this.i === this.path.length) unit.endAction(game, null);
            else this.frameCount = 0;
        } else this.frameCount++;
    }
}
class AttackAction extends Action {
    duration = 50;
    
    constructor(otherUnit) {
        super();
        this.otherUnit = otherUnit;
    }

    update = (game, unit) => {
        if (!this.frameCount) {
            this.otherUnit.takeDamage(game, unit);
            unit.useEnergy(game, unit.attack);
        }

        if (this.frameCount < this.duration / 2) {
            const diff = unit.tile.pos.plus(this.otherUnit.tile.pos.times(-1));
            unit.posAnim = unit.posAnim.plus(diff.times(-.2));
        }

        if (this.frameCount === this.duration) {
            let nextAction = null;
            if (unit.faction.isTurn) {
                if (!this.otherUnit.health || this.otherUnit.isFatigue) {
                    if (unit.faction === game.player) nextAction = new GainEXPAction(this.otherUnit);
                } else {
                    nextAction = new ReceiveAttackAction(this.otherUnit);
                }
            }
            unit.endAction(game, nextAction);
        }

        this.frameCount++;
    }
}
class ReceiveAttackAction extends Action {
    duration = 50;

    constructor(otherUnit) {
        super();
        this.otherUnit = otherUnit;
    }

    update = (game, unit) => {
        if (this.frameCount === this.duration) {
            let nextAction = null;
            if (unit.health) {
                if (unit.faction.isTurn) {
                    if (unit.faction === game.player) nextAction = new GainEXPAction(this.otherUnit);
                } else if (!unit.isFatigue) {
                    nextAction = new AttackAction(this.otherUnit);
                }
            }
            unit.endAction(game, nextAction);
        }

        this.frameCount++;
    }
}
class GainEXPAction extends Action {
    nextAction = null;

    constructor(otherUnit) {
        super();
        this.otherUnit = otherUnit;
    }

    update = (game, unit) => {
        if (!this.frameCount) {
            this.totalEXP = Math.min(unit.maxExperiencce, (this.otherUnit.health ? 10 : 30) + (this.otherUnit.level - unit.level) * (this.otherUnit.health ? 1 : 2));
        }

        if (this.totalEXP && !(this.frameCount % 2)) {
            unit.experience++;
            unit.experienceBarAnim = unit.experience;
            this.totalEXP--;

            if (unit.experience === unit.maxExperiencce) {
                this.nextAction = new LevelUpAction();
                unit.experienceBarAnim = 0;
                unit.experience = 0;
            }
        }
        
        if (!this.totalEXP) {
            unit.endAction(game, this.nextAction);
        } else if (!(this.frameCount % 4)) game.playSound('exp');

        this.frameCount++;
    }
}
class LevelUpAction extends Action {
    duration = 150;
    offset = 50;
    step = 10;

    update = (game, unit) => {
        if (!this.frameCount) {
            game.playSound('fanfare');
            unit.level++;
        }
        
        if (this.frameCount >= this.offset && this.frameCount <= this.offset + 5 * this.step && !((this.frameCount - this.offset) % this.step)) {
            const [stat, growthRate] = Object.entries(unit.growthRates)[(this.frameCount - this.offset) / this.step];
            if (Math.random() < growthRate) {
                game.playSound('exp');
                switch (stat) {
                    case 'fatigue':
                        if (unit.fatigue > 0) {
                            unit.fatigue--;
                            this.fatigue = true;
                        }
                        break;
                    case 'maxHealth':
                        unit.maxHealth++;
                        unit.health++;
                        this.maxHealth = true;
                        break;
                    case 'maxEnergy':
                        unit.maxEnergy++;
                        unit.energy++;
                        this.maxEnergy = true;
                        break;
                    default:
                        unit[stat]++;
                        this[stat] = true;
                        break;
                }
            }
        }

        if (this.frameCount === this.duration) {
            unit.endAction(game, null);
        }

        this.frameCount++;
    }
}