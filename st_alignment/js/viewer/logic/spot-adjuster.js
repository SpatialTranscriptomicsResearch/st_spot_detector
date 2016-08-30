/* in the case that the number of spots becomes rather high, then there
   should perhaps be a separate container for the selected spots, to
   not need to loop through all of them when adjusting or deleting */

(function() {
    var self;
    var SpotAdjuster = function(camera, spots, calibrationData) {
        self = this;
        self.camera = camera;
        self.spots = spots;
        self.calibrationData = calibrationData;
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
        },
        deleteSpots: function() {
            for(var i = self.spots.spots.length - 1; i >= 0; --i) {
                if(self.spots.spots[i].selected) {
                    self.spots.spots.splice(i, 1);
                }
            }
        },
        addSpot: function(position) {
            var renderPosition = self.camera.mouseToCameraPosition(position);
            var adjustedPosition = {
                x: renderPosition.x - self.calibrationData.TL.x,
                y: renderPosition.y - self.calibrationData.TL.y
            };
            // we don't want negative array coordinates
            adjustedPosition.x = Math.max(0, adjustedPosition.x);
            adjustedPosition.y = Math.max(0, adjustedPosition.y);
            // this array positioning is very naive! it should take
            // into account the array positions of the spots around it
            var newArrayPosition = {
                x: adjustedPosition.x / self.spots.spacer.x,
                y: adjustedPosition.y / self.spots.spacer.y
            };
            var arrayPosition = {
                x: Math.round(newArrayPosition.x),
                y: Math.round(newArrayPosition.y)
            };
            var newSpot = {
                'arrayPosition': arrayPosition,
                'newArrayPosition': newArrayPosition,
                'renderPosition': renderPosition,
                'selected': false
            };
            self.spots.spots.push(newSpot);
        }
    };

    this.SpotAdjuster = SpotAdjuster;

}).call(self);
