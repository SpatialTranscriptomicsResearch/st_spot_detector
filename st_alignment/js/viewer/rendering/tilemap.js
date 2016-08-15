'use strict';

(function() {
    var Tilemap = function(tilemapLevels) {
        this.tilemapLevels = tilemapLevels || [1, 2, 3, 5, 10, 20]; /*  1 is most zoomed in,  1:1  pixel ratio 
                                                                       20 is most zoomed out, 1:20 pixel ratio */
        this.tileWidth  = 1024;
        this.tileHeight = 1024;
        this.tilemaps = []; // array holding the tilemaps at each zoom level
        this.constructAllTilemaps = function() {
            for(var i = 0; i < this.tilemapLevels.length; ++i) {
                var level = this.tilemapLevels[i];
                this.tilemaps[level] = this.constructTilemap(level);
            }
        }
        this.constructTilemap = function(tilemapLevel) {
            /* this constructs a tilemap out of already existing
               images created by the largeImageTiler.pl script */
            var tilemap = [];
            var photoWidth  = 20000;
            var photoHeight = 20000;

            var tileMapWidth  = Math.trunc((photoWidth  / tilemapLevel) / this.tileWidth)  + 1;
            var tileMapHeight = Math.trunc((photoHeight / tilemapLevel) / this.tileHeight) + 1;

            for(var x = 0; x < tileMapWidth; ++x) {
                var imageRow = [];
                for(var y = 0; y < tileMapHeight; ++y) {
                    var image = new Image();
                    //image.src = "img/zoom" + tilemapLevel + "_x" + x + "_y" + y + ".jpg";
                    imageRow.push(image);
                }
                tilemap.push(imageRow);
            }

            tilemap.width  = tileMapWidth;
            tilemap.height = tileMapHeight;

            return tilemap;
        }
        this.constructAllTilemaps();
    };

    Tilemap.prototype = {
        getRenderableImages: function(tilePosition, tilemapLevel, radius) {
            radius = radius || 3;
            var tilePositions = this.getSurroundingTilePositions(tilePosition, tilemapLevel, radius);
            var images = this.getImagesAtTilePositions(tilePositions, tilemapLevel);
            return images;
        },
        getImagesAtTilePositions: function(tilePositions, tilemapLevel) {
            /* given a set of tile positions and a tile map level,
               the relevant images are returned from the tile map */
            var images = [];
            for(var i = 0; i < tilePositions.length; ++i) {
                var tileX = tilePositions[i].x;
                var tileY = tilePositions[i].y;
                var image = this.tilemaps[tilemapLevel][tileX][tileY];

                image.renderPosition = {x: (tileX * this.tileWidth)  * tilemapLevel,
                                        y: (tileY * this.tileHeight) * tilemapLevel};
                image.scaledSize = {x: this.tileWidth  * tilemapLevel,
                                    y: this.tileHeight * tilemapLevel};
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
                    if(!(xPos < 0 || xPos >= this.tilemaps[tilemapLevel].width ||
                         yPos < 0 || yPos >= this.tilemaps[tilemapLevel].height)) {
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
            var tileSizeInImageCoords = {x: this.tileWidth * tilemapLevel,
                                         y: this.tileHeight * tilemapLevel};
            var tileX = Math.trunc(imagePosition.x / tileSizeInImageCoords.x);
            var tileY = Math.trunc(imagePosition.y / tileSizeInImageCoords.y);
            return {x: tileX, y: tileY};
        }
    };

    this.Tilemap = Tilemap;
  
}).call(this);
