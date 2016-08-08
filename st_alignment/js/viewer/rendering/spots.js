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
            var file;
            if(format == 'csv') {
            }
            else if(format == 'tsv') {
            }
            else if(format == 'json') {
            }
            var data = "{name: 'Bob', occupation: 'Plumber'}";
            var url = 'data:text/json;charset=utf8,' + encodeURIComponent(data);
            window.open(url, '_blank');
            window.focus();
            return file;
        }
    };

    this.SpotManager = SpotManager;

}).call(this);
