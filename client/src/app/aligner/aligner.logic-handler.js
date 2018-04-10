/**
 * @module aligner.logic-handler
 */

import _ from 'underscore';
import math from 'mathjs';

import Codes from '../viewer/keycodes';
import LogicHandler from '../logic-handler';
import Vec2 from '../viewer/vec2';
import { UndoAction } from '../viewer/undo';
import { setCursor } from '../utils';

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
                var matrices = action.state;
                _.each(
                    _.filter(
                        Object.entries(this.layerManager.getLayers()),
                        layer => {
                            var key = layer[0]; // e.g. 'he' or 'cy3'
                            var layerObject = layer[1];
                            return key in matrices;
                        },
                    ),
                    layer => {
                        var key = layer[0]; // e.g. 'he' or 'cy3'
                        var layerObject = layer[1];
                        layerObject.setTransform(matrices[key]);
                    }
                );
                this.refresh();
            }
        }
    }

    processMouseEvent(e, data) {
        switch (e) {
        case Codes.mouseEvent.down:
            var action = new UndoAction(
                'state_alignment',
                'layerTransform',
                {}
            );

            _.each(
                _.filter(
                    Object.entries(this.layerManager.getLayers()),
                    layer => layer[1].get('active'),
                ),
                layer => {
                    var key = layer[0]; // e.g. 'he' or 'cy3'
                    var layerObject = layer[1];
                    action.state[key] = layerObject.getTransform();
                }
            );
            this.undoStack.setTemp(action);
            break;
        case Codes.mouseEvent.up:
            if(this.undoStack.temp) {
                var state = {};
                _.each(
                    _.filter(
                        Object.entries(this.layerManager.getLayers()),
                        layer => layer[1].get('active'),
                    ),
                    layer => {
                        var key = layer[0]; // e.g. 'he' or 'cy3'
                        var layerObject = layer[1];
                        state[key] = layerObject.getTransform();
                    }
                );
                var tempState = this.undoStack.temp.state;
                // check to see if the actions differ when the mouse button was clicked down and when it was released
                if(_.isEqual(Object.keys(state), Object.keys(tempState))) { // check that the keys are equal in the action
                    let equal = Object.keys(state).every(
                        key => {
                            return math.deepEqual(state[key], tempState[key]);
                        }
                    )
                    if(!equal) {
                        // push action if it differs from when mouse button was pressed down
                        this.undoStack.pushTemp();
                    }
                    else {
                        // ignore and clear the temporary action if it is the same as when mouse button was pressed down
                        this.undoStack.clearTemp();
                    }
                }
                else {
                    this.undoStack.pushTemp();
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
