import _ from 'lodash';

import {
    SELECTION_RECT_COL,
    SELECTION_RECT_DASH,
    SELECTION_RECT_WGHT,
} from '../config';
import LogicHandler from '../logic-handler';
import { UndoAction } from '../viewer/undo';
import { setCursor } from '../utils';
import { collides } from './graphics/functions';
import { StrokedRectangle } from './graphics/rectangle';
import Codes from './keycodes';


export const STATES = Object.freeze({
    PANNING:     1 << 0,
    CALIBRATING: 1 << 1,
    HOVERING:    1 << 2,
    MOVING:      1 << 3,
    SELECTING:   1 << 4,
    ADDING:      1 << 5,
});


class AdjustmentLH extends LogicHandler {
    constructor(camera, calibrator, spotManager, refreshCanvas, undoStack) {
        super();
        this.camera = camera;
        this.calibrator = calibrator;
        this.spotManager = spotManager;
        this.refreshCanvas = refreshCanvas;
        this.undoStack = undoStack;

        this.state = STATES.DEFAULT;
        this.hovering = undefined;
        this.selectionRectangle = undefined;
        this.modifiedSelection = new Set();

        this.recordKeyStates();
    }

    undo(action) {
        switch (action.action) {
        case 'spotAdjustment':
            this.spotManager.spots = action.state;
            break;
        case 'frameAdjustment':
            this.calibrator.points = action.state;
            break;
        default:
            throw new Error(`Unknown undo action ${action.action}`);
        }
    }

    get renderables() {
        return _.filter(
            [
                this.selectionRectangle,
            ],
            x => x !== undefined,
        );
    }

    refreshCursor() {
        if (this.state & STATES.PANNING) {
            return setCursor(
                this.state & STATES.MOVING
                    ? 'grabbing'
                    : 'grab'
                ,
            );
        }
        if (this.state & STATES.ADDING) {
            return setCursor('crosshair');
        }
        if (this.state & STATES.CALIBRATING) {
            switch (this.calibrator.selection) {
            case 'l':
            case 'r':
                return setCursor('ew-resize');
            case 't':
            case 'b':
                return setCursor('ns-resize');
            case 'lt':
            case 'rb':
                return setCursor('nwse-resize');
            case 'lb':
            case 'rt':
                return setCursor('nesw-resize');
            default:
                return setCursor('grab');
            }
        }
        if (this.state & STATES.SELECTING) {
            return setCursor('crosshair');
        }
        if (this.state & STATES.MOVING) {
            return setCursor('grabbing');
        }
        if (this.state & STATES.HOVERING) {
            return setCursor('move');
        }
        return setCursor('grab');
    }

    processKeydownEvent(keyEvent) {
        switch (keyEvent) {
        case Codes.keyEvent.ctrl:
            this.state |= STATES.PANNING;
            break;
        default:
            // ignore
        }
        this.refreshCursor();
    }

    processKeyupEvent(keyEvent) {
        switch (keyEvent) {
        case Codes.keyEvent.undo:
            if (this.undoStack.lastTab() === 'state_adjustment') {
                this.undo(this.undoStack.pop());
            }
            break;
        case Codes.keyEvent.ctrl:
            this.state = this.state & (~STATES.PANNING);
            break;
        default:
            // ignore
        }
        this.refreshCursor();
    }

