#!/usr/bin/env python3

import base64
import io
import json
import time
from bottle import error, get, post, request, route, run, static_file
from PIL import Image

class Spots:
    """Holds the spot data"""
    spots = {
        'kalle': 123,
        'nalle': 234,
        'falle': 345
    }

class Tiles:
    """Holds the tile data"""
    tiles = {
        'level_1': {
            'kex': 1567,
            'mex': 1678,
            'tex': 1789
        },
        'level_2': {
            'kex': 2567,
            'mex': 2678,
            'tex': 2789
        },
        'level_3': {
            'kex': 3567,
            'mex': 3678,
            'tex': 3789
        },
        'level_5': {
            'kex': 5567,
            'mex': 5678,
            'tex': 5789
        },
        'level_10': {
            'kex': 10567,
            'mex': 10678,
            'tex': 10789
        },
        'level_20': {
            'kex': 20567,
            'mex': 20678,
            'tex': 20789
        },
    }

class ImageProcessor:
    """Takes the jpeg image and performs various methods on it"""

    def process_image(self, jpeg_data):
        """Process the jpeg data and return the processed data"""
        # import
        my_image = Image.open(jpeg_data)

        # processing
        my_image = my_image.resize((1024, 1024))

        # export
        export_bytes = io.BytesIO()
        my_image.save(export_bytes, 'JPEG')
        return export_bytes.getbuffer()

    def jpeg_bytes_to_URI(self, jpeg_data):
        """Take jpeg data and return it as a base64-encoded URI"""
        jpeg_string = base64.b64encode(jpeg_data)
        jpeg_string = b'data:image/jpeg;base64,' + jpeg_string
        jpeg_string = str(jpeg_string, 'utf-8')
        return jpeg_string

    def URI_to_jpeg_bytes(self, jpeg_URI):
        """Take a jpeg base64-encoded URI and return it as byte data"""
        # remove 'data:image/jpeg;base64,'
        image_bytes = base64.b64decode(jpeg_URI[23:])
        return image_bytes

spots = Spots()
tiles = Tiles()
image_processor = ImageProcessor()

#######################
### ↓ server code ↓ ###
#######################

@get('/spots')
def get_spots():
    return spots.spots
    
@get('/tiles/')
def get_tiles():
    return tiles.tiles

@get('/tiles/<level:int>')
def get_tiles_at(level=1):
    level_string = "level_" + str(level)
    return tiles.tiles[level_string]
    
@route('/<filepath:path>')
def serve_site(filepath):
    return static_file(filepath, root='./st_alignment')

@post('/<filepath:path>') # the argument should possibly be different
def receive_image(filepath):
    image_string = request.body.read()
    image_bytes = image_processor.URI_to_jpeg_bytes(image_string)
    processed_image = image_processor.process_image(io.BytesIO(image_bytes))
    processed_image = image_processor.jpeg_bytes_to_URI(processed_image)
    return processed_image

@error(404)
def error404(error):
    return "404 Not Found"

run(host='localhost', port=8081, debug=True, reloader=True)
