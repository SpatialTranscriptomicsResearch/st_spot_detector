'use strict';

(function() {
  
    var Renderer = function(context, camera) {
        this.ctx = context;
        this.camera = camera;
        this.bgColour = 'khaki';
        this.spotColour = 'red';
        this.selectedSpotColour = 'green';
        this.spotMiddleColour = 'black';
    };
  
    Renderer.prototype = {
        clearCanvas: function() {
            this.ctx.fillStyle = this.bgColour;
            this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
        },
        renderImages: function(images) {
            this.camera.begin();
                for(var i = 0; i < images.length; ++i) {
                    this.ctx.drawImage(images[i], images[i].renderPosition.x, images[i].renderPosition.y, images[i].scaledSize.x, images[i].scaledSize.y);
                }
            this.camera.end();
        },
        renderSpots: function(spots) {
            this.camera.begin();
                for(var i = 0; i < spots.length; ++i) {
                    var spot = spots[i];

                    this.ctx.beginPath();
                    if(spot.selected) {
                        this.ctx.fillStyle = this.selectedSpotColour;
                    }
                    else {
                        this.ctx.fillStyle = this.spotColour;
                    }
                    this.ctx.arc(spot.renderPosition.x, spot.renderPosition.y, spot.size, 0, Math.PI * 2);
                    this.ctx.closePath();
                    this.ctx.fill();

                    this.ctx.beginPath();
                    this.ctx.fillStyle = this.spotMiddleColour;
                    this.ctx.arc(spot.renderPosition.x, spot.renderPosition.y, 4, 0, Math.PI * 2);
                    this.ctx.closePath();
                    this.ctx.fill();
                }
            this.camera.end();
        },
        renderSpotSelection: function(rectCoords) {
            this.ctx.strokeStyle = "rgba(30, 30, 30, 0.9)";
            this.ctx.setLineDash([4, 3]);
            this.ctx.strokeRect(rectCoords.TL.x, rectCoords.TL.y, rectCoords.WH.x, rectCoords.WH.y);
        }
  };

  this.Renderer = Renderer;
  
}).call(this);
