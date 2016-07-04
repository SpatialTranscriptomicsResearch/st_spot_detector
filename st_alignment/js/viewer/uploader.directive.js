angular.module('viewer')
    .directive('stUploader', [
        '$rootScope',
        function($rootScope){
            var link = function(scope, element) {
                var ctx = element[0].getContext('2d');
                ctx.fillStyle = "green";
                ctx.fillRect(10, 10, 100, 100);
                $rootScope.$on('imageUrlSet', function(event, data) {
                    console.log(data);
                    ctx.fillStyle = "pink";
                    ctx.fillRect(500, 500, 100, 100);
                    /*
                    var image = new Image();
                    image.src = data;
                    image.addEventListener('load', function() {
                        ctx.drawImage(image, 20, 20);
                    }, false);
                    */
                    var hej = data;
                    var rawData = jpeg.decode(hej);
                    console.log(hej.data);
                });
            };
            return {
                restrict: 'A',
                link: link
            };
        }]);
    /* this is from http://stackoverflow.com/a/16623816 and
     * is being used as a guide, so will soon be rewritten */
    /*
      return {
        restrict: "A",
        link: function(scope, element){
          var ctx = element[0].getContext('2d');

          // variable that decides if something should be drawn on mousemove
          var drawing = false;

          // the last coordinates before the current move
          var lastX;
          var lastY;

          element.bind('mousedown', function(event){
            if(event.offsetX!==undefined){
              lastX = event.offsetX;
              lastY = event.offsetY;
            } else { // Firefox compatibility
              lastX = event.layerX - event.currentTarget.offsetLeft;
              lastY = event.layerY - event.currentTarget.offsetTop;
            }

            // begins new line
            ctx.beginPath();

            drawing = true;
          });
          element.bind('mousemove', function(event){
            if(drawing){
              // get current mouse position
              if(event.offsetX!==undefined){
                currentX = event.offsetX;
                currentY = event.offsetY;
              } else {
                currentX = event.layerX - event.currentTarget.offsetLeft;
                currentY = event.layerY - event.currentTarget.offsetTop;
              }

              draw(lastX, lastY, currentX, currentY);

              // set current coordinates to last one
              lastX = currentX;
              lastY = currentY;
            }

          });
          element.bind('mouseup', function(event){
            // stop drawing
            drawing = false;
          });

          // canvas reset
          function reset(){
           element[0].width = element[0].width; 
          }

          function draw(lX, lY, cX, cY){
            // line from
            ctx.moveTo(lX,lY);
            // to
            ctx.lineTo(cX,cY);
            // color
            ctx.strokeStyle = "#4bf";
            // draw it
            ctx.stroke();
          }
        }
      };
    });
    */
