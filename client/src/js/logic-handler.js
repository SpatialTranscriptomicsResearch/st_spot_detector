/**
 * @module logic-handler
 */

import Codes from './viewer/keycodes';
import Vec2 from './viewer/vec2';

/**
 * Abstract class that defines a unified interface for the event handler across
 * different logic handlers.
 */
/* eslint-disable no-unused-vars, class-methods-use-this */
// (makes sense to disable these, since this class is abstract */
class LogicHandler {
    /**
     * FIXME: Have to disable the below for the time being, since new.target
     *        is not supported in uglify-js yet, see
     *        https://github.com/mishoo/UglifyJS2/issues/938 for the bug
     *        tracker issue.
     */
    // constructor() {
    //     if (new.target === LogicHandler) {
    //         throw new TypeError(
    //             "Call of new on abstract class LogicHandler not allowed."
    //         );
    //     }
    // }

    /**
     * Abstract method for handling key down events.
     *
     * @param {Object} e - The event object
     */
    processKeydownEvent(e) {
        throw new Error('Abstract method not implemented.');
    }

    /**
     * Abstract method for handling key up events.
     *
     * @param {Object} e - The event object
     */
    processKeyupEvent(e) {
        throw new Error('Abstract method not implemented.');
    }

    /**
     * Abstract method for handling mouse events.
     *
     * @param {Object} e - The event object
     */
    processMouseEvent(e, data) {
        throw new Error('Abstract method not implemented.');
    }

    /**
     * Wraps {@link LogicHandler#processMouseEvent} to record the current mouse
     * position. The mouse position is stored in {@link
     * LogicHandler#mousePosition}. This may be useful when the logic handler
     * needs to check the mouse position on a key up/down event.
     */
    recordMousePosition() {
        /**
         * @type {Vec2}
         */
        this.mousePosition = Vec2.Vec2(0, 0);

        const oldME = this.processMouseEvent;
        function constructNewME() {
            function ret(e, data) {
                this.mousePosition = data.position;
                return oldME.apply(this, [e, data]);
            }
            return ret;
        }
        this.processMouseEvent = constructNewME();
    }

    /**
     * Wraps {@link LogicHandler#processKeydownEvent}, {@link
     * LogicHandler#processKeyupEvent}, and {@link
     * LogicHandler#processMouseEvent} to record the current key states. The key
     * states are stored in {@link LogicHandler#_keystates}.
     */
    recordKeyStates() {
        const keys = {};
        const codeToKey = {};
        Object.keys(Codes.keys).forEach((k) => {
            keys[k] = false;
            codeToKey[Codes.keyEvent[k]] = k;
        });
        keys.mouseLeft = false;
        keys.mouseRight = false;

        /**
         * @type {Object}
         */
        this.keystates = Object.seal(keys);

        const oldKDE = this.processKeydownEvent;
        function newKDE(e) {
            if (codeToKey[e] in keys) {
                keys[codeToKey[e]] = true;
            }
            return oldKDE.apply(this, [e]);
        }
        this.processKeydownEvent = newKDE;

        const oldKUE = this.processKeyupEvent;
        function newKUE(e) {
            if (codeToKey[e] in keys) {
                keys[codeToKey[e]] = false;
            }
            return oldKUE.apply(this, [e]);
        }
        this.processKeyupEvent = newKUE;

        const oldME = this.processMouseEvent;
        function newME(e, data) {
            if (e === Codes.mouseEvent.down) {
                switch (data.button) {
                case Codes.mouseButton.left:
                    keys.mouseLeft = true;
                    break;
                case Codes.mouseButton.right:
                    keys.mouseRight = true;
                    break;
                default:
                    break;
                }
            } else if (e === Codes.mouseEvent.up) {
                switch (data.button) {
                case Codes.mouseButton.left:
                    keys.mouseLeft = false;
                    break;
                case Codes.mouseButton.right:
                    keys.mouseRight = false;
                    break;
                default:
                    break;
                }
            }
            return oldME.apply(this, [e, data]);
        }
        this.processMouseEvent = newME;
    }
}

export default LogicHandler;
