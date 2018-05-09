import math from 'mathjs';

import GraphicsObject from './graphics-object';
import strokeMixin from './stroke';
import {
    collidesAdd,
    collidesNxt,
    renderAdd,
    renderNxt,
} from './functions';

const cType = collidesNxt();
const rType = renderNxt();

// private members of lineMixin
const sx0 = Symbol('Line coordinate 1 of point 1');
const sy0 = Symbol('Line coordinate 2 of point 1');
const sx1 = Symbol('Line coordinate 1 of point 2');
const sy1 = Symbol('Line coordinate 2 of point 2');

const lineMixin = s => class extends strokeMixin(s) {
    static ctype() { return cType; }
    static rtype() { return rType; }

    constructor(x0, y0, x1, y1, kwargs) {
        super(kwargs);
        this.x0 = x0;
        this.y0 = y0;
        this.x1 = x1;
        this.y1 = y1;
    }

    get x0() { return this[sx0]; }
    get x1() { return this[sx1]; }
    get y0() { return this[sy0]; }
    get y1() { return this[sy1]; }

    set x0(value) { this[sx0] = value; }
    set x1(value) { this[sx1] = value; }
    set y0(value) { this[sy0] = value; }
    set y1(value) { this[sy1] = value; }
};

renderAdd(
    rType,
    (ctx, line) => {
        ctx.beginPath();
        ctx.moveTo(line.x0, line.y0);
        ctx.lineTo(line.x1, line.y1);
    },
);

collidesAdd(
    cType,
    (x, y, line) => {
        /* eslint-disable no-multi-spaces, array-bracket-spacing, yoda */
        const v0 = math.subtract(
            [line.x1, line.y1],
            [line.x0, line.y0],
        );
        const v1 = math.subtract(
            [      x,       y],
            [line.x0, line.y0],
        );
        const c = math.dot(v0, v1) / math.dot(v0, v0);
        const v2 = math.subtract(v1, math.multiply(c, v0));
        return (0 <= c && c <= 1) &&
            math.dot(v2, v2) < (line.scale * line.lineWidth) ** 2;
    },
);

const Line = lineMixin(GraphicsObject);

export default lineMixin;
export { Line };
