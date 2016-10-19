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
                    // TODO: take into account canvas size, in order to centre the image
                    // (as opposed to having it in the top left corner)
                    var cameraPosition = {x: (ctx.canvas.width  / 2) * tilemapLevel,
                                          y: (ctx.canvas.height / 2) * tilemapLevel};
                    var camera = new Camera(ctx, cameraPosition, 1 / tilemapLevel);
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
                        }
                    }

                    scope.receiveTilemap = function(tilemapData) {
                        tilemap.loadTilemap(tilemapData);
                        scaleManager.setTilemapLevels(tilemap.tilemapLevels, tilemapLevel);
                        tilePosition = tilemap.getTilePosition(cameraPosition, tilemapLevel);
                        images.images = tilemap.getRenderableImages(tilePosition, tilemapLevel); 

                        refreshCanvas();
                    }
                    
                }
            };
        });
