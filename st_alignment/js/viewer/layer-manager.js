/* LayerManager.js
 * -----------------------------------------------------------------------------
 *  Simple layer manager.
 *
 *  TODO:
 *  1. Add documentation
 *  2. Make it possible to pass varargs to callback
 */

const DEF_MODIFIERS = new Map([
  ['active', false],
  ['visible', true],
  ['trans', Vec2.Vec2(0, 0)],
  ['rot', 0],
  ['alpha', 0.5]
]);

// export default class {
var LayerManager = class {
  constructor(callback) {
    this._layers = new Map();
    this._callback = callback;
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

  setModifiers(layer, modifiers) {
    layer = this.getModifiers(layer);
    for (var [key, val] of modifiers) {
      if (!layer.has(key))
        throw "Invalid modifier " + key + ".";
      layer.set(key, val);
    }
    this._callback();
  }

  setModifier(layer, modifier, value) {
    this.setModifiers(layer, new Map([
      [modifier, value]
    ]));
  }

  move(diff) {
    for (var [key, layer] of this._layers)
      if (layer.get('active'))
        this.setModifier(key, 'trans', Vec2.subtract(this.getModifier(key,
          'trans'), diff));
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
};
