/**
 * @module aligner.logic-handler
 */

import _ from 'lodash';
import math from 'mathjs';

import Codes from '../viewer/keycodes';
import LogicHandler from '../logic-handler';
import Vec2 from '../viewer/vec2';

import { collides } from '../viewer/graphics/functions';
import { UndoAction } from '../viewer/undo';
import { setCursor } from '../utils';

// private members
const curs = Symbol('Current state');

/**
 * Default logic handler for the alignment view.
 */
class AlignerLHDefault extends LogicHandler {
    constructor(camera, getActive, refreshFunc, undoStack) {
        super();
        this.camera = camera;
        this.getActive = getActive;
        this.refresh = refreshFunc;
        this.undoStack = undoStack;
        this.recordKeyStates();
    }

    processKeydownEvent() {
        this.refreshCursor();
    }

    processKeyupEvent(e) {
        if (this.keystates.ctrl) {
            this.refreshCursor();
        } else if (e === Codes.keyEvent.undo) {
            if(this.undoStack.lastTab() == "state_alignment") {
                var action = this.undoStack.pop();
                const { layer, matrix } = action.state;
                layer.setTransform(matrix);
                this.refresh();
            }
        }
    }

    processMouseEvent(e, data) {
        switch (e) {
        case Codes.mouseEvent.down: {
            const layer = this.getActive();
            const action = new UndoAction(
                'state_alignment',
                'layerTransform',
                { layer, matrix: layer.getTransform() },
            );
            this.undoStack.setTemp(action);
        } break;
        case Codes.mouseEvent.up:
            if(this.undoStack.temp) {
                const layer = this.getActive();
                const matrix = layer.getTransform();
                const { layer: prevLayer, matrix: prevMatrix } =
                    this.undoStack.temp.state;
                if (layer === prevLayer && !math.deepEqual(matrix, prevMatrix)) {
                    this.undoStack.pushTemp();
                } else {
                    this.undoStack.clearTemp();
                }
            }
            this.refresh();
            break;
        case Codes.mouseEvent.drag:
            this.camera.pan(Vec2.Vec2(
                data.difference.x,
                data.difference.y,
            ));
            this.refresh();
            break;
        case Codes.mouseEvent.wheel:
            this.camera.navigate(data.direction, data.position);
            this.refresh();
            break;
        default:
            break;
        }
        this.refreshCursor();
    }

    refreshCursor() {
        if (this.keystates.mouseLeft) {
            setCursor('grabbing');
        } else {
            setCursor('grab');
        }
    }
}

/**
 * Logic handler for the translation tool in the alignment view.
 */
class AlignerLHMove extends AlignerLHDefault {
    processKeydownEvent(e) {
        if (e === Codes.keyEvent.ctrl) {
            super.processKeydownEvent(e);
        }
    }

    processMouseEvent(e, data) {
        if (e === Codes.mouseEvent.wheel || data.ctrl) {
            super.processMouseEvent(e, data);
            return;
        }
        if (e === Codes.mouseEvent.drag) {
            this.getActive().translate(
                math.matrix([
                    [data.difference.x / this.camera.scale],
                    [data.difference.y / this.camera.scale],
                ]),
            );
        } else if (e === Codes.mouseEvent.up) {
            super.processMouseEvent(e, data);
        } else if (e === Codes.mouseEvent.down) {
            super.processMouseEvent(e, data);
            this.refreshCursor();
        }
    }

    refreshCursor() {
        if (this.keystates.ctrl) {
            super.refreshCursor();
            return;
        }
        if (this.keystates.mouseLeft || this.keystates.mouseRight) {
            setCursor('crosshair');
        } else {
            setCursor('move');
        }
    }
}

/**
 * Logic handler for the rotation tool in the alignment view.
 */
class AlignerLHRotate extends AlignerLHDefault {
    constructor(camera, layerManager, refreshFunc, undoStack, rotationPoint) {
        super(camera, layerManager, refreshFunc, undoStack);
        this.rp = rotationPoint;
        this.rpHoverState = false;
        this[curs] = 'def';
        this.recordMousePosition();
        this.recordKeyStates();
    }

    processKeydownEvent(e) {
        if (this.keystates.ctrl) {
            super.processKeydownEvent(e);
            return;
        }
        this.refreshState();
    }

    processKeyupEvent(e) {
        if (this.keystates.ctrl) {
            super.processKeyupEvent(e);
            return;
        } else if (e == Codes.keyEvent.undo) {
            super.processKeyupEvent(e);
            return;
        }
        this.refreshState();
    }

    processMouseEvent(e, data) {
        if (this.keystates.ctrl || e === Codes.mouseEvent.wheel) {
            super.processMouseEvent(e, data);
            return;
        }
        switch (e) {
        case Codes.mouseEvent.drag:
            if (this[curs] === 'rotate') {
                const position = this.camera.mouseToCameraPosition(data.position);
                const difference = this.camera.mouseToCameraScale(data.difference);
                const to = Vec2.subtract(position, this.rp);
                const from = Vec2.subtract(to, difference);
                this.getActive().rotate(
                    Vec2.angleBetween(from, to),
                    math.matrix([
                        [this.rp.x],
                        [this.rp.y],
                        [1],
                    ]),
                );
            } else if (this[curs] === 'dragRP') {
                const rpNew = Vec2.subtract(
                    this.rp,
                    this.camera.mouseToCameraScale(data.difference),
                );
                this.rp.x = rpNew.x;
                this.rp.y = rpNew.y;
                this.refresh();
            }
            break;
        case Codes.mouseEvent.down:
            if (data.button === Codes.mouseButton.right) {
                const rpNew = this.camera.mouseToCameraPosition(data.position);
                this.rp.x = rpNew.x;
                this.rp.y = rpNew.y;
                this.refresh();
            }
            else {
                super.processMouseEvent(e, data);
            }
            break;
        case Codes.mouseEvent.up:
            super.processMouseEvent(e, data);
            break;
        default:
            break;
        }
        this.refreshState();
    }

    refreshState() {
        const { x, y } = this.camera.mouseToCameraPosition(this.mousePosition);
        if (this.rp.isHovering(x, y)) {
            if (this.keystates.mouseLeft !== true) {
                this[curs] = 'hoverRP';
            } else if (this[curs] !== 'rotate') {
                this[curs] = 'dragRP';
            }
            if (!this.rpHoverState) {
                this.rpHoverState = true;
                this.refresh();
            }
        } else {
            if (this.keystates.mouseLeft === true) {
                this[curs] = 'rotate';
            } else {
                this[curs] = 'def';
            }
            if (this.rpHoverState) {
                this.rpHoverState = false;
                this.refresh();
            }
        }
        this.refreshCursor();
    }

    refreshCursor() {
        if (this.keystates.ctrl) {
            super.refreshCursor();
            return;
        }
        switch (this[curs]) {
        case 'dragRP':
            setCursor('grabbing');
            break;
        case 'hoverRP':
            setCursor('grab');
            break;
        case 'rotate':
            setCursor('crosshair');
            break;
        case 'def':
        default:
            setCursor('move');
            break;
        }
    }
}

export {
    AlignerLHMove,
    AlignerLHRotate,
};
