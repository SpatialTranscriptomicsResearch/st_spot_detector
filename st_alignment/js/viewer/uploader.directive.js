'use strict';

angular.module('viewer')
    .directive('stUploader', [
        '$rootScope',
        function($rootScope) {
            var link = function(scope, element) {
                var tilemapLevel = 3;
                var imagePosition = [8000, 8000]; // pixel coordinates within the large image

                var canvas = element[0];
                var ctx = canvas.getContext('2d');

                var tilemap = new Tilemap();
                var scaleManager = new ScaleManager(tilemap.tilemapLevels, tilemapLevel);
                var camera = new Camera(ctx, imagePosition, scaleManager.currentScaleLevel);
                var renderer = new Renderer(ctx, camera);

                /* https://css-tricks.com/snippets/javascript/javascript-keycodes/#article-header-id-1 */
                var keycodes = {
                    left : [37, 72], // left,  h
                    up   : [38, 75], // up,    k
                    right: [39, 76], // right, l
                    down : [40, 74], // down,  j
                    zin  : [87]    , // w
                    zout : [83]      // s
                }

                var tilePosition = tilemap.getTilePosition(imagePosition, tilemapLevel);
                var images = tilemap.getRenderableImages(tilePosition, tilemapLevel); 
                renderer.clearCanvas();
                renderer.renderImages(images);

                document.onkeydown = function(event) {
                    if(scope.imageLoaded) {
                        event = event || window.event;

                        var movement = false;
                        if(keycodes.left.includes(event.which)) {
                            // ← left
                            camera.pan(camera.dir.left);
                            movement = true;
                        }
                        else if(keycodes.up.includes(event.which)) {
                            // ↑ up
                            camera.pan(camera.dir.up);
                            movement = true;
                        }
                        else if(keycodes.right.includes(event.which)) {
                            // → right
                            camera.pan(camera.dir.right);
                            movement = true;
                        }
                        else if(keycodes.down.includes(event.which)) {
                            // ↓ down
                            camera.pan(camera.dir.down);
                            movement = true;
                        }
                        else if(keycodes.zin.includes(event.which)) {
                            // + in
                            camera.zoom(camera.dir.zin);
                            movement = true;
                        }
                        else if(keycodes.zout.includes(event.which)) {
                            // - out
                            camera.zoom(camera.dir.zout);
                            movement = true;
                        }

                        if(movement) {
                            // update position and scale
                            scaleManager.updateScaleLevel(camera.scale);
                            tilemapLevel = 1 / scaleManager.currentScaleLevel;
                            imagePosition = camera.position;
                            console.log("about to call with " + imagePosition[0] + ", " + imagePosition[1] + " at level " + scaleManager.currentScaleLevel + "/" + tilemapLevel);
                            tilePosition = tilemap.getTilePosition(imagePosition, tilemapLevel); 

                            // render images
                            images = tilemap.getRenderableImages(tilePosition, tilemapLevel);
                            renderer.clearCanvas();
                            renderer.renderImages(images);

                            console.log("Camera at: " + camera.position[0] + ", " + camera.position[1]);
                            console.log("with zoom: " + camera.scale);
                            console.log("in tile: " + tilePosition[0] + ", " + tilePosition[1]);
                            console.log("image position: " + imagePosition[0] + ", " + imagePosition[1]);
                            console.log("Scale and tilemap level at: " + scaleManager.currentScaleLevel + ", " + tilemapLevel);
                        }
                    }

                }

                $rootScope.$on('imageLoaded', function(event, data) {
                    scope.imageLoaded = true;
                });
            };
            return {
                restrict: 'A',
                link: link
            };
        }]);
