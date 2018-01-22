import math from 'mathjs';

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
const sx = Symbol('Circle first coordinate');
const sy = Symbol('Circle second coordinate');
const sr = Symbol('Circle radius');

const circleMixin = s => class extends s {
    static ctype() { return cType; }
    static rtype() { return rType; }

    constructor(x, y, r) {
        super();
        this[sx] = x;
        this[sy] = y;
        this[sr] = r;
    }

    get sx() { return this[sx]; }
    get sy() { return this[sy]; }
    get sr() { return this[sr]; }

    set sx(value) { this[sx] = value; }
    set sy(value) { this[sy] = value; }
    set sr(value) { this[sr] = value; }
};

renderAdd(
    rType,
    (ctx, circle) => {
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.r, -Math.PI, Math.PI);
        ctx.closePath();
    },
);

collidesAdd(
    cType,
    (x, y, circle) => {
        const v = math.subtract([x, y], [circle.x, circle.y]);
        return math.dot(v, v) < circle.r * circle.r;
    },
);

const FilledCircle = circleMixin(fillMixin(GraphicsObject));
const StrokedCircle = circleMixin(strokeMixin(GraphicsObject));

export default circleMixin;
export {
    FilledCircle,
    StrokedCircle,
};
