import GraphicsObject from './graphics-object';
import fillMixin from './fill';
import strokeMixin from './stroke';
import {
    collidesAdd,
    collidesNxt,
    renderAdd,
    renderNxt,
} from './functions';

const cType = collidesNxt();
const rType = renderNxt();

// private members of circleMixin
const sx0 = Symbol('Rectangle top-left first coordinate');
const sy0 = Symbol('Rectangle top-left second coordinate');
const sx1 = Symbol('Rectangle bottom-right first coordinate');
const sy1 = Symbol('Rectangle bottom-right second coordinate');

const rectangleMixin = s => class extends s {
    static ctype() { return cType; }
    static rtype() { return rType; }

    constructor(x0, y0, x1, y1, ...args) {
        super(...args);
        this[sx0] = x0;
        this[sy0] = y0;
        this[sx1] = x1;
        this[sy1] = y1;
    }

    get x0() { return this[sx0]; }
    get y0() { return this[sy0]; }
    get x1() { return this[sx1]; }
    get y1() { return this[sy1]; }

    set x0(value) { this[sx0] = value; }
    set y0(value) { this[sy0] = value; }
    set x1(value) { this[sx1] = value; }
    set y1(value) { this[sy1] = value; }

    get topLeft() {
        return [Math.min(this.x0, this.x1), Math.min(this.y0, this.y1)];
    }
    get bottomRight() {
        return [Math.max(this.x0, this.x1), Math.max(this.y0, this.y1)];
    }

    set topLeft([x, y]) {
        if (this.x0 < this.x1) this.x0 = x; else this.x1 = x;
        if (this.y0 < this.y1) this.y0 = y; else this.y1 = y;
    }
    set bottomRight([x, y]) {
        if (this.x0 > this.x1) this.x0 = x; else this.x1 = x;
        if (this.y0 > this.y1) this.y0 = y; else this.y1 = y;
    }
};

renderAdd(
    rType,
    (ctx, r) => {
        const [x0, y0] = r.topLeft;
        const [x1, y1] = r.bottomRight;
        ctx.rect(x0, y0, x1 - x0, y1 - y0);
    },
);

collidesAdd(
    cType,
    (x, y, r) => {
        const [x0, y0] = r.topLeft;
        const [x1, y1] = r.bottomRight;
        return x0 <= x && x <= x1 && y0 <= y && y <= y1;
    },
);

const FilledRectangle = rectangleMixin(fillMixin(GraphicsObject));
const StrokedRectangle = rectangleMixin(strokeMixin(GraphicsObject));

export default rectangleMixin;
export {
    FilledRectangle,
    StrokedRectangle,
};
