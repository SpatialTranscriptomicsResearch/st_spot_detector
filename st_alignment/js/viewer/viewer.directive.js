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
                
                // prevents the context menu from appearing
                canvas.oncontextmenu = function(e) { e.preventDefault(); } 

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
                var images = {
                    images: '',
                    thumbnail: new Image()
                };
                var sessionId;
                var calibrationThumbnailOn = true;

                updateCanvas();

                var getThumbnail = function() {
                    var thumbnailSuccessCallback = function(response) {
                        images.thumbnail.src = response.data.thumbnail;
                        logicHandler.currentState = logicHandler.state.calibrate;
                        updateCanvas();
                        $rootScope.$broadcast('thumbnailLoaded');
                    };
                    var thumbnailErrorCallback = function(response) {
                        console.error(response.data);
                    };
                    var config = {
                        params: {
                            brightness: calibrator.calibrationData.brightness,
                            contrast:   calibrator.calibrationData.contrast,
                            threshold:  calibrator.calibrationData.threshold,
                            session_id: sessionId
                        }
                    };
                    $http.get('../thumbnail', config)
                        .then(thumbnailSuccessCallback, thumbnailErrorCallback);
                };

                $rootScope.$on('imageLoading', function(event, data) {
                    logicHandler.currentState = logicHandler.state.loading;
                });
                $rootScope.$on('imageLoadingError', function(event, data) {
                    logicHandler.currentState = logicHandler.state.error;
                });
                $rootScope.$on('clientValid', function(event, data) {
                    var getTileData = function() {
                        var tileSuccessCallback = function(response) {
                            tilemap.loadTilemap(response.data);
                            scaleManager = new ScaleManager(tilemap.tilemapLevels, tilemapLevel);
                            tilePosition = tilemap.getTilePosition(cameraPosition, tilemapLevel);
                            images.images = tilemap.getRenderableImages(tilePosition, tilemapLevel); 

                            logicHandler.currentState = logicHandler.state.calibrate;
                            getThumbnail();
                            updateCanvas();
                        };
                        var tileErrorCallback = function(response) {
                            console.error(response.data);
                            $rootScope.$broadcast('imageLoadingError', response.data);
                        };
                        data.session_id = sessionId;
                        $http.post('../tiles', data)
                            .then(tileSuccessCallback, tileErrorCallback);
                    };

                    var getSessionId = function() {
                        var sessionSuccessCallback = function(response) {
                            sessionId = response.data;
                            getTileData();
                        };
                        var sessionErrorCallback = function(response) {
                            console.error(response.data);
                            $rootScope.$broadcast('imageLoadingError', response.data);
                        };
                        $http.get('../session_id')
                            .then(sessionSuccessCallback, sessionErrorCallback);
                    };
                    getSessionId();
                });
                $rootScope.$on('spotDetecting', function(event, data) {
                    var getSpotData = function() {
                        var successCallback = function(response) {
                            spots.loadSpots(response.data);
                            $rootScope.$broadcast('finishedDetecting');
                            logicHandler.currentState = logicHandler.state.adjust_spots;
                        };
                        var errorCallback = function(response) {
                            console.error(response.data);
                            // should it change to some other state on error?
                        };
                        var config = {
                            params: {
                                TL:         calibrator.calibrationData.TL,
                                BR:         calibrator.calibrationData.BR,
                                array_size: calibrator.calibrationData.arraySize,
                                brightness: calibrator.calibrationData.brightness,
                                contrast:   calibrator.calibrationData.contrast,
                                threshold:  calibrator.calibrationData.threshold,
                                session_id: sessionId
                            }
                        };
                        $http.get('../detect_spots', config)
                            .then(successCallback, errorCallback);
                    };
                    logicHandler.currentState = logicHandler.state.spot_detecting;
                    getSpotData();
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
                $rootScope.$on('deleteSelectedSpots', function(event, data) {
                    spotAdjuster.deleteSelectedSpots();
                    updateCanvas();
                });
                $rootScope.$on('spotDetectorAdjusted', function(event, data) {
                    calibrator.calibrationData = data.data;
                    if(data.bctChanged) {
                        getThumbnail();
                    }
                    updateCanvas();
                });
                $rootScope.$on('finishedAddSpots', function(event) {
                    logicHandler.currentState = logicHandler.state.adjust_spots;
                });
                $rootScope.$on('colourUpdate', function(event, data) {
                    renderer.spotColour = 'hsla(' + data['spotColour'] + ', 100%, 50%,' + data['spotOpacity'] + ')';
                    renderer.selectedSpotColour = 'hsla(120, 100%, 50%,' + data['spotOpacity'] + ')';
                    if(logicHandler.currentState == logicHandler.state.adjust_spots ||
                       logicHandler.currentState == logicHandler.state.add_spots) {
                        updateCanvas();
                    }

                });
                $rootScope.$on('exportSpotData', function(event, data) {
                    var spotDataString = spots.exportSpots(data);

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
                        renderer.renderDetectingScreen();
                    }
                    else if(logicHandler.currentState == logicHandler.state.calibrate) {
                        scaleManager.updateScaleLevel(camera.scale);
                        tilemapLevel = 1 / scaleManager.currentScaleLevel;
                        tilePosition = tilemap.getTilePosition(camera.position, tilemapLevel); 
                        images.images = tilemap.getRenderableImages(tilePosition, tilemapLevel);
                        renderer.renderImages(images.images); 
                        //renderer.renderThumbnail(images.thumbnail);
                        renderer.renderCalibrationPoints(calibrator.calibrationData);
                        $rootScope.$broadcast('calibratorAdjusted', calibrator.calibrationData);
                    }
                    else if(logicHandler.currentState == logicHandler.state.adjust_spots) {
                        scaleManager.updateScaleLevel(camera.scale);
                        tilemapLevel = 1 / scaleManager.currentScaleLevel;
                        tilePosition = tilemap.getTilePosition(camera.position, tilemapLevel); 
                        images.images = tilemap.getRenderableImages(tilePosition, tilemapLevel);
                        renderer.renderImages(images.images);
                        renderer.renderSpots(spots.spots);
                        renderer.renderSpotSelection(spotSelector.renderingRect);
                        /* currently does not work; the view does not change upon receiving a signal
                        if(spotSelector.selected) {
                            // unideal since it broadcasts this every update; only needs to broadcast
                            // upon selection from the spot-selector (how?)
                            $rootScope.$broadcast('selectedSpots');
                        }
                        else {
                            $rootScope.$broadcast('unSelectedSpots');
                        }
                        */
                    }
                    else if(logicHandler.currentState == logicHandler.state.add_spots) {
                        scaleManager.updateScaleLevel(camera.scale);
                        tilemapLevel = 1 / scaleManager.currentScaleLevel;
                        tilePosition = tilemap.getTilePosition(camera.position, tilemapLevel); 
                        images.images = tilemap.getRenderableImages(tilePosition, tilemapLevel);
                        renderer.renderImages(images.images);
                        renderer.renderSpots(spots.spots);
                        renderer.renderSpotToAdd(spots.spotToAdd);
                    }
                }
            };
            return {
                restrict: 'A',
                link: link
            };
        }]);
