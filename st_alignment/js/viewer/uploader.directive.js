'use strict';

/*
function crop(data, x, y, w, h)
{
    var convert = new Interface('js/convert-worker.js');
    convert.on_stdout = function(txt) { console.log(txt); };
    convert.on_stderr = function(txt) { console.log(txt); };

    var stream = new Interface('js/stream-worker.js');
    stream.on_stdout = function(txt) { console.log(txt); };
    stream.on_stderr = function(txt) { console.log(txt); };

    //stream.mkdir('usr/local/etc/ImageMagick').then(function()
    //{ 
        stream.addUrl('../config/configure.xml',  '/usr/local/etc/ImageMagick/', true);
        stream.addUrl('../config/magic.xml',   '/usr/local/etc/ImageMagick/');
        stream.addUrl('../config/mime.xml',   '/usr/local/etc/ImageMagick/');
        stream.addUrl('../config/coder.xml',   '/usr/local/etc/ImageMagick/');
        stream.addUrl('../config/policy.xml',  '/usr/local/etc/ImageMagick/');
        stream.addUrl('../config/english.xml', '/usr/local/etc/ImageMagick/');
        stream.addUrl('../config/locale.xml',  '/usr/local/etc/ImageMagick/');
        stream.addUrl('../config/delegates.xml',  '/usr/local/etc/ImageMagick/');

        stream.addData(data, 'kalle.jpeg');
        stream.allDone().then(function()
        {   
            stream.run('-list', 'configure');
            stream.run('-v');
            stream.run('-map', 'rgb', '-storage-type', 'char', '-extract', '100x100+150+150', 'kalle.jpeg', 'ralle.dat').then(function()
            {   
                stream.getFile('/ralle.dat').then(function(contents)
                {   
                    return contents
                }); 
            }); 
        }); 
    //});


    return data;
}
*/

function getImages(zoomOutLevel) {
    var images = [];
    var photoWidth  = 20000;
    var photoHeight = 20000;
    var imageWidth  = 1024;
    var imageHeight = 1024;

    var tileMapWidth  = Math.trunc((photoWidth  / zoomOutLevel) / imageWidth)  + 1;
    var tileMapHeight = Math.trunc((photoHeight / zoomOutLevel) / imageHeight) + 1;

    for(var y = 0; y < tileMapWidth; ++y) {
        var imageRow = [];
        for(var x = 0; x < tileMapHeight; ++x) {
            var image = new Image();
            image.src = "img/zoom" + zoomOutLevel + "_x" + x + "_y" + y + ".jpg";
            imageRow.push(image);
        }
        images.push(imageRow);
    }

    images.width  = tileMapWidth;
    images.height = tileMapHeight;

    return images;
}

function renderImages(ctx, camera, zoomOutLevel, position, images) {
    camera.moveTo(position[0], position[1]);
    camera.begin();
        for(var i = 0; i < images.length; ++i) {
            ctx.drawImage(images[i], images[i].renderPosition[0], images[i].renderPosition[1]);
        }
    camera.end();
}

function grabRenderableImages(tilePosition, tiledImages) {
    var tilePositions = getSurroundingTilePositions(tilePosition, tiledImages.width, tiledImages.height);
    var images = [];
    for(var i = 0; i < tilePositions.length; ++i) {
        var tileX = tilePositions[i][0];
        var tileY = tilePositions[i][1];
        var image = tiledImages[tileX][tileY];
        image.renderPosition = [tileX * 1024, tileY * 1024];
        images.push(tiledImages[tilePositions[i][0]][tilePositions[i][1]]);
    }
    return images;
}

function getSurroundingTilePositions(tilePosition, maxWidth, maxHeight) {
    var surroundingTilePositions = [];
    for(var x = -1; x < 2; ++x) {
        for(var y = -1; y < 2; ++y) {
            var xPos = tilePosition[0] + x;
            var yPos = tilePosition[1] + y;
            // make sure it is a valid tile
            if(!(xPos < 0 || xPos >= maxWidth ||
                 yPos < 0 || yPos >= maxHeight)) {
                surroundingTilePositions.push([xPos, yPos]);
            }
        }
    }
    return surroundingTilePositions;
}

function updateImagePosition(cameraPosition, zoomOutLevel) {
    var newImagePosition = [cameraPosition[0] * zoomOutLevel, cameraPosition[1] * zoomOutLevel];
    return newImagePosition;
}

function updateTilePosition(cameraPosition, zoomOutLevel) {
    var x = Math.trunc(cameraPosition[0] / 1024);
    var y = Math.trunc(cameraPosition[1] / 1024);
    return [x, y];
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

                var zoomImages = [];
                zoomImages[1]  = getImages(1);
                zoomImages[2]  = getImages(2);
                zoomImages[3]  = getImages(3);
                zoomImages[5]  = getImages(5);
                zoomImages[10] = getImages(10);
                zoomImages[20] = getImages(20);

                var imagesToRender = [];

                document.onkeydown = function(event) {
                    if(scope.imageLoaded) {
                        event = event || window.event;
                       if(event.which === 37) { // left
                            scope.cameraPosition[0] -= scope.panFactor;
                        }
                        if(event.which === 38) { // up
                            scope.cameraPosition[1] -= scope.panFactor;
                        }
                        if(event.which === 39) { // right
                            scope.cameraPosition[0] += scope.panFactor;
                        }
                        if(event.which === 40) { // down
                            scope.cameraPosition[1] += scope.panFactor;
                        }

                        scope.imagePosition = updateImagePosition(scope.cameraPosition, scope.zoomOutLevel);
                        scope.tilePosition = updateTilePosition(scope.cameraPosition, scope.zoomOutLevel);
                        var imagesForRendering = grabRenderableImages(scope.tilePosition, zoomImages[scope.zoomOutLevel]);
                        renderImages(ctx, camera, scope.zoomOutLevel, scope.cameraPosition, imagesForRendering);
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
