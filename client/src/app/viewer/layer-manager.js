/**
 * layer-manager.js
 * ----------------
 */

import math from 'mathjs';
import $ from 'jquery';

const DEF_MODIFIERS = {
    visible: true,
    active: true,
};
const DEF_TEMPLATE = '<canvas id="layer-{name}" />';

// Symbols for private members
const cb = Symbol('Callback');
const dm = Symbol('Default modifiers');
const layers = Symbol('Layers');
const mod = Symbol('Modifiers');

// (Re-)appends the layers in the order given by self.layerOrder.
function refreshLayerOrder(layerManager) {
    layerManager.layerOrder.forEach(
        cur => $(layerManager.container).append(layerManager[layers][cur].canvas));
}

/**
 * Data structure for the canvas element and the modifiers associated with a layer.
 */
class Layer {
    /**
     * Constructs a new layer object.
     *
     * @param {HTMLElement} canvas - The canvas element
     * @param {object} defaultModifiers - Default modifiers
     */
    constructor(canvas, defaultModifiers, callback) {
        this[dm] = defaultModifiers;
        this[cb] = callback;
        this[mod] = Object.assign({}, defaultModifiers);

        /**
         * The canvas element of the layer.
         * @type {HTMLElement}
         */
        this.canvas = canvas;

        /**
         * The transformation matrix of the layer.
         * @type {mathjs#matrix}
         */
        this.tmat = math.eye(3);
    }

    /**
     * Getter for layer modifiers.
     *
     * @param {string} name - The name of the modifier.
     * @returns {*} The value of the modifier.
     */
    get(name) {
        if (!(name in this[dm])) {
            throw new Error(`Modifier ${name} does not exist.`);
        }
        return this[mod][name];
    }

    /**
     * Getter for layer modifiers.
     *
     * @returns {Object} The modifiers on the layer.
     */
    getAll() {
        return Object.assign({}, this[mod]);
    }

    /**
     * Setter for layer modifiers.
     *
     * @param {string} name - The name of the modifier.
     * @param {*} value - The value to set the modifier to.
     * @param {...*} args - The arguments to pass to the callback function.
     * @returns {Layer} The layer object that the function was called on.
     */
    set(name, value, ...args) {
        if (!(name in this[dm])) {
            throw new Error(`Modifier ${name} does not exist.`);
        }
        this[mod][name] = value;
        this[cb](...args);
        return this;
    }
    /**
     * Getter for the layer transformation matrix.
     *
     * @returns {mathjs#matrix} The transformation matrix.
     */
    getTransform(transMatrix) {
        return this.tmat;
    }
    /**
     * Sets the layer's transform to the given transformation matrix.
     *
     * @param {mathjs#matrix} transMatrix - The transformation matrix.
     * @returns {Layer} The layer that the function was called on.
     */
    setTransform(transMatrix) {
        this.tmat = transMatrix;
        return this;
    }

    /**
     * Translates the layer.
     *
     * @param {mathjs#matrix} translationVector - The translation vector.
     * @param {...*} args - The arguments to pass to the callback function.
     * @returns {Layer} The layer that the function was called on.
     */
    translate(translationVector, ...args) {
        const [x, y] = [
            math.subset(translationVector, math.index(0, 0)),
            math.subset(translationVector, math.index(1, 0)),
        ];
        const translationMatrix = math.matrix([
            [1, 0, -x],
            [0, 1, -y],
            [0, 0, 1],
        ]);
        this.tmat = math.multiply(translationMatrix, this.tmat);
        this[cb](...args);
        return this;
    }

