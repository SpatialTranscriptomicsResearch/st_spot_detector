/**
 * undo.js
 * ----------------
 */

import math from 'mathjs';
import $ from 'jquery';

/**
 * Data structure for actions which can be undone
 */
class UndoAction {
    /**
     * Constructs a new Undo action
     *
     * @param {string} tab - In which tab it occured
     * @param {string} action - The type of action
     * @param {object} state - The previous state associated with the action
     */
    constructor(tab, action, state) {
        this.tab = tab;
        this.action = action;
        this.state = state;
    }
}

/**
 * Data structure for an undo stack and various utility functions associated with it
 */
class UndoStack {
    /**
     * Constructs a new Undo stack
     *
     */
    constructor() {
        /**
         * The stack.
         * @type {Array} stack - The undo stack
         * @type {Array} redoStack - The redo stack
         * @type {Array} temp - A variable to hold undo actions ready for pushing to the stack once ready (e.g. actions formed when mouse button clicked, then pushed once mouse button released)
         */
        this.stack = [];
        this.redoStack = [];
        this.temp;
    }

    /**
     * Push to the stack.
     *
     * @param {Action} action - The action last performed.
     */
    push(action) {
        /*
        console.log("pushing: ");
        console.log(action);
        */
        // clear the redo stack if actions are being performed
        this.redoStack = []
        this.stack.push(action);
        /*
        console.log("stack is now: ");
        console.log(this.stack);
        */
        if(action.action == "addSpots") {
        }
    }

    /**
     * Pop from the stack.
     *
     * @returns {Action} action - The action last performed.
     */
    pop() {
        this.redoStack.push(this.stack.slice(-1)[0])
        var action = this.stack.pop()
        /*
        console.log("popping: ");
        console.log(this.stack);
        */
        return action;
    }

    /**
     * Get the tab value of the last item in the stack.
     *
     * @returns {String} tab - The tab of the last action performed. If the stack is empty, then undefined is returned.
     */
    lastTab() {
        if(this.stack.length == 0)
            return undefined;
        else
            return this.stack.slice(-1)[0].tab;
    }

    /**
     * Get the action value of the last item in the stack.
     *
     * @returns {String} action - The action of the last action performed. If the stack is empty, then undefined is returned.
     */
    lastAction() {
        if(this.stack.length == 0)
            return undefined;
        else
            return this.stack.slice(-1)[0].action;
    }

    /**
     * Clear the temp variable
     *
     */
    clearTemp() {
        //console.log("clearing temp");
        this.temp = undefined;
    }

    /**
     * Set an undo action to the temp variable
     *
     * @param {Action} action - The action last performed.
     */
    setTemp(action) {
        /*
        console.log("setting temp to: ");
        console.log(action);
        */
        this.temp = action;
    }

    /**
     * Push the undo variable to the undo stack
     *
     */
    pushTemp() {
        /*
        console.log("pushing temp: ");
        console.log(this.temp);
        console.log("to the stack, then clearin git");
        */
        this.push(this.temp);
        this.clearTemp();
    }
}

export { UndoAction };
export default UndoStack;
