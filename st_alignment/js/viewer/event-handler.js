'use strict';

(function() {
    var self;
    var EventHandler = function(scopeData, canvas, camera, logicHandler) {
        self = this;
        self.canvas = canvas;
        self.camera = camera;
        self.logicHandler = logicHandler;
        self.scopeData = scopeData;

        self.mousePos = {};
        self.mouseDown = false;
        self.mouseButtonDown = 0;

        self.setUpMouseEvents(self.canvas, self.camera);
        self.setUpKeyEvents(self.canvas, self.camera);
    };
  
    EventHandler.prototype = {
        passEventToLogicHandler: function(evt) {
          // TODO: clean up
          if(self.scopeData.state == 'state_predetection' ||
            self.scopeData.state == 'state_adjustment') {
            if(evt.type == 'mouse') {
              self.logicHandler.processMouseEvent(self.scopeData.state, evt.eventType, evt.data);
            }
            else if(evt.type == 'key') {
              if(evt.keyDirection == 'down') {
                self.logicHandler.processKeydownEvent(self.scopeData.state, evt.keyEvent);
              }
              else if(evt.keyDirection == 'up') {
                self.logicHandler.processKeyupEvent(self.scopeData.state, evt.keyEvent);
              }
            }
          }
          else if(self.scopeData.state == 'state_alignment') {
            if(evt.type == 'mouse')
              self.logicHandler.processMouseEvent(evt.eventType, evt.data);
            else if(evt.type == 'key')
              if(evt.keyDirection == 'down')
                self.logicHandler.processKeydownEvent(evt.keyEvent);
              else if(evt.keyDirection == 'up')
                self.logicHandler.processKeyupEvent(evt.keyEvent);
          }
        },
        setUpMouseEvents: function(canvas, camera) {
            canvas.onmousedown = function(e) {
                self.mousePos = Vec2.Vec2(e.layerX, e.layerY);
                self.mouseDown = true;
                self.mouseButtonDown = e.button;
                var mouseEvent = {
                    type: 'mouse',
                    eventType: self.logicHandler.mouseEvent.down,
                    data: {
                        position: self.camera.mouseToCameraPosition(self.mousePos),
                        button: e.button,
                        ctrl: e.ctrlKey
                    }

                }
                self.passEventToLogicHandler(mouseEvent);
            };
            canvas.onmouseup = function(e) {
                self.mousePos = Vec2.Vec2(e.layerX, e.layerY);
                self.mouseDown = false;
                var mouseEvent = {
                    type: 'mouse',
                    eventType: self.logicHandler.mouseEvent.up,
                    data: {
                        position: self.camera.mouseToCameraPosition(self.mousePos),
                        button: e.button,
                        ctrl: e.ctrlKey
                    }

                }
                self.passEventToLogicHandler(mouseEvent);
            };
            canvas.onmousemove = function(e) {
                var distanceMoved = Vec2.Vec2(self.mousePos.x - e.layerX, self.mousePos.y - e.layerY);
                self.mousePos = Vec2.Vec2(e.layerX, e.layerY);

                var mouseButton = e.button;
                var thisEventType;
                if(self.mouseDown) {
                    mouseButton = self.mouseButtonDown; // required for Firefox, otherwise it attributes all movement to the left button
                    thisEventType = self.logicHandler.mouseEvent.drag;
                }
                else {
                    thisEventType = self.logicHandler.mouseEvent.move;
                }
                var mouseEvent = {
                    type: 'mouse',
                    eventType: thisEventType,
                    data: {
                        position: self.camera.mouseToCameraPosition(self.mousePos),
                        difference: self.camera.mouseToCameraScale(distanceMoved),
                        button: mouseButton,
                        ctrl: e.ctrlKey
                    }

                }
                self.passEventToLogicHandler(mouseEvent);
            };
            function wheelCallback(e) {
                self.mousePos = Vec2.Vec2(e.layerX, e.layerY);
                var direction;
                if(e.deltaY < 0 || e.detail < 0) {
                    direction = keyevents.zin;
                }
                else if(e.deltaY > 0 || e.detail > 0) {
                    direction = keyevents.zout;
                }
                var mouseEvent = {
                    type: 'mouse',
                    eventType: self.logicHandler.mouseEvent.wheel,
                    data: {
                        position: self.camera.mouseToCameraPosition(self.mousePos),
                        direction: direction
                    }

                }
                self.passEventToLogicHandler(mouseEvent);
            };
            canvas.addEventListener('DOMMouseScroll', wheelCallback, false);
            canvas.onmousewheel = wheelCallback;
        },
        setUpKeyEvents: function(canvas, camera) {
            document.onkeydown = function(event) {
                event = event || window.event;
                var keyName;
                for(var key in keycodes) { // iterating through the possible keycodes
                    if(keycodes.hasOwnProperty(key)) { // only counts as a key if it's in a direct property
                        if(keycodes[key].includes(event.which)) { // is the event one of the keys?
                            // then that's the key we want!
                            keyName = key;
                        }
                    }
                }
                // send it to the logic handler if not undefined
                if(keyName) {
                    var keyEvent = {
                        type: 'key',
                        keyDirection: 'down',
                        keyEvent: keyevents[keyName]
                    };
                    self.passEventToLogicHandler(keyEvent);
                }
            };
            document.onkeyup = function(event) {
                event = event || window.event;
                var keyName;
                for(var key in keycodes) { // iterating through the possible keycodes
                    if(keycodes.hasOwnProperty(key)) { // only counts as a key if it's in a direct property
                        if(keycodes[key].includes(event.which)) { // is the event one of the keys?
                            // then that's the key we want!
                            keyName = key;
                        }
                    }
                }
                // send it to the logic handler if not undefined
                if(keyName) {
                    var keyEvent = {
                        type: 'key',
                        keyDirection: 'up',
                        keyEvent: keyevents[keyName]
                    };
                    self.passEventToLogicHandler(keyEvent);
                }
            }
        }
    };
  
    this.EventHandler = EventHandler;
    
}).call(self);
