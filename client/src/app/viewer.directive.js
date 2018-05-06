// this directive controls the rendering and input of the canvas element
// used for viewing the image and spots.

import $ from 'jquery';
import _ from 'lodash';
import math from 'mathjs';

import AdjustmentLH, { STATES as alhs } from './viewer/logic-handler.adjustment';
import Calibrator, {
    arr2pxMatrix,
    px2arr,
    px2assignment,
} from './viewer/calibrator';
import Camera from './viewer/camera';
import Codes from './viewer/keycodes';
import CollisionTracker from './viewer/collision-tracker';
import EventHandler from './viewer/event-handler';
import RenderingClient, { ReturnCodes } from './viewer/rendering-client';
import ScaleManager from './viewer/scale-manager';
import SpotManager from './viewer/spots';
import Vec2 from './viewer/vec2';
import UndoStack, { UndoAction } from './viewer/undo';

import { MAX_THREADS } from './config';
import { mathjsToTransform, mulVec2 } from './utils';
import { clear, render, scale } from './viewer/graphics/functions';

function viewer() {
    return {
        restrict: 'A',
        scope: false,
        link: function(scope, element) {
            const fg = element[0].querySelector('#fg');
            const fgCtx = fg.getContext('2d');

            const layers = element[0].querySelector('#layers');
            const renderableLayers = [];

            // prevents the context menu from appearing on right click
            fg.oncontextmenu = function(e) { e.preventDefault(); }

            scope.undoStack = new UndoStack(
                new Proxy(scope.visible.undo, {
                    set(obj, prop, val) {
                        /* eslint-disable no-param-reassign */
                        obj[prop] = val;
                        const phase = scope.$root.$$phase;
                        if (phase !== '$apply' && phase !== '$digest') {
                            scope.$apply();
                        }
                        return obj;
                    },
                }),
            );

            var tilePosition;
            var camera = new Camera(fgCtx, scope.layerManager);

            const calibrator = new Calibrator();
            calibrator.width = 33;
            calibrator.height = 35;

            var spots = new SpotManager();

            const collisionTracker = new CollisionTracker(calibrator, spots.spotsMutable);

            scope.eventHandler = new EventHandler(scope.data, fg, camera);

            scope.adjustmentLH = new AdjustmentLH(
                camera,
                calibrator,
                spots,
                collisionTracker,
                refreshCanvas,
                scope.undoStack,
            );

            scope.loadSpots = function(spotData, tissueMask) {
                const { positions, tl, br } = spotData;
                calibrator.points = [tl, br];
                spots.loadSpots(positions, tissueMask);
                collisionTracker.update();
            };

            scope.selectInsideTissue = function() {
                const action = new UndoAction(
                    'state_adjustment',
                    'spotAdjustment',
                    spots.spots,
                );
                scope.undoStack.push(action);
                spots.selectTissueSpots(
                    math.multiply(
                        math.inv(scope.layerManager.getLayer('HE').tmat),
                        scope.layerManager.getLayer('Cy3').tmat,
                    ),
                    0.5,
                );
                refreshCanvas();
            };

            scope.getSpots = function() {
                return spots.getSpots();
            };

            scope.setSpotColor = function(value) {
                spots.setSpotColor(value);
                refreshCanvas();
            };

            scope.setSpotOpacity = function(value) {
                spots.setSpotOpacity(value);
                refreshCanvas();
            };

            function resizeCanvas() {
                Array.from(element[0].getElementsByTagName('canvas')).forEach(
                    (canvas) => {
                        /* eslint-disable no-param-reassign */
                        canvas.width = window.innerWidth;
                        canvas.height = window.innerHeight;
                    },
                );
            }

            function refreshCanvas() {
                _.each(
                    _.map(renderableLayers, x => scope.layerManager.getLayer(x)),
                    (layer) => {
                        const level = layer.scaleManager.level(1 / camera.scale);
                        const canvas = layer.canvas;
                        const context = canvas.getContext('2d');

                        if (layer.get('visible') === false) {
                            clear(context);
                            return;
                        }

                        const adjustments = layer.adjustments;

                        $(layer.canvas).css('opacity', _.reduce(
                            _.filter(adjustments, ([x]) => x === 'opacity'),
                            (a, [, x]) => a * x,
                            1.0,
                        ));

                        const tmat = math.multiply(camera.getTransform(), layer.tmat);

                        // Compute difference to previous transformation matrix, set the
                        // transformation matrix to the difference, and redraw the canvas at (0, 0),
                        // thus transforming the canvas according to the difference (this serves as
                        // a 'quick refresh' before the requests to the renderingClient complete).
                        // const tmatOld = transformToMathjs(context.currentTransform);
                        // TODO: proper polyfill of CanvasRenderingContext2d.currentTransform
                        let tmatOld;
                        if (layer.currentTransform !== undefined) {
                            tmatOld = layer.currentTransform;
                        } else {
                            tmatOld = math.eye(3);
                        }
                        layer.currentTransform = tmat;
                        const tmatDiff = math.multiply(tmat, math.inv(tmatOld));

                        context.setTransform(...mathjsToTransform(tmatDiff));
                        context.drawImage(canvas, 0, 0);
                        context.setTransform(...mathjsToTransform(tmat));

                        // compute the bounding box of the current view in tile space
                        const range = _.map(
                            [
                                [0, 0, 1],
                                [canvas.width, 0, 1],
                                [0, canvas.height, 1],
                                [canvas.width, canvas.height, 1],
                            ],
                            _.flowRight(
                                /* eslint-disable no-underscore-dangle */
                                v => v._data,
                                v => math.floor(v),
                                v => math.dotDivide(v, level),
                                v => math.dotDivide(v, layer.tdim),
                                v => math.subset(v, math.index([0, 1])),
                                v => math.multiply(math.inv(tmat), v),
                                v => math.matrix(v),
                            ),
                        );

                        // request all tiles in the bounding box and clear out-of-bounds tiles
                        const it = layer.renderingClient.requestAll(
                            ...math.min(range, 0),
                            ...math.max(range, 0),
                            level,
                            adjustments,
                        );
                        const tsz = _.map(layer.tdim, x => x * level);
                        Array.from(it).forEach(
                            ([x, y, /* z */, retCode]) => {
                                if (retCode === ReturnCodes.OOB) {
                                    context.clearRect(
                                        ..._.map(_.zip([x, y], tsz), ([a, b]) => a * b),
                                        ...tsz,
                                    );
                                }
                            },
                        );
                    },
                );

                const rfnc = _.partial(render, fgCtx);
                const rfncScale = _.flowRight(
                    rfnc,
                    _.partial(scale, 1 / camera.scale),
                );

                clear(fgCtx);
                if (scope.data.state === 'state_alignment') {
                    scope.camera.begin();
                    _.each(scope.getAlignerRenderables(), rfncScale);
                    scope.camera.end();
                } else if(scope.data.state == 'state_adjustment') {
                    scope.camera.begin();
                    _.each(spots.spotsMutable, rfnc);
                    _.each(calibrator.renderables, rfncScale);
                    _.each(collisionTracker.renderables, rfncScale);
                    _.each(scope.adjustmentLH.renderables, rfncScale);
                    scope.camera.end();
                }
            }

            scope.addSpots = function() {
                scope.adjustmentLH.state |= alhs.ADDING;
                scope.spotManager.spotsMutable.push(
                    scope.spotManager.createSpot());
                scope.visible.spotAdjuster.button_addSpots       = false;
                scope.visible.spotAdjuster.button_finishAddSpots = true;
                scope.visible.spotAdjuster.button_deleteSpots    = false;
                refreshCanvas();
            };

            scope.finishAddSpots = function() {
                scope.adjustmentLH.state = 0;
                scope.spotManager.spotsMutable.pop();
                collisionTracker.update();
                scope.visible.spotAdjuster.button_addSpots       = true;
                scope.visible.spotAdjuster.button_finishAddSpots = false;
                scope.visible.spotAdjuster.button_deleteSpots    = true;
                refreshCanvas();
            };

            scope.deleteSpots = function() {
                var action = new UndoAction(
                    'state_adjustment',
                    'spotAdjustment',
                    spots.spots,
                );
                scope.undoStack.push(action);
                spots.spots = _.filter(
                    spots.spotsMutable,
                    s => !(spots.selected.has(s)),
                );
                collisionTracker.update();
                refreshCanvas();
            };

            function constructTileCallback(layer, tdim) {
                const scaleManager = layer.scaleManager;
                const context = layer.canvas.getContext('2d');
                function callback(tile, x, y, z) {
                    window.requestAnimationFrame(() => {
                        // exit if layer isn't visible
                        if (layer.get('visible') !== true) {
                            return;
                        }
                        // exit if the z-coordinate doesn't match the current tilemap level
                        if (z !== scaleManager.level()) {
                            return;
                        }
                        context.drawImage(
                            tile,
                            0, 0,
                            ...tdim,
                            z * x * tdim[0],
                            z * y * tdim[1],
                            z * tdim[0],
                            z * tdim[1],
                        );
                    });
                }
                return callback;
            }

            scope.receiveTilemap = function (data) {
                // delete all current layers and add the ones in data.tiles
                _.each(
                    Object.keys(scope.layerManager.getLayers()),
                    x => scope.layerManager.deleteLayer(x),
                );
                renderableLayers.length = 0;

                let maxWidth = 0;
                let maxHeight = 0;
                let maxLevel = 1;

                Promise.all(_.map(
                    Object.entries(data),
                    ([layerName, tiles]) => {
                        const layer = scope.layerManager.addLayer(layerName);

                        const canvas = layer.canvas;
                        canvas.width = fg.width;
                        canvas.height = fg.height;
                        $(canvas).addClass('fullscreen');

                        const levels = _.map(Object.keys(tiles.tiles), x => parseInt(x, 10));
                        layer.scaleManager = new ScaleManager(levels);
                        maxLevel = Math.max(maxLevel, ...levels);

                        layer.tdim = tiles.tile_size;
                        maxWidth = Math.max(maxWidth, tiles.image_size[0]);
                        maxHeight = Math.max(maxHeight, tiles.image_size[1]);

                        const nThreads = Math.floor(MAX_THREADS / Object.keys(data).length);
                        layer.renderingClient = new RenderingClient(
                            Math.max(1, nThreads),
                            constructTileCallback(layer, tiles.tile_size),
                        );
                        return layer.renderingClient.loadTileData(
                            tiles.tiles,
                            tiles.histogram,
                        ).then(() => {
                            renderableLayers.push(layerName);
                        });
                    },
                )).then(() => {
                    refreshCanvas();
                });

                // update camera boundaries
                camera.positionBoundaries.maxX = maxWidth;
                camera.positionBoundaries.maxY = maxHeight;
                camera.minScale = 1 / maxLevel;

                // center camera
                camera.position = Vec2.Vec2(maxWidth / 2, maxHeight / 2);
                camera.scale = 2 / maxLevel;
                camera.updateViewport();
            };

            scope.zoom = function(direction) {
                camera.navigate(Codes.keyEvent[direction]);
                refreshCanvas();
            };

            scope.undo = function(direction) {
                if(direction == "undo") {
                    var lastState = scope.undoStack.lastTab();
                    if(lastState == scope.data.state) {
                        var action = scope.undoStack.pop();
                        if(lastState == "state_alignment") {
                            const { layer, matrix } = action.state;
                            layer.setTransform(matrix);
                        }
                        if(lastState == "state_adjustment") {
                            scope.adjustmentLH.undo(action);
                        }
                    }
                }
                else if(direction == "redo") {
                }

                scope.visible.undo.undo = (scope.undoStack.stack.length == 0) ? true : false;
                scope.visible.undo.redo = (scope.undoStack.redoStack.length == 0) ? true : false;
                refreshCanvas();
            };

            scope.exportSpots = function(selection, sep = '\t') {
                const headers = [
                    'x', 'y',
                    'new_x', 'new_y',
                    'pixel_x', 'pixel_y',
                    ...(selection === 'all' ? ['selected'] : []),
                ];

                const ls = scope.layerManager.getLayers();
                const canvas2image = math.inv('HE' in ls ? ls.HE.tmat : ls.Cy3.tmat);
                const spotData = _.map(
                    _.filter(
                        spots.spots,
                        s => selection === 'all' || s.selected,
                    ),
                    (s) => {
                        const [[arrx, arry]] = px2arr(calibrator, [[s.x, s.y]]);
                        const [[assx, assy]] = px2assignment(calibrator, [[s.x, s.y]]);
                        const { x: px_x, y: px_y } = mulVec2(canvas2image, s.position);
                        return {
                            x: assx,
                            y: assy,
                            new_x: arrx.toFixed(2),
                            new_y: arry.toFixed(2),
                            pixel_x: px_x.toFixed(1),
                            pixel_y: px_y.toFixed(1),
                            selected: s.selected ? '1' : '0',
                        };
                    },
                );

                const sortOrder = [
                    'x', 'y',
                    'selected',
                    'new_x', 'new_y',
                ];
                const spotOutput = _.map(
                    spotData.sort((a, b) => {
                        const [p] = _.dropWhile(sortOrder, x => a[x] === b[x]);
                        if (p) {
                            return parseFloat(a[p]) < parseFloat(b[p]) ? -1 : 1;
                        }
                        return 0;
                    }),
                    s => _.map(headers, h => s[h]),
                );

                const res = _.map(
                    [headers, ...spotOutput],
                    x => x.join(sep),
                ).join('\n');

                return exportFile(
                    new Blob([res]),
                    `spot_data-${selection}-` +
                        `${`${scope.data.cy3Filename.replace(/\.[^.]*$/, '')}.tsv`}`,
                    'text/plain',
                );
            };

            scope.exportTMat = function() {
                const ls = scope.layerManager.getLayers();
                const arr2image = math.multiply(
                    math.inv('HE' in ls ? ls.HE.tmat : ls.Cy3.tmat),
                    arr2pxMatrix(calibrator),
                );

                const res = _.map(
                    math.transpose(arr2image)._data,
                    x => x.join(' '),
                ).join(' ');

                exportFile(
                    new Blob([res]),
                    'transformation_matrix' +
                        `${`${scope.data.cy3Filename.replace(/\.[^.]*$/, '')}.txt`}`,
                    'text/plain',
                );
            };

            scope.getSpotMatrix = function() {
                return spots.transformMatrix;
            };

            var exportFile = function(fileblob, filename, filetype) {
                // this function is adapted from https://github.com/mholt/PapaParse/issues/175
                if(window.navigator.msSaveOrOpenBlob) { // IE hack; see http://msdn.microsoft.com/en-us/library/ie/hh779016.aspx
                    window.navigator.msSaveBlob(fileblob, filename);
                }
                else {
                    var a = window.document.createElement("a");
                    a.href = window.URL.createObjectURL(fileblob, {type: filetype});
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();  // IE: "Access is denied"; see: https://connect.microsoft.com/IE/feedback/details/797361/ie-10-treats-blob-url-as-cross-origin-and-denies-access
                    document.body.removeChild(a);
                }
            };

            scope.camera = camera;
            scope.calibrator = calibrator;
            scope.layerManager.container = layers;
            scope.layerManager.callback = refreshCanvas;
            scope.spotManager = spots;

            window.addEventListener(
                'resize',
                () => {
                    resizeCanvas();
                    camera.updateViewport();
                    refreshCanvas();
                },
                false,
            );

            window.addEventListener('load', resizeCanvas, false);
        }
    };
}

export default viewer;
