(function() {
    var self;
    var LogicHandler = function(canvas, camera, spotSelector, updateCanvasFunction) {
        self = this;
        self.canvas = canvas;
        self.camera = camera;
        self.spotSelector = spotSelector;
        self.updateCanvasFunction = updateCanvasFunction;

        self.mouseEvent = Object.freeze({"down": 1, "up": 2, "move": 3, "drag": 4, "wheel": 5});
        self.keyEvent = camera.dir;
        self.state = Object.freeze({"upload_ready": 1, "loading": 2, "move_camera": 3, "select_spots": 4, "manipulate_spots": 5});

        //self.currentState = self.state.upload_ready;
        self.currentState = self.state.select_spots;
    };
  
    LogicHandler.prototype = {
        processKeyEvent: function(keyEvent, eventData) {
            if(self.currentState == self.state.move_camera) {
                self.camera.navigate(keyEvent);
            }
            self.updateCanvasFunction();
        },
        processMouseEvent: function(mouseEvent, eventData) {
            if(self.currentState == self.state.upload_ready) {
                if(mouseEvent == self.mouseEvent.up) {
                    // load image
                }
            }
            else if(self.currentState == self.state.move_camera) {
                if(mouseEvent == self.mouseEvent.drag) {
                    self.camera.pan(eventData.difference);
                }
                else if(mouseEvent == self.mouseEvent.wheel) {
                    self.camera.navigate(eventData);
                }
            }
            else if(self.currentState == self.state.select_spots) {
                if(mouseEvent == self.mouseEvent.down) {
                    self.spotSelector.beginSelection(eventData.position);
                }
                else if(mouseEvent == self.mouseEvent.up) {
                    self.spotSelector.endSelection();
                }
                else if(mouseEvent == self.mouseEvent.out) {
                    self.spotSelector.endSelection();
                }
                else if(mouseEvent == self.mouseEvent.drag) {
                    self.spotSelector.updateSelection(eventData.position);
                }
            }
            self.updateCanvasFunction();
        }
    };
  
    this.LogicHandler = LogicHandler;
    
}).call(self);
