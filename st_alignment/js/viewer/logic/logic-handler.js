'use strict';

(function() {
    var self;
    var LogicHandler = function(canvas, camera, spotSelector, spotAdjuster, calibrator, updateCanvasFunction) {
        self = this;
        self.canvas = canvas;
        self.camera = camera;
        self.spotSelector = spotSelector;
        self.spotAdjuster = spotAdjuster;
        self.calibrator = calibrator;
        self.updateCanvasFunction = updateCanvasFunction;

        self.mouseEvent = Object.freeze({"down": 1, "up": 2, "move": 3, "drag": 4, "wheel": 5});
        self.keyEvent = camera.dir;
        self.state = Object.freeze({
            "upload_ready": 1,
            "loading": 2,
            "error": 3,
            "spot_detecting": 4,
            "move_camera": 5,
            "calibrate": 6,
            "select_spots": 7,
            "adjust_spots": 8
        });

        self.currentState = self.state.upload_ready;
    };
  
    LogicHandler.prototype = {
        processKeydownEvent: function(keyEvent, eventData) {
            if(self.currentState == self.state.move_camera) {
                self.camera.navigate(keyEvent);
            }
            else if(self.currentState == self.state.select_spots) {
                self.spotSelector.toggleShift(true);
            }
            else if(self.currentState == self.state.adjust_spots) {
                self.spotAdjuster.adjust(keyEvent);
            }
            self.updateCanvasFunction();
        },
        processKeyupEvent: function(keyEvent, eventData) {
            if(self.currentState == self.state.select_spots) {
                self.spotSelector.toggleShift(false);
            }
            self.updateCanvasFunction();
        },
        processMouseEvent: function(mouseEvent, eventData) {
            if(self.currentState == self.state.upload_ready) {
                if(mouseEvent == self.mouseEvent.up) {
                    // load image
                }
            }
            else if(self.currentState == self.state.move_camera) {
                if(mouseEvent == self.mouseEvent.drag) {
                    self.camera.pan(eventData.difference);
                }
                else if(mouseEvent == self.mouseEvent.wheel) {
                    self.camera.navigate(eventData);
                }
            }
            else if(self.currentState == self.state.calibrate) {
                if(self.calibrator.selected) {
                    if(mouseEvent == self.mouseEvent.drag) {
                        self.calibrator.moveSpot(eventData.position);
                    }
                }
                else {
                    // moving the canvas normally
                    if(mouseEvent == self.mouseEvent.drag) {
                        self.camera.pan(eventData.difference);
                    }
                    else if(mouseEvent == self.mouseEvent.wheel) {
                        self.camera.navigate(eventData);
                    }
                }
                if(mouseEvent == self.mouseEvent.down) {
                    self.calibrator.detectSelection(eventData.position);
                }
                else if(mouseEvent == self.mouseEvent.up) {
                    self.calibrator.endSelection();
                }
            }
            else if(self.currentState == self.state.select_spots) {
                if(mouseEvent == self.mouseEvent.down) {
                    self.spotSelector.beginSelection(eventData.position);
                }
                else if(mouseEvent == self.mouseEvent.up) {
                    self.spotSelector.endSelection();
                }
                else if(mouseEvent == self.mouseEvent.drag) {
                    self.spotSelector.updateSelection(eventData.position);
                }
            }
            self.updateCanvasFunction();
        }
    };
  
    this.LogicHandler = LogicHandler;
    
}).call(self);
