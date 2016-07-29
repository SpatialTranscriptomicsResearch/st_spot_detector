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
                    image.src = "img/zoom" + tilemapLevel + "_x" + x + "_y" + y + ".jpg";
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
                var tileX = tilePositions[i][0];
                var tileY = tilePositions[i][1];
                var image = this.tilemaps[tilemapLevel][tileX][tileY];

                image.renderPosition = [(tileX * this.tileWidth) * tilemapLevel, (tileY * this.tileHeight) * tilemapLevel];
                image.scaledSize = [this.tileWidth * tilemapLevel, this.tileHeight * tilemapLevel];
                images.push(image);
            }
            return images;
        },
        getSurroundingTilePositions: function(tilePosition, tilemapLevel, radius) {
            /* given a specific tile position, the surrounding valid
               tile positions within a certain radius are returned.
               the radius variable includes the centre tile position */
            console.log("getting surrounding tiles at level " + tilemapLevel);
            radius = radius || 3;
            console.log('radius is: ' + radius);
            var positions = [];
            var negBoundary = 1 - radius;
            var posBoundary = 0 + radius;
            var i = 0;
            for(var y = negBoundary; y < posBoundary; ++y) {
                for(var x = negBoundary; x < posBoundary; ++x) {
                    var xPos = tilePosition[0] + x;
                    var yPos = tilePosition[1] + y;
                    // make sure it is a valid tile
                    if(!(xPos < 0 || xPos >= this.tilemaps[tilemapLevel].width ||
                         yPos < 0 || yPos >= this.tilemaps[tilemapLevel].height)) {
                        console.log(i + ": adding tile " + xPos + ", " + yPos);
                        positions.push([xPos, yPos]);
                        ++i;
                    }
                }
            }
            return positions;
        },
        getTilePosition: function(imagePosition, tilemapLevel) {
            /* calculates the tile position from a given image
               position, i.e. converts image to tile coordinates */
            console.log("imagepos " + imagePosition[0] + ", " + imagePosition[1]);
            console.log(tilemapLevel);
            var tileSizeInImageCoords = [this.tileWidth * tilemapLevel, this.tileHeight * tilemapLevel];
            console.log(tileSizeInImageCoords);
            var x = Math.trunc(imagePosition[0] / tileSizeInImageCoords[0]);
            var y = Math.trunc(imagePosition[1] / tileSizeInImageCoords[1]);
            console.log("tile " + x + ", " + y);
            return [x, y];
        }
    };

    this.Tilemap = Tilemap;
  
}).call(this);
