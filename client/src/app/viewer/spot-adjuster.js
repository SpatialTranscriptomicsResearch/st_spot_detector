/* in the case that the number of spots becomes rather high, then there
   should perhaps be a separate container for the selected spots, to
   not need to loop through all of them when adjusting or deleting */

import Codes from './keycodes';
import Vec2 from './vec2';
import { Spot } from './spots';

const SpotAdjuster = (function() {
    var self;
    var SpotAdjuster = function(camera, spots, calibrator) {
        self = this;
        self.camera = camera;
        self.spots = spots;
        self.calibrator = calibrator;
        self.adjustFactor = 10;
        self.moving = false;
    };

    SpotAdjuster.prototype = {
        atSelectedSpots: function(position) {
            /* detects if the mouse is close to a selected spot and
               whether the selection can be dragged around or not.
               Returns true if closeby. */
            var atSpots = false;

            position = self.camera.mouseToCameraPosition(position, 'cy3');
            for(var i = 0; i < self.spots.spots.length; ++i) {
                if(self.spots.spots[i].selected) {
                    if(Vec2.distanceBetween(position, self.spots.spots[i].renderPosition) < self.spots.average.diameter / 2) {
                        atSpots = true;
                        break;
                    }
                }
            }
            return atSpots;
        },
        adjustSpots: function(direction) {
            var movement = Vec2.Vec2(0, 0);
            if(direction === Codes.keyEvent.left) {
                movement.x -= this.adjustFactor;
            }
            else if(direction === Codes.keyEvent.up) {
                movement.y -= this.adjustFactor;
            }
            else if(direction === Codes.keyEvent.right) {
                movement.x += this.adjustFactor;
            }
            else if(direction === Codes.keyEvent.down) {
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
            movement = self.camera.mouseToCameraScale(movement, 'cy3');
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
            var renderPosition = self.camera.mouseToCameraPosition(position, 'cy3');
            renderPosition = Vec2.truncate(renderPosition);
            const [x0, y0] = self.calibrator.points;
            const adjustedPosition = Vec2.subtract(renderPosition, Vec2.Vec2(x0, y0));
            var newArrayPosition = Vec2.add(Vec2.divide(adjustedPosition, self.spots.spacer), Vec2.Vec2(1, 1));
            var arrayPosition = Vec2.round(newArrayPosition);
            const newSpot = new Spot({
                'arrayPosition': arrayPosition,
                'newArrayPosition': newArrayPosition,
                'renderPosition': renderPosition,
                'diameter': self.spots.average.diameter,
                'selected': false
            });
            // inserting the spot in order in the array
            var newSpotOrder = arrayPosition.y * self.calibrator.width + arrayPosition.x;
            for(var i = 0; i < self.spots.spots.length; ++i) {
                var spotPos = self.spots.spots[i].arrayPosition;
                var spotOrder = spotPos.y * self.calibrator.width + spotPos.x;
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
        },
        getSpotsCopy: function() {
            var spots = self.spots.getSpots().spots;
            var copy = spots.map(spot => {
                var newSpot = new Spot({
                    'arrayPosition': Vec2.copy(spot.arrayPosition),
                    'newArrayPosition': Vec2.copy(spot.newArrayPosition),
                    'renderPosition': Vec2.copy(spot.renderPosition),
                    'diameter': spot.diameter,
                    'selected': spot.selected
                });
                return newSpot;
            });
            return copy;
        },
        getSpots: function() {
            return self.spots.getSpots().spots;
        },
        setSpots: function(spots) {
            self.spots.setSpots(spots);
        }
    };

    return SpotAdjuster;

}());

export default SpotAdjuster;