    /**
     * Rotates the layer around a given rotation point.
     *
     * @param {number} diff - The rotation angle (in radians)
     * @param {mathjs#matrix} rotationPoint - The rotation point
     * @param {...*} args - The arguments to pass to the callback function.
     * @returns {Layer} The layer that the function was called on.
     */
    rotate(diff, rotationPoint, ...args) {
        const [x, y] = [
            math.subset(rotationPoint, math.index(0, 0)),
            math.subset(rotationPoint, math.index(1, 0)),
        ];
        const rotationMatrix = math.matrix([
            [
                Math.cos(diff),
                Math.sin(diff),
                x - ((x * Math.cos(diff)) + (y * Math.sin(diff))),
            ],
            [
                -Math.sin(diff),
                Math.cos(diff),
                y - ((y * Math.cos(diff)) - (x * Math.sin(diff))),
            ],
            [0, 0, 1],
        ]);
        this.tmat = math.multiply(rotationMatrix, this.tmat);
        this[cb](...args);
        return this;
    }
}

/**
 * Utility class for managing canvas layers.
 */
class LayerManager {
    /**
     * Constructs a new LayerManager object.
     *
     * @param {HTMLElement} container - The {@link LayerManager#container}.
     * @param {function} callback - The {@link LayerManager#callback} function.
     */
    constructor(container, callback) {
        // Private members
        this[cb] = (...args) => this.callback(...args);
        this[dm] = Object.assign({}, DEF_MODIFIERS);
        this[layers] = {};

        /**
         * Function to call whenever a layer gets modified.
         * @type {function}
         */
        this.callback = callback || (() => null);

        /**
         * The container of the layers. Must be a DOM element to which elements can be appended
         * (e.g., a div).
         * @type {HTMLElement}
         */
        this.container = container;

        // Add refresh hook when the layer order gets modified
        this.layerOrder = new Proxy([], {
            set: (target, property, value) => {
                /* eslint-disable no-param-reassign */
                target[property] = value;
                refreshLayerOrder(this);
                return target;
            },
        });
    }

    /**
     * Adds a new layer and appends it to the DOM container.
     *
     * @param {string} name - The name for the layer. Must be unique.
     * @param {string} template - The HTML template for the layer. For example, '<canvas
     * id="${name}" />.
     * @returns {Layer} the new layer object.
     */
    addLayer(name, template) {
        if (name in this[layers]) {
            throw new Error(`Layer ${name} already exists!`);
        }
        const layer = new Layer(
            $((template || DEF_TEMPLATE).replace('{name}', name))[0],
            this[dm],
            this[cb]);
        this[layers][name] = layer;
        this.layerOrder.push(name);
        return layer;
    }

    /**
     * Deletes a layer and removes it from the DOM conainter.
     *
     * @param {string} name - The name of the layer.
     * @returns {LayerManager} The object that the function was called on.
     */
    deleteLayer(name) {
        if (!(name in this[layers])) {
            throw new Error(`Layer ${name} does not exist!`);
        }
        this.container.removeChild(this[layers][name].canvas);
        this.layerOrder.splice(this.layerOrder.indexOf(name), 1);
        delete this[layers][name];
        return this;
    }

    /**
     * Getter for a single layer
     *
     * @param {string} name - The name of the layer.
     * @returns {Layer} The layer.
     */
    getLayer(name) {
        if (!(name in this[layers])) {
            throw new Error(`Layer ${name} does not exist.`);
        }
        return this[layers][name];
    }

    /**
     * Getter for all layers
     *
     * @returns {Map} The layers.
     */
    getLayers() {
        return Object.assign({}, this[layers]);
    }

    /**
     * Adds a new modifier/property.
     *
     * @param {string} name - The name of the property. Must be unique.
     * @param {*} value - The default value of the property.
     * @returns {LayerManager} The object that the function was called on.
     */
    addModifier(name, value) {
        if (name in this[dm]) {
            throw new Error(`Modifier ${name} is already defined.`);
        }
        this[dm][name] = value;
        Object.values(this[layers]).forEach((layer) => { layer[mod] = value; });
        return this;
    }

    /**
     * Deletes a modifier/property.
     *
     * @param {string} name - The name of the property.
     * @returns {LayerManager} The object that the function was called on.
     */
    deleteModifier(name) {
        if (!(name in this[dm])) {
            throw new Error(`Modifier ${name} does not exist.`);
        }
        delete this[dm][name];
        Object.values(this[layers]).forEach(layer => delete layer[mod]);
        return this;
    }
}

export default LayerManager;
