'use strict';

(function() {
  
    var Renderer = function(context, camera) {
        this.ctx = context;
        this.camera = camera;
        this.bgColour = 'khaki';
        this.spotColour = 'red';
        this.spotMiddleColour = 'blue';
        this.bgSize = [-4096, -4096, 32768, 32768];
    };
  
    Renderer.prototype = {
        clearCanvas: function() {
            this.camera.begin();
                this.ctx.fillStyle = this.bgColour;
                this.ctx.fillRect(this.bgSize[0], this.bgSize[1], this.bgSize[2], this.bgSize[3]);
            this.camera.end();
        },
        renderImages: function(images) {
            this.camera.begin();
                for(var i = 0; i < images.length; ++i) {
                    this.ctx.drawImage(images[i], images[i].renderPosition[0], images[i].renderPosition[1], images[i].scaledSize[0], images[i].scaledSize[1]);
                }
            this.camera.end();
        },
        renderSpots: function(spots) {
            this.camera.begin();
                for(var i = 0; i < spots.length; ++i) {
                    var spot = spots[i];

                    this.ctx.beginPath();
                    this.ctx.fillStyle = this.spotColour;
                    this.ctx.arc(spot.renderPosition[0], spot.renderPosition[1], 90, 0, Math.PI * 2);
                    this.ctx.closePath();
                    this.ctx.fill();

                    this.ctx.beginPath();
                    this.ctx.fillStyle = this.spotMiddleColour;
                    this.ctx.arc(spot.renderPosition[0], spot.renderPosition[1], 4, 0, Math.PI * 2);
                    this.ctx.closePath();
                    this.ctx.fill();
                }
            this.camera.end();
        }
  };

  this.Renderer = Renderer;
  
}).call(this);
