'use strict';

(function() {
    var self;
    var Tilemap = function() {
        self = this;
    };

    Tilemap.prototype = {
        loadTilemap: function(tilemap, onComplete) {
            // store these variables and hold the tilemaps in an object
            self.tilemapLevels = tilemap.tilemapLevels;
            self.tilesize = Vec2.Vec2(tilemap.tileWidth, tilemap.tileHeight);
            self.tilemaps = {};

            self.rows = {};
            self.cols = {};
            // TODO: make this better
            for(var l in tilemap.tilemaps) {
                for(var t in tilemap.tilemaps[l]) {
                    if(self.rows[t] === undefined)
                        self.rows[t] = tilemap.tilemaps[l][t].length;
                    else if(self.rows[t] != tilemap.tilemaps[l][t].length)
                        throw "tile sizes differ";

                    if(self.cols[t] === undefined)
                        self.cols[t] = tilemap.tilemaps[l][t][0].length;
                    else if(self.cols[t] != tilemap.tilemaps[l][t][0].length)
                        throw "tile sizes differ";
                }
            }

            var onLoad = (function() {
                var imageCount = 0;
                for(var l in tilemap.tilemaps)
                    for(var t in tilemap.tilemaps[l])
                        imageCount += self.rows[t] * self.cols[t];
                var loadedImageCount = 0;
                return function() {
                    // we increment the loaded image count and compare it against
                    // the total, imageCount
                    loadedImageCount++;
                    if(loadedImageCount >= imageCount) {
                        // we refresh the canvas once everything is loaded
                        onComplete();
                    }
                };
            })();

            // Indices:
            // l = layer
            // t = tilemap level
            // r = image row
            // c = image col
            for(var l in tilemap.tilemaps) {
                self.tilemaps[l] = {};
                for(var t in tilemap.tilemaps[l]) {
                    var newTilemap = [];
                    for(var r = 0; r < self.rows[t]; ++r) {
                        // create empty image array as one row of the tilemap
                        var imageRow = [];
                        for(var c = 0; c < self.cols[t]; ++c) {
                            var image = new Image();
                            image.src = tilemap.tilemaps[l][t][r][c]; // this loading is asynchronous; therefore we use the image.onload callback to count how many images have been loaded, and call the onLoadCallback after they are done loading
                            // this function is called once image.src has finished loading
                            image.onload = onLoad;
                            // add the image to the row
                            imageRow.push(image);
                        }
                        // add the row to the tilemap
                        newTilemap.push(imageRow);
                    } 
                    self.tilemaps[l][t] = newTilemap;
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
            var images = {};
            for(var l in self.tilemaps) {
                images[l] = [];
                for(var i = 0; i < tilePositions.length; ++i) {
                    var tile = Vec2.Vec2(tilePositions[i].x,
                        tilePositions[i].y);
                    var image = self.tilemaps[l][tilemapLevel][tile.x][tile.y];
                    image.renderPosition = Vec2.scale(Vec2.multiply(tile,
                        self.tilesize), tilemapLevel);
                    image.scaledSize = Vec2.scale(self.tilesize, tilemapLevel);
                    images[l].push(image);
                }
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
                    if(!(xPos < 0 || xPos >= self.cols[tilemapLevel] ||
                         yPos < 0 || yPos >= self.rows[tilemapLevel])) {
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
