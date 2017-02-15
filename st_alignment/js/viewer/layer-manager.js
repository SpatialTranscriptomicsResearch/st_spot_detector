/* LAYER-MANAGER.JS
 * =============================================================================
 *  Simple layer manager.
 *
 * Requirements
 * ------------
 *  1. jQuery
 *  2. mathjs
 *
 *  TODO
 *  ----
 *  1. Add documentation
 *  2. Make it possible to pass varargs to callback
 *  3. Validation when setting layerOrder (should make sure that all layers are
 *     included)
 */

// export default class {
var LayerManager = (function() {

  const DEF_MODIFIERS = new Map([
    ['visible', true],
    ['tmat', math.eye(3)],
    ['alpha', 1.0]
  ]);

  const DEF_TEMPLATE = "<canvas id='layer-{name}' />";

  return class {
    constructor(container, callback) {
      this._active = {};
      this._callback = callback;
      this._container = container;
      this._layers = new Map();
      this._layerOrder = [];

      this.layerOrder = new Proxy(this._layerOrder, {
        set: (function(target, property, value, receiver) {
          target[property] = value;
          this._refreshLayerOrder();
          return true;
        }).bind(this)
      });

      this.setModifiers = this._interpretLayers(this.setModifiers);
      this.setModifier = this._interpretLayers(this.setModifier);
    }

    addLayer(name, template) {
      if (this._layers.has(name))
        throw "Layer " + name + " already exists!";

      var el, mod;

      el = (template || DEF_TEMPLATE).replace("{name}", name);
      el = $(el)[0];

      mod = new Map(DEF_MODIFIERS.entries());

      this._layers.set(name, Object.create(null, {
        el: {
          value: el
        },
        mod: {
          value: mod
        }
      }));

      this.layerOrder.push(name);

      return this;
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
      return Object.keys(this._active);
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

    getCanvas(layer) {
      var ret = this._layers.get(layer).el;
      if (ret === undefined)
        throw "Failed to get canvas for layer " + layer +
          " (does it exist?).";
      return ret;
    }

    getModifiers(layer) {
      var ret = this._layers.get(layer).mod;
      if (ret === undefined)
        throw "Failed to get modifiers for layer " + layer +
          " (does it exist?).";
      return ret;
    }

    getModifier(layer, modifier) {
      var modifiers = this.getModifiers(layer);
      var ret = modifiers.get(modifier);
      if (ret === undefined)
        throw "Failed to get modifier " + modifier + " in layer " +
          layer +
          ". (does the modifier exist?)";
      return ret;
    }

    setModifiers(layers, modifiers) {
      var layer, curmod, key, val;
      for (layer of layers) {
        curmod = this.getModifiers(layer);
        for ([key, val] of modifiers) {
          if (!curmod.has(key))
            throw "Invalid modifier " + key + ".";
          curmod.set(key, val);
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

    _refreshLayerOrder() {
      var el, sel;
      for (sel of this._layerOrder)
        $(this._container).append(this._layers.get(sel).el);
    }
  };
})();
