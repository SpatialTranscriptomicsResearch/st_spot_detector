import _ from 'underscore';
import Codes from './keycodes';
import LogicHandler from '../logic-handler';
import { UndoAction } from '../viewer/undo';

class AdjustmentLH extends LogicHandler {
    constructor(camera, spotAdjuster, spotSelector, setCanvasCursor, refreshCanvas, undoStack) {
        super();
        this.camera = camera;
        this.spotAdjuster = spotAdjuster;
        this.spotSelector = spotSelector;
        this.setCanvasCursor = setCanvasCursor;
        this.refreshCanvas = refreshCanvas;
        this.undoStack = undoStack;

        this.addingSpots = false;
    }

    processKeydownEvent(keyEvent) {
        if(this.addingSpots == false) {
            if(keyEvent == Codes.keyEvent.shift) {
                this.spotSelector.toggleShift(true);
            }
            else {
                if(this.spotSelector.selected) {
                    this.spotAdjuster.adjustSpots(keyEvent);
                }
                else {
                    this.camera.navigate(keyEvent);
                }
            }
        }
        // check for ctrl key down to change cursor
        if(keyEvent == Codes.keyEvent.ctrl) {
            this.setCanvasCursor('grabbable');
        }
        this.refreshCanvas();
    }

    processKeyupEvent(keyEvent) {
        if(this.addingSpots) {
            this.spotAdjuster.finishAddSpots(false);
        }
        else {
            if(keyEvent == Codes.keyEvent.shift) {
                this.spotSelector.toggleShift(false);
            }
        }

        if(keyEvent === Codes.keyEvent.undo) {
            if(this.undoStack.lastTab() == "adjustment") {
                var action = this.undoStack.pop();
                this.spotAdjuster.setSpots(action.state);
            }
        } else if(keyEvent == Codes.keyEvent.ctrl) {
            this.setCanvasCursor('crosshair');
        }
        this.refreshCanvas();
    }

    processMouseEvent(mouseEvent, eventData) {
        var cursor;
        cursor = 'crosshair';

        var action;
        // right click moves canvas or spots
        if(eventData.button == Codes.mouseButton.right ||
            eventData.ctrl == true) {
            if(mouseEvent == Codes.mouseEvent.down) {
                this.spotAdjuster.moving = this.spotAdjuster.atSelectedSpots(eventData.position);
                cursor = 'grabbed';
                if(this.spotAdjuster.moving) {
                    action = new UndoAction(
                        'adjustment',
                        'moveSpot',
                        this.spotAdjuster.getSpotsCopy()
                    );
                }
            }
            else if(mouseEvent == Codes.mouseEvent.up) {
                this.spotAdjuster.moving = false;
            }
            else if(mouseEvent == Codes.mouseEvent.drag) {
                if(this.spotAdjuster.moving) {
                    this.spotAdjuster.dragSpots(eventData.difference);
                }
                else {
                    this.camera.pan(eventData.difference);
                }
                cursor = 'grabbed';
            }
            else if(mouseEvent == Codes.mouseEvent.move) {
                cursor = 'grabbable';
            }
        }
        else if(mouseEvent == Codes.mouseEvent.move) {
            this.spotAdjuster.updateSpotToAdd(eventData.position);
            cursor = 'crosshair';
        }
        // left click adds or selects spots
        else if(eventData.button == Codes.mouseButton.left &&
            eventData.ctrl == false) {
            // in adding state, left click serves to add a new spot
            if(this.addingSpots) {
                if(mouseEvent == Codes.mouseEvent.up) {
                    this.spotAdjuster.addSpot(eventData.position);
                }
                else if(mouseEvent == Codes.mouseEvent.down) {
                    action = new UndoAction(
                        'adjustment',
                        'addSpot',
                        this.spotAdjuster.getSpotsCopy()
                    );
                }
            }
            // but in selection state, left click to make a selection
            else {
                if(mouseEvent == Codes.mouseEvent.down) {
                    this.spotSelector.beginSelection(eventData.position);
                    action = new UndoAction(
                        'adjustment',
                        'selectSpot',
                        this.spotAdjuster.getSpotsCopy()
                    );
                }
                else if(mouseEvent == Codes.mouseEvent.up) {
                    this.spotSelector.endSelection();
                }
                else if(mouseEvent == Codes.mouseEvent.drag) {
                    this.spotSelector.updateSelection(eventData.position);
                }
            }
        }
        else if(mouseEvent == Codes.mouseEvent.wheel) {
            // scrolling
            this.camera.navigate(eventData.direction, eventData.position);
        }

        /* undo stuff */
        if(action) {
            this.undoStack.setTemp(action);
        }
        // check if there is an action to push to the undo stack
        else if(mouseEvent == Codes.mouseEvent.up && this.undoStack.temp) {
            var currentSpots = this.spotAdjuster.getSpots();
            var tempState = this.undoStack.temp.state;
            if(_.isEqual(currentSpots, tempState)) {
                this.undoStack.clearTemp();
            }
            else {
                // only push action to undo stack if spots have been adjusted
                this.undoStack.pushTemp();
            }
        }
        this.setCanvasCursor(cursor);
        this.refreshCanvas();
    }
}

export default AdjustmentLH;