    processMouseEvent(mouseEvent, eventData) {
        const { x, y } = this.camera.mouseToCameraPosition(eventData.position);
        this.hovering = _.find(
            Array.from(this.spotManager.selected),
            s => collides(x, y, s),
        );
        this.state ^= (this.state & STATES.HOVERING) ^
            (this.hovering ? STATES.HOVERING : 0);

        switch (mouseEvent) {
        case Codes.mouseEvent.drag:
            if (this.state & STATES.PANNING) {
                this.camera.pan(eventData.difference);
            } else {
                switch (this.state & (~(STATES.PANNING | STATES.HOVERING))) {
                case STATES.CALIBRATING:
                    this.calibrator.setSelectionCoordinates(x, y);
                    break;
                case STATES.SELECTING:
                    this.selectionRectangle.x1 = x;
                    this.selectionRectangle.y1 = y;
                    _.each(
                        this.spotManager.spotsMutable,
                        (s) => {
                            /* eslint-disable no-param-reassign */
                            const v = eventData.button === Codes.mouseButton.left;
                            if (collides(s.x, s.y, this.selectionRectangle)) {
                                if (s.selected !== v) {
                                    s.selected = v;
                                    this.modifiedSelection.add(s);
                                }
                            } else if (this.modifiedSelection.has(s)) {
                                s.selected = !v;
                                this.modifiedSelection.delete(s);
                            }
                        },
                    );
                    break;
                case STATES.MOVING:
                    this.spotManager.selected.forEach((s) => {
                        const { x: dx, y: dy } =
                            this.camera.mouseToCameraScale(eventData.difference);
                        /* eslint-disable no-param-reassign */
                        s.x -= dx;
                        s.y -= dy;
                    });
                    break;
                default:
                    // ignore
                }
            }
            this.refreshCanvas();
            break;

        case Codes.mouseEvent.wheel:
            this.camera.navigate(eventData.direction, eventData.position);
            this.refreshCanvas();
            // fall through

        case Codes.mouseEvent.move:
            if (this.state & STATES.ADDING) {
                this.spotManager.spotToAdd.position = { x, y };
                this.refreshCanvas();
            } else {
                this.calibrator.setSelection(x, y);
                if (this.calibrator.selection !== '' &&
                        !(this.state & STATES.CALIBRATING)) {
                    this.state |= STATES.CALIBRATING;
                    this.refreshCanvas();
                } else if (this.calibrator.selection === '' &&
                        (this.state & STATES.CALIBRATING)) {
                    this.state &= ~STATES.CALIBRATING;
                    this.refreshCanvas();
                }
            }
            break;

        case Codes.mouseEvent.down:
            if (this.state & STATES.PANNING) {
                this.state |= STATES.MOVING;
                break;
            }
            switch (this.state) {
            case STATES.ADDING:
                this.spotManager.spotsMutable.push(
                    _.cloneDeep(this.spotManager.spotToAdd),
                );
                break;
            case STATES.CALIBRATING:
                this.undoStack.setTemp(new UndoAction(
                    'state_adjustment',
                    'frameAdjustment',
                    this.calibrator.points,
                ));
                break;
            default:
                this.undoStack.setTemp(new UndoAction(
                    'state_adjustment',
                    'spotAdjustment',
                    this.spotManager.spots,
                ));
                if (this.state & STATES.HOVERING) {
                    this.state |= STATES.MOVING;
                } else {
                    if (!this.keystates.shift && eventData.button === Codes.mouseButton.left) {
                        this.spotManager.selected.forEach((s) => {
                            /* eslint-disable no-param-reassign */
                            s.selected = false;
                        });
                    }
                    this.modifiedSelection.clear();
                    this.selectionRectangle = new StrokedRectangle(
                        x, y, x, y,
                        {
                            lineColor: SELECTION_RECT_COL,
                            lineDash:  SELECTION_RECT_DASH,
                            lineWidth: SELECTION_RECT_WGHT,
                        },
                    );
                    this.state |= STATES.SELECTING;
                }
                this.refreshCanvas();
            }
            break;

        case Codes.mouseEvent.up:
            if (this.undoStack.temp) {
                this.undoStack.pushTemp();
            }
            this.selectionRectangle = undefined;
            this.refreshCanvas();
            this.state &= ~(
                STATES.SELECTING
              | STATES.MOVING
            );
            break;

        default:
            // ignore
        }

        this.refreshCursor();
    }
}

export default AdjustmentLH;
