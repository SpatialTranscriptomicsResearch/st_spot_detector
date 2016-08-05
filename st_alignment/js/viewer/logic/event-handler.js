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
            zout : [109, 81]  // -,     q
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
                var difference = {x: self.mousePos[0] - e.layerX, y: self.mousePos[1] - e.layerY};
                self.mousePos = {x: e.layerX, y: e.layerY};
                self.logicHandler.processMouseEvent(self.logicHandler.mouseEvent.move, {position: self.mousePos, difference: difference});
                if(self.mouseDown) {
                    self.logicHandler.processMouseEvent(self.logicHandler.mouseEvent.drag, {position: self.mousePos, difference: difference});
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
                    self.logicHandler.processKeyEvent(self.logicHandler.keyEvent.left);
                }
                else if(self.keycodes.up.includes(event.which)) {
                    // ↑ up
                    self.logicHandler.processKeyEvent(self.logicHandler.keyEvent.up);
                }
                else if(self.keycodes.right.includes(event.which)) {
                    // → right
                    self.logicHandler.processKeyEvent(self.logicHandler.keyEvent.right);
                }
                else if(self.keycodes.down.includes(event.which)) {
                    // ↓ down
                    self.logicHandler.processKeyEvent(self.logicHandler.keyEvent.down);
                }
                else if(self.keycodes.zin.includes(event.which)) {
                    // + in
                    self.logicHandler.processKeyEvent(self.logicHandler.keyEvent.zin);
                }
                else if(self.keycodes.zout.includes(event.which)) {
                    // - out
                    self.logicHandler.processKeyEvent(self.logicHandler.keyEvent.zout);
                }
            }
        }
    };
  
    this.EventHandler = EventHandler;
    
}).call(self);
