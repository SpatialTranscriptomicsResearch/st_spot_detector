'use strict';

// move these functions to the camera or renderer //
function renderImages(ctx, camera, scale, position, images) {
    camera.moveTo(position[0], position[1]);
    camera.zoomTo(scale);
    camera.begin();
        ctx.fillStyle = "khaki";
        ctx.fillRect(-1024, -1024, 21504, 21504);
        for(var i = 0; i < images.length; ++i) {
            console.log(i + ": " + images[i].renderPosition[0] + ", " + images[i].renderPosition[1]);
            ctx.drawImage(images[i], images[i].renderPosition[0], images[i].renderPosition[1]);
        }
    camera.end();
}

function updateCameraPosition(imagePosition, scaleLevel) {
    var cameraPosition = [];
    cameraPosition[0] = imagePosition[0] / scaleLevel;
    cameraPosition[1] = imagePosition[1] / scaleLevel;
    return cameraPosition;
}

function updateScaleLevel(scaleLevel, cameraScale, scaleLevels) {
    // assumes no 'skipping' between scale levels
    var newScaleLevel;
    var index = scaleLevels.indexOf(scaleLevel);
    if(index != 0 && index != scaleLevels.length - 1) {
        var index = scaleLevels.indexOf(scaleLevel);
        var prevLevel = scaleLevels[index - 1];
        var nextLevel = scaleLevels[index + 1];
        if(cameraScale < scaleLevel) {
            newScaleLevel = previousLevel;
        }
        else if(cameraScale >= nextLevel) {
            newScaleLevel = nextLevel;
        }
    }
    else if(index == 0) {
    }
    else if(index == scaleLevels.length - 1) {
    }
    return newScaleLevel;
}

function getScaleLevels(tilemapLevels) {
    var scaleLevels = [];
    for(var i = 0; i < tilemapLevels.length; ++i) {
        scaleLevels.push(1 / tilemapLevels[i]);
    }
    return scaleLevels;
}

angular.module('viewer')
    .directive('stUploader', [
        '$rootScope',
        function($rootScope){
            var link = function(scope, element) {
                var canvas = element[0];
                var ctx = canvas.getContext('2d');

                var camera = new Camera(ctx);
                camera.begin();
                    ctx.fillStyle = "green";
                    ctx.fillRect(300, 300, 100, 100);
                camera.end();

                var imagePosition = [10000, 10000]; // pixel coordinates within the large image

                var tilemap = new Tilemap();
                var tilemapLevel = 1;
                var tilePosition = tilemap.getTilePosition(imagePosition, tilemapLevel); 

                /* the scale checkpoint level at which everything is rendered and scaled
                   scaled around but is *not* necessarily the same as the camera scale   */
                var scaleLevel = 1 / tilemapLevel;
                /* the possible scale levels based on the tilemap levels; i.e.
                   the scales at which the various tilemaps should be rendered */
                var scaleLevels = getScaleLevels(tilemap.tilemapLevels);

                var panFactor = 100;    // move these two to
                var scaleFactor = 0.99; // the camera class, maybe?

                // coordinates on the canvas; varies depending on image position and camera scale
                var cameraScale = scaleLevel;
                var cameraPosition = updateCameraPosition(imagePosition, cameraScale);

                /* https://css-tricks.com/snippets/javascript/javascript-keycodes/#article-header-id-1 */
                var keycodes = {
                    left : [37, 72], // left,  h
                    up   : [38, 75], // up,    k
                    right: [39, 76], // right, l
                    down : [40, 74], // down,  j
                    zin  : [87]    , // w
                    zout : [83]      // s
                }

                document.onkeydown = function(event) {
                    if(scope.imageLoaded) {
                        event = event || window.event;
                        if(keycodes.left.includes(event.which)) {
                            // ← left
                            imagePosition[0] -= panFactor;
                        }
                        else if(keycodes.up.includes(event.which)) {
                            // ↑ up
                            imagePosition[1] -= panFactor;
                        }
                        else if(keycodes.right.includes(event.which)) {
                            // → right
                            imagePosition[0] += panFactor;
                        }
                        else if(keycodes.down.includes(event.which)) {
                            // ↓ down
                            imagePosition[1] += panFactor;
                        }
                        else if(keycodes.zin.includes(event.which)) {
                            // + in
                            cameraScale /= scaleFactor;
                        }
                        else if(keycodes.zout.includes(event.which)) {
                            // - out
                            cameraScale *= scaleFactor;
                        }

                        // update position and scale
                        scaleLevel = updateScaleLevel(scaleLevel, cameraScale, scaleLevels);
                        cameraPosition = updateCameraPosition(imagePosition, scaleLevel); 
                        console.log("Camera at: " + cameraPosition[0] + ", " + cameraPosition[1]);
                        tilePosition = tilemap.getTilePosition(imagePosition, tilemapLevel); 

                        // render images
                        var tilePositions = tilemap.getSurroundingTilePositions(tilePosition, tilemapLevel);
                        var imagesForRendering = tilemap.getRenderableImages(tilePositions, tilemapLevel);
                        renderImages(ctx, camera, cameraScale, cameraPosition, imagesForRendering);
                    }

                }

                $rootScope.$on('imageLoaded', function(event, data) {
                    scope.imageLoaded = true;
                    ctx.drawImage(zoomImages20[0][0], 0, 0);

                });
            };
            return {
                restrict: 'A',
                link: link
            };
        }]);
