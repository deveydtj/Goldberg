export class Block {
    constructor(id, x, y) {
        this.id = id;
        this.type = 'block';
        this.x = x;
        this.y = y;
        this.spawnTime = Date.now();
    }
}

export class Ramp {
    constructor(id, x, y, direction = 'right') {
        this.id = id;
        this.type = 'ramp';
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.spawnTime = Date.now();
    }
}

export class Fan {
    constructor(id, x, y, power = 1) {
        this.id = id;
        this.type = 'fan';
        this.x = x;
        this.y = y;
        this.power = power;
        this.spawnTime = Date.now();
    }
}

export class Spring {
    constructor(id, x, y, power = 8) {
        this.id = id;
        this.type = 'spring';
        this.x = x;
        this.y = y;
        this.power = power;
        this.spawnTime = Date.now();
    }
}

export class Ball {
    constructor(id, x, y, vx = 0, vy = 0, radius = 8) {
        this.id = id;
        this.type = 'ball';
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.radius = radius;
        this.spawnTime = Date.now();
    }
}
