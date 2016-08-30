(function() {

    var self;
    var SpotManager = function(camera) {
        self = this;
        self.spots = [];
        self.spacer = {};
        self.TL = {};
    };

    SpotManager.prototype = {
        loadSpots: function(spotData) {
            self.spots = spotData.spots;
            self.spacer = spotData.spacer;
        },
        exportSpots: function(format) {
            var dataString = "";

            if(format == 'json') {
                dataString = JSON.stringify(self.spots, null, '\t');
            }
            else if(format == 'tsv') {
                dataString += "original_position\tnew_position\tpixel_position\n";
                for(var i = 0; i < self.spots.length; ++i) {
                    var spot = self.spots[i];
                    dataString += spot.arrayPosition.x  + "," + spot.arrayPosition.y  + "\t";
                    dataString += spot.newArrayPosition.x  + "," + spot.newArrayPosition.y  + "\t"; 
                    dataString += spot.renderPosition.x + "," + spot.renderPosition.y;
                    if(i != self.spots.length - 1) {
                        dataString += "\n"
                    }
                }
            }
            return dataString;
        }
    };

    this.SpotManager = SpotManager;

}).call(this);
