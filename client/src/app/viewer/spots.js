import _ from 'underscore';
import math from 'mathjs';

import Vec2 from './vec2';

import opacityMixin from './graphics/opacity';
import { FilledCircle } from './graphics/circle';
import { chunksOf, combinations, intBounds, mulVec2 } from '../utils';
import {
    SPOT_COL_DEF,
    SPOT_COL_HLT,
    SPOT_OPACITY,
} from '../config';

// private members of Spot
const sdiameter = Symbol('Spot diameter');
const srpos     = Symbol('Spot render position');

class Spot extends opacityMixin(FilledCircle) {
    constructor({
        arrayPosition,
        diameter,
        newArrayPosition,
        renderPosition,
        selected,
    }) {
        super();
        this.arrayPosition = arrayPosition;
        this.newArrayPosition = newArrayPosition;
        this.renderPosition = renderPosition;
        this.diameter = diameter;
        this.selected = selected;
        this.opacity = SPOT_OPACITY;
        this.color = SPOT_COL_DEF;
    }

    get diameter() { return this[sdiameter]; }
    set diameter(value) {
        this[sdiameter] = value;
        this.r = value / 2;
    }

    get renderPosition() { return this[srpos]; }
    set renderPosition(value) {
        this[srpos] = value;
        this.x = value.x;
        this.y = value.y;
    }

    get fillColor() { return this.selected ? SPOT_COL_HLT : this.color; }
    set fillColor(value) { this.color = value; }
}

const SpotManager = (function() {

    var self;
    var SpotManager = function(camera) {
        self = this;
        self.spots = [];
        self.mask = [];
        self.maskScale = 0;
        self.maskShape = [];
        self.spacer = {};
        self.average = {};
        self.transformMatrix;
        self.spotToAdd = new Spot({
            arrayPosition: Vec2.Vec2(0, 0),
            newArrayPosition: Vec2.Vec2(0, 0),
            renderPosition: Vec2.Vec2(0, 0),
            diameter: 0,
            selected: false,
        });
    };

    SpotManager.prototype = {
        loadSpots: function(data) {
            self.spots = _.map(data.spots.positions, x => new Spot(x));
            self.spacer = data.spots.spacer;
            if (data.tissue_mask !== null) {
                self.loadMask(data.tissue_mask);
            }
            self.average.diameter = (([n, s]) => s / n)(
                _.reduce(
                    _.map(self.spots, x => x.diameter),
                    ([n, s], x) => [n + 1, s + x], [0, 0],
                ),
            );
            self.spotToAdd.diameter = self.average.diameter;
            // the 3x3 affine transformation matrix between the adjusted array and pixel coordinates
            // represented as a string in the format a11 a12 a13 a21 a22 a23 a31 a32 a33
            self.transformMatrix = math.matrix(
                chunksOf(3, _.map(
                    data.spots.transform_matrix.trim().split(' '),
                    x => parseFloat(x, 10),
                )),
            );
        },
        setSpots: function(spots) {
            self.spots = spots;
        },
        loadMask: function(mask) {
            self.mask = _.reduce(
                _.map(
                    mask.data.split(''),
                    _.compose(
                        c => _.map(
                            _.range(6, -1, -1),
                            /* eslint-disable no-bitwise */
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
            self.maskShape = mask.shape;
            self.maskScale = mask.scale;
        },
        getSpots: function() {
            return {spots: self.spots, spacer: self.spacer};
        },
        /**
         * Given a particular spot, the spot is set to selected or not depending on whether it is
         * located on the tissue or not. The threshold parameter determines the percentage of how
         * many pixels in the tissue it needs to overlap in order to be classified as being under
         * the tissue.
         */
        selectTissueSpots: function(tmat, threshold) {
            // relevant only if an HE image has been uploaded
            // adds to current selection
            _.each(
                // ignore if already selected
                _.filter(self.spots, s => s.selected === false),
                (s) => {
                    // transform coordinates to the basis of the mask
                    const center = _.map(
                        Vec2.data(
                            mulVec2(tmat, s.renderPosition),
                        ),
                        x => x * self.maskScale,
                    );
                    const radius = (s.diameter * self.maskScale) / 2;
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
                        (a, [x, y]) => [a[0] + 1, a[1] + self.mask[(y * self.maskShape[0]) + x]],
                        [0, 0],
                    );
                    /* eslint-disable no-param-reassign */
                    s.selected = inside[1] / inside[0] > threshold;
                },
            );
        },
        setSpotColor(value) {
            _.each(self.spots, (x) => { x.color = value; });
        },
        setSpotOpacity(value) {
            _.each(self.spots, (x) => { x.opacity = value; });
        },
        exportSpots(selection, transformation) {
            let header = 'x\ty\tnew_x\tnew_y\tpixel_x\tpixel_y';
            header += selection === 'all' ? '\tselection\n' : '\n';
            const data = _.reduce(
                self.spots,
                (a, x) => {
                    if (selection === 'selection' && x.selected === false) {
                        // we want to skip adding the spot if we are only exporting the selection
                        // and find that the current spot is not selected
                        return a;
                    }
                    a += `${x.arrayPosition.x}\t`;
                    a += `${x.arrayPosition.y}\t`;
                    a += `${x.newArrayPosition.x.toFixed(2)}\t`;
                    a += `${x.newArrayPosition.y.toFixed(2)}\t`;
                    let position = x.renderPosition;
                    if (transformation !== undefined) {
                        position = mulVec2(transformation, position);
                    }
                    position = Vec2.map(position, Math.round);
                    a += `${position.x}\t${position.y}`;
                    if (selection === 'all') {
                        // we add a bool 0 or 1, depending on whether the spot is selected or not
                        a += x.selected ? '\t1' : '\t0';
                    }
                    a += '\n';
                    return a;
                },
                '',
            );
            return header + data;
        },
    };

    return SpotManager;

}());

export default SpotManager;
export { Spot };
