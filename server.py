#!/usr/bin/python
# -*- coding: utf-8 -*-

import ast
import time

from bottle import error, get, post, response, request, route, run, static_file

from spots import Spots
from tilemap import Tilemap
from imageprocessor import ImageProcessor
from PIL import Image

class ImageHolder:
    image_loaded = False
    image = None

#######################
### ↓ server code ↓ ###
#######################

spots = Spots()
tiles = Tilemap()
image_processor = ImageProcessor()
image = ImageHolder()

@post('/dummy_image')
def receive_dummy_image():
    # we want these three objects to be reinitialised every time a new image is chosen
    spots = Spots()
    tiles = Tilemap()
    image_processor = ImageProcessor()
    tiles.fill_dummy_tiles()
    image_string = request.body.read()
    image.image = image_processor.jpeg_URI_to_Image(image_string)
    image.image_loaded = True
    return
    

@get('/detect_spots')
def get_spots():
    timer_start = time.time()
    # ast converts the query strings into python dictionaries
    TL_coords = ast.literal_eval(request.query['TL'])
    BR_coords = ast.literal_eval(request.query['BR'])
    array_size = ast.literal_eval(request.query['arraySize'])
    brightness = int(request.query['brightness'])
    contrast = int(request.query['contrast'])
    threshold = int(request.query['threshold'])

    if(image.image_loaded):
        image.image = image_processor.process_image(image.image, brightness, contrast, threshold)
        spots.keypoints = image_processor.keypoints_from_image(image.image)
        spots.create_spots_from_keypoints(array_size, TL_coords, BR_coords)

    print("Spot detection took:")
    print(time.time() - timer_start)
    print("sending: " + str(len(spots.get_spots()['spots'])) + " spots")
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
    # we want these three objects to be reinitialised every time a new image is chosen
    spots = Spots()
    tiles = Tilemap()
    image_processor = ImageProcessor()

    image_string = request.body.read()
    valid = image_processor.validate_jpeg_URI(image_string)
    if(valid):
        image.image = image_processor.jpeg_URI_to_Image(image_string)
        for x in tiles.dict_wrapper['tilemapLevels']:
            tiles.put_tiles_at(x, image_processor.tile_image(image.image, x))
        image.image_loaded = True
        return
    else:
        response.status = 400
        return 'Invalid image. Please upload a jpeg image.'

@error(404)
def error404(error):
    return "404 Not Found"

run(host='localhost', port=8081, debug=True, reloader=True)
