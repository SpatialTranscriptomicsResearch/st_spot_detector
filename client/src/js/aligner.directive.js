/**
 * @module aligner.directive
 *
 * Directive for the alignment/editor view.
 */

import _ from 'underscore';
import sortable from 'sortablejs';

import ToolsManager from './aligner/tools-manager';
import Vec2 from './viewer/vec2';

import {
    AlignerLHMove,
    AlignerLHRotate,
} from './aligner/aligner.logic-handler';
import {
    ROT_POINT_COLOR,
    ROT_POINT_RADIUS,
} from './config';
import {
    LogicHandlerWrapper,
} from './logic-handler';

function getActiveLayers(layerManager) {
    return _.filter(
        Object.values(layerManager.getLayers()),
        x => x.get('active'),
    );
}

// Creates getter/setters for given LayerManager attributes
// TODO: handle this in a smarter way when more than one layer is selected
function lmGetterSetter(layerManager, attribute, parser) {
    function ret(value) {
        if (arguments.length > 0) {
            _.each(
                Object.values(getActiveLayers(layerManager)),
                layer => layer.set(attribute, parser(value)),
            );
            return true;
        }
        const layers = Object.values(getActiveLayers(layerManager));
        if (layers.length === 0) {
            return 0;
        }
        return _.first(layers).get(attribute);
    }
    return ret;
}

function aligner() {
    return {
        link(scope, element) {
            function getLayers() {
                return scope.layerManager.layerOrder;
            }

            function setActiveLayer(layer) {
                if (!scope.aligner.logicHandler.logicHandler.keystates.ctrl) {
                    _.each(
                        Object.values(scope.layerManager.getLayers()),
                        x => x.set('active', false),
                    );
                }
                scope.layerManager.getLayer(layer).set('active', true);
            }

            // create getter/setters for layer attributes
            const parse10 = v => parseInt(v, 10);
            const brightness = lmGetterSetter(scope.layerManager, 'brightness', parse10);
            const contrast = lmGetterSetter(scope.layerManager, 'contrast', parse10);
            const equalize = lmGetterSetter(scope.layerManager, 'equalize', _.identity);
            const opacity = lmGetterSetter(scope.layerManager, 'alpha', _.identity);

            // create tools manager and add our tools
            const toolsManager = new ToolsManager(scope.layerManager.callback);

            // move/translate tool
            toolsManager.addTool('Move', {
                logicHandler: new AlignerLHMove(
                    scope.camera,
                    scope.layerManager,
                    scope.layerManager.callback,
                    scope.setCanvasCursor,
                    scope.undoStack,
                ),
                onActive() {
                    scope.aligner.logicHandler.set(this.logicHandler);
                },
            });

            // rotate tool
            const rotationPoint = Vec2.Vec2();

            function drawRotationPoint(ctx) {
                const circle = (r) => {
                    const path = new Path2D();
                    path.arc(rotationPoint.x, rotationPoint.y, r, 0, 2 * Math.PI);
                    return path;
                };

                ctx.save();

                ctx.fillStyle = ROT_POINT_COLOR;
                ctx.strokeStyle = ROT_POINT_COLOR;
                ctx.lineWidth = ROT_POINT_RADIUS / 2;

                ctx.stroke(circle(ROT_POINT_RADIUS));
                ctx.fill(circle(ROT_POINT_RADIUS / 4));

                ctx.restore();
            }

            toolsManager.addTool('Rotate', {
                logicHandler: new AlignerLHRotate(
                    scope.camera,
                    scope.layerManager,
                    scope.layerManager.callback,
                    scope.setCanvasCursor,
                    scope.undoStack,
                    rotationPoint,
                    pos => (
                        Vec2.distanceBetween(pos, rotationPoint) < ROT_POINT_RADIUS
                    ),
                ),
                onActive() {
                    scope.aligner.logicHandler.set(this.logicHandler);

                    // center rotation point
                    rotationPoint.x = scope.camera.position.x;
                    rotationPoint.y = scope.camera.position.y;
                },
            });

            // rendering function (should be called from the viewer directive)
            function renderFG(ctx) {
                if (toolsManager.activeTool() === 'Rotate') {
                    drawRotationPoint(ctx);
                }
            }

            // initialize the alignment view (should be called from the main
            // controller)
            function initialize() {
                const layers = Object.values(scope.layerManager.getLayers());
                _.each(
                    layers,
                    _.compose(
                        x => x.set('visible', true),
                        x => x.set('alpha', 0.5),
                        x => x.set('active', false),
                    ),
                );
                _.first(layers).set('alpha', 1.0);
                _.last(layers).set('active', true);

                toolsManager.activeTool('Move');
            }

            // add the modifiers that we will change
            scope.layerManager
                .addModifier('alpha', 1)
                .addModifier('brightness', 0)
                .addModifier('contrast', 0)
                .addModifier('equalize', false);

            /* eslint-disable no-param-reassign */
            // (do assignments to the scope.)
            scope.aligner = {};

            scope.aligner.logicHandler = new LogicHandlerWrapper();
            scope.aligner.toolsManager = toolsManager;

            // make layer list sortable
            sortable.create(element[0].querySelector('#layer-list'), {
                onSort() {
                    // update layer order
                    _.each(this.toArray(), (val, i) => {
                        scope.layerManager.layerOrder[i] = val;
                    });
                },
            });

            scope.aligner.getLayers = getLayers;
            scope.aligner.setActiveLayer = setActiveLayer;

            scope.aligner.brightness = brightness;
            scope.aligner.contrast = contrast;
            scope.aligner.equalize = equalize;
            scope.aligner.opacity = opacity;

            scope.aligner.renderFG = renderFG;

            scope.aligner.initialize = initialize;
        },
        restrict: 'E',
        templateUrl: '../aligner.html',
    };
}

export default aligner;
