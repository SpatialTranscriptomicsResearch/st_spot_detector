import _ from 'lodash';

import {
    COLLISION_LINE_DEF,
    COLLISION_LINE_HLT,
    COLLISION_LINE_WGHT,
} from '../config';
import {
    px2assignment,
    arr2px,
} from './calibrator';
import { Line } from './graphics/line';

const salines = Symbol('Assignment lines');
const sbins = Symbol('Assignment bins');

class CollisionTracker {
    constructor(calibrator, spots) {
        this.calibrator = calibrator;
        this.spots = spots;

        this[salines] = [];
        this[sbins] = [];
        this.update();
    }
    update() {
        const assigned = [];
        const assignedArr = [];
        const unassigned = [];
        _.each(
            this.spots,
            (s) => {
                const { x, y } = s.position;
                const { x: ax, y: ay } = s.assignment;
                if (ax && ay) {
                    assigned.push([x, y]);
                    assignedArr.push([ax, ay]);
                } else {
                    unassigned.push([x, y]);
                }
            },
        );
        const unassignedArr = px2assignment(this.calibrator, unassigned);
        const orig = [...unassigned, ...assigned];
        const arrs = [...unassignedArr, ...assignedArr];
        const to = arr2px(this.calibrator, arrs);
        this[sbins] = _.map(
            _.range(this.calibrator.width + 1),
            () => new Array(this.calibrator.height + 1).fill(0),
        );
        _.each(arrs, ([x, y]) => { this[sbins][x][y] += 1; });
        this[salines] = _.map(
            _.zip(orig, to, arrs),
            ([as, bs, [x, y]]) => new Line(
                ...as, ...bs,
                {
                    lineColor:
                        this[sbins][x][y] > 1
                            ? COLLISION_LINE_HLT
                            : COLLISION_LINE_DEF,
                    lineWidth: COLLISION_LINE_WGHT,
                },
            ),
        );
    }
    get collisions() {
        return _.map(
            _.filter(
                _.concat(..._.map(
                    _.zip(this[sbins], _.range(this[sbins].length)),
                    ([as, x]) => _.map(
                        _.zip(as, _.range(as.length)),
                        ([a, y]) => [a, x, y],
                    ),
                )),
                ([a]) => a > 1,
            ),
            _.tail,
        );
    }
    get renderables() { return this[salines]; }
}

export default CollisionTracker;
