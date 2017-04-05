'use strict';

(function() {
    var ScaleManager = function() {
    };
  
    ScaleManager.prototype = {
        setTilemapLevels: function(tilemapLevels, tilemapLevel) {
            this.scaleLevels = this.getScaleLevels(tilemapLevels);

            /* the scale checkpoint level at which everything is rendered and scaled
               scaled around but is *not* necessarily the same as the camera scale */
            this.currentScaleLevel = 1 / tilemapLevel;
        },
        getScaleLevels: function(tilemapLevels) {
            /* the possible scale levels based on the tilemap levels; i.e.
               the scales at which the various tilemaps should be rendered */
            var scaleLevels = [];
            for(var i = 0; i < tilemapLevels.length; ++i) {
                scaleLevels.push(1 / tilemapLevels[i]);
            }
            return scaleLevels;
        },
        updateScaleLevel: function(cameraScale) {
            /* assumes no 'skipping' between scale levels, so
               may encounter some problems with fast zooming */
            var prevLevel;
            var nextLevel;
            var index = this.scaleLevels.indexOf(this.currentScaleLevel); 

            if(index != 0 && index != this.scaleLevels.length - 1) {
                prevLevel = this.scaleLevels[index - 1];
                nextLevel = this.scaleLevels[index + 1];
            }
            else if(index == 0) {
                prevLevel = this.currentScaleLevel;
                nextLevel = this.scaleLevels[index + 1];

            }
            else if(index == this.scaleLevels.length - 1) {
                prevLevel = this.scaleLevels[index - 1];
                nextLevel = this.currentScaleLevel;
            }

            if(cameraScale == this.currentScaleLevel ||
               cameraScale >  nextLevel) {
                // do nothing
            }
            if(cameraScale > this.currentScaleLevel) {
                this.currentScaleLevel = prevLevel;
            }
            else if(cameraScale <= nextLevel) {
                this.currentScaleLevel = nextLevel;
            }
        },
    };

    this.ScaleManager = ScaleManager;
  
}).call(this);
