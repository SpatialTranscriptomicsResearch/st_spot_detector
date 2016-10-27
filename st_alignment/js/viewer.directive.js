'use strict';

// this directive controls the rendering and input of the canvas element
// used for viewing the image and spots.

angular.module('stSpots')
    .directive('viewer',
        function() {
            return {
                restrict: 'A',
                scope: false,
                link: function(scope, element) {
                    var canvas = element[0];
                    var ctx = canvas.getContext('2d');

                    // prevents the context menu from appearing on right click
                    canvas.oncontextmenu = function(e) { e.preventDefault(); } 

                    var tilemap = new Tilemap();
                    var scaleManager = new ScaleManager();

                    var tilemapLevel = 20;
                    var tilePosition;
                    var camera = new Camera(ctx);
                    var renderer = new Renderer(ctx, camera);

                    var calibrator = new Calibrator(camera);

                    var spots = new SpotManager();
                    var spotSelector = new SpotSelector(camera, spots);
                    var spotAdjuster = new SpotAdjuster(camera, spots, calibrator.calibrationData);
                    var logicHandler = new LogicHandler(canvas, camera, spotSelector, spotAdjuster, calibrator, refreshCanvas);
                    var eventHandler = new EventHandler(scope.data, canvas, camera, logicHandler);

                    var images = {
                        images: '',
                        thumbnail: new Image()
                    };

                    scope.loadSpots = function(spotData) {
                        spots.loadSpots(spotData);
                        refreshCanvas();
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

                    function refreshCanvas() {
                        renderer.clearCanvas();

                        scaleManager.updateScaleLevel(camera.scale);
                        tilemapLevel = 1 / scaleManager.currentScaleLevel;
                        tilePosition = tilemap.getTilePosition(camera.position, tilemapLevel); 
                        images.images = tilemap.getRenderableImages(tilePosition, tilemapLevel);
                        renderer.renderImages(images.images); 

                        if(scope.data.state == 'state_predetection') {
                            renderer.renderCalibrationPoints(calibrator.calibrationData);
                        }
                        else if(scope.data.state == 'state_adjustment') {
                            renderer.renderSpots(spots.spots)
                            renderer.renderSpotSelection(spotSelector.renderingRect)
                            if(logicHandler.addingSpots) {
                                renderer.renderSpotToAdd(spots.spotToAdd);
                            }
                        }
                    }

                    scope.addSpots = function() {
                        logicHandler.addingSpots = true;
                        scope.visible.spotAdjuster.button_addSpots       = false;
                        scope.visible.spotAdjuster.button_finishAddSpots = true;
                        scope.visible.spotAdjuster.button_deleteSpots    = false;
                        scope.addSpotsToasts(); // in the main controller
                        refreshCanvas();
                    };

                    scope.finishAddSpots = function() {
                        logicHandler.addingSpots = false;
                        scope.visible.spotAdjuster.button_addSpots       = true;
                        scope.visible.spotAdjuster.button_finishAddSpots = false;
                        scope.visible.spotAdjuster.button_deleteSpots    = true;
                        refreshCanvas();
                    };

                    scope.deleteSpots = function() {
                        spotAdjuster.deleteSelectedSpots();
                        refreshCanvas();
                    };

                    scope.receiveTilemap = function(tilemapData) {
                        tilemap.loadTilemap(tilemapData, refreshCanvas);
                        scaleManager.setTilemapLevels(tilemap.tilemapLevels, tilemapLevel);
                        tilePosition = tilemap.getTilePosition(camera.position, tilemapLevel);
                        images.images = tilemap.getRenderableImages(tilePosition, tilemapLevel); 
                        camera.position = {x: (1024 / 2) * tilemapLevel, // centers the camera to the middle of the image
                                           y: (1024 / 2) * tilemapLevel};
                        camera.scale = 1 / tilemapLevel;
                        camera.updateViewport();

                        refreshCanvas();
                    }

                    scope.exportSpots = function(type, selection) {
                        var spotDataString = spots.exportSpots(type, selection);

                        var blob = new Blob([spotDataString]);
                        var filename = "spot_data-" + new Date().toISOString().slice(0, 10) + ".tsv";

                        // the next 11 lines are adapted from https://github.com/mholt/PapaParse/issues/175
                        if(window.navigator.msSaveOrOpenBlob) { // IE hack; see http://msdn.microsoft.com/en-us/library/ie/hh779016.aspx
                            window.navigator.msSaveBlob(blob, filename);
                        }
                        else {
                            var a = window.document.createElement("a");
                            a.href = window.URL.createObjectURL(blob, {type: 'text/tsv'});
                            a.download = filename;
                            document.body.appendChild(a);
                            a.click();  // IE: "Access is denied"; see: https://connect.microsoft.com/IE/feedback/details/797361/ie-10-treats-blob-url-as-cross-origin-and-denies-access
                            document.body.removeChild(a);
                        }
                    }
                    
                }
            };
        });
