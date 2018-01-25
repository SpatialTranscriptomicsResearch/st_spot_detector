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
        this.strokeDash = [];
        this.strokeColor = 'black';
        this.strokeWidth = 1;
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
        ctx.strokeStyle = x.strokeColor;
        ctx.lineWidth = x.strokeWidth;
        ctx.setLineDash(x.strokeDash);
        ctx.stroke();
    },
);

export default strokeMixin;
