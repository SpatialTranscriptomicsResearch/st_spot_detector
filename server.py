#!/usr/bin/python
# -*- coding: utf-8 -*-

import ast
import time

from bottle import error, get, post, response, request, route, run, static_file

from spots import Spots
from tilemap import Tilemap
from imageprocessor import ImageProcessor

#######################
### ↓ server code ↓ ###
#######################

spots = Spots()
tiles = Tilemap()
image_processor = ImageProcessor()

@get('/detect_spots')
def set_spot_coordinates():
    # ast converts the query strings into python dictionaries
    TL_coords = ast.literal_eval(request.query['TL'])
    BR_coords = ast.literal_eval(request.query['BR'])
    array_size = ast.literal_eval(request.query['arraySize'])
    spots.set_array_size(array_size)
    spots.set_coords(TL_coords, BR_coords)
    print("Received GET request")
    print(TL_coords)
    print(BR_coords)
    print(array_size)

@get('/spots')
def get_spots():
    spots.create_spots_from_keypoints()
    return spots.get_spots()
    
@get('/tiles')
def get_tiles():
    return tiles.dict_wrapper

@get('/tiles/<level:int>')
def get_tiles_at(level=1):
    level_string = "level_" + str(level)
    return tiles.dict_wrapper['tilemaps'][level_string]
    
@route('/<filepath:path>')
def serve_site(filepath):
    return static_file(filepath, root='./st_alignment')

@post('/<filepath:path>') # the argument should possibly be different
def receive_image(filepath):
    image_string = request.body.read()
    valid = image_processor.validate_jpeg_URI(image_string)
    if(valid):
        timer_start = time.time()
        my_image = image_processor.jpeg_URI_to_Image(image_string)
        for x in tiles.dict_wrapper['tilemapLevels']:
            tiles.put_tiles_at(x, image_processor.tile_image(my_image, x))
            #tiles.put_tiles_at(x, image_processor.tile_image_dummy(my_image, 20))
        
        spots.keypoints = image_processor.keypoints_from_image(my_image)

        print(time.time() - timer_start)
        return
    else:
        response.status = 400
        return 'Invalid image. Please upload a jpeg image.'

@error(404)
def error404(error):
    return "404 Not Found"

run(host='localhost', port=8081, debug=True, reloader=True)
