(function() {
    var self;
    var EventHandler = function(canvas, camera, logicHandler) {
        self = this;
        self.canvas = canvas;
        self.camera = camera;
        self.logicHandler = logicHandler;

        self.mousePos = {};
        self.mouseDown = false;

        /* https://css-tricks.com/snippets/javascript/javascript-keycodes/#article-header-id-1 */
        self.keycodes = {
            left : [ 37, 65], // left,  a
            up   : [ 38, 87], // up,    w
            right: [ 39, 68], // right, d
            down : [ 40, 83], // down,  s
            zin  : [107, 69], // +,     e
            zout : [109, 81], // -,     q
            shift: [     16]  // shift
        };

        self.setUpMouseEvents(self.canvas, self.camera);
        self.setUpKeyEvents(self.canvas, self.camera);
    };
  
    EventHandler.prototype = {
        setUpMouseEvents: function(canvas, camera) {
            canvas.onmousedown = function(e) {
                self.mousePos = {x: e.layerX, y: e.layerY};
                self.mouseDown = true;
                self.logicHandler.processMouseEvent(self.logicHandler.mouseEvent.down, {position: self.mousePos});
            }
            canvas.onmouseup = function(e) {
                self.mousePos = {x: e.layerX, y: e.layerY};
                self.mouseDown = false;
                self.logicHandler.processMouseEvent(self.logicHandler.mouseEvent.up, {position: self.mousePos});
            }

            canvas.onmouseout = function(e) {
                self.mousePos = {x: e.layerX, y: e.layerY};
                self.mouseDown = false;
                self.logicHandler.processMouseEvent(self.logicHandler.mouseEvent.out, {position: self.mousePos});
            }

            canvas.onmousemove = function(e) {
                var distanceMoved = {x: self.mousePos.x - e.layerX, y: self.mousePos.y - e.layerY};
                self.mousePos = {x: e.layerX, y: e.layerY};
                self.logicHandler.processMouseEvent(self.logicHandler.mouseEvent.move, {position: self.mousePos, difference: distanceMoved});
                if(self.mouseDown) {
                    self.logicHandler.processMouseEvent(self.logicHandler.mouseEvent.drag, {position: self.mousePos, difference: distanceMoved});
                }
            }
            canvas.onmousewheel = function(e) {
                if(e.deltaY < 0) {
                    self.logicHandler.processMouseEvent(self.logicHandler.mouseEvent.wheel, camera.dir.zin);
                }
                else if(e.deltaY > 0) {
                    self.logicHandler.processMouseEvent(self.logicHandler.mouseEvent.wheel, camera.dir.zout);
                }
            }
        },
        setUpKeyEvents: function(canvas, camera) {
            document.onkeydown = function(event) {
                event = event || window.event;
                if(self.keycodes.left.includes(event.which)) {
                    // ← left
                    self.logicHandler.processKeydownEvent(self.logicHandler.keyEvent.left);
                }
                else if(self.keycodes.up.includes(event.which)) {
                    // ↑ up
                    self.logicHandler.processKeydownEvent(self.logicHandler.keyEvent.up);
                }
                else if(self.keycodes.right.includes(event.which)) {
                    // → right
                    self.logicHandler.processKeydownEvent(self.logicHandler.keyEvent.right);
                }
                else if(self.keycodes.down.includes(event.which)) {
                    // ↓ down
                    self.logicHandler.processKeydownEvent(self.logicHandler.keyEvent.down);
                }
                else if(self.keycodes.zin.includes(event.which)) {
                    // + in
                    self.logicHandler.processKeydownEvent(self.logicHandler.keyEvent.zin);
                }
                else if(self.keycodes.zout.includes(event.which)) {
                    // - out
                    self.logicHandler.processKeydownEvent(self.logicHandler.keyEvent.zout);
                }
                else if(self.keycodes.shift.includes(event.which)) {
                    // ⇧ shift
                    self.logicHandler.processKeydownEvent(self.logicHandler.keyEvent.shift);
                }
            };
            document.onkeyup = function(event) {
                event = event || window.event;
                if(self.keycodes.shift.includes(event.which)) {
                    self.logicHandler.processKeyupEvent(self.logicHandler.keyEvent.shift);
                }
            }
        }
    };
  
    this.EventHandler = EventHandler;
    
}).call(self);
