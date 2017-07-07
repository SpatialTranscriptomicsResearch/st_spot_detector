/**
 * undo.js
 * ----------------
 */

import math from 'mathjs';
import $ from 'jquery';

/**
 * Data structure for an undo stack and various utility functions associated with it
 */
class UndoStack {
    /**
     * Constructs a new Undo stack
     *
     * @param {HTMLElement} canvas - The canvas element
     * @param {object} defaultModifiers - Default modifiers
     */
    constructor() {
        /**
         * The stack.
         * @type {Array}
         */
        this.stack = [];
        this.redoStack = [];
    }

    /**
     * Push to the stack.
     *
     * @param {Action} action - The action last performed.
     */
    push(action) {
        // pushing should clear the redo stack
        console.log("puuuuuuuuuush!!")
    }

    /**
     * Pop from the stack.
     *
     * @returns {Action} action - The action last performed.
     */
    pop() {
        console.log("popping pop pop pop!")
        //return Object.assign({}, this[mod]);
    }

    }

export default UndoStack;
