'use strict';

(function() {
    var self;
    var Calibrator = function(camera) {
        self = this;
        self.camera = camera;
        self.calibrationData = {
            TL: Vec2.Vec2(1251, 676),
            BR: Vec2.Vec2(11780, 11982),
            arraySize: Vec2.Vec2(33, 35)
        };
        self.selected = false;
    };
  
    Calibrator.prototype = {
        detectSelection: function(position) {
            position = self.camera.mouseToCameraPosition(position);
            if(Vec2.distanceBetween(position, self.calibrationData.TL) < 100) {
                self.selected = 'TL';
            }
            else if(Vec2.distanceBetween(position, self.calibrationData.BR) < 100) {
                self.selected = 'BR';
            }
        },
        endSelection: function() {
            self.selected = false;
        },
        moveSpot: function(position) {
            position = self.camera.mouseToCameraPosition(position);
            if(self.selected == 'TL') {
                self.calibrationData.TL = position;
            }
            else if(self.selected == 'BR') {
                self.calibrationData.BR = position;
            }
        }
    };
  
    this.Calibrator = Calibrator;
    
}).call(self);
