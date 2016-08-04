(function() {

    var SpotManager = function() {
        this.arrayWidth = 33;
        this.arrayHeight = 35;
        this.spacer = [330, 333];
        this.offset = [5100, 4730];
        this.spots = [];
        for(var i = 0; i < this.arrayHeight; ++i) {
            for(var j = 0; j < this.arrayWidth; ++j) {
                this.spots.push({
                    'renderPosition': [this.spacer[0] * j + this.offset[0], this.spacer[1] * i + this.offset[1]]
                });
            }
        }
    };

    SpotManager.prototype = {
    };

    this.SpotManager = SpotManager;

}).call(this);
