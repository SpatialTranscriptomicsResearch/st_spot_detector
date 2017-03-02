class AlignerLHAdapter extends LogicHandler {
  constructor(lh) {
    super();
    this.setLH(lh);
  }
  setLH(lh) {
    this.lh = lh;
  }
  processKeydownEvent(e) {
    this.lh.processKeydownEvent(e);
  }
  processKeyupEvent(e) {
    this.lh.processKeyupEvent(e);
  }
  processMouseEvent(e, data) {
    this.lh.processMouseEvent(e, data);
  }
}

(function() {

  class AlignerLHDefault extends LogicHandler {
    constructor(camera, layerManager, refreshFunc, cursorFunc) {
      super();
      this._camera = camera;
      this._layerManager = layerManager;
      this._refresh = refreshFunc;
      this._cursor = cursorFunc;

      this._recordKeyStates();
    }

    processKeydownEvent(e) {
      this._refreshCursor();
    }
    processKeyupEvent(e) {
      this._refreshCursor();
    }
    processMouseEvent(e, data) {
      switch (e) {
        case this.mouseEvent.down:
          break;
        case this.mouseEvent.up:
          this._refresh();
          break;
        case this.mouseEvent.drag:
          this._camera.pan(data.difference);
          this._refresh();
          break;
        case this.mouseEvent.wheel:
          this._camera.navigate(data.direction, data.position);
          this._refresh();
          break;
      }
      this._refreshCursor();
    }

    _refreshCursor() {
      if (this._keystates.mouseLeft)
        this._cursor('grabbing');
      else
        this._cursor('grab');
    }
  }


  this.AlignerLHMove = class extends AlignerLHDefault {
    processKeydownEvent(e) {
      if (e == keyevents.ctrl)
        return super.processKeydownEvent(e);
    }
    processMouseEvent(e, data) {
      if (e == this.mouseEvent.wheel || data.ctrl)
        return super.processMouseEvent(e, data);
      if (e == this.mouseEvent.drag)
        this._layerManager.move(data.difference);
      else if (e == this.mouseEvent.up)
        this._refresh();
      this._refreshCursor();
    }
    _refreshCursor() {
      if (this._keystates.ctrl)
        return super._refreshCursor();
      if (this._keystates.mouseLeft || this._keystates.mouseRight)
        this._cursor('move');
      else
        this._cursor('auto');
    }
  };


  this.AlignerLHRotate = class extends AlignerLHDefault {
    constructor(camera, layerManager, refreshFunc, cursorFunc, rp, hovering) {
      super(camera, layerManager, refreshFunc, cursorFunc);
      this._rp = rp;
      this._hovering = hovering;

      this._curState = 'def';

      this._recordMousePosition();
      this._recordKeyStates();
    }
    processKeydownEvent(e) {
      if (this._keystates.ctrl)
        return super.processKeydownEvent(e);
      this._refreshState();
    }
    processKeyupEvent(e) {
      if (this._keystates.ctrl)
        return super.processKeyupEvent(e);
      this._refreshState();
    }
    processMouseEvent(e, data) {
      if (this._keystates.ctrl || e == this.mouseEvent.wheel)
        return super.processMouseEvent(e, data);

      switch (e) {
        case this.mouseEvent.drag:
          if (this._curState == 'rotate') {
            var to = Vec2.subtract(data.position, this._rp),
              from = Vec2.subtract(to, data.difference);
            this._layerManager.rotate(
              Vec2.angleBetween(from, to),
              math.transpose(math.matrix([
                [this._rp.x, this._rp.y, 1]
              ]))
            );
          } else
          if (this._curState == 'dragRP') {
            this._rp.x -= data.difference.x;
            this._rp.y -= data.difference.y;
            this._refresh();
          }
          break;

        case this.mouseEvent.down:
          if (data.button == this.mouseButton.right) {
            this._rp.x = data.position.x;
            this._rp.y = data.position.y;
            this._refresh();
          }
          break;

        case this.mouseEvent.up:
          this._refresh();
          break;
      }

      this._refreshState();
    }

    _refreshState() {
      if (this._hovering(this._mousePosition)) {
        if (this._keystates.mouseLeft)
          this._curState = 'dragRP';
        else
          this._curState = 'hoverRP';
      } else {
        if (this._keystates.mouseLeft)
          this._curState = 'rotate';
        else
          this._curState = 'def';
      }
      this._refreshCursor();
    }

    _refreshCursor() {
      if (this._keystates.ctrl)
        return super._refreshCursor();
      switch (this._curState) {
        case 'dragRP':
          this._cursor('grabbing');
          break;
        case 'hoverRP':
          this._cursor('grab');
          break;
        case 'rotate':
          this._cursor('move');
          break;
        case 'def':
          this._cursor('auto');
          break;
      }
    }
  };

})();
