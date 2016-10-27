'use strict';

(function() {
    var self;
    var Tilemap = function() {
        self = this;
    };

    Tilemap.prototype = {
        loadTilemap: function(tilemap, onLoadCallback) {
            // these two variables are used to check for async image loading status
            var imageCount = 0;
            var loadedImageCount = 0;

            // store these variables and hold the tilemaps in an object
            self.tilemapLevels = tilemap.tilemapLevels;
            self.tilesize = Vec2.Vec2(tilemap.tileWidth, tilemap.tileHeight);
            self.tilemaps = {};

            // iterate through all the tilemap levels in the loaded tilemap
            for(var tilemapLevel in tilemap.tilemaps) {
                // only count them if they are not part of the prototype (JS necessity)
                if(tilemap.tilemaps.hasOwnProperty(tilemapLevel)) {
                    // create empty tilemap array to fill with a 2D tilemap
                    var newTilemap = [];
                    for(var i = 0; i < tilemap.tilemaps[tilemapLevel].length; ++i) {
                        // create empty image array as one row of the tilemap
                        var imageRow = [];
                        for(var j = 0; j < tilemap.tilemaps[tilemapLevel][i].length; ++j) {
                            // increment the image counter
                            imageCount++;
                            var image = new Image();
                            image.src = tilemap.tilemaps[tilemapLevel][i][j]; // this loading is asynchronous; therefore we use the image.onload callback to count how many images have been loaded, and call the onLoadCallback (which calls refreshCanvas()) after they are done loading
                            // this function is called once image.src has finished loading
                            image.onload = function() {
                                // we increment the loaded image count and compare it against the imageCount
                                // note: it is possible that an image finished loading before all the imageCounts are incremented,
                                // but this is a non-critical operation and will not break things if this happens
                                loadedImageCount++;
                                if(loadedImageCount >= imageCount) {
                                    // we refresh the canvas once everything is loaded
                                    onLoadCallback();
                                }
                            };
                            // add the image to the row
                            imageRow.push(image);
                        }
                        // add the row to the tilemap
                        newTilemap.push(imageRow);
                    }
                    self.tilemaps[tilemapLevel] = newTilemap;
                } 
            }
        },
        getRenderableImages: function(tilePosition, tilemapLevel, radius) {
            radius = radius || 3;
            var tilePositions = self.getSurroundingTilePositions(tilePosition, tilemapLevel, radius);
            var images = self.getImagesAtTilePositions(tilePositions, tilemapLevel);
            return images;
        },
        getImagesAtTilePositions: function(tilePositions, tilemapLevel) {
            /* given a set of tile positions and a tile map level,
               the relevant images are returned from the tile map */
            var images = [];
            for(var i = 0; i < tilePositions.length; ++i) {
                var tile = Vec2.Vec2(tilePositions[i].x, tilePositions[i].y);
                var image = self.tilemaps[tilemapLevel][tile.x][tile.y]; 

                image.renderPosition = Vec2.scale(Vec2.multiply(tile, self.tilesize), tilemapLevel);
                image.scaledSize = Vec2.scale(self.tilesize, tilemapLevel);
                images.push(image);
            }
            return images;
        },
        getSurroundingTilePositions: function(tilePosition, tilemapLevel, radius) {
            /* given a specific tile position, the surrounding valid
               tile positions within a certain radius are returned.
               the radius variable includes the centre tile position */
            radius = radius || 3;
            var positions = [];
            var negBoundary = 1 - radius;
            var posBoundary = 0 + radius;
            var i = 0;
            for(var y = negBoundary; y < posBoundary; ++y) {
                for(var x = negBoundary; x < posBoundary; ++x) {
                    var xPos = tilePosition.x + x;
                    var yPos = tilePosition.y + y;
                    // make sure it is a valid tile
                    var tilemapHeight = self.tilemaps[tilemapLevel][0].length;
                    var tilemapWidth  = self.tilemaps[tilemapLevel].length;
                    if(!(xPos < 0 || xPos >= tilemapWidth ||
                         yPos < 0 || yPos >= tilemapHeight)) {
                        positions.push(Vec2.Vec2(xPos, yPos));
                        ++i;
                    }
                }
            }
            return positions;
        },
        getTilePosition: function(imagePosition, tilemapLevel) {
            /* calculates the tile position from a given image
               position, i.e. converts image to tile coordinates */
            var tileSizeInImageCoords = Vec2.scale(self.tilesize, tilemapLevel);
            var tilePos = Vec2.truncate(Vec2.divide(imagePosition, tileSizeInImageCoords));
            return tilePos;
        }
    };

    this.Tilemap = Tilemap;
  
}).call(this);
