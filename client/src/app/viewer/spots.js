import _ from 'lodash';
import math from 'mathjs';

import Vec2 from './vec2';

import opacityMixin from './graphics/opacity';
import { FilledCircle } from './graphics/circle';
import { combinations, intBounds, mulVec2 } from '../utils';
import {
    SPOT_COL_DEF,
    SPOT_COL_HLT,
    SPOT_OPACITY_DEF,
} from '../config';


// private members of Spot
const sassign   = Symbol('Array assignment');
const scolor    = Symbol('Color getter');
const sopacity  = Symbol('Opacity getter');
const sdiameter = Symbol('Spot diameter');
const srpos     = Symbol('Spot render position');
const sselected = Symbol('Selected');
const sselectcb = Symbol('Selection callback');

class Spot extends opacityMixin(FilledCircle) {
    constructor({
        position,
        diameter,
        selectcb,
        getcolor,
        getopacity,
    }) {
        super();
        this.position = position;
        this.diameter = diameter;
        this[sselectcb] = selectcb;
        this[sselected] = false;
        this[sopacity] = getopacity;
        this[scolor] = getcolor;
        this[sassign] = {};
    }

    get diameter() { return this[sdiameter]; }
    set diameter(value) {
        this[sdiameter] = value;
        this.r = value / 2;
    }

    get position() { return this[srpos]; }
    set position(value) {
        this[srpos] = value;
        this.x = value.x;
        this.y = value.y;
    }

    get assignment() { return this[sassign]; }
    set assignment({ x, y }) { this[sassign] = { x, y }; }

    set x(v) { this[srpos].x = v; super.x = v; }
    get x() { return super.x; }
    set y(v) { this[srpos].y = v; super.y = v; }
    get y() { return super.y; }

    get color() { return this[scolor](); }
    get opacity() { return this[sopacity](); }

    /* eslint-disable class-methods-use-this */
    set color(v) { /* can't be set */ }
    set opacity(v) { /* can't be set */ }

    get fillColor() { return this.selected ? SPOT_COL_HLT : this.color; }
    set fillColor(value) { this.color = value; }

    set selected(v) {
        this[sselected] = v;
        this[sselectcb](this, v);
    }
    get selected() { return this[sselected]; }
}


// private members of SpotManager
const sspots = Symbol('Spots');

class SpotManager {
    constructor() {
        this.mask = [];
        this.maskScale = 0;
        this.maskShape = [];
        this.avgDiameter = Number();
        this.selected = new Set();
        this[sspots] = [];
        this.color = SPOT_COL_DEF;
        this.opacity = SPOT_OPACITY_DEF;
    }

    get spotsMutable() { return this[sspots]; }
    get spots() { return _.cloneDeep(this[sspots]); }
    set spots(xs) {
        this[sspots].splice(0, this[sspots].length, ...xs);
        this.selected.clear();
        _.each(xs, (x) => {
            if (x.selected) {
                this.selected.add(x);
            }
        });
    }

    createSpot(x = 0, y = 0, d = 0) {
        return new Spot({
            diameter: d > 0 ? d : this.avgDiameter,
            position: { x, y },
            selectcb: (s, v) => {
                if (v) {
                    this.selected.add(s);
                } else {
                    this.selected.delete(s);
                }
            },
            getcolor: () => this.color,
            getopacity: () => this.opacity,
        });
    }

    loadSpots(spots, tissueMask) {
        const ds = _.filter(_.map(spots, _.last), x => x > 0);
        this.avgDiameter = math.sum(ds) / ds.length;
        this.spots = _.map(spots, props => this.createSpot(...props));
        if (tissueMask) {
            this.loadMask(tissueMask);
        }
    }

    setSpots(spots) {
        this.spots = spots;
    }

    loadMask(mask) {
        this.mask = _.reduce(
            _.map(
                mask.data.split(''),
                _.flowRight(
                    c => _.map(
                        _.range(6, -1, -1),
                        i => (c & (1 << i)) !== 0,
                    ),
                    c => c.charCodeAt(0),
                ),
            ),
            (a, x) => {
                a.push(...x);
                return a;
            },
            [],
        );
        this.maskShape = mask.shape;
        this.maskScale = mask.scale;
    }

    getSpots() {
        return { spots: this.spots, spacer: 20 };
    }

    /**
     * Given a particular spot, the spot is set to selected or not depending on whether it is
     * located on the tissue or not. The threshold parameter determines the percentage of how
     * many pixels in the tissue it needs to overlap in order to be classified as being under
     * the tissue.
     */
    selectTissueSpots(tmat, threshold) {
        // relevant only if an HE image has been uploaded
        // adds to current selection
        _.each(
            // ignore if already selected
            _.filter(this.spotsMutable, s => s.selected === false),
            (s) => {
                // transform coordinates to the basis of the mask
                const center = _.map(
                    Vec2.data(
                        mulVec2(tmat, s.position),
                    ),
                    x => x * this.maskScale,
                );
                const radius = (s.diameter * this.maskScale) / 2;
                const inside = _.reduce(
                    _.filter(
                        // check all (x, y) in the bounding box of the spot
                        combinations(
                            ..._.map(center, (c) => {
                                const bounds = intBounds([c], radius)[0];
                                return _.range(bounds[0], bounds[1] + 1);
                            }),
                        ),
                        // but discard those more than `radius` away
                        ([x, y]) => Math.sqrt(
                            ((x - center[0]) ** 2) + ((y - center[1]) ** 2)) < radius,
                    ),
                    (a, [x, y]) => [a[0] + 1, a[1] + this.mask[(y * this.maskShape[0]) + x]],
                    [0, 0],
                );
                /* eslint-disable no-param-reassign */
                s.selected = inside[1] / inside[0] > threshold;
            },
        );
    }
}

export default SpotManager;
export { Spot };
