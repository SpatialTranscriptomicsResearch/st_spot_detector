class AdjustmentLH extends LogicHandler {
    constructor(camera, spotAdjuster, spotSelector, setCanvasCursor, refreshCanvas) {
        super();
        this.camera = camera;
        this.spotAdjuster = spotAdjuster;
        this.spotSelector = spotSelector;
        this.setCanvasCursor = setCanvasCursor;
        this.refreshCanvas = refreshCanvas;

        this.addingSpots = false;
    }

    processKeydownEvent(keyEvent) {
        if(this.addingSpots == false) {
            if(keyEvent == codes.keyEvent.shift) {
                this.spotSelector.toggleShift(true);
            }
            else {
                if(this.spotSelector.selected) {
                    this.spotAdjuster.adjustSpots(keyEvent);
                }
                else {
                    this.camera.navigate(keyEvent);
                }
            }
        }
        // check for ctrl key down to change cursor
        if(keyEvent == codes.keyEvent.ctrl) {
            this.setCanvasCursor('grabbable');
        }
        this.refreshCanvas();
    }

    processKeyupEvent(keyEvent) {
        if(this.addingSpots) {
            this.spotAdjuster.finishAddSpots(false);
        }
        else {
            if(keyEvent == codes.keyEvent.shift) {
                this.spotSelector.toggleShift(false);
            }
        }

        if(keyEvent == codes.keyEvent.ctrl) {
            this.setCanvasCursor('crosshair');
        }
        this.refreshCanvas();
    }

    processMouseEvent(mouseEvent, eventData) {
        var cursor;
        cursor = 'crosshair';
        // right click moves canvas or spots
        if(eventData.button == codes.mouseButton.right ||
            eventData.ctrl == true) {
            if(mouseEvent == codes.mouseEvent.down) {
                this.spotAdjuster.moving = this.spotAdjuster.atSelectedSpots(eventData.position);
                cursor = 'grabbed';
            }
            else if(mouseEvent == codes.mouseEvent.up) {
                this.spotAdjuster.moving = false;
            }
            else if(mouseEvent == codes.mouseEvent.drag) {
                if(this.spotAdjuster.moving) {
                    this.spotAdjuster.dragSpots(eventData.difference);
                }
                else {
                    this.camera.pan(eventData.difference);
                }
                cursor = 'grabbed';
            }
            else if(mouseEvent == codes.mouseEvent.move) {
                cursor = 'grabbable';
            }
        }
        else if(mouseEvent == codes.mouseEvent.move) {
            this.spotAdjuster.updateSpotToAdd(eventData.position);
            cursor = 'crosshair';
        }
        // left click adds or selects spots
        else if(eventData.button == codes.mouseButton.left &&
            eventData.ctrl == false) {
            // in adding state, left click serves to add a new spot
            if(this.addingSpots) {
                if(mouseEvent == codes.mouseEvent.up) {
                    this.spotAdjuster.addSpot(eventData.position);
                }
            }
            // but in selection state, left click to make a selection
            else {
                if(mouseEvent == codes.mouseEvent.down) {
                    this.spotSelector.beginSelection(eventData.position);
                }
                else if(mouseEvent == codes.mouseEvent.up) {
                    this.spotSelector.endSelection();
                }
                else if(mouseEvent == codes.mouseEvent.drag) {
                    this.spotSelector.updateSelection(eventData.position);
                }
            }
        }
        else if(mouseEvent == codes.mouseEvent.wheel) {
            // scrolling
            this.camera.navigate(eventData.direction, eventData.position);
        }
        this.setCanvasCursor(cursor);
        this.refreshCanvas();
    }
}
