/* very stripped down and modified version of  https://github.com/robashton/camera */

(function() {
  
    var Camera = function(context, initialPosition, initialScale) {
        this.position = initialPosition || [0,0];
        this.scale = initialScale || 1.0;
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
        this.panFactor = 300;
        this.scaleFactor = 0.99; 

        this.updateViewport();
        this.dir = Object.freeze({"left": 1, "up": 2, "right": 3, "down": 4, "zin": 5, "zout": 6});
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
        pan: function(dir) {
            if(dir === this.dir.left) {
                this.position[0] -= this.panFactor;
            }
            else if(dir === this.dir.up) {
                this.position[1] -= this.panFactor;
            }
            else if(dir === this.dir.right) {
                this.position[0] += this.panFactor;
            }
            else if(dir === this.dir.down) {
                this.position[1] += this.panFactor;
            }
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
        }
    };
  
    this.Camera = Camera;
    
}).call(this);
