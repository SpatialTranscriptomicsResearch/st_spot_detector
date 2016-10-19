'use strict';

(function() {
    var self;
    var LogicHandler = function(canvas, camera, spotSelector, spotAdjuster, calibrator, refreshCanvas) {
        self = this;
        self.canvas = canvas;
        self.camera = camera;
        self.spotSelector = spotSelector;
        self.spotAdjuster = spotAdjuster;
        self.calibrator = calibrator;
        self.refreshCanvas = refreshCanvas;

        self.mouseEvent = Object.freeze({"down": 1, "up": 2, "move": 3, "drag": 4, "wheel": 5});
        self.mouseButton = Object.freeze({"left": 0, "right": 2})
        self.state = Object.freeze({
            "upload_ready": 1,
            "loading": 2,
            "error": 3,
            "spot_detecting": 4,
            "calibrate": 5,
            "adjust_spots": 6,
            "add_spots": 7
        });
    };
  
    LogicHandler.prototype = {
        processKeydownEvent: function(state, keyEvent) {
            if(state == 'state_adjustment') {
                if(keyEvent == keyevents.shift) {
                    self.spotSelector.toggleShift(true);
                }
                else {
                    if(self.spotSelector.selected) {
                        self.spotAdjuster.adjustSpots(keyEvent);
                    }
                    else {
                        self.camera.navigate(keyEvent);
                    }
                }
            }
            self.refreshCanvas();
        },
        processKeyupEvent: function(state, keyEvent) {
            if(state == 'state_adjustment') {
                self.spotSelector.toggleShift(false);
            }
            /*
            else if(state == self.state.add_spots) {
                self.spotAdjuster.finishAddSpots(false);
            }
            */
            self.refreshCanvas();
        },
        processMouseEvent: function(state, mouseEvent, eventData) {
            // calibrate state
            if(state == 'state_predetection') {
                // if at least one line has been selected
                if(self.calibrator.selected.length != 0) {
                    if(mouseEvent == self.mouseEvent.drag) {
                        self.calibrator.moveLine(eventData.position);
                    }
                }
                else {
                    // moving the canvas normally
                    if(mouseEvent == self.mouseEvent.drag) {
                        // maybe this should take the position rather than the difference
                        self.camera.pan(eventData.difference);
                    }
                    else if(mouseEvent == self.mouseEvent.wheel) {
                        self.camera.navigate(eventData.direction);
                    }
                }
                if(mouseEvent == self.mouseEvent.move) {
                    self.calibrator.detectHighlight(eventData.position);
                }
                else if(mouseEvent == self.mouseEvent.down) {
                    console.log('hej');
                    self.calibrator.detectSelection(eventData.position);
                }
                else if(mouseEvent == self.mouseEvent.up) {
                    self.calibrator.endSelection();
                }
            }
            // adjusting spots state
            else if(state == 'state_adjustment') {
                if(eventData.button == self.mouseButton.left) {
                    // LMB, moving canvas or spots
                    if(mouseEvent == self.mouseEvent.down) {
                        self.spotAdjuster.moving = self.spotAdjuster.atSelectedSpots(eventData.position);
                    }
                    else if(mouseEvent == self.mouseEvent.up) {
                        self.spotAdjuster.moving = false;
                    }
                    else if(mouseEvent == self.mouseEvent.drag) {
                        if(self.spotAdjuster.moving) {
                            self.spotAdjuster.dragSpots(eventData.difference);
                        }
                        else {
                            self.camera.pan(eventData.difference);
                        }
                    }
                }
                else if(eventData.button == self.mouseButton.right) {
                    // RMB, selecting spots
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
                if(mouseEvent == self.mouseEvent.wheel) {
                    // scrolling
                    self.camera.navigate(eventData.direction);
                }
            }
            // add spots state
            // copies lots of code from adjust_state; please fix (DRY)
            /*
            else if(state == self.state.add_spots) {
                if(eventData.button == self.mouseButton.left) {
                    // LMB, moving canvas or spots
                    if(mouseEvent == self.mouseEvent.down) {
                        self.spotAdjuster.moving = self.spotAdjuster.atSelectedSpots(eventData.position);
                    }
                    else if(mouseEvent == self.mouseEvent.up) {
                        self.spotAdjuster.moving = false;
                    }
                    else if(mouseEvent == self.mouseEvent.drag) {
                        if(self.spotAdjuster.moving) {
                            self.spotAdjuster.dragSpots(eventData.difference);
                        }
                        else {
                            self.camera.pan(eventData.difference);
                        }
                    }
                }
                else if(eventData.button == self.mouseButton.right) {
                    // RMB, adding spots
                    if(mouseEvent == self.mouseEvent.up) {
                        self.spotAdjuster.addSpot(eventData.position);
                    }
                }
                if(mouseEvent == self.mouseEvent.move) {
                    self.spotAdjuster.updateSpotToAdd(eventData.position);
                }
                else if(mouseEvent == self.mouseEvent.wheel) {
                    // scrolling
                    self.camera.navigate(eventData.direction);
                }
            }
            */
            self.refreshCanvas();
        }
    };
  
    this.LogicHandler = LogicHandler;
    
}).call(self);
