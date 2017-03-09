# -*- coding: utf-8 -*-

class Tilemap:
    """Holds the tile data"""

    def __init__(self):
        # everything is wrapped in a dict to make it easier
        # to return from a GET request in a JSON data format
        self.tilemapLevels = [1, 2, 3, 5, 10, 20]
        # do not change these two tileWidth and tileHeight values:
        # can lead to offset point rendering and bad quality images etc.
        # a fix would be nice!
        # self.tileWidth = 256
        # self.tileHeight = 256
        self.tilemaps = {}

    def wrapped_tiles(self):
        # dict_wrapper = {
        #     'tilemapLevels': self.tilemapLevels,
        #     'tileWidth': self.tileWidth,
        #     'tileHeight': self.tileHeight,
        #     'tilemaps': self.tilemaps
        # }
        # return dict_wrapper
        return self.tilemaps

    def put_tiles_at(self, tilemap_level, tiles, layer='default'):
        """This takes a 2D array of tiles and inserts it into
        the tilemaps object with the tilemap level as a key.
        """
        if self.tilemaps.get(layer) is None:
            self.tilemaps[layer] = {}
        self.tilemaps[layer][int(tilemap_level)] = tiles

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
