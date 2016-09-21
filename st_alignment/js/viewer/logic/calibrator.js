'use strict';

(function() {
    var self;
    var Calibrator = function(camera) {
        self = this;
        self.camera = camera;
        self.calibrationData = {
            TL: Vec2.Vec2(5250, 4301),
            BR: Vec2.Vec2(15840, 15581),
            arraySize: Vec2.Vec2(33, 35),
            brightness: 0,
            contrast: 0,
            threshold: 50,
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
            position = Vec2.truncate(position);
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
