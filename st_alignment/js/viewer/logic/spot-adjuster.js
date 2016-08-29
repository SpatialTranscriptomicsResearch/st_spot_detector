(function() {
    var self;
    var SpotAdjuster = function(camera, spots) {
        self = this;
        self.camera = camera;
        self.spots = spots;
        self.adjustFactor = 10;
    };

    SpotAdjuster.prototype = {
        adjust: function(direction) {
            var movement = {x: 0, y: 0};
            if(direction === self.camera.dir.left) {
                movement.x -= this.adjustFactor;
            }
            else if(direction === self.camera.dir.up) {
                movement.y -= this.adjustFactor;
            }
            else if(direction === self.camera.dir.right) {
                movement.x += this.adjustFactor;
            }
            else if(direction === self.camera.dir.down) {
                movement.y += this.adjustFactor;
            }
            for(var i = 0; i < self.spots.spots.length; ++i) {
                if(self.spots.spots[i].selected) {
                    var arrayPosOffsetX = movement.x / self.spots.spacer.x;
                    var arrayPosOffsetY = movement.y / self.spots.spacer.y;
                    self.spots.spots[i].newArrayPosition.x += arrayPosOffsetX;
                    self.spots.spots[i].newArrayPosition.y += arrayPosOffsetY;
                    self.spots.spots[i].renderPosition.x += movement.x;
                    self.spots.spots[i].renderPosition.y += movement.y;
                }
            }
        }
    };

    this.SpotAdjuster = SpotAdjuster;

}).call(self);
