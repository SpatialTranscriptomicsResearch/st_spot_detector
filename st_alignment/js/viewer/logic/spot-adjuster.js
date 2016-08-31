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
                // array positions start on (1, 1), not (0, 0)
                x: (adjustedPosition.x / self.spots.spacer.x) + 1,
                y: (adjustedPosition.y / self.spots.spacer.y) + 1
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

            // inserting the spot in order in the array
            var newSpotOrder = arrayPosition.y * self.calibrationData.arraySize.x + arrayPosition.x;
            for(var i = 0; i < self.spots.spots.length; ++i) {
                var spotPos = self.spots.spots[i].arrayPosition;
                var spotOrder = spotPos.y * self.calibrationData.arraySize.x + spotPos.x;
                if(newSpotOrder <= spotOrder) {
                    self.spots.spots.splice(i, 0, newSpot);
                    break;
                }
                else if(newSpotOrder > spotOrder) {
                    // if it is bigger than the last spot, append it to the array
                    if(i == self.spots.spots.length - 1) {
                        self.spots.spots.push(newSpot);
                        break; // required to not check it against itself
                    }
                    // otherwise check the next spot
                }
            }
        }
    };

    this.SpotAdjuster = SpotAdjuster;

}).call(self);
