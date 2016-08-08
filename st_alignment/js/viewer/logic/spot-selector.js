'use strict';

(function() {
    var self;
  
    var SpotSelector = function(context, camera, spotManager) {
        self = this;
        self.ctx = context;
        self.camera = camera;
        self.spotManager = spotManager;
        self.selecting = false;
        self.selected = false;
        self.shiftPressed = false;
        self.renderingRect = {TL: {x: 0, y: 0},
                              WH: {x: 0, y: 0}};
        self.selectionRect = {TL: {x: 0, y: 0},
                              BR: {x: 0, y: 0}};
    };
  
    SpotSelector.prototype = {
        selectSpots: function() {
            // takes two points, the top left and bottom right of a rect, and returns the spots contained within it
            var selectedSpots;
            var spots = self.spotManager.spots;

            // first we need to check if the user is only clicking on a single spot
            if(self.renderingRect.WH.x < 3 && self.renderingRect.WH.y < 3) // arbitrary 3 values here for a "click"
            {
                for(var i = 0; i < spots.length; ++i) {
                    var pos = {x: spots[i].renderPosition.x, y: spots[i].renderPosition.y};
                    if(Math.abs(pos.x - self.selectionRect.TL.x) < spots[i].size &&
                       Math.abs(pos.y - self.selectionRect.TL.y) < spots[i].size) {
                        spots[i].selected = true;
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
                for(var i = 0; i < spots.length; ++i) {
                    var pos = {x: spots[i].renderPosition.x, y: spots[i].renderPosition.y};
                    if(pos.x > self.selectionRect.TL.x && pos.x < self.selectionRect.BR.x &&
                       pos.y > self.selectionRect.TL.y && pos.y < self.selectionRect.BR.y) {
                        spots[i].selected = true;
                    }
                    else {
                        if(!self.shiftPressed) {
                            spots[i].selected = false;
                        }
                    }
                }
            }
        },
        beginSelection: function(topLeft) {
            self.renderingRect.TL = topLeft;
            self.renderingRect.WH = {x: 0, y: 0};
            var cam = {x: self.camera.position.x - self.camera.positionOffset.x,
                       y: self.camera.position.y - self.camera.positionOffset.y};
            var mouse = {x: topLeft.x / self.camera.scale,
                         y: topLeft.y / self.camera.scale};
            self.selectionRect.TL = {x: cam.x + mouse.x, y: cam.y + mouse.y};
            self.selectionRect.BR = {x: cam.x + mouse.x, y: cam.y + mouse.y};
        },
        updateSelection: function(bottomRight) {
            self.renderingRect.WH = {x: bottomRight.x - self.renderingRect.TL.x,
                                     y: bottomRight.y - self.renderingRect.TL.y};
            var cam = {x: self.camera.position.x - self.camera.positionOffset.x,
                       y: self.camera.position.y - self.camera.positionOffset.y};
            var mouse = {x: bottomRight.x / self.camera.scale,
                         y: bottomRight.y / self.camera.scale};
            self.selectionRect.BR = {x: cam.x + mouse.x, y: cam.y + mouse.y};
            self.selecting = true;
            self.selectSpots();
        },
        endSelection: function() {
            self.selecting = false;
            self.selected  = true;
            self.selectSpots();
        },
        toggleShift: function(bool) {
            self.shiftPressed = bool;
        }
  };

  this.SpotSelector = SpotSelector;
  
}).call(this);
