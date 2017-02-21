(function() {

  const RET_CONTINUE = 1;


  this.AlignerLH = class extends LogicHandler {
    constructor(camera, layerManager, refreshFunc) {
      super();
      this._camera = camera;
      this._layerManager = layerManager;
      this._refresh = refreshFunc;
      this._innerLH = undefined;
      for (var identifier of [
          'processKeydownEvent',
          'processKeyupEvent',
          'processMouseEvent'
        ]) {
        this[identifier] = this._fallbackFromInner(this[identifier],
          identifier);
        // this[identifier] = this._addRefreshHook(this[identifier]);
      }
    }

    setInnerLH(lh) {
      this._innerLH = lh;
    }

    processKeydownEvent(e) {}
    processKeyupEvent(e) {}
    processMouseEvent(e, data) {
      switch (e) {
        case this.mouseEvent.drag:
          this._camera.pan(data.difference);
          this._refresh(false);
          break;
        case this.mouseEvent.wheel:
          this._camera.navigate(data.direction, data.position);
          this._refresh(false);
          break;
      }
    }

    _fallbackFromInner(fun, identifier) {
      return function(...args) {
        [...args] = [...args].slice(1); // FIXME
        var ret = this._innerLH[identifier](this, ...args);
        if (ret === RET_CONTINUE)
          return fun.apply(this, [...args]);
        return ret;
      };
    }

    _addRefreshHook(fun) {
      return function(...args) {
        var ret = fun.apply(this, [...args]);
        this._refresh();
        return ret;
      };
    }
  };


  this.AlignerMoveLH = class extends LogicHandler {
    processKeydownEvent(that, e) {
      return RET_CONTINUE;
    }
    processKeyupEvent(that, e) {
      return RET_CONTINUE;
    }
    processMouseEvent(that, e, data) {
      if (!data.ctrl && e == this.mouseEvent.drag) {
        that._layerManager.move(data.difference, false);
        return;
      }
      return RET_CONTINUE;
    }
  };


  this.AlignerRotateLH = class extends LogicHandler {
    constructor(rp, hovering) {
      super();
      this._rp = rp;
      this._hovering = hovering;
      this._movingRp = false;
    }
    processKeydownEvent(that, e) {
      return RET_CONTINUE;
    }
    processKeyupEvent(that, e) {
      return RET_CONTINUE;
    }
    processMouseEvent(that, e, data) {
      switch (e) {
        case this.mouseEvent.drag:
          var to = Vec2.subtract(data.position, this._rp),
            from = Vec2.subtract(to, data.difference);
          that._layerManager.rotate(
            Vec2.angleBetween(from, to),
            math.transpose(math.matrix([
              [this._rp.x, this._rp.y, 1]
            ])),
            false
          );
          return;
      }
      return RET_CONTINUE;
    }
  };

})();
