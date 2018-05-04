import _ from 'lodash';
import math from 'mathjs';

import Vec2 from './vec2';

import opacityMixin from './graphics/opacity';
import { FilledCircle } from './graphics/circle';
import { combinations, intBounds, mulVec2 } from '../utils';
import {
    SPOT_COL_DEF,
    SPOT_COL_HLT,
    SPOT_OPACITY,
} from '../config';


// private members of Spot
const sdiameter = Symbol('Spot diameter');
const srpos     = Symbol('Spot render position');
const sselected = Symbol('Selected');
const sselectcb = Symbol('Selection callback');

class Spot extends opacityMixin(FilledCircle) {
    constructor({
        position,
        diameter,
        selectcb,
    }) {
        super();
        this.position = position;
        this.diameter = diameter;
        this[sselectcb] = selectcb;
        this[sselected] = false;
        this.opacity = SPOT_OPACITY;
        this.color = SPOT_COL_DEF;
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

    set x(v) { this[srpos].x = v; super.x = v; }
    get x() { return super.x; }
    set y(v) { this[srpos].y = v; super.y = v; }
    get y() { return super.y; }

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
        this.selectcb = (s, v) => {
            if (v) {
                this.selected.add(s);
            } else {
                this.selected.delete(s);
            }
        };
        this[sspots] = [];
        this.spotToAdd = new Spot({
            diameter: 0,
            position: { x: 0, y: 0 },
            selectcb: this.selectcb,
        });
    }

    get spotsMutable() { return this[sspots]; }
    get spots() { return _.cloneDeep(this[sspots]); }
    set spots(xs) {
        this[sspots] = xs;
        this.selected.clear();
        _.each(xs, (x) => {
            if (x.selected) {
                this.selected.add(x);
            }
        });
    }

    loadSpots(spots, tissueMask) {
        const avgDiameter = math.sum(
            _.filter(_.map(spots, _.last), x => x > 0),
        ) / spots.length;
        this.spots = _.map(
            spots,
            ([x, y, d]) => new Spot({
                position: { x, y },
                diameter: d > 0 ? d : avgDiameter,
                selectcb: this.selectcb,
            }),
        );
        if (tissueMask !== null) {
            this.loadMask(tissueMask);
        }
        this.avgDiameter = avgDiameter;
        this.spotToAdd.diameter = avgDiameter;
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

    setSpotColor(value) {
        _.each(this.spotsMutable, (x) => { x.color = value; });
    }

    setSpotOpacity(value) {
        _.each(this.spotsMutable, (x) => { x.opacity = value; });
    }
}

export default SpotManager;
export { Spot };
