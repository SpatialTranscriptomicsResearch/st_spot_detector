/**
 * @module aligner.logic-handler
 */

import _ from 'underscore';
import math from 'mathjs';

import Codes from '../viewer/keycodes';
import LogicHandler from '../logic-handler';
import Vec2 from '../viewer/vec2';
import UndoAction from '../viewer/undo';

// private members
const curs = Symbol('Current state');

/**
 * Default logic handler for the alignment view.
 */
class AlignerLHDefault extends LogicHandler {
    constructor(camera, layerManager, refreshFunc, cursorFunc, undoStack) {
        super();
        this.camera = camera;
        this.layerManager = layerManager;
        this.refresh = refreshFunc;
        this.cursor = cursorFunc;
        this.undoStack = undoStack;
        this.recordKeyStates();
    }

    processKeydownEvent() {
        this.refreshCursor();
    }

    processKeyupEvent(e) {
        if (this.keystates.ctrl) {
            super.processKeyupEvent(e);
            this.refreshCursor();
        } else if (e === Codes.keyEvent.undo) {
            //if this.undoStack[-1].tab == "aligner" {
            _.each(
                _.filter(
                    Object.values(this.layerManager.getLayers()),
                    x => x.get('active'),
                ),
                x => x.setTransform(math.eye(3))
                //x -> setTransform(this.undoStack.pop)
                //this.undoStack.pop();
                //state = this.undoStack.pop();
                //x.tmat = state.matrix
                //this.redoStack.push(state);
            );
            this.refresh();
            //}
        }
    }

    processMouseEvent(e, data) {
        switch (e) {
        case Codes.mouseEvent.down:
            break;
        case Codes.mouseEvent.up:
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
            this.cursor('grabbed');
        } else {
            this.cursor('grabbable');
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
            _.each(
                _.filter(
                    Object.values(this.layerManager.getLayers()),
                    x => x.get('active'),
                ),
                x => x.translate(
                    math.matrix([
                        [data.difference.x / this.camera.scale],
                        [data.difference.y / this.camera.scale],
                    ]),
                ),
            );
        } else if (e === Codes.mouseEvent.up) {
            this.refresh();
        } else if (e === Codes.mouseEvent.down) {
            this.undoStack.push();

            /*
            _.each(
                _.filter(
                    Object.values(this.layerManager.getLayers()),
                    x => x.get('active'),
                ),
            );
                //this.undoStack.push(UndoAction('aligner', 'layerTransform', x.tmat.clone())); // make sure tmat pushed as copy not reference
            */
        }
        this.refreshCursor();
    }

    refreshCursor() {
        if (this.keystates.ctrl) {
            super.refreshCursor();
            return;
        }
        if (this.keystates.mouseLeft || this.keystates.mouseRight) {
            this.cursor('crosshair');
        } else {
            this.cursor('move');
        }
    }
}

/**
 * Logic handler for the rotation tool in the alignment view.
 */
class AlignerLHRotate extends AlignerLHDefault {
    constructor(camera, layerManager, refreshFunc, cursorFunc, undoStack, rp, hovering) {
        super(camera, layerManager, refreshFunc, cursorFunc, undoStack);
        this.rp = rp;
        this.hovering = hovering;
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
                _.each(
                    _.filter(
                        Object.values(this.layerManager.getLayers()),
                        x => x.get('active'),
                    ),
                    x => x.rotate(
                        Vec2.angleBetween(from, to),
                        math.matrix([
                            [this.rp.x],
                            [this.rp.y],
                            [1],
                        ]),
                    ),
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
            break;
        case Codes.mouseEvent.up:
            this.refresh();
            break;
        default:
            break;
        }
        this.refreshState();
    }

    refreshState() {
        if (this.hovering(this.camera.mouseToCameraPosition(this.mousePosition))) {
            if (this.keystates.mouseLeft !== true) {
                this[curs] = 'hoverRP';
            } else if (this[curs] !== 'rotate') {
                this[curs] = 'dragRP';
            }
        } else if (this.keystates.mouseLeft === true) {
            this[curs] = 'rotate';
        } else {
            this[curs] = 'def';
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
            this.cursor('grabbed');
            break;
        case 'hoverRP':
            this.cursor('grabbable');
            break;
        case 'rotate':
            this.cursor('crosshair');
            break;
        case 'def':
        default:
            this.cursor('move');
            break;
        }
    }
}

export {
    AlignerLHMove,
    AlignerLHRotate,
};
