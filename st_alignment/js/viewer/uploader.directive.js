'use strict';

// move these functions to the camera or renderer //
function renderImages(ctx, camera, scale, position, images, scaleLevel) {
    camera.moveTo(position);
    camera.zoomTo(scale);
    camera.begin();
        ctx.fillStyle = "khaki";
        ctx.fillRect(-4096, -4096, 32768, 32768);
        for(var i = 0; i < images.length; ++i) {
            console.log(i + ": " + images[i].renderPosition[0] + ", " + images[i].renderPosition[1]);
            console.log(i + ": " + images[i].scaledSize[0] + ", " + images[i].scaledSize[1]);
            ctx.drawImage(images[i], images[i].renderPosition[0], images[i].renderPosition[1], images[i].scaledSize[0], images[i].scaledSize[1]);
        }
    camera.end();
}

function updateImagePosition(camera) {
    var imagePosition = [];
    imagePosition[0] = camera.lookat[0];
    imagePosition[1] = camera.lookat[1];
    return imagePosition;
}

function updateScaleLevel(scaleLevel, cameraScale, scaleLevels) {
    /* assumes no 'skipping' between scale levels, so
       may encounter some problems with fast zooming */
    var newScaleLevel = scaleLevel;
    var prevLevel;
    var nextLevel;
    var index = scaleLevels.indexOf(scaleLevel);

    if(index != 0 && index != scaleLevels.length - 1) {
        prevLevel = scaleLevels[index - 1];
        nextLevel = scaleLevels[index + 1];
    }
    else if(index == 0) {
        prevLevel = scaleLevel;
        nextLevel = scaleLevels[index + 1];

    }
    else if(index == scaleLevels.length - 1) {
        prevLevel = scaleLevels[index - 1];
        nextLevel = scaleLevel;
    }

    if(cameraScale== scaleLevel ||
       cameraScale >  nextLevel) {
        // do nothing
    }
    if(cameraScale > scaleLevel) {
        newScaleLevel = prevLevel;
    }
    else if(cameraScale <= nextLevel) {
        newScaleLevel = nextLevel;
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
        function($rootScope) {
            var link = function(scope, element) {
                var canvas = element[0];
                var ctx = canvas.getContext('2d');

                var camera = new Camera(ctx);
                            console.log("Camera at: " + camera.lookat[0] + ", " + camera.lookat[1]);
                camera.begin();
                    ctx.fillStyle = "green";
                    ctx.fillRect(300, 300, 100, 100);
                camera.end();

                var imagePosition = [0, 0]; // pixel coordinates within the large image

                var tilemap = new Tilemap();
                var tilemapLevel = 20;
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
                camera.zoomTo(scaleLevel);
                camera.moveTo([2.5, 3]);
                            console.log("Camera at: " + camera.lookat[0] + ", " + camera.lookat[1]);

                /* https://css-tricks.com/snippets/javascript/javascript-keycodes/#article-header-id-1 */
                var keycodes = {
                    left : [37, 72], // left,  h
                    up   : [38, 75], // up,    k
                    right: [39, 76], // right, l
                    down : [40, 74], // down,  j
                    zin  : [87]    , // w
                    zout : [83]      // s
                }
                var tilePositions = tilemap.getSurroundingTilePositions(tilePosition, tilemapLevel);
                var images = tilemap.getRenderableImages(tilePositions, tilemapLevel);
                renderImages(ctx, camera, camera.zoom, camera.lookat, images, scaleLevel);

                document.onkeydown = function(event) {
                    if(scope.imageLoaded) {
                        event = event || window.event;

                        var movement = false;
                        if(keycodes.left.includes(event.which)) {
                            // ← left
                            camera.lookat[0] -= panFactor;
                            movement = true;
                        }
                        else if(keycodes.up.includes(event.which)) {
                            // ↑ up
                            camera.lookat[1] -= panFactor;
                            movement = true;
                        }
                        else if(keycodes.right.includes(event.which)) {
                            // → right
                            camera.lookat[0] += panFactor;
                            movement = true;
                        }
                        else if(keycodes.down.includes(event.which)) {
                            // ↓ down
                            camera.lookat[1] += panFactor;
                            movement = true;
                        }
                        else if(keycodes.zin.includes(event.which)) {
                            // + in
                            camera.zoom /= scaleFactor;
                            movement = true;
                        }
                        else if(keycodes.zout.includes(event.which)) {
                            // - out
                            camera.zoom *= scaleFactor;
                            movement = true;
                        }

                        if(movement) {
                            console.log('////////////////////////////');

                            console.log('hi');
                            // update position and scale
                            scaleLevel = updateScaleLevel(scaleLevel, camera.zoom, scaleLevels);
                            tilemapLevel = 1 / scaleLevel;
                            imagePosition = updateImagePosition(camera);
                            console.log("about to call with " + imagePosition[0] + ", " + imagePosition[1] + " at level " + scaleLevel + "/" + tilemapLevel);
                            tilePosition = tilemap.getTilePosition(imagePosition, tilemapLevel); 

                            // render images
                            var tilePositions = tilemap.getSurroundingTilePositions(tilePosition, tilemapLevel);
                            var images = tilemap.getRenderableImages(tilePositions, tilemapLevel);
                            renderImages(ctx, camera, camera.zoom, camera.lookat, images, scaleLevel);

                            console.log("Camera at: " + camera.lookat[0] + ", " + camera.lookat[1]);
                            console.log("with zoom: " + camera.zoom);
                            console.log("in tile: " + tilePosition[0] + ", " + tilePosition[1]);
                            console.log("image position: " + imagePosition[0] + ", " + imagePosition[1]);
                            console.log("Scale and tilemap level at: " + scaleLevel + ", " + tilemapLevel);
                        }
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
