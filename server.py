#!/usr/bin/env python3

import base64
import io
import json
import time
from bottle import error, get, post, response, request, route, run, static_file
from PIL import Image

class Spots:
    """Holds the spot data"""
    spots = []

    def create_spots(self):
        """temporary function manually creates some 'arbitrary' spots"""
        arrayWidth = 33;
        arrayHeight = 35;
        spacer = {'x': 330, 'y': 333};
        offset = {'x': 5100, 'y': 4730};
        for i in range(0, arrayHeight):
            for j in range(0, arrayWidth):
                self.spots.append({
                    'arrayPosition': {'x': j + 1, 'y': i + 1},
                    'renderPosition': {'x': spacer['x'] * j + offset['x'],
                                       'y': spacer['y'] * i + offset['y']},
                    'selected': False,
                    'size': 90
                });
        spot_dictionary = {'spots': self.spots}
        return spot_dictionary

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
    URI_header = b'data:image/jpeg;base64,'

    def validate_jpeg_URI(self, jpeg_URI):
        """Checks that it is a valid base64-encoded jpeg URI"""
        valid = (jpeg_URI.find(self.URI_header) == 0)
        return valid

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
        jpeg_string = self.URI_header + jpeg_string
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
    return spots.create_spots()
    
@get('/tiles')
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
    valid = image_processor.validate_jpeg_URI(image_string)
    if(valid):
        image_bytes = image_processor.URI_to_jpeg_bytes(image_string)
        processed_image = image_processor.process_image(io.BytesIO(image_bytes))
        processed_image = image_processor.jpeg_bytes_to_URI(processed_image)
        return processed_image
    else:
        response.status = 400
        return 'Invalid image. Please upload a jpeg image.'

@error(404)
def error404(error):
    return "404 Not Found"

run(host='localhost', port=8081, debug=True, reloader=True)
