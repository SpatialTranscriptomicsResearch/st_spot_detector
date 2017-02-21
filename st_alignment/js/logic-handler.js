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

    // Abstract classes
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
    getMouseEvent() {
      return mouseEvent;
    }
    getMouseButton() {
      return mouseButton;
    }
  };
})();
