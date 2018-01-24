'use strict';

const Renderer = (function() {

    var self;
    var Renderer = function(context, camera) {
        self = this;
        self.ctx = context;
        self.camera = camera;
        self.spotColorHSL = "6, 78%, 57%"; // red
        self.spotColorA = "0.60";
        self.selectedSpotColor  = 'hsla(140, 63%, 42%, 0.50)'; // green
        self.spotSelectionColor = 'rgba(150, 150, 150, 0.95)'; // grey
    };

    Renderer.prototype = {
        changeSpotColor: function(color, type) {
            var currentColor = self.spotColor;
            if(type == "color") {
                self.spotColorHSL = color;
            }
            else if(type == "opacity") {
                self.spotColorA = color;
            }
        },
        clearCanvas: function(context = self.ctx) {
            context.save();
            context.resetTransform();
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);
            context.restore();
        },
        renderImages: function(canvas, images) {
            const ctx = canvas.getContext('2d');
            self.camera.begin(ctx);
                for(var i = 0; i < images.length; ++i) {
                    ctx.drawImage(images[i], images[i].renderPosition.x, images[i].renderPosition.y, images[i].scaledSize.x, images[i].scaledSize.y);
                }
            self.camera.end(ctx);
        },
        renderSpots: function(spots) {
                for(var i = 0; i < spots.length; ++i) {
                    var spot = spots[i];

                    self.ctx.beginPath();
                        if(spot.selected) {
                            self.ctx.fillStyle = self.selectedSpotColor;
                        }
                        else {
                            var spotColor = 'hsla(' + self.spotColorHSL + ',' + self.spotColorA + ')';
                            self.ctx.fillStyle = spotColor;
                        }
                        self.ctx.arc(spot.renderPosition.x, spot.renderPosition.y, spot.diameter / 2, 0, Math.PI * 2);
                    self.ctx.closePath();
                    self.ctx.fill();
                }
        },
        renderSpotToAdd: function(spot) {
            self.camera.begin();
                self.ctx.beginPath();
                    self.ctx.fillStyle = self.selectedSpotColor;
                    self.ctx.arc(spot.renderPosition.x, spot.renderPosition.y, spot.diameter / 2, 0, Math.PI * 2);
                self.ctx.closePath();
                self.ctx.fill();
            self.camera.end();
        },
        renderSpotSelection: function(rectCoords) {
            self.ctx.save();
            self.ctx.strokeStyle = self.spotSelectionColor;
            self.ctx.setLineDash([4, 3]);
            self.ctx.strokeRect(rectCoords.TL.x, rectCoords.TL.y, rectCoords.WH.x, rectCoords.WH.y);
            self.ctx.restore();
        },
  };

  return Renderer;

}());

export default Renderer;
