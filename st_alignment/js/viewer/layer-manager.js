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
      this._callback = callback || (() => null);
      this._container = container;
      this._defmod = new Map(DEF_MODIFIERS.entries());
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

      return this;
    }

    addLayer(name, template, ...data) {
      if (this._layers.has(name))
        throw "Layer " + name + " already exists!";

      var el = (template || DEF_TEMPLATE).replace("{name}", name);
      el = $(el)[0];

      var mod = new Map(this._defmod.entries());

      this._layers.set(name, Object.create(null, {
        el: {
          value: el
        },
        mod: {
          value: mod
        },
        data: {
          value: data
        }
      }));

      this.layerOrder.push(name);

      return this;
    }

    deleteLayer(name) {
      if (!this._layers.has(name))
        throw "Layer " + name + " does not exist!";

      if (name in this._active)
        delete this._active[name];

      let idx = this._layerOrder.find(name);
      this._layerOrder.splice(idx, 1);

      this._layers.delete(name);
    }

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
      return this;
    }

    getCanvas(layer) {
      layer = this._layers.get(layer);
      if (layer === undefined)
        throw "Failed to get canvas for layer " + layer +
          " (does it exist?).";
      return layer.el;
    }

    getData(layer) {
      layer = this._layers.get(layer);
      if (layer === undefined)
        throw "Failed to get data for layer " + layer +
          " (does it exist?).";
      return layer.data;
    }

    addModifier(name, value) {
      var layer;
      if (this._defmod.has(name))
        throw "Modifier already defined!";
      this._defmod.set(name, value);
      for (layer of this._layers)
        layer.mod.set(name, value);
      return this;
    }

    deleteModifier(name) {
      var layer;
      if (!this._defmod.has(name))
        throw "Modifier does not exist!";
      this._defmod.delete(name);
      for (layer of this._layers)
        layer.mod.delete(name);
      return this;
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
          layer + ". (does the modifier exist?)";
      return ret;
    }

    setModifiers(layers, modifiers, ...args) {
      var layer, curmod, key, val;
      for (layer of layers) {
        curmod = this.getModifiers(layer);
        for ([key, val] of modifiers) {
          if (!curmod.has(key))
            throw "Invalid modifier " + key + ".";
          curmod.set(key, val);
        }
      }
      this._callback(...args);
      return this;
    }

    setModifier(layers, modifier, value, ...args) {
      for (var layer of layers)
        this.setModifiers(layer, new Map([
          [modifier, value]
        ]), ...args);
      return this;
    }

    // TODO: callback should only be called once
    move(diff, ...args) {
      var transform = math.matrix([
        [1, 0, -diff.x],
        [0, 1, -diff.y],
        [0, 0, 1]
      ]);
      for (var layer of this.getActiveLayers()) {
        this.setModifier(layer, 'tmat', math.multiply(transform,
          this.getModifier(layer, 'tmat')), ...args);
      }
      return this;
    }

    // TODO: callback should only be called once
    rotate(diff, rp, ...args) {
      var transform, transform_, x, y;
      for (var layer of this.getActiveLayers()) {
        transform = this.getModifier(layer, 'tmat');
        [x, y] = [
          math.subset(rp, math.index(0, 0)),
          math.subset(rp, math.index(1, 0))
        ];
        // TODO: rewrite !! (:
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
        this.setModifier(layer, 'tmat', math.multiply(math.inv(lol),
            math.multiply(lol2, math.multiply(lol, transform))), ...
          args);
      }
      return this;
    }

    _interpretLayers(func) {
      return function(layers, ...args) {
        if (typeof(layers) !== "object")
          layers = [layers];
        else if (layers === null)
          layers = Object.keys(this._active);
        return func.apply(this, [layers, ...args]);
      };
    }

    _refreshLayerOrder() {
      var el, sel;
      for (sel of this._layerOrder)
        $(this._container).append(this._layers.get(sel).el);
    }
  };
})();
