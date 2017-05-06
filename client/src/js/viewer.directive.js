// this directive controls the rendering and input of the canvas element
// used for viewing the image and spots.

import 'ctx-polyfill';  // provides polyfill for ctx.currentTransform

import $ from 'jquery';
import _ from 'underscore';
import math from 'mathjs';

import AdjustmentLH from './viewer/logic-handler.adjustment';
import Calibrator from './viewer/calibrator';
import Camera from './viewer/camera';
import EventHandler from './viewer/event-handler';
import LayerManager from './viewer/layer-manager';
import PredetectionLH from './viewer/logic-handler.predetection';
import Renderer from './viewer/renderer';
import RenderingClient, { ReturnCodes } from './viewer/rendering-client';
import ScaleManager from './viewer/scale-manager';
import SpotAdjuster from './viewer/spot-adjuster';
import SpotManager from './viewer/spots';
import SpotSelector from './viewer/spot-selector';
import Vec2 from './viewer/vec2';

import { mathjsToTransform, transformToMathjs } from './utils';

function viewer() {
    return {
        restrict: 'A',
        scope: false,
        link: function(scope, element) {
            const fg = element[0].querySelector('#fg');
            const fgCtx = fg.getContext('2d');

            const layers = element[0].querySelector('#layers');

            // prevents the context menu from appearing on right click
            fg.oncontextmenu = function(e) { e.preventDefault(); }

            var scaleManager = new ScaleManager();

            let tileDim;
            var tilemapLevel = 20;
            var tilePosition;
            var camera = new Camera(fgCtx);
            var renderer = new Renderer(fgCtx, camera);

            var calibrator = new Calibrator(camera);

            scope.setCanvasCursor = function(cursor) {
                scope.$apply(function() {
                    scope.classes.canvas = cursor;
                });
            };

            var spots = new SpotManager();
            var spotSelector = new SpotSelector(camera, spots);
            var spotAdjuster = new SpotAdjuster(camera, spots, calibrator.calibrationData);

            scope.eventHandler = new EventHandler(scope.data, fg, camera);

            scope.predetectionLH = new PredetectionLH(
                camera, calibrator, scope.setCanvasCursor, refreshCanvas);
            scope.adjustmentLH = new AdjustmentLH(
                camera, spotAdjuster, spotSelector, scope.setCanvasCursor, refreshCanvas);

            scope.loadSpots = function(spotData) {
                spots.loadSpots(spotData);
                refreshCanvas();
            };

            scope.selectInsideTissue = function() {
                spots.selectTissueSpots();
                refreshCanvas();
            };

            scope.getSpots = function() {
                return spots.getSpots();
            };

            scope.updateScalingFactor = function(scalingFactor) {
                return spots.updateScalingFactor(scalingFactor);
            };

            scope.getCalibrationData = function() {
                return {
                    TL:         calibrator.calibrationData.TL,
                    BR:         calibrator.calibrationData.BR,
                    array_size: calibrator.calibrationData.arraySize,
                    brightness: calibrator.calibrationData.brightness,
                    contrast:   calibrator.calibrationData.contrast,
                    threshold:  calibrator.calibrationData.threshold,
                }
            };

            scope.clickSpotColor = function(color, type) {
                renderer.changeSpotColor(color, type);
                refreshCanvas();
            };

            function refreshCanvas() {
                scaleManager.updateScaleLevel(camera.scale);
                tilemapLevel = 1 / scaleManager.currentScaleLevel;

                Object.values(scope.layerManager.getLayers()).forEach(
                    (layer) => {
                        const canvas = layer.canvas;
                        const context = canvas.getContext('2d');

                        if (layer.get('visible') === false) {
                            renderer.clearCanvas(context);
                            return;
                        }

                        const tmat = math.multiply(camera.getTransform(), layer.tmat);

                        // Compute difference to previous transformation matrix, set the
                        // transformation matrix to the difference, and redraw the canvas at (0, 0),
                        // thus transforming the canvas according to the difference (this serves as
                        // a 'quick refresh' before the requests to the renderingClient complete).
                        const tmatOld = transformToMathjs(context.currentTransform);
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
                            _.compose(
                                /* eslint-disable no-underscore-dangle */
                                v => v._data,
                                v => math.floor(v),
                                v => math.dotDivide(v, tilemapLevel),
                                v => math.dotDivide(v, tileDim),
                                v => math.subset(v, math.index([0, 1])),
                                v => math.multiply(math.inv(tmat), v),
                                v => math.matrix(v),
                            ),
                        );

                        // request all tiles in the bounding box and clear out-of-bounds tiles
                        const it = layer.get('renderingClient').requestAll(
                            ...math.min(range, 0),
                            ...math.max(range, 0),
                            tilemapLevel,
                        );
                        const tsz = _.map(tileDim, x => x * tilemapLevel);
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
                    });

                renderer.clearCanvas();
                if(scope.data.state == 'state_predetection') {
                    renderer.renderCalibrationPoints(calibrator.calibrationData);
                }
                else if(scope.data.state == 'state_adjustment') {
                    renderer.renderSpots(spots.spots)
                    renderer.renderSpotSelection(spotSelector.renderingRect)
                    if(scope.adjustmentLH.addingSpots) {
                        renderer.renderSpotToAdd(spots.spotToAdd);
                    }
                }
            }
            scope.layerManager = new LayerManager(layers, refreshCanvas)
                .addModifier('tilemap', null)
                .addModifier('renderingClient', null);

            scope.addSpots = function() {
                scope.adjustmentLH.addingSpots = true;
                scope.visible.spotAdjuster.button_addSpots       = false;
                scope.visible.spotAdjuster.button_finishAddSpots = true;
                scope.visible.spotAdjuster.button_deleteSpots    = false;
                scope.addSpotsToasts(); // in the main controller
                refreshCanvas();
            };

            scope.finishAddSpots = function() {
                scope.adjustmentLH.addingSpots = false;
                scope.visible.spotAdjuster.button_addSpots       = true;
                scope.visible.spotAdjuster.button_finishAddSpots = false;
                scope.visible.spotAdjuster.button_deleteSpots    = true;
                refreshCanvas();
            };

            scope.deleteSpots = function() {
                spotAdjuster.deleteSelectedSpots();
                refreshCanvas();
            };

            function constructTileCallback(layer, tdim) {
                const context = layer.canvas.getContext('2d');
                function callback(tile, x, y, z) {
                    window.requestAnimationFrame(() => {
                        // exit if layer isn't visible
                        if (layer.get('visible') !== true) {
                            return;
                        }
                        // exit if the z-coordinate doesn't match the current tilemap level
                        if (parseInt(z, 10) !== tilemapLevel) {
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

            scope.receiveTilemap = function(data) {
                tileDim = data.dim;
                scaleManager.setTilemapLevels(data.levels, tilemapLevel);

                // centers the camera to the middle of the first layer
                const fst = Object.values(data.tiles)[0].tiles[1];
                const dim = [
                    tileDim[0] * fst.length,
                    tileDim[1] * fst[0].length,
                ];
                camera.position = Vec2.Vec2(...dim.map(x => x / 2));
                camera.scale = 1 / tilemapLevel;
                camera.updateViewport();

                // delete all current layers and add the ones in data.tiles
                Object.keys(scope.layerManager.getLayers()).forEach(
                    layer => scope.layerManager.deleteLayer(layer));

                Object.entries(data.tiles).forEach(
                    ([layerName, tiles]) => {
                        const layer = scope.layerManager.addLayer(layerName);

                        const canvas = layer.canvas;
                        canvas.width = fg.width;
                        canvas.height = fg.height;
                        $(canvas).addClass('fullscreen');

                        layer.set('renderingClient', new RenderingClient(
                            tiles,
                            constructTileCallback(layer, tileDim),
                        ));
                    });

                refreshCanvas();
            };

            scope.zoom = function(direction) {
                camera.navigate(codes.keyEvent[direction]);
                refreshCanvas();
            };

            scope.exportSpots = function(type, selection) {
                var spotDataString = spots.exportSpots(type, selection);

                var blob = new Blob([spotDataString]);
                var filetype = type.slice(0, 3) + "_" + selection.slice(0, 3) + "-";
                var filename = "spot_data-" + filetype + scope.data.cy3Filename.slice(0, -3) + "tsv";

                exportFile(blob, filename, "text/tsv");
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
        }
    };
}

export default viewer;
