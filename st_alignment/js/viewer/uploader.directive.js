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

                var zoomImages1  = getImages(1);
                var zoomImages2  = getImages(2);
                var zoomImages3  = getImages(3);
                var zoomImages5  = getImages(5);
                var zoomImages10 = getImages(10);
                var zoomImages20 = getImages(20);

                document.onkeydown = function(event) {
                    if(scope.imageLoaded) {
                        event = event || window.event;
                       if(event.which === 37) { // left
                            console.log('left');
                            scope.cameraPosition[0] -= scope.panFactor;
                        }
                        if(event.which === 38) { // up
                            console.log('up');
                            scope.cameraPosition[1] -= scope.panFactor;
                        }
                        if(event.which === 39) { // right
                            console.log('right');
                            scope.cameraPosition[0] += scope.panFactor;
                        }
                        if(event.which === 40) { // down
                            console.log('down');
                            scope.cameraPosition[1] += scope.panFactor;
                        }

                        camera.moveTo(scope.cameraPosition[0], scope.cameraPosition[1]);
                        camera.begin();
                            ctx.fillStyle = "blue";
                            ctx.fillRect(300, 300, 100, 100);
                        camera.end();
                    }

                }

                $rootScope.$on('imageLoaded', function(event, data) {
                    scope.imageLoaded = true;
                    ctx.fillStyle = "pink";
                    ctx.fillRect(500, 500, 100, 100);

                    var zoomOutLevel = 1;
                    var posX = 500;
                    var posY = 500;

                    ctx.drawImage(zoomImages20[0][0], 0, 0);

                });
            };
            return {
                restrict: 'A',
                link: link
            };
        }]);
