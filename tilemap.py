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

