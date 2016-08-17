(function() {

    var self;
    var SpotManager = function() {
        self = this;
        self.spots = [];
    };

    SpotManager.prototype = {
        createSpots: function(arrayWidth, arrayHeight, spacer, offset) {
            // manual creation of 'arbitrary' spots
            var arrayWidth = arrayWidth || 33;
            var arrayHeight = arrayHeight || 35;
            var spacer = spacer || {x: 330, y: 333};
            var offset = offset || {x: 5100, y: 4730};
            for(var i = 0; i < arrayHeight; ++i) {
                for(var j = 0; j < arrayWidth; ++j) {
                    self.spots.push({
                        'arrayPosition': {x: j + 1, y: i + 1},
                        'renderPosition': {x: spacer.x * j + offset.x,
                                           y: spacer.y * i + offset.y},
                        'selected': false,
                        'size': 90
                    });
                }
            }
        },
        loadSpots: function(spotData) {
            self.spots = spotData.spots;
        },
        exportSpots: function(format) {
            var dataString = "";
            var dataType = "";

            if(format == 'json') {
                dataString = JSON.stringify(self.spots, null, '\t');
                dataType = "text/json";
            }
            else if(format == 'tsv') {
                dataString += "original_position\tnew_position\tpixel_position\n";
                for(var i = 0; i < self.spots.length; ++i) {
                    var spot = self.spots[i];
                    dataString += spot.arrayPosition.x  + "," + spot.arrayPosition.y  + "\t";
                    dataString += spot.arrayPosition.x  + "," + spot.arrayPosition.y  + "\t"; // replace this with the new position!
                    dataString += spot.renderPosition.x + "," + spot.renderPosition.y;
                    if(i != self.spots.length - 1) {
                        dataString += "\n"
                    }
                }
                dataType = "text/tsv";
            }
            return dataString;
        }
    };

    this.SpotManager = SpotManager;

}).call(this);
