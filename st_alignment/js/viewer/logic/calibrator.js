'use strict';

(function() {
    var self;
    var Calibrator = function(camera) {
        self = this;
        self.camera = camera;
        self.calibrationData = {
            TL: { x: 1251, y: 676 },
            BR: { x: 11780, y: 11982 },
            arraySize: { x: 33, y: 35 }
        };
        self.selected = false;
    };
  
    Calibrator.prototype = {
        distanceBetween: function(a, b) {
            var w = a.x - b.x;
            var h = a.y - b.y;
            return Math.sqrt(w * w + h * h);
        },
        detectSelection: function(position) {
            position = self.camera.mouseToCameraPosition(position);
            if(self.distanceBetween(position, self.calibrationData.TL) < 100) {
                self.selected = 'TL';
            }
            else if(self.distanceBetween(position, self.calibrationData.BR) < 100) {
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
