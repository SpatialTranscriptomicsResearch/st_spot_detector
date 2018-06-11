import {
    renderNxt,
    renderAdd,
} from './functions';

const frType = renderNxt();

const sfcolor = Symbol('Fill color');

const fillMixin = s => class extends s {
    static rtype() { return frType; }
    constructor(kwargs = {}) {
        super(kwargs);
        const { fillColor } = kwargs;
        this.fillColor = fillColor || 'black';
    }
    get fillColor() { return this[sfcolor]; }
    set fillColor(value) { this[sfcolor] = value; }
};

renderAdd(
    frType,
    (ctx, x) => {
        ctx.fillStyle = x.fillColor;
        ctx.fill();
    },
);

export default fillMixin;
