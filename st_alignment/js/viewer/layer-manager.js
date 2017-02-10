/* LayerManager.js
 * -----------------------------------------------------------------------------
 *  Simple layer manager.
 *
 *  TODO:
 *  1. Add documentation
 *  2. Make it possible to pass varargs to callback
 */

const DEF_MODIFIERS = new Map([
  ['visible', true],
  ['trans', Vec2.Vec2(0, 0)],
  ['rot', 0],
  ['alpha', 0.5]
]);

// export default class {
var LayerManager = class {
  constructor(callback) {
    this._layers = new Map();
    this._active = {};
    this._callback = callback;

    this.setModifiers = this._interpretLayers(this.setModifiers);
    this.setModifier = this._interpretLayers(this.setModifier);
  }

  addLayer(name) {
    if (this._layers.has(name))
      throw "Layer " + name + " already exists!";
    this._layers.set(name, new Map(DEF_MODIFIERS.entries()));
  }

  // TODO: implement
  deleteLayer(name) {}

  getLayers() {
    return this._layers.keys();
  }

  getActiveLayers() {
    var ret = [];
    for (var layer in this._active)
      ret.push(layer);
    return ret;
  }

  getActiveLayer(layer) {
    if (layer in this._active)
      return true;
    return false;
  }

  setActiveLayer(layer, b) {
    if (b === undefined) {
      if (this._active[layer] !== undefined)
        b = false;
      else b = true;
    }
    if (b === true)
      this._active[layer] = true;
    else if (b === false && layer in this._active)
      delete this._active[layer];
  }

  getModifiers(layer) {
    var ret = this._layers.get(layer);
    if (ret === undefined)
      throw "Failed to get modifiers for layer " + layer +
        " (does it exist?).";
    return ret;
  }

  getModifier(layer, modifier) {
    var _layer = this.getModifiers(layer);
    var ret = _layer.get(modifier);
    if (ret === undefined)
      throw "Failed to get modifier " + modifier + " in layer " + layer +
        ". (does the modifier exist?)";
    return ret;
  }

  setModifiers(layers, modifiers) {
    for (var layer of layers) {
      layer = this.getModifiers(layer);
      for (var [key, val] of modifiers) {
        if (!layer.has(key))
          throw "Invalid modifier " + key + ".";
        layer.set(key, val);
      }
    }
    this._callback();
  }

  setModifier(layers, modifier, value) {
    for (var layer of layers)
      this.setModifiers(layer, new Map([
        [modifier, value]
      ]));
  }

  move(diff) {
    for (var layer in this._active) {
      this.setModifier(layer, 'trans', Vec2.subtract(this.getModifier(layer,
        'trans'), diff));
    }
  }

  getOffset(type) {
    switch (type) {
      case 'rotation':
        return 0;
      case 'x':
        return 0;
      case 'y':
        return 0;
    }
  }

  _interpretLayers(func) {
    return function(layers, ...args) {
      if (typeof(layers) !== "object")
        layers = [layers];
      else if (layers === null)
        layers = Object.keys(this._active);
      func.apply(this, [layers, ...args]);
    };
  }
};
