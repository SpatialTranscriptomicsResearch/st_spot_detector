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
        self.addingSpots = false;
    };
  
    LogicHandler.prototype = {
        processKeydownEvent: function(state, keyEvent) {
            if(state == 'state_adjustment' && self.addingSpots == false) {
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
                if(self.addingSpots) {
                    self.spotAdjuster.finishAddSpots(false);
                }
                else {
                    if(keyEvent == keyevents.shift) {
                        self.spotSelector.toggleShift(false);
                    }
                }
            }
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
                }
                if(mouseEvent == self.mouseEvent.move) {
                    self.calibrator.detectHighlight(eventData.position);
                }
                else if(mouseEvent == self.mouseEvent.down) {
                    self.calibrator.detectSelection(eventData.position);
                }
                else if(mouseEvent == self.mouseEvent.up) {
                    self.calibrator.endSelection();
                }
                else if(mouseEvent == self.mouseEvent.wheel) {
                    self.camera.navigate(eventData.direction, eventData.position);
                }
            }
            // adjusting spots state
            else if(state == 'state_adjustment') {
                // right click moves canvas or spots
                if(eventData.button == self.mouseButton.right &&
                   eventData.ctrl == false) {
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
                // left click or ctrl+click adds or selects spots
                else if(eventData.button == self.mouseButton.left ||
                        eventData.ctrl == true) {
                    // in adding state, left click serves to add a new spot
                    if(self.addingSpots) {
                        if(mouseEvent == self.mouseEvent.up) {
                            self.spotAdjuster.addSpot(eventData.position);
                        }
                    }
                    // but in selection state, left click to make a selection
                    else {
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
                }
                else if(mouseEvent == self.mouseEvent.move) {
                    self.spotAdjuster.updateSpotToAdd(eventData.position);
                }
                else if(mouseEvent == self.mouseEvent.wheel) {
                    // scrolling
                    self.camera.navigate(eventData.direction, eventData.position);
                }
            }
            self.refreshCanvas();
        }
    };
  
    this.LogicHandler = LogicHandler;
    
}).call(self);
