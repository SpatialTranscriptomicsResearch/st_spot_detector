import _ from 'underscore';
import Codes from './keycodes';
import LogicHandler from '../logic-handler';
import { UndoAction } from '../viewer/undo';

class PredetectionLH extends LogicHandler {
    constructor(camera, calibrator, setCanvasCursor, refreshCanvas, undoStack) {
        super();
        this.camera = camera;
        this.calibrator = calibrator;
        this.setCanvasCursor = setCanvasCursor;
        this.refreshCanvas = refreshCanvas;
        this.undoStack = undoStack;
    }

    processKeydownEvent(keyEvent) {}
    processKeyupEvent(keyEvent) {
        if (keyEvent === Codes.keyEvent.undo) {
            if(this.undoStack.lastTab() == "predetection") {
                var action = this.undoStack.pop();
                this.calibrator.setCalibrationLines(action.state);
                this.refreshCanvas();
            }
        }
    }

    processMouseEvent(mouseEvent, eventData) {
        var cursor;
        // if at least one line has been selected
        if(this.calibrator.selected.length != 0) {
            if(mouseEvent == Codes.mouseEvent.drag) {
                this.calibrator.moveLine(eventData.position);
                cursor = this.checkCalibrationCursor(this.calibrator.selected);
            }
        }
        else {
            // moving the canvas normally
            if(mouseEvent == Codes.mouseEvent.drag) {
                // maybe this should take the position rather than the difference
                this.camera.pan(eventData.difference);
                cursor = 'grabbed';
            }
        }
        if(mouseEvent == Codes.mouseEvent.move) {
            this.calibrator.detectHighlight(eventData.position);
            cursor = this.checkCalibrationCursor(this.calibrator.calibrationData.highlighted);
        }
        else if(mouseEvent == Codes.mouseEvent.down) {
            var selected = this.calibrator.detectSelection(eventData.position);
            cursor = this.checkCalibrationCursor(this.calibrator.selected);
            if(selected) {
                var action = new UndoAction(
                    'predetection',
                    'frameAdjustment',
                    this.calibrator.getCalibrationLines()
                );
                this.undoStack.setTemp(action);
            }
        }
        else if(mouseEvent == Codes.mouseEvent.up) {
            if(this.calibrator.selected.length != 0) {
                this.calibrator.endSelection();
                if(this.undoStack.temp) {
                    var lines = this.calibrator.getCalibrationLines();
                    var tempState = this.undoStack.temp.state;
                    if(!_.isEqual(lines, tempState)) {
                        this.undoStack.pushTemp();
                    }
                    else {
                        this.undoStack.clearTemp();
                    }
                }
            }
            this.calibrator.detectHighlight(eventData.position);
            cursor = this.checkCalibrationCursor(this.calibrator.calibrationData.highlighted);
        }
        else if(mouseEvent == Codes.mouseEvent.wheel) {
            this.camera.navigate(eventData.direction, eventData.position);
            this.calibrator.detectHighlight(eventData.position);
            cursor = this.checkCalibrationCursor(this.calibrator.calibrationData.highlighted);
        }
        this.setCanvasCursor(cursor);
        this.refreshCanvas();
    }

    checkCalibrationCursor(highlights) {
        var cursor;
        if(highlights.length == 1) {
            if(highlights[0] == 'L' || highlights[0] == 'R') {
                cursor = 'ew-resize';
            }
            else if(highlights[0] == 'T' || highlights[0] == 'B') {
                cursor = 'ns-resize';
            }
        }
        else if(highlights.length == 2) {
            if((highlights[0] == 'L' && highlights[1] == 'T') ||
                (highlights[0] == 'R' && highlights[1] == 'B')) {
                cursor = 'nwse-resize';
            }
            else if((highlights[0] == 'L' && highlights[1] == 'B') ||
                (highlights[0] == 'R' && highlights[1] == 'T')) {
                cursor = 'nesw-resize';
            }
        }
        else {
            cursor = 'grabbable';
        }
        return cursor;
    }
}

export default PredetectionLH;
