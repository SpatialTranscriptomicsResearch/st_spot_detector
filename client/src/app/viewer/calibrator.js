import _ from 'lodash';
import math from 'mathjs';

import { FilledCircle } from './graphics/circle';
import { Line } from './graphics/line';
import { collides } from './graphics/functions';
import {
    CALIBRATOR_LINE_COL_DEF,
    CALIBRATOR_LINE_COL_HLT,
    CALIBRATOR_LINE_DASH,
    CALIBRATOR_LINE_WGHT,
    CALIBRATOR_CORNER_COL,
    CALIBRATOR_CORNER_WGHT,
} from '../config';

// Calibrator private members
const arrayW            = Symbol('Calibrator array width');
const arrayH            = Symbol('Calibrator array height');

const sx0               = Symbol('Calibrator left coordinate');
const sx1               = Symbol('Calibrator right coordinate');
const sy0               = Symbol('Calibrator top coordinate');
const sy1               = Symbol('Calibrator bottom coordinate');

const ssel              = Symbol('Calibrator selection flags');
const sselAnnotation    = Symbol('Calibrator selection annotation');
const sselBoundsSetters = Symbol('Calibrator selection bounds setters');

const slines            = Symbol('Calibrator lines');
const slineSelSetters   = Symbol('Calibrator line selection setters');

const scircles          = Symbol('Calibrator corner circles');
const scircleSelSetters = Symbol('Calibrator corner circle selection setters');

class Calibrator {
    constructor() {
        this[arrayW] = Number();
        this[arrayH] = Number();

        this[sx0] = Number();
        this[sy0] = Number();
        this[sx1] = Number();
        this[sy1] = Number();

        this[ssel] = new Array(4);

        this[sselAnnotation] = ['l', 'r', 't', 'b'];

        this[sselBoundsSetters] = [
            /* eslint no-unused-vars: 0 */
            (x, y) => { this[sx0] = x; },
            (x, y) => { this[sx1] = x; },
            (x, y) => { this[sy0] = y; },
            (x, y) => { this[sy1] = y; },
        ];

        this[slines] = _.times(
            4,
            () => new Line(0, 0, 0, 0, {
                lineDash: CALIBRATOR_LINE_DASH,
                lineWidth: CALIBRATOR_LINE_WGHT,
                lineColor: CALIBRATOR_LINE_COL_DEF,
            }),
        );

        this[slineSelSetters] = [
            () => { this[ssel][0] = true; },
            () => { this[ssel][1] = true; },
            () => { this[ssel][2] = true; },
            () => { this[ssel][3] = true; },
        ];

        this[scircles] = _.times(4, () => {
            const c = new FilledCircle(
                0, 0,
                CALIBRATOR_CORNER_WGHT,
                {
                    fillColor: CALIBRATOR_CORNER_COL,
                },
            );
            return c;
        });

        this[scircleSelSetters] = [
            () => { this[ssel][0] = true; this[ssel][2] = true; },
            () => { this[ssel][1] = true; this[ssel][2] = true; },
            () => { this[ssel][1] = true; this[ssel][3] = true; },
            () => { this[ssel][0] = true; this[ssel][3] = true; },
        ];

        this.updateGraphics();
    }

    updateGraphics() {
        // update line positions
        this[slines][0].x0 = this[sx0]; this[slines][0].y0 = this[sy0];
        this[slines][0].x1 = this[sx0]; this[slines][0].y1 = this[sy1];

        this[slines][1].x0 = this[sx1]; this[slines][1].y0 = this[sy0];
        this[slines][1].x1 = this[sx1]; this[slines][1].y1 = this[sy1];

        this[slines][2].x0 = this[sx0]; this[slines][2].y0 = this[sy0];
        this[slines][2].x1 = this[sx1]; this[slines][2].y1 = this[sy0];

        this[slines][3].x0 = this[sx0]; this[slines][3].y0 = this[sy1];
        this[slines][3].x1 = this[sx1]; this[slines][3].y1 = this[sy1];

        // update corner circle positions
        this[scircles][0].x = this[sx0]; this[scircles][0].y = this[sy0];
        this[scircles][1].x = this[sx1]; this[scircles][1].y = this[sy0];
        this[scircles][2].x = this[sx1]; this[scircles][2].y = this[sy1];
        this[scircles][3].x = this[sx0]; this[scircles][3].y = this[sy1];
    }

    setSelection(x, y) {
        const collidesxy = _.partial(collides, x, y);
        /* eslint no-param-reassign: 0 */
        this[ssel] = _.map(this[ssel], () => false);
        _.each(
            _.filter(
                _.zip(
                    Array.concat(this[slines], this[scircles]),
                    Array.concat(this[slineSelSetters], this[scircleSelSetters]),
                ),
                ([z]) => collidesxy(z),
            ),
            ([, s]) => s(),
        );
        _.each(
            _.zip(this[ssel], this[slines]),
            ([s, l]) => {
                l.lineColor = s ? CALIBRATOR_LINE_COL_HLT : CALIBRATOR_LINE_COL_DEF;
            },
        );
    }

    setSelectionCoordinates(x, y) {
        _.each(
            _.filter(_.zip(this[ssel], this[sselBoundsSetters]), _.head),
            ([, f]) => { f(x, y); },
        );
        this.updateGraphics();
    }

    get renderables() { return Array.concat(this[slines], this[scircles]); }

    get selection() {
        return _.reduce(
            _.filter(_.zip(this[ssel], this[sselAnnotation]), _.head),
            (a, [, x]) => a + x,
            '',
        );
    }

    get points() {
        return [
            this[sx0],
            this[sy0],
            this[sx1],
            this[sy1],
        ];
    }

    set points([x0, y0, x1, y1]) {
        this[sx0] = x0;
        this[sy0] = y0;
        this[sx1] = x1;
        this[sy1] = y1;
        this.updateGraphics();
    }

    get width() { return this[arrayW]; }
    set width(value) { this[arrayW] = value; }

    get height() { return this[arrayH]; }
    set height(value) { this[arrayH] = value; }
}

export default Calibrator;
