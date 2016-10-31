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
        self.moving = false;
    };

    SpotAdjuster.prototype = {
        atSelectedSpots: function(position) {
            // detects if the mouse is close to a selected spot and
            // whether the selection can be dragged around or not
            var atSpots = false;

            position = self.camera.mouseToCameraPosition(position);
            for(var i = 0; i < self.spots.spots.length; ++i) {
                if(self.spots.spots[i].selected) {
                    if(Vec2.distanceBetween(position, self.spots.spots[i].renderPosition) < 100) {
                        atSpots = true;
                        break;
                    }
                }
            }
            return atSpots;
        },
        adjustSpots: function(direction) {
            var movement = Vec2.Vec2(0, 0);
            if(direction === keyevents.left) {
                movement.x -= this.adjustFactor;
            }
            else if(direction === keyevents.up) {
                movement.y -= this.adjustFactor;
            }
            else if(direction === keyevents.right) {
                movement.x += this.adjustFactor;
            }
            else if(direction === keyevents.down) {
                movement.y += this.adjustFactor;
            }
            for(var i = 0; i < self.spots.spots.length; ++i) {
                if(self.spots.spots[i].selected) {
                    var arrayPosOffset = Vec2.divide(movement, self.spots.spacer);
                    self.spots.spots[i].newArrayPosition = Vec2.add(self.spots.spots[i].newArrayPosition, arrayPosOffset);
                    self.spots.spots[i].renderPosition = Vec2.add(self.spots.spots[i].renderPosition, movement);
                }
            }
        },
        dragSpots: function(movement) {
            movement = self.camera.mouseToCameraDifference(movement);
            movement = Vec2.truncate(movement);
            for(var i = 0; i < self.spots.spots.length; ++i) {
                if(self.spots.spots[i].selected) {
                    var arrayPosOffset = Vec2.divide(movement, self.spots.spacer);
                    self.spots.spots[i].newArrayPosition = Vec2.subtract(self.spots.spots[i].newArrayPosition, arrayPosOffset);
                    self.spots.spots[i].renderPosition = Vec2.subtract(self.spots.spots[i].renderPosition, movement);
                }
            }
        },
        deleteSelectedSpots: function() {
            for(var i = self.spots.spots.length - 1; i >= 0; --i) {
                if(self.spots.spots[i].selected) {
                    self.spots.spots.splice(i, 1);
                }
            }
        },
        updateSpotToAdd: function(position) {
            var renderPosition = self.camera.mouseToCameraPosition(position);
            self.spots.spotToAdd.renderPosition = renderPosition;
        },
        addSpot: function(position) {
            var renderPosition = self.camera.mouseToCameraPosition(position);
            renderPosition = Vec2.truncate(renderPosition);
            var adjustedPosition = Vec2.subtract(renderPosition, self.calibrationData.TL);
            // we don't want negative array coordinates
            adjustedPosition = Vec2.clamp(adjustedPosition, 0);
            var newArrayPosition = Vec2.add(Vec2.divide(adjustedPosition, self.spots.spacer), Vec2.Vec2(1, 1));
            var arrayPosition = Vec2.round(newArrayPosition);
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
        },
        finishAddSpots: function() {
        }
    };

    this.SpotAdjuster = SpotAdjuster;

}).call(self);
