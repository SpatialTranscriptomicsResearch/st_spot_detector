/**
 * @module filter
 */

/* eslint-disable no-param-reassign */
// (filters need to be applied in-place for efficiency.)

class Filter {
    constructor() {
        if (new.target === Filter) {
            throw new TypeError(
                'Call of new on abstract class Filter not allowed.');
        }
    }

    /* eslint-disable class-methods-use-this */
    apply(/* data,  histogram,  parameters */) {
        throw new Error('Abstract method not implemented.');
    }
}

class Brightness extends Filter {
    /* eslint-disable no-plusplus */
    apply(d, h, p) {
        if (p === 0) {
            return;
        }
        const k = Math.exp(-p);
        const brightness = v => 255 / (1 + (((255 / v) - 1) * k));
        for (let i = 0; i < d.length;) {
            d[i] = brightness(d[i++]);
            d[i] = brightness(d[i++]);
            d[i] = brightness(d[i++]);
            i++; // ignore alpha channel
        }
    }
}

class Contrast extends Filter {
    /* eslint-disable no-plusplus */
    apply(d, h, p) {
        if (p === 0) {
            return;
        }
        const k = Math.exp(p);
        const contrast = v => 255 / (1 + (((255 / v) - 1) ** k));
        for (let i = 0; i < d.length;) {
            d[i] = contrast(d[i++]);
            d[i] = contrast(d[i++]);
            d[i] = contrast(d[i++]);
            i++; // ignore alpha channel
        }
    }
}

class Equalize extends Filter {
    /* eslint-disable no-plusplus */
    apply(d, h, p) {
        if (p === false) {
            return;
        }
        for (let i = 0; i < d.length;) {
            d[i] = Math.floor(255 * h[0][d[i++]]);
            d[i] = Math.floor(255 * h[1][d[i++]]);
            d[i] = Math.floor(255 * h[2][d[i++]]);
            i++; // ignore alpha channel
        }
    }
}

export default Object.freeze({
    brightness: new Brightness(),
    contrast: new Contrast(),
    equalize: new Equalize(),
});
