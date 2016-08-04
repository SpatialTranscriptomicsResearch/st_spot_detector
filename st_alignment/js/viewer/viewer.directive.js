'use strict';

angular.module('viewer')
    .directive('viewerCanvas', [
        '$rootScope',
        function($rootScope) {
            var link = function(scope, element) {
                var canvas = element[0];
                var ctx = canvas.getContext('2d');

                var tilemapLevel = 20;
                var imagePosition = [(ctx.canvas.width / 2) * tilemapLevel, (ctx.canvas.height / 2) * tilemapLevel];

                var tilemap = new Tilemap();
                var spots = new SpotManager();
                var scaleManager = new ScaleManager(tilemap.tilemapLevels, tilemapLevel);
                var camera = new Camera(ctx, imagePosition, scaleManager.currentScaleLevel);
                var renderer = new Renderer(ctx, camera);
                var logicHandler = new LogicHandler(canvas, camera, updateCanvas);
                var eventHandler = new EventHandler(canvas, camera, logicHandler);

                var tilePosition = tilemap.getTilePosition(imagePosition, tilemapLevel);
                var images = tilemap.getRenderableImages(tilePosition, tilemapLevel); 
                renderer.clearCanvas();
                renderer.renderImages(images);

                var spotsOn = false;

                $rootScope.$on('imageLoaded', function(event, data) {
                    scope.imageLoaded = true;
                    updateCanvas();
                });
                $rootScope.$on('spotsCalculated', function(event, data) {
                    spotsOn = !spotsOn;
                    updateCanvas();
                });
                $rootScope.$on('colourUpdate', function(event, data) {
                    renderer.spotColour = data['background-color'];
                    updateCanvas();
                });

                function updateCanvas() {
                    // update position and scale
                    scaleManager.updateScaleLevel(camera.scale);
                    tilemapLevel = 1 / scaleManager.currentScaleLevel;
                    imagePosition = camera.position;
                    tilePosition = tilemap.getTilePosition(imagePosition, tilemapLevel); 

                    // render images
                    images = tilemap.getRenderableImages(tilePosition, tilemapLevel);
                    renderer.clearCanvas();
                    renderer.renderImages(images);

                    // render spots
                    if(spotsOn) renderer.renderSpots(spots.spots);

                    //tileDebugPrints();
                }
                function tileDebugPrints() {
                    console.log("Camera at: " + camera.position[0] + ", " + camera.position[1]);
                    console.log("with zoom: " + camera.scale);
                    console.log("in tile: " + tilePosition[0] + ", " + tilePosition[1]);
                    console.log("image position: " + imagePosition[0] + ", " + imagePosition[1]);
                    console.log("Scale and tilemap level at: " + scaleManager.currentScaleLevel + ", " + tilemapLevel);
                }
            };
            return {
                restrict: 'A',
                link: link
            };
        }]);
