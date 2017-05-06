// this directive controls the rendering and input of the canvas element
// used for viewing the image and spots.

import $ from 'jquery';

import AdjustmentLH from './viewer/logic-handler.adjustment';
import Calibrator from './viewer/calibrator';
import Camera from './viewer/camera';
import EventHandler from './viewer/event-handler';
import LayerManager from './viewer/layer-manager';
import PredetectionLH from './viewer/logic-handler.predetection';
import Renderer from './viewer/renderer';
import ScaleManager from './viewer/scale-manager';
import SpotAdjuster from './viewer/spot-adjuster';
import SpotManager from './viewer/spots';
import SpotSelector from './viewer/spot-selector';
import Tilemap from './viewer/tilemap';

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
                        renderer.clearCanvas(context);

                        if (layer.get('visible') === false) {
                            return;
                        }

                        const tilemap = layer.get('tilemap');
                        const pos = tilemap.getTilePosition(camera.position, tilemapLevel);
                        const images = tilemap.getRenderableImages(pos, tilemapLevel);
                        renderer.renderImages(canvas, images);
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
                .addModifier('tilemap', null);

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

            scope.receiveTilemap = function(tilemaps, resetCamera = true) {
                // TODO: This is not the right way to do it but all
                // tilemaps should always have the same tilemap levels.
                // May be a good idea to reconsider how this data is
                // returned from the server.
                scaleManager.setTilemapLevels(
                    Object.values(tilemaps)[0].tilemapLevels, tilemapLevel);
                if (resetCamera) {
                    // centers the camera to the middle of the image
                    camera.position = {
                        x: (1024 / 2) * tilemapLevel,
                        y: (1024 / 2) * tilemapLevel,
                    };
                    camera.scale = 1 / tilemapLevel;
                    camera.updateViewport();
                }

                Object.keys(scope.layerManager.getLayers()).forEach(
                    layer => scope.layerManager.deleteLayer(layer));

                function delayCallback() {
                    let times = Object.keys(tilemaps).length;
                    function ret() {
                        times -= 1;
                        if (times <= 0) {
                            refreshCanvas();
                        }
                    }
                    return ret;
                }
                const delayedCallback = delayCallback();

                Object.keys(tilemaps).forEach(
                    (layerName) => {
                        const layer = scope.layerManager.addLayer(layerName);

                        const canvas = layer.canvas;
                        canvas.width = fg.width;
                        canvas.height = fg.height;
                        $(canvas).addClass('fullscreen');

                        const tilemap = new Tilemap();
                        tilemap.loadTilemap(tilemaps[layerName], delayedCallback);
                        layer.set('tilemap', tilemap);
                    });
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
