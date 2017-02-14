/* layer-manager.js
 * -----------------------------------------------------------------------------
 *  Simple layer manager.
 *
 *  TODO:
 *  1. Add documentation
 *  2. Make it possible to pass varargs to callback
 *  3. Validation when setting layerOrder (should make sure that all layers are
 *     included)
 */

const DEF_MODIFIERS = new Map([
  ['visible', true],
  ['tmat', math.eye(3)],
  ['alpha', 1.0]
]);

// export default class {
var LayerManager = class {
  constructor(callback) {
    this._layers = new Map();
    this._layerOrder = [];
    this._active = {};
    this._callback = callback;

    this.layerOrder = new Proxy(this._layerOrder, {
      set: (function(target, property, value, receiver) {
        target[property] = value;
        this._callback();
        return true;
      }).bind(this)
    });

    this.setModifiers = this._interpretLayers(this.setModifiers);
    this.setModifier = this._interpretLayers(this.setModifier);
  }

  addLayer(name) {
    if (this._layers.has(name))
      throw "Layer " + name + " already exists!";
    this._layers.set(name, new Map(DEF_MODIFIERS.entries()));
    this.layerOrder.push(name);
  }

  // TODO: implement
  deleteLayer(name) {}

  getLayers() {
    var ret = [];
    for (var layer of this._layers.keys())
      ret.push(layer);
    return ret;
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
    var transform = math.matrix([
      [1, 0, -diff.x],
      [0, 1, -diff.y],
      [0, 0, 1]
    ]);
    for (var layer of this.getActiveLayers()) {
      this.setModifier(layer, 'tmat', math.multiply(transform, this.getModifier(
        layer, 'tmat')));
    }
  }

  rotate(diff, rp) {
    var transform, transform_, x, y;
    for (var layer of this.getActiveLayers()) {
      transform = this.getModifier(layer, 'tmat');
      [x, y] = [
        math.subset(rp, math.index(0, 0)),
        math.subset(rp, math.index(1, 0))
      ];
      var lol = math.matrix([
        [1, 0, -x],
        [0, 1, -y],
        [0, 0, 1]
      ]);
      var lol2 = math.matrix([
        [Math.cos(diff), Math.sin(diff), 0],
        [-Math.sin(diff), Math.cos(diff), 0],
        [0, 0, 1]
      ]);
      this.setModifier(layer, 'tmat', math.multiply(lol, transform));
      this.setModifier(layer, 'tmat', math.multiply(lol2, this.getModifier(
        layer, 'tmat')));
      this.setModifier(layer, 'tmat', math.multiply(math.inv(lol),
        this.getModifier(layer, 'tmat')));
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
