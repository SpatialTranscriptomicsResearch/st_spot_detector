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

        self.setUpMouseEvents(self.canvas, self.camera);
        self.setUpKeyEvents(self.canvas, self.camera);
    };
  
    EventHandler.prototype = {
        passEventToLogicHandler: function(evt) {
            // only pass events in these two states
            if(self.scopeData.state == 'state_predetection' || self.scopeData.state == 'state_adjustment') {
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
        },
        setUpMouseEvents: function(canvas, camera) {
            canvas.onmousedown = function(e) {
                self.mousePos = Vec2.Vec2(e.layerX, e.layerY);
                self.mouseDown = true;
                var mouseEvent = {
                    type: 'mouse',
                    eventType: self.logicHandler.mouseEvent.down,
                    data: {
                        position: self.mousePos,
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
                        position: self.mousePos,
                        button: e.button,
                        ctrl: e.ctrlKey
                    }

                }
                self.passEventToLogicHandler(mouseEvent);
            };
            canvas.onmousemove = function(e) {
                var distanceMoved = Vec2.Vec2(self.mousePos.x - e.layerX, self.mousePos.y - e.layerY);
                self.mousePos = Vec2.Vec2(e.layerX, e.layerY);

                var thisEventType;
                if(self.mouseDown) {
                    thisEventType = self.logicHandler.mouseEvent.drag;
                }
                else {
                    thisEventType = self.logicHandler.mouseEvent.move;
                }
                var mouseEvent = {
                    type: 'mouse',
                    eventType: thisEventType,
                    data: {
                        position: self.mousePos,
                        difference: distanceMoved,
                        button: e.button,
                        ctrl: e.ctrlKey
                    }

                }
                self.passEventToLogicHandler(mouseEvent);
            };
            canvas.onmousewheel = function(e) {
                var direction;
                if(e.deltaY < 0) {
                    direction = keyevents.zin;
                }
                else if(e.deltaY > 0) {
                    direction = keyevents.zout;
                }
                var mouseEvent = {
                    type: 'mouse',
                    eventType: self.logicHandler.mouseEvent.wheel,
                    data: {
                        direction: direction
                    }

                }
                self.passEventToLogicHandler(mouseEvent);
            }
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
