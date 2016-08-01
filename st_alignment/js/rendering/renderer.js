'use strict';

(function() {
  
    var Renderer = function(context, camera) {
        this.ctx = context;
        this.camera = camera;
        this.bgColour = "khaki";
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
        }
  };

  this.Renderer = Renderer;
  
}).call(this);
