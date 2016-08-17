'use strict';

(function() {
    var self;
    var Tilemap = function(tilemapLevels) {
        self = this;
        self.loadTilemap = function(tilemap) {
            self.tilemapLevels = tilemap.tilemapLevels;
            self.tileWidth  = tilemap.tileWidth;
            self.tileHeight = tilemap.tileHeight;
            self.tilemaps = {};
            for(var tilemapLevel in tilemap.tilemaps) {
                if(tilemap.tilemaps.hasOwnProperty(tilemapLevel)) {
                    var newTilemap = [];
                    for(var i = 0; i < tilemap.tilemaps[tilemapLevel].length; ++i) {
                        var imageRow = [];
                        for(var j = 0; j < tilemap.tilemaps[tilemapLevel][i].length; ++j) {
                            var image = new Image();
                            image.src = tilemap.tilemaps[tilemapLevel][i][j]; 
                            imageRow.push(image);
                        }
                        newTilemap.push(imageRow);
                    }
                    self.tilemaps[tilemapLevel] = newTilemap;
                } 
            }

        }
    };

    Tilemap.prototype = {
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
                var tileX = tilePositions[i].x;
                var tileY = tilePositions[i].y;
                var image = self.tilemaps[tilemapLevel][tileX][tileY]; 

                image.renderPosition = {x: (tileX * self.tileWidth)  * tilemapLevel,
                                        y: (tileY * self.tileHeight) * tilemapLevel};
                image.scaledSize = {x: self.tileWidth  * tilemapLevel,
                                    y: self.tileHeight * tilemapLevel};
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
                        positions.push({x: xPos, y: yPos});
                        ++i;
                    }
                }
            }
            return positions;
        },
        getTilePosition: function(imagePosition, tilemapLevel) {
            /* calculates the tile position from a given image
               position, i.e. converts image to tile coordinates */
            var tileSizeInImageCoords = {x: self.tileWidth * tilemapLevel,
                                         y: self.tileHeight * tilemapLevel};
            var tileX = Math.trunc(imagePosition.x / tileSizeInImageCoords.x);
            var tileY = Math.trunc(imagePosition.y / tileSizeInImageCoords.y);
            return {x: tileX, y: tileY};
        }
    };

    this.Tilemap = Tilemap;
  
}).call(this);
