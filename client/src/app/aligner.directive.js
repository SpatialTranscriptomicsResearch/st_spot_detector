/**
 * @module aligner.directive
 *
 * Directive for the alignment/editor view.
 */

import 'assets/css/aligner.css';
import template from 'assets/html/aligner.html';

import _ from 'underscore';
import sortable from 'sortablejs';

import {
    AlignerLHMove,
    AlignerLHRotate,
} from './aligner/aligner.logic-handler';
import {
    ROT_POINT_COLOR_DEF,
    ROT_POINT_COLOR_HLT,
    ROT_POINT_LINE_WGHT,
    ROT_POINT_RADIUS,
} from './config';
import { LogicHandlerWrapper } from './logic-handler';
import { StrokedCircle } from './viewer/graphics/circle';
import { collides } from './viewer/graphics/functions';

class State {
    constructor(
        active = null,
        adjustments = [],
        logicHandler = null,
        tool = null,
    ) {
        this.active = active;
        this.adjustments = adjustments;
        this.logicHandler = logicHandler;
        this.tool = tool;
    }

    clone() {
        return new State(
            this.active,
            new Map(_.map(
                Array.from(this.adjustments),
                ([k, xs]) => [k, _.clone(xs)],
            )),
            this.logicHandler,
            this.tool,
        );
    }
}

const sgraphic = Symbol('Rotation point graphics object');

class RotationPoint {
    constructor(x, y) {
        this[sgraphic] = new StrokedCircle(
            x, y,
            ROT_POINT_RADIUS,
            {
                lineColor: ROT_POINT_COLOR_DEF,
                lineWidth: ROT_POINT_LINE_WGHT,
            },
        );
    }
    isHovering(x, y) {
        const ret = collides(x, y, this[sgraphic]);
        this[sgraphic].lineColor =
            ret ? ROT_POINT_COLOR_HLT : ROT_POINT_COLOR_DEF;
        return ret;
    }
    get x() { return this[sgraphic].x; }
    get y() { return this[sgraphic].y; }
    set x(v) { this[sgraphic].x = v; }
    set y(v) { this[sgraphic].y = v; }
    get graphic() { return this[sgraphic]; }
}

const ADJUSTMENTS = {
    opacity: 1,
    contrast: 0,
    equalize: true,
};

