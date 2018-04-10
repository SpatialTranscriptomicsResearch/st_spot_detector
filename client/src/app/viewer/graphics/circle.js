import math from 'mathjs';

import GraphicsObject from './graphics-object';
import fillMixin from './fill';
import strokeMixin from './stroke';
import {
    collidesAdd,
    collidesNxt,
    renderAdd,
    renderNxt,
    scaleAdd,
    scaleNxt,
} from './functions';

const cType = collidesNxt();
const rType = renderNxt();
const sType = scaleNxt();

// private members of circleMixin
const sx = Symbol('Circle first coordinate');
const sy = Symbol('Circle second coordinate');
const sr = Symbol('Circle radius');

const sscale = Symbol('Circle scale factor');

const circleMixin = s => class extends s {
    static ctype() { return cType; }
    static rtype() { return rType; }
    static stype() { return sType; }

    constructor(x, y, r, kwargs = {}) {
        super(kwargs);

        this[sx] = x;
        this[sy] = y;
        this[sr] = r;

        const { scale } = kwargs;
        this[sscale] = scale || 1;
    }

    get x() { return this[sx]; }
    get y() { return this[sy]; }
    get r() { return this[sr]; }

    set x(value) { this[sx] = value; }
    set y(value) { this[sy] = value; }
    set r(value) { this[sr] = value; }

    get scale() { return this[sscale]; }
};

renderAdd(
    rType,
    (ctx, circle) => {
        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle[sscale] * circle.r, -Math.PI, Math.PI);
        ctx.closePath();
    },
);

collidesAdd(
    cType,
    (x, y, circle) => {
        const v = math.subtract([x, y], [circle.x, circle.y]);
        return math.dot(v, v) < (circle.scale * circle.r) ** 2;
    },
);

scaleAdd(
    sType,
    /* eslint-disable no-param-reassign */
    (scale, circle) => { circle[sscale] = scale; },
);

const FilledCircle = circleMixin(fillMixin(GraphicsObject));
const StrokedCircle = circleMixin(strokeMixin(GraphicsObject));

export default circleMixin;
export {
    FilledCircle,
    StrokedCircle,
};
