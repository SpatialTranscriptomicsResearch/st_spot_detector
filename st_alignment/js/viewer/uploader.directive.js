'use strict';

angular.module('viewer')
    .directive('stUploader', [
        '$rootScope',
        function($rootScope) {
            var link = function(scope, element) {
                var canvas = element[0];
                var ctx = canvas.getContext('2d');

                var tilemapLevel = 20;
                var imagePosition = [(ctx.canvas.width / 2) * tilemapLevel, (ctx.canvas.height / 2) * tilemapLevel];

                var tilemap = new Tilemap();
                var scaleManager = new ScaleManager(tilemap.tilemapLevels, tilemapLevel);
                var camera = new Camera(ctx, imagePosition, scaleManager.currentScaleLevel);
                var renderer = new Renderer(ctx, camera);

                /* https://css-tricks.com/snippets/javascript/javascript-keycodes/#article-header-id-1 */
                var keycodes = {
                    left : [ 37, 65], // left,  a
                    up   : [ 38, 87], // up,    w
                    right: [ 39, 68], // right, d
                    down : [ 40, 83], // down,  s
                    zin  : [107, 69], // +,     e
                    zout : [109, 81]  // -,     q
                }

                var tilePosition = tilemap.getTilePosition(imagePosition, tilemapLevel);
                var images = tilemap.getRenderableImages(tilePosition, tilemapLevel); 
                renderer.clearCanvas();
                renderer.renderImages(images);

                var mousePos = [];
                var mouseDown = false;

                canvas.onmousedown = function(e){
                    mousePos = [e.pageX, e.pageY];
                    mouseDown = true;
                }
                canvas.onmouseup = function(e) {
                    mouseDown = false;
                }

                canvas.onmouseout = function(e) {
                    mouseDown = false;
                }

                canvas.onmousemove = function(e) {
                    if(mouseDown) {
                        var difference = [mousePos[0] - e.pageX, mousePos[1] - e.pageY];
                        camera.pan(difference);
                        mousePos = [e.pageX, e.pageY];
                        updateCanvas();
                    }
                }
                canvas.onmousewheel = function(e) {
                    if(e.deltaY < 0) {
                        camera.zoom(camera.dir.zin);
                    }
                    else if(e.deltaY > 0) {
                        camera.zoom(camera.dir.zout);
                    }
                    updateCanvas();
                }

                document.onkeydown = function(event) {
                    if(scope.imageLoaded) {
                        event = event || window.event;

                        if(keycodes.left.includes(event.which)) {
                            // ← left
                            camera.navigate(camera.dir.left);
                        }
                        else if(keycodes.up.includes(event.which)) {
                            // ↑ up
                            camera.navigate(camera.dir.up);
                        }
                        else if(keycodes.right.includes(event.which)) {
                            // → right
                            camera.navigate(camera.dir.right);
                        }
                        else if(keycodes.down.includes(event.which)) {
                            // ↓ down
                            camera.navigate(camera.dir.down);
                        }
                        else if(keycodes.zin.includes(event.which)) {
                            // + in
                            camera.zoom(camera.dir.zin);
                        }
                        else if(keycodes.zout.includes(event.which)) {
                            // - out
                            camera.zoom(camera.dir.zout);
                        }

                        updateCanvas();
                    }
                }

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

                    console.log("Camera at: " + camera.position[0] + ", " + camera.position[1]);
                    console.log("with zoom: " + camera.scale);
                    console.log("in tile: " + tilePosition[0] + ", " + tilePosition[1]);
                    console.log("image position: " + imagePosition[0] + ", " + imagePosition[1]);
                    console.log("Scale and tilemap level at: " + scaleManager.currentScaleLevel + ", " + tilemapLevel);
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
