import {
    renderNxt,
    renderAdd,
} from './functions';

const srType = renderNxt();

const sscolor = Symbol('Line color');
const sswidth = Symbol('Line width');
const ssdash  = Symbol('Line dash');

const strokeMixin = s => class extends s {
    static rtype() { return srType; }
    constructor(...args) {
        super(...args);
        this.lineDash = [];
        this.lineColor = 'black';
        this.lineWidth = 1;
    }
    get lineColor() { return this[sscolor]; }
    get lineWidth() { return this[sswidth]; }
    get lineDash() { return this[ssdash]; }
    set lineColor(value) { this[sscolor] = value; }
    set lineWidth(value) { this[sswidth] = value; }
    set lineDash(value) { this[ssdash] = value; }
};

renderAdd(
    srType,
    (ctx, x) => {
        ctx.strokeStyle = x.lineColor;
        ctx.lineWidth = x.scale * x.lineWidth;
        ctx.setLineDash(x.lineDash.map(a => a * x.scale));
        ctx.stroke();
    },
);

export default strokeMixin;
