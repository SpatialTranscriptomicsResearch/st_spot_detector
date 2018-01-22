'use strict';

import Vec2 from './vec2';

import { fromLayerCoordinates } from '../utils';

const SpotSelector = (function() {
    var self;
  
    var SpotSelector = function(camera, layerManager, spotManager) {
        self = this;
        self.camera = camera;
        self.layerManager = layerManager;
        self.spotManager = spotManager;
        self.selected = false;
        self.selectedSpotCounter = 0;
        self.shiftPressed = false;
        self.renderingRect = {TL: Vec2.Vec2(),
                              WH: Vec2.Vec2()}
        self.selectionRect = {TL: Vec2.Vec2(),
                              BR: Vec2.Vec2()};
    };
  
    SpotSelector.prototype = {
        selectSpots: function() {
            // takes two points, the top left and bottom right of a rect, and returns the spots contained within it
            var spots = self.spotManager.spots;
            self.selectedSpotCounter = 0;

            const cy3layer = self.layerManager.getLayer('cy3');

            // first we need to check if the user is only clicking on a single spot
            if(self.renderingRect.WH.x < 3 && self.renderingRect.WH.x >= 0 &&
               self.renderingRect.WH.y < 3 && self.renderingRect.WH.y >= 0) // arbitrary 3 values here for a "click"
            {
                for(var i = 0; i < spots.length; ++i) {
                    const pos = fromLayerCoordinates(cy3layer, spots[i].renderPosition);
                    if(Vec2.distanceBetween(pos, self.selectionRect.TL) < self.spotManager.average.diameter / 2) {
                        if(self.shiftPressed && spots[i].selected) {
                            // deselect spots that are already selected
                            spots[i].selected = false;
                        }
                        else {
                            spots[i].selected = true;
                            self.selectedSpotCounter++;
                        }
                    }
                    else {
                        if(!self.shiftPressed) {
                            spots[i].selected = false;
                        }
                    }
                }
            }
            // otherwise, we treat the selection as a rectangle
            else {
                // separate variables to preserve the value of the points
                var selectionTL = Vec2.Vec2(self.selectionRect.TL.x, self.selectionRect.TL.y);
                var selectionBR = Vec2.Vec2(self.selectionRect.BR.x, self.selectionRect.BR.y);
                // account for "backward" selections
                if(self.selectionRect.BR.x < self.selectionRect.TL.x) {
                    selectionTL.x = self.selectionRect.BR.x;
                    selectionBR.x = self.selectionRect.TL.x;
                }
                if(self.selectionRect.BR.y < self.selectionRect.TL.y) {
                    selectionTL.y = self.selectionRect.BR.y;
                    selectionBR.y = self.selectionRect.TL.y;
                }
                for(var i = 0; i < spots.length; ++i) {
                    const pos = fromLayerCoordinates(cy3layer, spots[i].renderPosition);
                    if(pos.x > selectionTL.x && pos.x < selectionBR.x &&
                       pos.y > selectionTL.y && pos.y < selectionBR.y) {
                        spots[i].selected = true;
                        self.selectedSpotCounter++;
                    }
                    else {
                        if(!self.shiftPressed) {
                            spots[i].selected = false;
                        }
                    }
                }
            }
            if(self.selectedSpotCounter == 0) {
                self.selected = false;
            }
        },
        beginSelection: function(topLeft) {
            self.renderingRect.TL = topLeft;
            self.renderingRect.WH = Vec2.Vec2();
            topLeft = self.camera.mouseToCameraPosition(topLeft);
            self.selectionRect.TL = topLeft;
            self.selectionRect.BR = topLeft;
        },
        updateSelection: function(bottomRight) {
            self.renderingRect.WH = Vec2.subtract(bottomRight, self.renderingRect.TL);
            bottomRight = self.camera.mouseToCameraPosition(bottomRight);
            self.selectionRect.BR = bottomRight;
            self.selectSpots();
        },
        endSelection: function() {
            self.selected = true;
            self.selectSpots();
            self.renderingRect = {TL: Vec2.Vec2(),
                                  WH: Vec2.Vec2()};
        },
        toggleShift: function(bool) {
            self.shiftPressed = bool;
        }
  };

  return SpotSelector;
  
}());

export default SpotSelector;
