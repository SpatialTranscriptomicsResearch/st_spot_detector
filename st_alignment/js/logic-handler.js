var LogicHandler = (function() {
  var mouseEvent = Object.freeze({
    "down": 1,
    "up": 2,
    "move": 3,
    "drag": 4,
    "wheel": 5
  });
  var mouseButton = Object.freeze({
    "left": 0,
    "right": 2
  });

  return class LogicHandler {
    constructor() {
      if (new.target === LogicHandler)
        throw new TypeError(
          "Call of new on abstract class LogicHandler not allowed.");

      this.mouseEvent = mouseEvent;
      this.mouseButton = mouseButton;
    }

    // Abstract methods
    processKeydownEvent(e) {
      throw "Abstract method not implemented.";
    }
    processKeyupEvent(e) {
      throw "Abstract method not implemented.";
    }
    processMouseEvent(e, data) {
      throw "Abstract method not implemented.";
    }

    // Getters for static members
    static getMouseEvent() {
      return mouseEvent;
    }
    static getMouseButton() {
      return mouseButton;
    }

    // Utility functions
    _recordMousePosition() {
      this._mousePosition = Vec2.Vec2(0, 0);
      var oldM = this.processMouseEvent;
      this.processMouseEvent = (function() {
        return function(e, data) {
          this._mousePosition = data.position;
          return oldM.apply(this, [e, data]);
        };
      })();
    }

    _recordKeyStates() {
      var keys = {};
      var codeToKey = {};
      for (var key in keyevents) {
        keys[key] = false;
        codeToKey[keyevents[key]] = key;
      }
      keys.mouseLeft = false;
      keys.mouseRight = false;
      this._keystates = Object.seal(keys);

      var oldKD = this.processKeydownEvent;
      this.processKeydownEvent = function(e) {
        if (codeToKey[e] in keys)
          keys[codeToKey[e]] = true;
        return oldKD.apply(this, [e]);
      };

      var oldKU = this.processKeyupEvent;
      this.processKeyupEvent = function(e) {
        if (codeToKey[e] in keys)
          keys[codeToKey[e]] = false;
        return oldKU.apply(this, [e]);
      };

      var oldM = this.processMouseEvent;
      this.processMouseEvent = function(e, data) {
        if (e == mouseEvent.down) {
          switch(data.button) {
            case mouseButton.left:
              keys.mouseLeft = true;
              break;
            case mouseButton.right:
              keys.mouseRight = true;
              break;
          }
        }
        else if (e == mouseEvent.up) {
          switch(data.button) {
            case mouseButton.left:
              keys.mouseLeft = false;
              break;
            case mouseButton.right:
              keys.mouseRight = false;
              break;
          }
        }
        return oldM.apply(this, [e, data]);
      };
    }
  };
})();
