import {
    renderNxt,
    renderAdd,
    scaleAdd,
    scaleNxt,
} from './functions';

const rType = renderNxt();
const sType = scaleNxt();

const sscolor = Symbol('Line color');
const sswidth = Symbol('Line width');
const ssdash  = Symbol('Line dash');

const sscale = Symbol('Line scale');

const strokeMixin = s => class extends s {
    static rtype() { return rType; }
    static stype() { return sType; }

    constructor(kwargs = {}) {
        super(kwargs);

        const { lineDash, lineColor, lineWidth } = kwargs;

        this.lineDash = lineDash || [];
        this.lineColor = lineColor || 'black';
        this.lineWidth = lineWidth || 1;

        const { scale } = kwargs;
        this[sscale] = scale || 1;
    }

    get lineColor() { return this[sscolor]; }
    get lineWidth() { return this[sswidth]; }
    get lineDash() { return this[ssdash]; }

    set lineColor(value) { this[sscolor] = value; }
    set lineWidth(value) { this[sswidth] = value; }
    set lineDash(value) { this[ssdash] = value; }

    get scale() { return this[sscale]; }
};

renderAdd(
    rType,
    (ctx, x) => {
        ctx.strokeStyle = x.lineColor;
        ctx.lineWidth = x.scale * x.lineWidth;
        ctx.setLineDash(x.lineDash.map(a => a * x.scale));
        ctx.stroke();
    },
);

scaleAdd(
    sType,
    /* eslint-disable no-param-reassign */
    (scale, line) => { line[sscale] = scale; },
);

export default strokeMixin;
