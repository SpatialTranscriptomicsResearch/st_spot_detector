(function() {

    var self;
    var SpotManager = function(camera) {
        self = this;
        self.spots = [];
        self.spacer = {};
    };

    SpotManager.prototype = {
        loadSpots: function(spotData) {
            self.spots = spotData.spots;
            self.spacer = spotData.spacer;
        },
        exportSpots: function(type) {
            var dataString = "";

            for(var i = 0; i < self.spots.length; ++i) {
                var spot = self.spots[i];
                dataString += spot.arrayPosition.x  + "\t" + spot.arrayPosition.y  + "\t";
                if(type == "adjustedArray") {
                    dataString += spot.newArrayPosition.x  + "\t" + spot.newArrayPosition.y; 
                }
                else if(type == "pixel") {
                    dataString += spot.renderPosition.x + "\t" + spot.renderPosition.y;
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
