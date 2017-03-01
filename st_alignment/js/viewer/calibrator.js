'use strict';

(function() {
    var self;
    var Calibrator = function(camera) {
        self = this;
        self.camera = camera;
        self.calibrationData = {
            TL: Vec2.Vec2(1276,  528),
            BR: Vec2.Vec2(6894, 6578),
            arraySize: Vec2.Vec2(33, 35),
            brightness: 0,
            contrast: 200,
            threshold: 50,
            highlighted: []
        };
        self.selected = [];
        self.thresholdSelectionDistance = 200;
    };
    Calibrator.prototype = {
        detectHighlight: function(position) {
            self.calibrationData.highlighted = [];
            position = self.camera.mouseToCameraPosition(position);
            if(Math.abs(position.x - self.calibrationData.TL.x) < self.thresholdSelectionDistance) {
                self.calibrationData.highlighted.push('L');
            }
            else if(Math.abs(position.x - self.calibrationData.BR.x) < self.thresholdSelectionDistance) {
                self.calibrationData.highlighted.push('R');
            }
            if(Math.abs(position.y - self.calibrationData.TL.y) < self.thresholdSelectionDistance) {
                self.calibrationData.highlighted.push('T');
            }
            else if(Math.abs(position.y - self.calibrationData.BR.y) < self.thresholdSelectionDistance) {
                self.calibrationData.highlighted.push('B');
            }
        },
        detectSelection: function(position) {
            self.selected = [];
            position = self.camera.mouseToCameraPosition(position);
            if(Math.abs(position.x - self.calibrationData.TL.x) < self.thresholdSelectionDistance) {
                self.selected.push('L');
            }
            else if(Math.abs(position.x - self.calibrationData.BR.x) < self.thresholdSelectionDistance) {
                self.selected.push('R');
            }
            if(Math.abs(position.y - self.calibrationData.TL.y) < self.thresholdSelectionDistance) {
                self.selected.push('T');
            }
            else if(Math.abs(position.y - self.calibrationData.BR.y) < self.thresholdSelectionDistance) {
                self.selected.push('B');
            }
        },
        endSelection: function() {
            self.selected = [];
        },
        moveLine: function(position) {
            position = self.camera.mouseToCameraPosition(position);
            position = Vec2.truncate(position);
            if(self.selected.includes('L')) {
                self.calibrationData.TL.x = position.x;
            }
            else if(self.selected.includes('R')) {
                self.calibrationData.BR.x = position.x;
            }
            if(self.selected.includes('T')) {
                self.calibrationData.TL.y = position.y;
            }
            else if(self.selected.includes('B')) {
                self.calibrationData.BR.y = position.y;
            }
        }
    };
  
    this.Calibrator = Calibrator;
    
}).call(self);
