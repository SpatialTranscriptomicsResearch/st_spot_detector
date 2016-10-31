(function() {

    var self;
    var SpotManager = function(camera) {
        self = this;
        self.spots = [];
        self.spacer = {};
        self.spotToAdd = {
            renderPosition: Vec2.Vec2(0, 0)
        };
    };

    SpotManager.prototype = {
        loadSpots: function(spotData) {
            self.spots = spotData.spots;
            self.spacer = spotData.spacer;
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
