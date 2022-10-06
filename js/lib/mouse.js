class Mouse {
    pos = null;
    moveTimer = null;
    isMoving = false;
    click = 'up';
    hold = 0;

    constructor(ctx) {
        this.ctx = ctx;
        this.ctx.oncontextmenu = event => event.preventDefault();
        this.ctx.onmousemove = event => {
            this.pos = new Vector2(event.offsetX, event.offsetY);
            this.moveTimer = setTimeout(() => this.isMoving = false, 300);
            this.isMoving = true;
        }
        this.ctx.onmouseout = event => {
            this.pos = null;
            if (this.click === 'down') this.release(event.which);
        }
        this.ctx.onmousedown = event => this.click = event.which === 1 ? 'down' : this.click;
        this.ctx.onmouseup = event => this.release(event.which);
    }

    update = () => {
        if (['release-left', 'release-right'].includes(this.click)) {
            if (this.clickBuffer) this.clickBuffer = false;
            else {
                this.click = 'up';
                this.hold = 0;
            }
        }
        else if (this.click === 'down') this.hold++;
    }

    release = btn => {
        this.click = `release-${btn === 1 ? 'left' : 'right'}`;
        this.clickBuffer = true;
    }
}