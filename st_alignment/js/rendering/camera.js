/* very stripped down and modified version of  https://github.com/robashton/camera */

(function() {
  
    var Camera = function(context, initialPosition, initialScale) {
        this.context = context;
        this.position = initialPosition || [0,0];
        this.scale = initialScale || 1.0;
        this.positionOffset = this.calculateOffset();
        this.viewport = {
            l: 0,
            r: 0,
            t: 0,
            b: 0,
            width: 0,
            height: 0,
            scale: [1.0, 1.0]
        };
        this.navFactor = 300;
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
            this.context.scale(this.viewport.scale[0], this.viewport.scale[1]);
        },
        applyTranslation: function() {
            // move offset code to updateViewport() function
            this.context.translate(-this.viewport.l + this.positionOffset[0], -this.viewport.t + this.positionOffset[1]);
        },
        updateViewport: function() {
            this.clampValues();
            this.positionOffset = this.calculateOffset();
            this.aspectRatio = this.context.canvas.width / this.context.canvas.height;
            this.viewport.l = this.position[0] - (this.viewport.width / 2.0);
            this.viewport.t = this.position[1] - (this.viewport.height / 2.0);
            this.viewport.r = this.viewport.l + this.viewport.width;
            this.viewport.b = this.viewport.t + this.viewport.height;
            this.viewport.scale[0] = this.scale; 
            this.viewport.scale[1] = this.scale;
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
            if(dir === this.dir.left) {
                this.position[0] -= this.navFactor;
            }
            else if(dir === this.dir.up) {
                this.position[1] -= this.navFactor;
            }
            else if(dir === this.dir.right) {
                this.position[0] += this.navFactor;
            }
            else if(dir === this.dir.down) {
                this.position[1] += this.navFactor;
            }
            this.updateViewport();
        },
        pan: function(direction) {
            // takes an array [x, y] and moves the camera with that distance //
            this.position[0] += (direction[0] * this.panFactor);
            this.position[1] += (direction[1] * this.panFactor);
            this.updateViewport();
        },
        zoom: function(dir) {
            if(dir === this.dir.zin) {
                this.scale /= this.scaleFactor;
            }
            else if(dir === this.dir.zout) {
                this.scale *= this.scaleFactor;
            }
            this.updateViewport();
        },
        calculateOffset: function() {
            return [(this.context.canvas.width / 2) / this.scale, (this.context.canvas.height / 2) / this.scale];
        },
        clampValues: function() {
            // keep the scale and position values within reasonable limits
            this.position[0] = Math.max(this.position[0], this.positionBoundaries.minX);
            this.position[0] = Math.min(this.position[0], this.positionBoundaries.maxX);
            this.position[1] = Math.max(this.position[1], this.positionBoundaries.minY);
            this.position[1] = Math.min(this.position[1], this.positionBoundaries.maxY);
            this.scale = Math.max(this.scale, this.minScale);
            this.scale = Math.min(this.scale, this.maxScale);
        }
    };
  
    this.Camera = Camera;
    
}).call(this);
