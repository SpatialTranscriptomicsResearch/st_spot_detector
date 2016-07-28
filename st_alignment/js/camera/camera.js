/* very stripped down and modified version of  https://github.com/robashton/camera */

(function() {

  var Camera = function(context, settings) {
      settings = settings || {};
      this.zoom = 1.0;
      this.lookat = [0,0];
      this.context = context;
      this.viewport = {
          l: 0,
          r: 0,
          t: 0,
          b: 0,
          width: 0,
          height: 0,
          scale: [1.0, 1.0]
      };
      this.updateViewport();
  };

  Camera.prototype = {
      begin: function() {
          this.context.save();
          this.applyScale();
          this.applyTranslation();
      },
      end: function() {
          this.context.restore();
      },
      applyScale: function() {
          this.context.scale(this.viewport.scale[0], this.viewport.scale[1]);
      },
      applyTranslation: function() {
          this.context.translate(-this.viewport.l, -this.viewport.t);
      },
      updateViewport: function() {
          this.aspectRatio = this.context.canvas.width / this.context.canvas.height;
          this.viewport.l = this.lookat[0] - (this.viewport.width / 2.0);
          this.viewport.t = this.lookat[1] - (this.viewport.height / 2.0);
          this.viewport.r = this.viewport.l + this.viewport.width;
          this.viewport.b = this.viewport.t + this.viewport.height;
          this.viewport.scale[0] = this.zoom; 
          this.viewport.scale[1] = this.zoom;
      },
      zoomTo: function(z) {
          this.zoom = z;
          this.updateViewport();
      },
      moveTo: function(pos) {
          this.lookat = pos;
          this.updateViewport();
      },
  };

  this.Camera = Camera;
  
}).call(this);
