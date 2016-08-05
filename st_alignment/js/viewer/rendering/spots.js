(function() {

    var SpotManager = function() {
        this.arrayWidth = 33;
        this.arrayHeight = 35;
        this.spacer = {x: 330, y: 333};
        this.offset = {x: 5100, y: 4730};
        this.spots = [];
        for(var i = 0; i < this.arrayHeight; ++i) {
            for(var j = 0; j < this.arrayWidth; ++j) {
                this.spots.push({
                    'renderPosition': {x: this.spacer.x * j + this.offset.x,
                                       y: this.spacer.y * i + this.offset.y},
                    'selected': false
                });
            }
        }
    };

    SpotManager.prototype = {
    };

    this.SpotManager = SpotManager;

}).call(this);
