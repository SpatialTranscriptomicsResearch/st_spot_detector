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
            self.spots = spotData;
        },
        exportSpots: function(format) {
            var filename = "spot_data-" + new Date().toISOString().slice(0, 10) + "." + format;
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

            // the next 12 lines are adapted from https://github.com/mholt/PapaParse/issues/175
            var blob = new Blob([dataString]);
            if (window.navigator.msSaveOrOpenBlob)  // IE hack; see http://msdn.microsoft.com/en-us/library/ie/hh779016.aspx
                window.navigator.msSaveBlob(blob, filename);
            else
            {
                var a = window.document.createElement("a");
                a.href = window.URL.createObjectURL(blob, {type: dataType});
                a.download = filename;
                document.body.appendChild(a);
                a.click();  // IE: "Access is denied"; see: https://connect.microsoft.com/IE/feedback/details/797361/ie-10-treats-blob-url-as-cross-origin-and-denies-access
                document.body.removeChild(a);
            }
        }
    };

    this.SpotManager = SpotManager;

}).call(this);
