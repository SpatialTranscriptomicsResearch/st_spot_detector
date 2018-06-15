import {
    renderNxt,
    renderAdd,
} from './functions';

const orType = renderNxt();

const sopacity = Symbol('Opacity');

const opacityMixin = s => class extends s {
    static rtype() { return orType; }
    constructor(...args) {
        super(...args);
        this.opacity = 1;
    }
    get opacity() { return this[sopacity]; }
    set opacity(value) { this[sopacity] = value; }
};

renderAdd(orType, (ctx, x) => { ctx.globalAlpha = x.opacity; });

export default opacityMixin;
