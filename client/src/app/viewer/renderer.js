'use strict';

const Renderer = (function() {

    var self;
    var Renderer = function(context, camera) {
        self = this;
        self.ctx = context;
        self.camera = camera;
        self.spotSelectionColor = 'rgba(150, 150, 150, 0.95)'; // grey
    };

    Renderer.prototype = {
        clearCanvas: function(context = self.ctx) {
            context.save();
            context.resetTransform();
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);
            context.restore();
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
