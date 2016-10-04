'use strict';

(function() {
    var self;
    var EventHandler = function(canvas, camera, logicHandler) {
        self = this;
        self.canvas = canvas;
        self.camera = camera;
        self.logicHandler = logicHandler;

        self.mousePos = {};
        self.mouseDown = false;

        self.setUpMouseEvents(self.canvas, self.camera);
        self.setUpKeyEvents(self.canvas, self.camera);
    };
  
    EventHandler.prototype = {
        setUpMouseEvents: function(canvas, camera) {
            canvas.onmousedown = function(e) {
                self.mousePos = Vec2.Vec2(e.layerX, e.layerY);
                self.mouseDown = true;
                self.logicHandler.processMouseEvent(self.logicHandler.mouseEvent.down, {position: self.mousePos, button: e.button});
            }
            canvas.onmouseup = function(e) {
                self.mousePos = Vec2.Vec2(e.layerX, e.layerY);
                self.mouseDown = false;
                self.logicHandler.processMouseEvent(self.logicHandler.mouseEvent.up, {position: self.mousePos, button: e.button});
            }

            canvas.onmouseout = function(e) {
                self.mousePos = Vec2.Vec2(e.layerX, e.layerY);
                self.mouseDown = false;
                self.logicHandler.processMouseEvent(self.logicHandler.mouseEvent.out, {position: self.mousePos, button: e.button});
            }

            canvas.onmousemove = function(e) {
                var distanceMoved = Vec2.Vec2(self.mousePos.x - e.layerX, self.mousePos.y - e.layerY);
                self.mousePos = Vec2.Vec2(e.layerX, e.layerY);
                self.logicHandler.processMouseEvent(self.logicHandler.mouseEvent.move, {position: self.mousePos, difference: distanceMoved});
                if(self.mouseDown) {
                    self.logicHandler.processMouseEvent(self.logicHandler.mouseEvent.drag, {position: self.mousePos, difference: distanceMoved, button: e.button});
                }
            }
            canvas.onmousewheel = function(e) {
                if(e.deltaY < 0) {
                    self.logicHandler.processMouseEvent(self.logicHandler.mouseEvent.wheel, keyevents.zin);
                }
                else if(e.deltaY > 0) {
                    self.logicHandler.processMouseEvent(self.logicHandler.mouseEvent.wheel, keyevents.zout);
                }
            }
        },
        setUpKeyEvents: function(canvas, camera) {
            document.onkeydown = function(event) {
                event = event || window.event;
                // this function can (and should) be simplified by iterating through the keycodes object
                if(keycodes.left.includes(event.which)) {
                    // ← left
                    self.logicHandler.processKeydownEvent(keyevents.left);
                }
                else if(keycodes.up.includes(event.which)) {
                    // ↑ up
                    self.logicHandler.processKeydownEvent(keyevents.up);
                }
                else if(keycodes.right.includes(event.which)) {
                    // → right
                    self.logicHandler.processKeydownEvent(keyevents.right);
                }
                else if(keycodes.down.includes(event.which)) {
                    // ↓ down
                    self.logicHandler.processKeydownEvent(keyevents.down);
                }
                else if(keycodes.zin.includes(event.which)) {
                    // + in
                    self.logicHandler.processKeydownEvent(keyevents.zin);
                }
                else if(keycodes.zout.includes(event.which)) {
                    // - out
                    self.logicHandler.processKeydownEvent(keyevents.zout);
                }
                else if(keycodes.shift.includes(event.which)) {
                    // ⇧ shift
                    self.logicHandler.processKeydownEvent(keyevents.shift);
                }
            };
            document.onkeyup = function(event) {
                event = event || window.event;
                if(keycodes.shift.includes(event.which)) {
                    self.logicHandler.processKeyupEvent(keyevents.shift);
                }
                else if(keycodes.esc.includes(event.which)) {
                    // escape
                    self.logicHandler.processKeydownEvent(keyevents.esc);
                }
                else if(keycodes.del.includes(event.which)) {
                    // delete
                    self.logicHandler.processKeydownEvent(keyevents.del);
                }
            }
        }
    };
  
    this.EventHandler = EventHandler;
    
}).call(self);
