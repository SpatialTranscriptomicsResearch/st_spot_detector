# -*- coding: utf-8 -*-

class Tilemap:
    """Holds the tile data"""
    # everything is wrapped in a dict to make it easier
    # to return from a GET request in a JSON data format
    dict_wrapper = {
        'tilemapLevels': [1, 2, 3, 5, 10, 20],
        # do not change these two tileWidth and tileHeight values:
        # can lead to offset point rendering and bad quality images etc.
        # a fix would be nice!
        'tileWidth': 1024,
        'tileHeight': 1024,
        'tilemaps': {}
    }

    def put_tiles_at(self, tilemap_level, tiles):
        """This takes a 2D array of tiles and inserts it into
        the tilemaps object with the tilemap level as a key.
        """
        tilemap_level = int(tilemap_level)
        self.dict_wrapper['tilemaps'][tilemap_level] = tiles

    def fill_dummy_tiles(self):
        """Fills the tilemap with pre-calculated images."""
        for level in self.dict_wrapper['tilemapLevels']:
            w = 20 / level
            h = 20 / level
            tiles = []
            for x in range(0, w):
                new_row = []
                for y in range(0, h):
                    string = "./img/zoom" + str(level) + "_x" + str(x) + "_y" + str(y) + ".jpg"
                    new_row.append(string)
                tiles.append(new_row)
            self.dict_wrapper['tilemaps'][level] = tiles
