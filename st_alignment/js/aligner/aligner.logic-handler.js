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
      lh.master = this;
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
        var ret = this._innerLH[identifier].apply(this._innerLH, [...args]);
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
    constructor() {
      super();
      this.master = null;
    }
    processKeydownEvent(e) {
      // TODO: this is a quick fix to make sure that the cursor changes to its
      // fallback state when the fallback key, ctrl, is pressed. This should
      // probably be done in some cleaner way.
      if (e == keyevents.ctrl)
        this.master.processMouseEvent(undefined, {
          ctrl: true
        });
      return RET_CONTINUE;
    }
    processKeyupEvent(e) {
      // TODO: see above
      if (e == keyevents.ctrl)
        this.master.processMouseEvent(undefined, {
          ctrl: false
        });
      return RET_CONTINUE;
    }
    processMouseEvent(e, data) {
      if (e == this.mouseEvent.wheel || data.ctrl)
        return RET_CONTINUE;
      if (e == this.mouseEvent.drag)
        this.master._layerManager.move(data.difference, false);
      this.master._cursor('move');
    }
  };


  this.AlignerRotateLH = class extends LogicHandler {
    constructor(rp, hovering) {
      super();
      this._fallback = false;
      this._rp = rp;
      this._hovering = hovering;
      this._movingRp = false;
      this._movingRpOffset = undefined;
      this._curCursor = 'none';

      this.master = null;

      this._recordMousePosition();
    }
    processKeydownEvent(e) {
      if (e != keyevents.ctrl)
        return;
      this._fallback = true;
      this.master._cursor('grab');
      return RET_CONTINUE;
    }
    processKeyupEvent(e) {
      if (e == keyevents.ctrl) {
        this._fallback = false;
        this.master._cursor(this._curCursor);
        return;
      }
      if (this._fallback)
        return RET_CONTINUE;
      return;
    }
    processMouseEvent(e, data) {
      if (this._fallback || e == this.mouseEvent.wheel)
        return RET_CONTINUE;

      switch (e) {
        case this.mouseEvent.drag:
          if (this._movingRp) {
            this._rp.x = data.position.x + this._movingRpOffset.x;
            this._rp.y = data.position.y + this._movingRpOffset.y;
            this.master._refresh();
          } else { // !this._movingRp
            var to = Vec2.subtract(data.position, this._rp),
              from = Vec2.subtract(to, data.difference);
            this.master._layerManager.rotate(
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
            this.master._refresh();
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
        this._setCursor('move');
      else if (this._movingRp)
        this._setCursor('grabbing');
      else
        this._setCursor('grab');
    }
    _setCursor(cursor) {
      this._curCursor = cursor;
      this.master._cursor(cursor);
    }
  };

})();
