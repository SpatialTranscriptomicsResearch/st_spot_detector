import _ from 'underscore';
import Codes from './keycodes';
import LogicHandler from '../logic-handler';
import { UndoAction } from '../viewer/undo';
import { setCursor } from '../utils';

function checkCalibrationCursor(selection) {
    switch (selection) {
    case 'l':
    case 'r':
        return 'ew-resize';
    case 't':
    case 'b':
        return 'ns-resize';
    case 'lt':
    case 'rb':
        return 'nwse-resize';
    case 'lb':
    case 'rt':
        return 'nesw-resize';
    default:
        return 'grab';
    }
}

class PredetectionLH extends LogicHandler {
    constructor(camera, calibrator, refreshCanvas, undoStack) {
        super();
        this.camera = camera;
        this.calibrator = calibrator;
        this.refreshCanvas = refreshCanvas;
        this.undoStack = undoStack;
    }

    processKeydownEvent(/* keyEvent */) {
        /* eslint class-methods-use-this: 0 */
    }

    processKeyupEvent(keyEvent) {
        if (keyEvent === Codes.keyEvent.undo) {
            if (this.undoStack.lastTab() === 'state_predetection') {
                const action = this.undoStack.pop();
                this.calibrator.points = action.state;
                this.refreshCanvas();
            }
        }
    }

    processMouseEvent(mouseEvent, eventData) {
        switch (mouseEvent) {
        case Codes.mouseEvent.drag:
            if (this.calibrator.selection.length > 0) {
                const p = this.camera.mouseToCameraPosition(eventData.position);
                this.calibrator.setSelectionCoordinates(p.x, p.y);
            } else {
                // maybe this should take the position rather than the difference
                this.camera.pan(eventData.difference);
                setCursor('grabbing');
            }
            break;
        case Codes.mouseEvent.wheel:
            this.camera.navigate(eventData.direction, eventData.position);
            // fall through
        case Codes.mouseEvent.move: {
            const p = this.camera.mouseToCameraPosition(eventData.position);
            this.calibrator.setSelection(p.x, p.y);
            setCursor(checkCalibrationCursor(this.calibrator.selection));
        } break;
        case Codes.mouseEvent.down:
            if (this.calibrator.selection.length > 0) {
                this.undoStack.setTemp(new UndoAction(
                    'state_predetection',
                    'frameAdjustment',
                    this.calibrator.points,
                ));
            }
            break;
        case Codes.mouseEvent.up:
            if (this.undoStack.temp) {
                const points = this.calibrator.points;
                const tempState = this.undoStack.temp.state;
                if (_.isEqual(points, tempState)) {
                    this.undoStack.clearTemp();
                } else {
                    // only push action to undo stack if the calibration lines have been adjusted
                    this.undoStack.pushTemp();
                }
            }
            break;
        default:
            // do nothing
        }
        this.refreshCanvas();
    }
}

export default PredetectionLH;
