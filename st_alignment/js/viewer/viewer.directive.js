'use strict';

angular.module('viewer')
    .directive('viewerCanvas', [
        '$rootScope',
        '$http',
        '$compile',
        function($rootScope, $http, $compile) {
            var link = function(scope, element) {
                var canvas = element[0];
                var ctx = canvas.getContext('2d');

                var tilemapLevel = 20;
                var cameraPosition = {x: (ctx.canvas.width  / 2) * tilemapLevel,
                                      y: (ctx.canvas.height / 2) * tilemapLevel};

                var tilemap = new Tilemap();
                var scaleManager;

                var camera = new Camera(ctx, cameraPosition, 1 / tilemapLevel);
                var renderer = new Renderer(ctx, camera);

                var spots = new SpotManager();
                var calibrator = new Calibrator(camera);
                var spotSelector = new SpotSelector(camera, spots);
                var spotAdjuster = new SpotAdjuster(camera, spots, calibrator.calibrationData);
                var logicHandler = new LogicHandler(canvas, camera, spotSelector, spotAdjuster, calibrator, updateCanvas);
                var eventHandler = new EventHandler(canvas, camera, logicHandler);

                var tilePosition;
                var images;

                updateCanvas();

                $rootScope.$on('imageLoading', function(event, data) {
                    logicHandler.currentState = logicHandler.state.loading;
                });
                $rootScope.$on('imageLoadingError', function(event, data) {
                    logicHandler.currentState = logicHandler.state.error;
                });
                $rootScope.$on('imageLoaded', function(event, data) {
                    var getTileData = function() {
                        var successCallback = function(response) {
                            tilemap.loadTilemap(response.data);
                            scaleManager = new ScaleManager(tilemap.tilemapLevels, tilemapLevel);
                            tilePosition = tilemap.getTilePosition(cameraPosition, tilemapLevel);
                            images = tilemap.getRenderableImages(tilePosition, tilemapLevel); 
                            updateCanvas();
                            $rootScope.$broadcast('imageRendered');
                        };
                        var errorCallback = function(response) {
                            console.error(response.data);
                        };
                        $http.get('../tiles')
                            .then(successCallback, errorCallback);
                    };

                    logicHandler.currentState = logicHandler.state.calibrate;
                    getTileData();
                });
                $rootScope.$on('spotDetecting', function(event, data) {
                    var getSpotData = function() {
                        var successCallback = function(response) {
                            spots.loadSpots(response.data);
                            $rootScope.$broadcast('finishedDetecting');
                            logicHandler.currentState = logicHandler.state.move_camera;
                        };
                        var errorCallback = function(response) {
                            console.error(response.data);
                            // should it change to some other state on error?
                        };
                        var config = {
                            params: calibrator.calibrationData
                        };
                        $http.get('../detect_spots', config)
                            .then(successCallback, errorCallback);
                    };
                    logicHandler.currentState = logicHandler.state.spot_detecting;
                    getSpotData();
                    updateCanvas();
                });
                $rootScope.$on('moveState', function(event, data) {
                    logicHandler.currentState = logicHandler.state.move_camera;
                    updateCanvas();
                });
                $rootScope.$on('selectState', function(event, data) {
                    logicHandler.currentState = logicHandler.state.select_spots;
                    updateCanvas();
                });
                $rootScope.$on('adjustState', function(event, data) {
                    logicHandler.currentState = logicHandler.state.adjust_spots;
                    updateCanvas();
                });

                $rootScope.$on('addSpots', function(event, data) {
                    logicHandler.currentState = logicHandler.state.add_spots;
                    updateCanvas();
                });
                $rootScope.$on('deleteSpots', function(event, data) {
                    spotAdjuster.deleteSpots();
                    updateCanvas();
                });
                $rootScope.$on('editSpots', function(event, data) {
                    updateCanvas();
                });
                $rootScope.$on('spotDetectorAdjusted', function(event, data) {
                    calibrator.calibrationData = data;
                    updateCanvas();
                });
                $rootScope.$on('colourUpdate', function(event, data) {
                    renderer.spotColour = data['background-color'];
                    if(logicHandler.currentState != logicHandler.state.upload_ready &&
                       logicHandler.currentState != logicHandler.state.loading &&
                       logicHandler.currentState != logicHandler.state.error ) {
                        updateCanvas();
                    }

                });
                $rootScope.$on('exportSpotData', function(event, data) {
                    var format = 'tsv';
                    var spotDataString = spots.exportSpots(format);

                    var blob = new Blob([spotDataString]);
                    var filename = "spot_data-" + new Date().toISOString().slice(0, 10) + "." + format;

                    // the next 11 lines are adapted from https://github.com/mholt/PapaParse/issues/175
                    if(window.navigator.msSaveOrOpenBlob) { // IE hack; see http://msdn.microsoft.com/en-us/library/ie/hh779016.aspx
                        window.navigator.msSaveBlob(blob, filename);
                    }
                    else {
                        var a = window.document.createElement("a");
                        a.href = window.URL.createObjectURL(blob, {type: 'text/' + format});
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();  // IE: "Access is denied"; see: https://connect.microsoft.com/IE/feedback/details/797361/ie-10-treats-blob-url-as-cross-origin-and-denies-access
                        document.body.removeChild(a);
                    }
                });

                function updateCanvas() {
                    renderer.clearCanvas();

                    if(logicHandler.currentState == logicHandler.state.upload_ready) {
                        renderer.renderStartScreen();
                    }
                    else if(logicHandler.currentState == logicHandler.state.loading) {
                        renderer.renderLoadingScreen();
                    }
                    else if(logicHandler.currentState == logicHandler.state.error) {
                        renderer.renderErrorScreen();
                    }
                    else if(logicHandler.currentState == logicHandler.state.spot_detecting) {
                        renderer.renderImages(images);
                        renderer.renderCalibrationPoints(calibrator.calibrationData);
                        renderer.renderDetectingScreen();
                    }
                    else if(logicHandler.currentState == logicHandler.state.move_camera) {
                        scaleManager.updateScaleLevel(camera.scale);
                        tilemapLevel = 1 / scaleManager.currentScaleLevel;
                        tilePosition = tilemap.getTilePosition(camera.position, tilemapLevel); 
                        images = tilemap.getRenderableImages(tilePosition, tilemapLevel);
                        renderer.renderImages(images);
                        renderer.renderSpots(spots.spots);
                    }
                    else if(logicHandler.currentState == logicHandler.state.calibrate) {
                        scaleManager.updateScaleLevel(camera.scale);
                        tilemapLevel = 1 / scaleManager.currentScaleLevel;
                        tilePosition = tilemap.getTilePosition(camera.position, tilemapLevel); 
                        images = tilemap.getRenderableImages(tilePosition, tilemapLevel);
                        renderer.renderImages(images);
                        renderer.renderCalibrationPoints(calibrator.calibrationData);
                        $rootScope.$broadcast('calibratorAdjusted', calibrator.calibrationData);
                    }
                    else if(logicHandler.currentState == logicHandler.state.select_spots) {
                        renderer.renderImages(images);
                        renderer.renderSpots(spots.spots);
                        renderer.renderSpotSelection(spotSelector.renderingRect);
                    }
                    else if(logicHandler.currentState == logicHandler.state.adjust_spots) {
                        renderer.renderImages(images);
                        renderer.renderSpots(spots.spots);
                    }
                    else if(logicHandler.currentState == logicHandler.state.add_spots) {
                        renderer.renderImages(images);
                        renderer.renderSpots(spots.spots);
                    }
                }
            };
            return {
                restrict: 'A',
                link: link
            };
        }]);
