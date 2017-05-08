import Vec2 from './vec2';

const SpotManager = (function() {

    var self;
    var SpotManager = function(camera) {
        self = this;
        self.spots = [];
        // the spots located under the tissue (relevant only if an HE image has been uploaded)
        self.tissueSpots = [];
        self.spacer = {};
        self.average = {};
        self.scalingFactor;
        self.transformMatrix;
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
            self.average.diameter = (([n, s]) => s / n)(
                _.reduce(
                    _.map(self.spots, x => x.diameter),
                    ([n, s], x) => [n + 1, s + x], [0, 0],
                ),
            );
            // the 3x3 affine transformation matrix between the adjusted array and pixel coordinates
            // represented as a string in the format a11 a12 a13 a21 a22 a23 a31 a32 a33
            self.transformMatrix = spotData.transform_matrix;
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
        exportSpots: function(type, selection, transformation) {
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
                    let position = spot.renderPosition;
                    if (transformation !== undefined) {
                        position = mulVec2(transformation, position);
                    }
                    position = Vec2.scale(position, self.scalingFactor);
                    position = Vec2.map(position, Math.round);
                    dataString += position.x + "\t" + position.y;
                }
                if(selection == 'all') {
                    // we add a bool 0 or 1, depending on whether the spot is selected or not
                    var selected = spot.selected ? "\t1" : "\t0";
                    dataString += selected;
                }
                if(i != self.spots.length - 1) {
                    dataString += "\n"
                }
            }
            return dataString;
        }
    };

    return SpotManager;

}());

export default SpotManager;
