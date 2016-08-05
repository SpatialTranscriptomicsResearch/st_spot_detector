'use strict';

(function() {
  
    var Renderer = function(context, camera) {
        this.ctx = context;
        this.camera = camera;
        this.bgColour = 'khaki';
        this.spotColour = 'red';
        this.selectedSpotColour = 'green';
        this.spotMiddleColour = 'black';
        this.bgSize = {x: -4096, y: -4096, w: 32768, h: 32768};
    };
  
    Renderer.prototype = {
        clearCanvas: function() {
            this.camera.begin();
                this.ctx.fillStyle = this.bgColour;
                this.ctx.fillRect(this.bgSize.x, this.bgSize.y, this.bgSize.w, this.bgSize.h);
            this.camera.end();
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
                    this.ctx.arc(spot.renderPosition.x, spot.renderPosition.y, 90, 0, Math.PI * 2);
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
        renderSpotSelection: function(spotSelection) {
            var w = spotSelection.TL.x - spotSelection.BR.x;
            var h = spotSelection.TL.y - spotSelection.BR.y;
            this.ctx.fillColour = 'blue';
            this.ctx.fillRect(spotSelection.TL.x, spotSelection.TL.y, w, h);
        }
  };

  this.Renderer = Renderer;
  
}).call(this);
