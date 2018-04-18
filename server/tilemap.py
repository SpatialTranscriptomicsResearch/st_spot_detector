# -*- coding: utf-8 -*-
"""Data structure for holding tilemaps"""

from imageprocessor import tile_image

class Tilemap:
    # pylint:disable=too-few-public-methods
    """Holds the tile data"""

    def __init__(self, image, tile_width=256, tile_height=256):
        from PIL.Image import LANCZOS

        self.tilemaps = dict()
        self.tile_width, self.tile_height = tile_width, tile_height

        level = 1
        width, height = image.size
        while True:
            self.tilemaps[level] = tile_image(image, tile_width, tile_height)
            width /= 2
            height /= 2
            if width < tile_width and height < tile_height:
                break
            level *= 2
            image = image.resize((int(width), int(height)), LANCZOS)
