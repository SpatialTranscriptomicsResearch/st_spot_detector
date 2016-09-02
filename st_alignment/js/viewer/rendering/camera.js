/* very stripped down and modified version of  https://github.com/robashton/camera */

(function() {
  
    var self;
    var Camera = function(ctx, initialPosition, initialScale) {
        self = this;
        self.context = ctx;
        self.position = initialPosition || Vec2.Vec2(0, 0);
        self.scale = initialScale || 1.0;
        self.positionOffset = self.calculateOffset();
        self.viewport = {
            l: 0, r: 0,
            t: 0, b: 0,
            width: 0,
            height: 0,
            scale: Vec2.Vec2(1, 1)
        };
        self.navFactor = 60;
        self.panFactor = 5;
        self.scaleFactor = 0.95; 
        self.minScale = 0.03;
        self.maxScale = 1.00;
        self.positionBoundaries = {"minX": 0, "maxX": 20480, "minY": 0, "maxY": 20480};
        self.dir = Object.freeze({"left": 1, "up": 2, "right": 3, "down": 4, "zin": 5, "zout": 6});
        self.updateViewport();
    };
  
    Camera.prototype = {
        begin: function() {
            self.context.save();
            self.applyScale();
            self.applyTranslation();
        },
        end: function() {
            self.context.restore();
        },
        applyScale: function() {
            self.context.scale(self.viewport.scale.x, self.viewport.scale.y);
        },
        applyTranslation: function() {
            // move offset code to updateViewport() function
            self.context.translate(-self.viewport.l + self.positionOffset.x, -self.viewport.t + self.positionOffset.y);
        },
        updateViewport: function() {
            self.clampValues();
            self.positionOffset = self.calculateOffset();
            self.aspectRatio = self.context.canvas.width / self.context.canvas.height;
            self.viewport.l = self.position.x - (self.viewport.width / 2.0);
            self.viewport.t = self.position.y - (self.viewport.height / 2.0);
            self.viewport.r = self.viewport.l + self.viewport.width;
            self.viewport.b = self.viewport.t + self.viewport.height;
            self.viewport.scale.x = self.scale; 
            self.viewport.scale.y = self.scale;
        },
        zoomTo: function(z) {
            self.scale = z;
            self.updateViewport();
        },
        moveTo: function(pos) {
            self.position = pos;
            self.updateViewport();
        },
        navigate: function(dir) {
            var movement = Vec2.Vec2(0, 0);
            var scaleFactor = 1;
            if(dir === self.dir.left) {
                movement.x -= self.navFactor;
            }
            else if(dir === self.dir.up) {
                movement.y -= self.navFactor;
            }
            else if(dir === self.dir.right) {
                movement.x += self.navFactor;
            }
            else if(dir === self.dir.down) {
                movement.y += self.navFactor;
            }
            else if(dir === self.dir.zin) {
                scaleFactor = 1 / self.scaleFactor;
            }
            else if(dir === self.dir.zout) {
                scaleFactor = self.scaleFactor;
            }
            self.pan(movement);
            self.zoom(scaleFactor);
        },
        pan: function(direction) {
            // takes an object {x, y} and moves the camera with that distance //
            direction = Vec2.scale(direction, self.panFactor);
            self.position = Vec2.add(self.position, direction);
            self.updateViewport();
        },
        zoom: function(scaleFactor) {
            self.scale *= scaleFactor;
            self.updateViewport();
        },
        calculateOffset: function() {
            var canvasMiddle = Vec2.Vec2(self.context.canvas.width / 2, self.context.canvas.height / 2);
            var offset = Vec2.scale(canvasMiddle, 1 / self.scale);
            return offset;
        },
        clampValues: function() {
            // keep the scale and position values within reasonable limits
            self.position = Vec2.clampX(self.position, self.positionBoundaries.minX, self.positionBoundaries.maxX);
            self.position = Vec2.clampY(self.position, self.positionBoundaries.minY, self.positionBoundaries.maxY);
            self.scale = Math.max(self.scale, self.minScale);
            self.scale = Math.min(self.scale, self.maxScale);
        },
        mouseToCameraPosition: function(position) {
            var cam = Vec2.subtract(self.position, self.positionOffset);
            var mouse = Vec2.scale(position, 1 / self.scale);
            return Vec2.add(cam, mouse);
        }
    };
  
    this.Camera = Camera;
    
}).call(self);
