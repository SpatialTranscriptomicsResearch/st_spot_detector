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
        self.selectionRect = {TL: {x: 0, y: 0},
                              BR: {x: 0, y: 0}};
    };
  
    SpotSelector.prototype = {
        selectSpots: function() {
            // takes two points, the top left and bottom right of a rect, and returns the spots contained within it
            var selectedSpots;
            var spots = self.spotManager.spots;
            for(var i = 0; i < spots.length; ++i) {
                var pos = {x: spots[i].renderPosition.x, y: spots[i].renderPosition.y};
                if(pos.x > self.selectionRect.TL.x && pos.x < self.selectionRect.BR.x &&
                   pos.y > self.selectionRect.TL.y && pos.y < self.selectionRect.BR.y) {
                    spots[i].selected = true;
                }
                else {
                    spots[i].selected = false;
                }
            }
        },
        beginSelection: function(topLeft) {
            self.selecting = true;
            self.selectionRect.TL = topLeft;
        },
        updateSelection: function(bottomRight) {
            self.selectionRect.BR = bottomRight;
        },
        endSelection: function() {
            self.selectSpots();
            self.selecting = false;
            self.selected = true;
        }
  };

  this.SpotSelector = SpotSelector;
  
}).call(this);
