import _ from 'lodash';

import { FilledCircle } from './graphics/circle';
import { Line } from './graphics/line';
import { collides } from './graphics/functions';
import {
    CALIBRATOR_LINE_COL_DEF,
    CALIBRATOR_LINE_COL_HLT,
    CALIBRATOR_LINE_WGHT,
    CALIBRATOR_GRID_COL,
    CALIBRATOR_GRID_WGHT,
    CALIBRATOR_CORNER_COL,
    CALIBRATOR_CORNER_WGHT,
} from '../config';

export const SEL = Object.freeze({
    L: 1 << 0, // left
    R: 1 << 1, // right
    T: 1 << 2, // top
    B: 1 << 3, // bottom
});

function createLines(n) {
    return _.map(
        _.range(n),
        k => new Line(
            0, 0, 0, 0,
            k === 0 || k === n - 1
                ? {
                    lineWidth: CALIBRATOR_LINE_WGHT,
                    lineColor: CALIBRATOR_LINE_COL_DEF,
                }
                : {
                    lineWidth: CALIBRATOR_GRID_WGHT,
                    lineColor: CALIBRATOR_GRID_COL,
                },
        ),
    );
}

// Calibrator private members
const arrayW = Symbol('Array width');
const arrayH = Symbol('Array height');

const sx0 = Symbol('Left coordinate');
const sx1 = Symbol('Right coordinate');
const sy0 = Symbol('Top coordinate');
const sy1 = Symbol('Bottom coordinate');

const ssel = Symbol('Selection flags');

const svlines = Symbol('Vertical lines');
const shlines = Symbol('Horizontal lines');
const scircles = Symbol('Corner circles');

class Calibrator {
    constructor() {
        this[arrayW] = Number();
        this[arrayH] = Number();

        this[sx0] = Number();
        this[sy0] = Number();
        this[sx1] = Number();
        this[sy1] = Number();

        this[ssel] = 0;

        this[svlines] = [];
        this[shlines] = [];

        this[scircles] = _.zip(
            [
                SEL.L | SEL.T,
                SEL.L | SEL.B,
                SEL.R | SEL.T,
                SEL.R | SEL.B,
            ],
            _.times(4, () => new FilledCircle(
                0, 0,
                CALIBRATOR_CORNER_WGHT,
                { fillColor: CALIBRATOR_CORNER_COL },
            )),
        );
    }

    updateGraphics() {
        /* eslint-disable no-param-reassign */
        /* eslint-disable no-multi-assign */
        _.each(
            _.zip(_.range(this.height), this[shlines]),
            ([i, x]) => {
                x.y0 = x.y1 = ((this.y1 - this.y0) *
                    (i / (this.height - 1))) + this.y0;
                x.x0 = this.x0;
                x.x1 = this.x1;
            },
        );
        _.each(
            _.zip(_.range(this.width), this[svlines]),
            ([i, x]) => {
                x.x0 = x.x1 = ((this.x1 - this.x0) *
                    (i / (this.width - 1))) + this.x0;
                x.y0 = this.y0;
                x.y1 = this.y1;
            },
        );

        _.each(
            this[scircles],
            ([corner, x]) => {
                x.x = corner & SEL.L ? this.x0 : this.x1;
                x.y = corner & SEL.T ? this.y0 : this.y1;
            },
        );
    }

    setSelection(x, y) {
        /* eslint-disable no-param-reassign */
        const collidesxy = _.partial(collides, x, y);
        const selLines = [
            [SEL.L, _.head(this[svlines])],
            [SEL.R, _.last(this[svlines])],
            [SEL.T, _.head(this[shlines])],
            [SEL.B, _.last(this[shlines])],
        ];
        this[ssel] = _.reduce(
            _.filter(
                _.concat(selLines, this[scircles]),
                ([, z]) => collidesxy(z),
            ),
            (a, [s]) => a | s,
            0,
        );
        _.each(
            selLines,
            ([s, z]) => {
                z.lineColor = this.selection & s
                    ? CALIBRATOR_LINE_COL_HLT
                    : CALIBRATOR_LINE_COL_DEF;
            },
        );
    }

    setSelectionCoordinates(x, y) {
        if (this.selection & SEL.L) { this.x0 = x; }
        if (this.selection & SEL.R) { this.x1 = x; }
        if (this.selection & SEL.T) { this.y0 = y; }
        if (this.selection & SEL.B) { this.y1 = y; }
        this.updateGraphics();
    }

    get renderables() {
        return _.concat(
            this[shlines],
            this[svlines],
            _.map(this[scircles], _.last),
        );
    }

    get selection() { return this[ssel]; }

    get points() {
        return [
            [this[sx0], this[sy0]],
            [this[sx1], this[sy1]],
        ];
    }

    set points([[x0, y0], [x1, y1]]) {
        this[sx0] = x0;
        this[sy0] = y0;
        this[sx1] = x1;
        this[sy1] = y1;
        this.updateGraphics();
    }

    get x0() { return this[sx0]; }
    get x1() { return this[sx1]; }
    get y0() { return this[sy0]; }
    get y1() { return this[sy1]; }

    set x0(v) { this[sx0] = v; this.updateGraphics(); }
    set x1(v) { this[sx1] = v; this.updateGraphics(); }
    set y0(v) { this[sy0] = v; this.updateGraphics(); }
    set y1(v) { this[sy1] = v; this.updateGraphics(); }

    get width() { return this[arrayW]; }
    get height() { return this[arrayH]; }

    set width(v) {
        this[arrayW] = v;
        this[svlines] = createLines(v);
        this.updateGraphics();
    }
    set height(v) {
        this[arrayH] = v;
        this[shlines] = createLines(v);
        this.updateGraphics();
    }
}

export default Calibrator;
