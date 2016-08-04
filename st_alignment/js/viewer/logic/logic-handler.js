(function() {
    var self;
    var LogicHandler = function(canvas, camera, updateCanvasFunction) {
        self = this;
        self.canvas = canvas;
        self.camera = camera;
        self.updateCanvasFunction = updateCanvasFunction;

        self.mouseEvent = Object.freeze({"down": 1, "up": 2, "move": 3, "wheel": 4});
        self.keyEvent = camera.dir;
        self.state = Object.freeze({"upload_ready": 1, "loading": 2, "move_camera": 3, "select_spots": 4, "manipulate_spots": 5});
    };
  
    LogicHandler.prototype = {
        processKeyEvent: function(keyEvent, eventData) {
            self.camera.navigate(keyEvent);
            self.updateCanvasFunction();
        },
        processMouseEvent: function(mouseEvent, eventData) {
            if(mouseEvent == self.mouseEvent.down) {
            }
            else if(mouseEvent == self.mouseEvent.up) {
            }
            else if(mouseEvent == self.mouseEvent.move) {
                self.camera.pan(eventData);
            }
            else if(mouseEvent == self.mouseEvent.wheel) {
                self.camera.navigate(eventData);
            }
            self.updateCanvasFunction();
        }
    };
  
    this.LogicHandler = LogicHandler;
    
}).call(self);
