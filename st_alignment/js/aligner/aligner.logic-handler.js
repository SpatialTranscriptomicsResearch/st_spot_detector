(function() {

  const RET_CONTINUE = 1;


  this.AlignerLH = class extends LogicHandler {
    constructor(camera, layerManager, refreshFunc, cursorFunc) {
      super();
      this._camera = camera;
      this._layerManager = layerManager;
      this._refresh = refreshFunc;
      this._cursor = cursorFunc;
      this._prevCursor = undefined;
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
        case this.mouseEvent.down:
          this._cursor('grabbing');
          break;
        case this.mouseEvent.drag:
          this._camera.pan(data.difference);
          this._refresh(false);
          break;
        case this.mouseEvent.wheel:
          this._camera.navigate(data.direction, data.position);
          this._cursor();
          this._refresh(false);
          break;
        default:
          this._cursor('grab');
          break;
      }
    }

    _fallbackFromInner(fun, identifier) {
      return function(...args) {
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
      // TODO: this is a quick fix to make sure that the cursor changes to its
      // fallback state when the fallback key, ctrl, is pressed. This should
      // probably be done in some cleaner way.
      if (e == keyevents.ctrl)
        that.processMouseEvent(undefined, {
          ctrl: true
        });
      return RET_CONTINUE;
    }
    processKeyupEvent(that, e) {
      // TODO: see above
      if (e == keyevents.ctrl)
        that.processMouseEvent(undefined, {
          ctrl: false
        });
      return RET_CONTINUE;
    }
    processMouseEvent(that, e, data) {
      if (e == this.mouseEvent.wheel || data.ctrl)
        return RET_CONTINUE;
      if (e == this.mouseEvent.drag)
        that._layerManager.move(data.difference, false);
      that._cursor('move');
    }
  };


  this.AlignerRotateLH = class extends LogicHandler {
    constructor(rp, hovering) {
      super();
      this._rp = rp;
      this._hovering = hovering;
      this._movingRp = false;
      this._movingRpOffset = undefined;
    }
    processKeydownEvent(that, e) {
      // TODO: see above
      if (e == keyevents.ctrl)
        that.processMouseEvent(undefined, {
          ctrl: true
        });
      return RET_CONTINUE;
    }
    processKeyupEvent(that, e) {
      // TODO: see above
      if (e == keyevents.ctrl)
        that.processMouseEvent(undefined, {
          ctrl: false
        });
      return RET_CONTINUE;
    }
    processMouseEvent(that, e, data) {
      if (e == this.mouseEvent.wheel || data.ctrl)
        return RET_CONTINUE;

      switch (e) {
        case this.mouseEvent.drag:
          if (this._movingRp) {
            this._rp.x = data.position.x + this._movingRpOffset.x;
            this._rp.y = data.position.y + this._movingRpOffset.y;
            that._refresh();
          } else { // !this._movingRp
            var to = Vec2.subtract(data.position, this._rp),
              from = Vec2.subtract(to, data.difference);
            that._layerManager.rotate(
              Vec2.angleBetween(from, to),
              math.transpose(math.matrix([
                [this._rp.x, this._rp.y, 1]
              ])),
              false
            );
          }
          return; // since no need to update cursor

        case this.mouseEvent.down:
          if (data.button == this.mouseButton.right) {
            this._rp.x = data.position.x;
            this._rp.y = data.position.y;
            that._refresh();
          }
          if (this._hovering(data.position)) {
            this._movingRp = true;
            this._movingRpOffset = Vec2.subtract(this._rp, data.position);
          }
          break;

        case this.mouseEvent.up:
          this._movingRp = false;
          break;
      }

      if (!this._hovering(data.position))
        that._cursor('move');
      else if (this._movingRp)
        that._cursor('grabbing');
      else
        that._cursor('grab');
    }
  };

})();
