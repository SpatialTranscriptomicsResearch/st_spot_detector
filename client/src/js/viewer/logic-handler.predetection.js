import Codes from './keycodes';
import LogicHandler from '../logic-handler';

class PredetectionLH extends LogicHandler {
    constructor(camera, calibrator, setCanvasCursor, refreshCanvas) {
        super();
        this.camera = camera;
        this.calibrator = calibrator;
        this.setCanvasCursor = setCanvasCursor;
        this.refreshCanvas = refreshCanvas;
    }

    processKeydownEvent(keyEvent) {}
    processKeyupEvent(keyEvent) {}

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
            this.calibrator.detectSelection(eventData.position);
            cursor = this.checkCalibrationCursor(this.calibrator.selected);
        }
        else if(mouseEvent == Codes.mouseEvent.up) {
            this.calibrator.endSelection();
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
