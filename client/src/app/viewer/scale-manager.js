/** @module scale-manager */

import _ from 'underscore';

// private members
const level = Symbol('Current tile level');
const levels = Symbol('Tile levels');

/**
 * Manages the scaling of a canvas layer.
 */
class ScaleManager {
    constructor(tileLevels) {
        this[level] = Number();
        this[levels] = Array(...tileLevels);
        this[levels] = _.sortBy(this[levels], _.id);
    }

    level(cameraLevel) {
        if (cameraLevel !== undefined) {
            let a = 1;
            let b = this[levels].length;
            while (b > a) {
                const c = Math.floor((a + b) / 2);
                if (this[levels][c] > cameraLevel) {
                    b = c;
                } else {
                    a = c + 1;
                }
            }
            this[level] = this[levels][a - 1];
        }
        return this[level];
    }
}

export default ScaleManager;
