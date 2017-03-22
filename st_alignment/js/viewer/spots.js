(function() {

    var self;
    var SpotManager = function(camera) {
        self = this;
        self.spots = [];
        // the spots located under the tissue (relevant only if an HE image has been uploaded)
        self.tissueSpots = [];
        self.spacer = {};
        self.scalingFactor;
        self.spotToAdd = {
            renderPosition: Vec2.Vec2(0, 0)
        };
    };

    SpotManager.prototype = {
        updateScalingFactor: function(scalingFactor) {
            // the uploaded image is scaled down to approximately 20k x 20k;
            // this scaling factor is necessary to scale the pixel spot coordinates up again
            self.scalingFactor = scalingFactor;
        },
        loadSpots: function(spotData) {
            self.spots = spotData.spots;
            self.spacer = spotData.spacer;
            self.tissueSpots = spotData.tissue_spots;
        },
        getSpots: function() {
            return {spots: self.spots, spacer: self.spacer};
        },
        selectTissueSpots: function() {
            // relevant only if an HE image has been uploaded
            // adds to current selection
            for(var i = 0; i < self.tissueSpots.length; ++i) { // for every spot in the tissue spots, go through them all 
                var tissueSpot = self.tissueSpots[i]; // this is the one, yes
                for(var j = 0; j < self.spots.length; ++j) { // okay, now, for every "normal" spot, check it out, compare it to it!
                    var spot = self.spots[j]; // this is the one, look at it
                    if(spot.selected) { // oh, it's already selected?
                        // ignore if already selected
                        continue;
                    }
                    if(tissueSpot.arrayPosition.x == spot.arrayPosition.x &&
                       tissueSpot.arrayPosition.y == spot.arrayPosition.y) {
                        self.spots[j].selected = true;
                        break;
                    }
                }
            }
        },
        exportSpots: function(type, selection) {
            var dataString = "";

            for(var i = 0; i < self.spots.length; ++i) {
                var spot = self.spots[i];
                if(selection == 'selection' && spot.selected == false) {
                    // we want to skip adding the spot if we are only exporting the selection
                    // and find that the current spot is not selected
                    continue;
                }
                dataString += spot.arrayPosition.x  + "\t" + spot.arrayPosition.y  + "\t";
                if(type == "array") {
                    dataString += spot.newArrayPosition.x  + "\t" + spot.newArrayPosition.y; 
                }
                else if(type == "pixel") {
                    var position = {
                        'x': Math.round(spot.renderPosition.x * self.scalingFactor),
                        'y': Math.round(spot.renderPosition.y * self.scalingFactor)
                    }
                    dataString += position.x + "\t" + position.y;
                }
                // we add a bool 0 or 1, depending on whether the spot is selected or not
                var selected = spot.selected ? "1\t" : "0\t";
                dataString += selected;
                if(i != self.spots.length - 1) {
                    dataString += "\n"
                }
            }
            return dataString;
        }
    };

    this.SpotManager = SpotManager;

}).call(this);
