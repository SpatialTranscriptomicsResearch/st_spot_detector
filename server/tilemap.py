# -*- coding: utf-8 -*-
"""Data structure for holding tilemaps"""

from imageprocessor import tile_image

class Tilemap:
    # pylint:disable=too-few-public-methods
    """Holds the tile data"""

    def __init__(self, image, tile_width=256, tile_height=256):
        self.tilemaps = dict()
        self.tile_width, self.tile_height = tile_width, tile_height

        level = 1
        width, height = image.width, image.height
        while width > tile_width or height > tile_height:
            self.tilemaps[level] = tile_image(
                image, level, tile_width, tile_height)
            level *= 2
            width /= 2
            height /= 2
