(function() {
    var self;
    var SpotAdjuster = function(camera, spots) {
        self = this;
        self.camera = camera;
        self.spots = spots.spots;
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
            for(var i = 0; i < self.spots.length; ++i) {
                if(self.spots[i].selected) {
                    console.log('before');
                    console.log(self.spots[i].renderPosition.x + ", " + self.spots[i].renderPosition.y);
                    self.spots[i].renderPosition.x += movement.x;
                    self.spots[i].renderPosition.y += movement.y;
                    console.log(self.spots[i].renderPosition.x + ", " + self.spots[i].renderPosition.y);
                }
            }
        }
    };

    this.SpotAdjuster = SpotAdjuster;

}).call(self);
