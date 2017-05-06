# -*- coding: utf-8 -*-

class Tilemap:
    """Holds the tile data"""
    tilemapLevels = [1, 2, 4, 8, 16]
    tileWidth = 256
    tileHeight = 256

    def __init__(self):
        self.tilemaps = {}

    def put_tiles_at(self, tilemap_level, tiles):
        """This takes a 2D array of tiles and inserts it into
        the tilemaps object with the tilemap level as a key.
        """
        tilemap_level = int(tilemap_level)
        self.tilemaps[tilemap_level] = tiles

    def fill_dummy_tiles(self):
        """Fills the tilemap with pre-calculated images."""
        for level in self.tilemapLevels:
            w = 20 / level
            h = 20 / level
            tiles = []
            for x in range(0, w):
                new_row = []
                for y in range(0, h):
                    string = "./img/zoom" + str(level) + "_x" + str(x) + "_y" + str(y) + ".jpg"
                    new_row.append(string)
                tiles.append(new_row)
            self.tilemaps[level] = tiles
