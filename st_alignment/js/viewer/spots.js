(function() {

    var self;
    var SpotManager = function(camera) {
        self = this;
        self.spots = [];
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
        },
        getSpots: function() {
            return {spots: self.spots, spacer: self.spacer};
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
                if(i != self.spots.length - 1) {
                    dataString += "\n"
                }
            }
            return dataString;
        }
    };

    this.SpotManager = SpotManager;

}).call(this);