function aligner() {
    return {
        link(scope, element) {
            /* eslint-disable no-param-reassign */

            /* state management functions */
            scope.state = new State();

            function stateful(f) {
                return (...args) => {
                    const state = scope.state.clone();
                    const [newState, value] = f(state, ...args);
                    scope.state = newState;
                    return value;
                };
            }

            scope.logicHandler = new LogicHandlerWrapper();

            // applies state to world
            scope.applyState = stateful((s) => {
                s.adjustments.forEach((xs, layer) => {
                    scope.layers.getLayer(layer).adjustments = _.map(
                        xs,
                        ({ name, value }) => {
                            switch (name) {
                            case 'brightness':
                                return [name, 2 * value];
                            case 'contrast':
                                return [name, value / 2];
                            default:
                                return [name, value];
                            }
                        },
                    );
                });
                scope.logicHandler.set(s.logicHandler);
                scope.layers.callback();
                return [s];
            });

            // reads state from world
            scope.readState = stateful((s) => {
                s.adjustments = new Map(_.map(
                    _.map(
                        scope.layers.layerOrder,
                        x => [x, scope.layers.getLayer(x).adjustments],
                    ),
                    ([name, xs]) => [
                        name,
                        _.map(xs, ([adjName, x]) => Object({
                            name: adjName,
                            value: x,
                        })),
                    ],
                ));
                s.logicHandler = scope.logicHandler.logicHandler;
                return [s];
            });


            /* active layer */
            scope.getActive = stateful(s => [s, s.active]);

            scope.setActive = stateful((s, name) => {
                if (name === undefined) {
                    return [s];
                }
                s.active = name;
                return [s];
            });

            scope.isActive = name => scope.getActive() === name;


            /* adjustments */
            scope.addAdjustment = _.compose(
                scope.applyState,
                stateful((s, name, value) => {
                    if (s.active !== undefined) {
                        s.adjustments.get(s.active).push({
                            name,
                            value: value || ADJUSTMENTS[name],
                        });
                    }
                    return [s];
                }),
            );

            scope.rmAdjustment = _.compose(
                scope.applyState,
                stateful((s, aObj) => {
                    s.adjustments.set(
                        s.active,
                        _.filter(
                            s.adjustments.get(s.active),
                            x => x !== aObj,
                        ),
                    );
                    return [s];
                }),
            );


            /* tools */
            const rotationPoint = new RotationPoint(0, 0);

            scope.tools = new Map([
                ['move', {
                    name: 'Move',
                    logicHandler: new AlignerLHMove(
                        scope.camera,
                        () => scope.layers.getLayer(scope.state.active),
                        () => scope.$apply(() => scope.layers.callback()),
                        scope.undoStack,
                    ),
                }],
                ['rotate', {
                    name: 'Rotate',
                    logicHandler: new AlignerLHRotate(
                        scope.camera,
                        () => scope.layers.getLayer(scope.state.active),
                        () => scope.$apply(() => scope.layers.callback()),
                        scope.undoStack,
                        rotationPoint,
                    ),
                }],
            ]);

            // Store tools in array for ng-repeat (ugh)
            scope.toolsArray = Array.from(scope.tools.entries());

            scope.isCurrentTool = stateful((s, name) => [s, name === s.tool]);

            scope.setCurrentTool = _.compose(
                scope.applyState,
                stateful((s, name) => {
                    if (name === 'rotate') {
                        rotationPoint.x = scope.camera.position.x;
                        rotationPoint.y = scope.camera.position.y;
                    }
                    s.logicHandler = scope.tools.get(name).logicHandler;
                    s.tool = name;
                    return [s];
                }),
            );


            /* init / exit */
            let initialState;

            scope.init = () => {
                scope.readState();

                initialState = scope.state.clone();

                const n = scope.layers.layerOrder.length;
                _.each(_.zip(scope.layers.layerOrder, _.range(n)), ([x, i]) => {
                    scope.setActive(x);
                    scope.addAdjustment('opacity', (n - i) / n);
                });

                scope.setCurrentTool('move');
            };

            scope.exit = () => {
                scope.state = initialState;
                scope.applyState();
            };


            /* other */
            scope.layerName = (x) => {
                switch (x) {
                case 'cy3':
                    return 'Cy3';
                case 'he':
                    return 'HE';
                default:
                    return x;
                }
            };

            scope.renderables = () => {
                const ret = [];
                if (scope.state.tool === 'rotate') {
                    ret.push(rotationPoint.graphic);
                }
                return ret;
            };

            // make layer list sortable
            sortable.create(element[0].querySelector('#layer-list'), {
                onSort() {
                    // update layer order
                    _.each(this.toArray(), (val, i) => {
                        scope.layers.layerOrder[i] = val;
                    });
                },
            });

            // make adjustments sortable
            sortable.create(element[0].querySelector('#adjustment-list'), {
                onSort({ oldIndex, newIndex }) {
                    const adjustments = scope.state.adjustments.get(scope.state.active);
                    const adjustment = adjustments.splice(oldIndex, 1)[0];
                    adjustments.splice(newIndex, 0, adjustment);
                    scope.applyState();
                },
                handle: '.sort-handle',
            });
        },
        restrict: 'E',
        template,
        scope: {
            /* requires */
            layers: '=',
            camera: '=',
            undoStack: '=',
            /* provides */
            init: '=',
            exit: '=',
            logicHandler: '=',
            renderables: '=',
        },
    };
}

export default aligner;
