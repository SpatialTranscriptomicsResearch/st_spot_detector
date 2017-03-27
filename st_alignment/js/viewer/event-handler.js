'use strict';

(function() {
    var self;
    var EventHandler = function(scopeData, canvas, camera) {
        self = this;
        self.canvas = canvas;
        self.camera = camera;
        self.scopeData = scopeData;

        self.mousePos = {};
        self.mouseDown = false;
        self.mouseButtonDown = 0;

        self.setUpMouseEvents(self.canvas, self.camera);
        self.setUpKeyEvents(self.canvas, self.camera);
    };
  
    EventHandler.prototype = {
        passEventToLogicHandler: function(evt) {
            var logicHandler = self.scopeData.logicHandler;
            if(logicHandler === null)
                return;
            if(evt.type == 'mouse') {
                logicHandler.processMouseEvent(evt.eventType, evt.data);
            }
            else if(evt.type == 'key') {
                if(evt.keyDirection == 'down') {
                    logicHandler.processKeydownEvent(evt.keyEvent);
                }
                else if(evt.keyDirection == 'up') {
                    logicHandler.processKeyupEvent(evt.keyEvent);
                }
            }
        },
        setUpMouseEvents: function(canvas, camera) {
            canvas.onmousedown = function(e) {
                self.mousePos = Vec2.Vec2(e.layerX, e.layerY);
                self.mouseDown = true;
                self.mouseButtonDown = e.button;
                var mouseEvent = {
                    type: 'mouse',
                    eventType: codes.mouseEvent.down,
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
                    eventType: codes.mouseEvent.up,
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

                var mouseButton = e.button;
                var thisEventType;
                if(self.mouseDown) {
                    mouseButton = self.mouseButtonDown; // required for Firefox, otherwise it attributes all movement to the left button
                    thisEventType = codes.mouseEvent.drag;
                }
                else {
                    thisEventType = codes.mouseEvent.move;
                }
                var mouseEvent = {
                    type: 'mouse',
                    eventType: thisEventType,
                    data: {
                        position: self.mousePos,
                        difference: distanceMoved,
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
                    direction = codes.keyEvent.zin;
                }
                else if(e.deltaY > 0 || e.detail > 0) {
                    direction = codes.keyEvent.zout;
                }
                var mouseEvent = {
                    type: 'mouse',
                    eventType: codes.mouseEvent.wheel,
                    data: {
                        position: self.mousePos,
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
                for(var key in codes.keys) { // iterating through the possible keycodes
                    if(codes.keys.hasOwnProperty(key)) { // only counts as a key if it's in a direct property
                        if(codes.keys[key].includes(event.which)) { // is the event one of the keys?
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
                        keyEvent: codes.keyEvent[keyName]
                    };
                    self.passEventToLogicHandler(keyEvent);
                }
            };
            document.onkeyup = function(event) {
                event = event || window.event;
                var keyName;
                for(var key in codes.keys) { // iterating through the possible keycodes
                    if(codes.keys.hasOwnProperty(key)) { // only counts as a key if it's in a direct property
                        if(codes.keys[key].includes(event.which)) { // is the event one of the keys?
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
                        keyEvent: codes.keyEvent[keyName]
                    };
                    self.passEventToLogicHandler(keyEvent);
                }
            }
        }
    };
  
    this.EventHandler = EventHandler;
    
}).call(self);
