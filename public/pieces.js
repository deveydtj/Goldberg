export class Block {
    constructor(id, x, y) {
        this.id = id;
        this.type = 'block';
        this.x = x;
        this.y = y;
    }
}

export class Ramp {
    constructor(id, x, y, direction = 'right') {
        this.id = id;
        this.type = 'ramp';
        this.x = x;
        this.y = y;
        this.direction = direction;
    }
}
