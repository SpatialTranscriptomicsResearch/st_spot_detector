/* very stripped down and modified version of  https://github.com/robashton/camera */

(function() {
  
    var Camera = function(context, initialPosition, initialScale) {
        this.context = context;
        this.position = initialPosition || {x: 0,y: 0};
        this.scale = initialScale || 1.0;
        this.positionOffset = this.calculateOffset();
        this.viewport = {
            l: 0,
            r: 0,
            t: 0,
            b: 0,
            width: 0,
            height: 0,
            scale: {x: 1.0, y: 1.0}
        };
        this.navFactor = 60;
        this.panFactor = 5;
        this.scaleFactor = 0.95; 
        this.minScale = 0.03;
        this.maxScale = 1.00;
        this.positionBoundaries = {"minX": 0, "maxX": 20480, "minY": 0, "maxY": 20480};
        this.dir = Object.freeze({"left": 1, "up": 2, "right": 3, "down": 4, "zin": 5, "zout": 6});
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
            this.context.scale(this.viewport.scale.x, this.viewport.scale.y);
        },
        applyTranslation: function() {
            // move offset code to updateViewport() function
            this.context.translate(-this.viewport.l + this.positionOffset.x, -this.viewport.t + this.positionOffset.y);
        },
        updateViewport: function() {
            this.clampValues();
            this.positionOffset = this.calculateOffset();
            this.aspectRatio = this.context.canvas.width / this.context.canvas.height;
            this.viewport.l = this.position.x - (this.viewport.width / 2.0);
            this.viewport.t = this.position.y - (this.viewport.height / 2.0);
            this.viewport.r = this.viewport.l + this.viewport.width;
            this.viewport.b = this.viewport.t + this.viewport.height;
            this.viewport.scale.x = this.scale; 
            this.viewport.scale.y = this.scale;
        },
        zoomTo: function(z) {
            this.scale = z;
            this.updateViewport();
        },
        moveTo: function(pos) {
            this.position = pos;
            this.updateViewport();
        },
        navigate: function(dir) {
            var movement = {x: 0, y: 0};
            var scaleFactor = 1;
            if(dir === this.dir.left) {
                movement.x -= this.navFactor;
            }
            else if(dir === this.dir.up) {
                movement.y -= this.navFactor;
            }
            else if(dir === this.dir.right) {
                movement.x += this.navFactor;
            }
            else if(dir === this.dir.down) {
                movement.y += this.navFactor;
            }
            else if(dir === this.dir.zin) {
                scaleFactor = 1 / this.scaleFactor;
            }
            else if(dir === this.dir.zout) {
                scaleFactor = this.scaleFactor;
            }
            this.pan(movement);
            this.zoom(scaleFactor);
        },
        pan: function(direction) {
            // takes an object {x, y} and moves the camera with that distance //
            this.position.x += (direction.x * this.panFactor);
            this.position.y += (direction.y * this.panFactor);
            this.updateViewport();
        },
        zoom: function(scaleFactor) {
            this.scale *= scaleFactor;
            this.updateViewport();
        },
        calculateOffset: function() {
            return {x: (this.context.canvas.width  / 2) / this.scale,
                    y: (this.context.canvas.height / 2) / this.scale};
        },
        clampValues: function() {
            // keep the scale and position values within reasonable limits
            this.position.x = Math.max(this.position.x, this.positionBoundaries.minX);
            this.position.x = Math.min(this.position.x, this.positionBoundaries.maxX);
            this.position.y = Math.max(this.position.y, this.positionBoundaries.minY);
            this.position.y = Math.min(this.position.y, this.positionBoundaries.maxY);
            this.scale = Math.max(this.scale, this.minScale);
            this.scale = Math.min(this.scale, this.maxScale);
        }
    };
  
    this.Camera = Camera;
    
}).call(this);
