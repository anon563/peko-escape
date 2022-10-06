class Astar {
    isSolvable = null;
    closedSet = [];
    path = [];

    cost = 0;

    directions = [
        new Vector2(0, -1),
        new Vector2(1, 0),
        new Vector2(0, 1),
        new Vector2(-1, 0)
    ];

    constructor(tiles, startPos, endPos, unitBound) {
        this.grid = tiles.map(tile => ({ f:0, g:0, h:0, parent:null, neighbors:[], tile: tile }));
        this.grid.forEach(cell => {
            this.directions.forEach(direction => {
                const neighbor = this.grid.find(neighbor => neighbor.tile.pos.x === cell.tile.pos.x + direction.x && neighbor.tile.pos.y === cell.tile.pos.y + direction.y);
                if (neighbor) cell.neighbors.push(neighbor);
            });
        });

        this.gridStart = this.grid.find(cell => cell.tile.pos.equals(startPos));
        this.gridEnd = this.grid.find(cell => cell.tile.pos.equals(endPos));
        this.openSet = [this.gridStart];

        this.unitBound = unitBound;
        // this.maxLength = this.gridStart.tile.unit.maxMove - this.gridStart.tile.unit.move + this.gridStart.tile.unit.attackRange;
        this.maxLength = this.gridStart.tile.unit.maxMove - this.gridStart.tile.unit.move;

        this.search();
        this.path = this.path.map(cell => cell.tile);
        this.path = this.path.reverse();
    }

    search = () => {
        if (this.openSet.length > 0) {
            var pathIndex = 0;
            this.openSet.forEach((cell, key) => {
                if (cell.f < this.openSet[pathIndex].f) pathIndex = key;
            });
            var currentCell = this.openSet[pathIndex];

            if (currentCell === this.gridEnd) this.isSolvable = true;
            else {
                this.removeFromArray(this.openSet, currentCell);
                this.closedSet.push(currentCell);

                currentCell.neighbors.forEach(neighbor => {
                    if (!this.closedSet.includes(neighbor) && neighbor.tile.floor !== '--' && (!this.unitBound || (!(neighbor.tile.unit && neighbor.tile.unit.faction !== this.gridStart.tile.unit.faction) && this.path.length + 1 <= this.maxLength))) {
                        var g = currentCell.g + 1;

                        if (this.openSet.includes(neighbor)) {
                            if (g < neighbor.g) neighbor.g = g;
                        }
                        else {
                            neighbor.g = g;
                            this.openSet.push(neighbor);
                        }

                        neighbor.h = this.heuristic(neighbor.tile.pos, this.gridEnd.tile.pos);
                        neighbor.f = neighbor.g + neighbor.h;
                        neighbor.parent = currentCell;
                    }
                });
            }

            var path = [];
            var cell = currentCell;
            path.push(cell);

            var findPath = () => {
                path.push(cell.parent);
                cell = cell.parent;
                if (cell.parent) findPath();
            }
            if (cell.parent) findPath();
            this.path = path;
        } else this.isSolvable = false;

        if (this.isSolvable === null) this.search();
    }

    heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

    removeFromArray = (array, element) => {
        for (let i = array.length-1; i >= 0 ; i--) {
            if (array[i] === element) array.splice(i, 1);
        }
    }
}