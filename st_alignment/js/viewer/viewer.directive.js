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
                var spotSelector = new SpotSelector(ctx, camera, spots);
                var spotAdjuster = new SpotAdjuster(camera, spots);
                var logicHandler = new LogicHandler(canvas, camera, spotSelector, spotAdjuster, updateCanvas);
                var eventHandler = new EventHandler(canvas, camera, logicHandler);

                var tilePosition;
                var images;

                updateCanvas();

                $rootScope.$on('imageLoading', function(event, data) {
                    logicHandler.currentState = logicHandler.state.loading;
                    //$rootScope.$broadcast('test');
                });
                $rootScope.$on('imageLoadingError', function(event, data) {
                    logicHandler.currentState = logicHandler.state.error;
                });
                $rootScope.$on('imageLoaded', function(event, data) {
                    var getSpotData = function() {
                        var successCallback = function(response) {
                            spots.loadSpots(response.data);
                        };
                        var errorCallback = function(response) {
                            console.error(response.data);
                        };
                        $http.get('../spots')
                            .then(successCallback, errorCallback);
                    };
                    var getTileData = function() {
                        var successCallback = function(response) {
                            tilemap.loadTilemap(response.data);
                            scaleManager = new ScaleManager(tilemap.tilemapLevels, tilemapLevel);
                            tilePosition = tilemap.getTilePosition(cameraPosition, tilemapLevel);
                            images = tilemap.getRenderableImages(tilePosition, tilemapLevel); 
                            updateCanvas();
                            $rootScope.$broadcast('test');
                        };
                        var errorCallback = function(response) {
                            console.error(response.data);
                        };
                        $http.get('../tiles')
                            .then(successCallback, errorCallback);
                    };

                    logicHandler.currentState = logicHandler.state.move_camera;
                    getSpotData();
                    getTileData();
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
                $rootScope.$on('colourUpdate', function(event, data) {
                    renderer.spotColour = data['background-color'];
                    if(logicHandler.currentState != logicHandler.state.upload_ready &&
                       logicHandler.currentState != logicHandler.state.loading &&
                       logicHandler.currentState != logicHandler.state.error ) {
                        updateCanvas();
                    }

                });
                $rootScope.$on('exportSpotData', function(event, data) {
                    var spotDataString = spots.getSpots('tsv');

                    var blob = new Blob([spotDataString]);
                    var filename = "spot_data-" + new Date().toISOString().slice(0, 10) + "." + format;

                    // the next 11 lines are adapted from https://github.com/mholt/PapaParse/issues/175
                    if (window.navigator.msSaveOrOpenBlob)  // IE hack; see http://msdn.microsoft.com/en-us/library/ie/hh779016.aspx
                        window.navigator.msSaveBlob(blob, filename);
                    else
                    {
                        var a = window.document.createElement("a");
                        a.href = window.URL.createObjectURL(blob, {type: dataType});
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
                    else if(logicHandler.currentState == logicHandler.state.move_camera) {
                        scaleManager.updateScaleLevel(camera.scale);
                        tilemapLevel = 1 / scaleManager.currentScaleLevel;
                        tilePosition = tilemap.getTilePosition(camera.position, tilemapLevel); 
                        images = tilemap.getRenderableImages(tilePosition, tilemapLevel);
                        renderer.renderImages(images);
                        renderer.renderSpots(spots.spots);
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
                }
            };
            return {
                restrict: 'A',
                link: link
            };
        }]);
