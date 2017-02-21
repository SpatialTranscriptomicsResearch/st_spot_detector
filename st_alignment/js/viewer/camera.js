/* modified version of  https://github.com/robashton/camera */

(function() {

  var self;
  var Camera = function(ctx, initialPosition, initialScale) {
    self = this;
    self.context = ctx;
    self.position = initialPosition || Vec2.Vec2(0, 0);
    self.scale = initialScale || 0.05;
    self.positionOffset = self.calculateOffset();
    self.navFactor = 60;
    self.scaleFactor = 0.95;
    self.minScale = 0.01;
    self.maxScale = 5.00;
    self.positionBoundaries = {
      "minX": 0,
      "maxX": 2000,
      "minY": 0,
      "maxY": 2000
    };
    self.updateViewport();
  };

  Camera.prototype = {
    begin: function(translation, rotation, ctx) {
      translation = translation || 0;
      rotation = rotation || 0;
      ctx = ctx || self.context;

      ctx.save();

      self.applyScale(ctx);
      self.applyTranslation(ctx);

      // Add offsets
      // Note: We assume that the parameter values are such that the rotation
      // occurs before the translation. This is also what happens here, since
      // we're doing the transformations using ctx.save() -> transforms ->
      // ctx.restore().
      ctx.translate(translation.x, translation.y);
      ctx.rotate(rotation);
    },
    end: function(ctx) {
      ctx = ctx || self.context;
      ctx.restore();
    },
    applyScale: function(ctx) {
      ctx.scale(self.scale, self.scale);
    },
    applyTranslation: function(ctx) {
      // move offset code to updateViewport() function
      ctx.translate(-self.position.x + self.positionOffset.x, -self.position.y +
        self.positionOffset.y);
    },
    updateViewport: function() {
      self.clampValues();
      self.positionOffset = self.calculateOffset();
      self.aspectRatio = self.context.canvas.width / self.context.canvas.height;
    },
    zoomTo: function(z) {
      self.scale = z;
      self.updateViewport();
    },
    moveTo: function(pos) {
      self.position = pos;
      self.updateViewport();
    },
    navigate: function(dir, zoomCenter) {
      var center = zoomCenter || canvasCenter; // the position to which the camera will zoom towards
      var movement = Vec2.subtract(center, self.position); // distance between position and canvas center
      movement = Vec2.scale(movement, 1 - self.scaleFactor); // scaling it down for slight movement

      var scaleFactor = 1.0;
      if (dir === keyevents.left) {
        movement.x -= self.navFactor;
      } else if (dir === keyevents.up) {
        movement.y -= self.navFactor;
      } else if (dir === keyevents.right) {
        movement.x += self.navFactor;
      } else if (dir === keyevents.down) {
        movement.y += self.navFactor;
      } else if (dir === keyevents.zin) {
        scaleFactor =  1 / self.scaleFactor; // 1.05
      } else if (dir === keyevents.zout) {
        scaleFactor = self.scaleFactor; // 0.95
      }

      if ((scaleFactor > 1.0 && self.scale == self.maxScale) ||
        (scaleFactor < 1.0 && self.scale == self.minScale)) {
        // if at min/max boundaries and trying to zoom in/out further, then do nothing
      } else {
        self.pan(movement);
        self.zoom(scaleFactor);
      }
    },
    pan: function(movement) {
      // takes an object {x, y} and moves the camera with that distance //
      // movement = self.mouseToCameraScale(movement, 1 / self.scale);
      self.position = Vec2.add(self.position, movement);
      self.updateViewport();
    },
    zoom: function(scaleFactor) {
      self.scale *= scaleFactor;
      self.updateViewport();
    },
    calculateOffset: function() {
      var canvasMiddle = Vec2.Vec2(self.context.canvas.width / 2, self.context
        .canvas.height / 2);
      var offset = Vec2.scale(canvasMiddle, 1 / self.scale);
      return offset;
    },
    clampValues: function() {
      // keep the scale and position values within reasonable limits
      self.position = Vec2.clampD(self.position, 'x', self.positionBoundaries.minX,
        self.positionBoundaries.maxX);
      self.position = Vec2.clampD(self.position, 'y', self.positionBoundaries.minY,
        self.positionBoundaries.maxY);
      self.scale = Math.max(self.scale, self.minScale);
      self.scale = Math.min(self.scale, self.maxScale);
    },
    mouseToCameraPosition: function(position) {
      var cam = Vec2.subtract(self.position, self.positionOffset);
      var mouse = self.mouseToCameraScale(position, 1 / self.scale);
      return Vec2.add(cam, mouse);
    },
    mouseToCameraScale: function(vector) {
      // this does not take the camera position into account, so it is ideal
      // for use with values such as difference/movement values
      return Vec2.scale(vector, 1 / self.scale);
    }
  };

  this.Camera = Camera;

}).call(self);
