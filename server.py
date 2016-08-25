#!/usr/bin/python
# -*- coding: utf-8 -*-

import base64
import io
import json
import time

from bottle import error, get, post, response, request, route, run, static_file
import cv2
import numpy
from PIL import Image, ImageOps

from spots import Spots

class Tilemap:
    """Holds the tile data"""
    # everything is wrapped in a dict to make it easier
    # to return from a GET request in a JSON data format
    dict_wrapper = {
        'tilemapLevels': [1, 2, 3, 5, 10, 20],
        'tileWidth': 1000,
        'tileHeight': 1000,
        'tilemaps': {}
    }

    def put_tiles_at(self, tilemap_level, tiles):
        """This takes a 2D array of tiles and inserts it into
        the tilemaps object with the tilemap level as a key.
        """
        tilemap_level = int(tilemap_level)
        self.dict_wrapper['tilemaps'][tilemap_level] = tiles

class ImageProcessor:
    """Takes the jpeg image and performs various methods on it."""
    # look into implementing this https://www.learnopencv.com/blob-detection-using-opencv-python-c/
    URI_header = b'data:image/jpeg;base64,'

    def validate_jpeg_URI(self, jpeg_URI):
        """Checks that it is a valid base64-encoded jpeg URI."""
        valid = (jpeg_URI.find(self.URI_header) == 0)
        return valid

    def jpeg_URI_to_Image(self, jpeg_URI):
        """Take a jpeg base64-encoded URI and return a PIL Image object."""
        # remove 'data:image/jpeg;base64,' and decode the string
        jpeg_data = base64.b64decode(jpeg_URI[23:])
        # stream the data as a bytes object and open as an image
        image = Image.open(io.BytesIO(jpeg_data))
        return image

    def Image_to_jpeg_URI(self, image):
        """Take a PIL Imag eobject and return a jpeg base64-encoded URI."""
        # save the image to a byte stream encoded as jpeg
        jpeg_data = io.BytesIO()
        image.save(jpeg_data, 'JPEG')

        # encode the data into a URI with the header added
        jpeg_string = base64.b64encode(jpeg_data.getvalue())
        jpeg_string = self.URI_header + jpeg_string

        # convert the string from a raw literal to utf-8 encoding
        jpeg_string = unicode(jpeg_string, 'utf-8')
        return jpeg_string


    def tile_image_dummy(self, image, tilemap_level):
        """Function included for debugging purposes to avoid waiting times"""
        tiles = []

        photoWidth = image.size[0]
        photoHeight = image.size[1]
        tileWidth = 1024;
        tileHeight = 1024;

        tilemapWidth = int((photoWidth / tilemap_level) / tileWidth) + 1
        tilemapHeight = int((photoHeight / tilemap_level) / tileHeight) + 1

        image = image.resize((tileWidth, tileHeight))

        for x in range(0, tilemapHeight):
            new_row = []
            for y in range(0, tilemapWidth):
                new_row.append(self.Image_to_jpeg_URI(image))
            tiles.append(new_row)

        return tiles

    def tile_image(self, image, tilemap_level):
        """Takes a jpeg image, scales its size down and splits it up 
        into tiles, the amount depends on the "level" of tile splitting.

        A 2D array of tiles is returned.
        """
        tiles = []

        photoWidth = image.size[0]
        photoHeight = image.size[1]
        tileWidth = 1024;
        tileHeight = 1024;

        tilemapWidth = int((photoWidth / tilemap_level) / tileWidth) + 1
        tilemapHeight = int((photoHeight / tilemap_level) / tileHeight) + 1

        print("Working on zoom out level %s, with a tilemap size of %s, %s."
            % (tilemap_level, tilemapWidth, tilemapHeight)
        )

        if(tilemap_level != 1):
            newPhotoWidth = int(photoWidth / tilemap_level)
            newPhotoHeight = int(photoHeight / tilemap_level)
            print("Resizing the large image file to a size of %s, %s"
                % (newPhotoWidth, newPhotoHeight)
            )
            image = image.resize((newPhotoWidth, newPhotoHeight))

        for x in range(0, tilemapHeight):
            new_row = []
            for y in range(0, tilemapWidth):
                widthOffset = tileWidth * x
                heightOffset = tileHeight * y

                print("Processing tile %d, %d" % (x, y))

                image_tile = image.crop((
                    widthOffset, 
                    heightOffset, 
                    widthOffset + tileWidth, 
                    heightOffset + tileHeight
                ))

                new_row.append(self.Image_to_jpeg_URI(image_tile))
            print("Appending row %d to the tiles array" % x)
            tiles.append(new_row)

        return tiles

    def keypoints_from_image(self, image):
        PIL_image = ImageOps.invert(image)
        PIL_image.save("out.jpg", 'JPEG')

        cv2_image = cv2.imread("out.jpg", cv2.IMREAD_GRAYSCALE)
        params = cv2.SimpleBlobDetector_Params()

        # these values seem good "for now"
        params.thresholdStep = 5.0
        params.minThreshold = 170.0
        params.maxThreshold = params.minThreshold + 50.0;

        params.filterByArea = True
        params.minArea = 15000
        params.maxArea = 35000

        detector = cv2.SimpleBlobDetector_create(params)
        keypoints = detector.detect(cv2_image)
        print("number of keypoints detected: " + str(len(keypoints)))

        return keypoints

#######################
### ↓ server code ↓ ###
#######################

spots = Spots()
tiles = Tilemap()
image_processor = ImageProcessor()

@get('/spot_coordinates')
def set_spot_coordinates():
    TL_coords = {
        'x': request.query['TL']['x'],
        'y': request.query['TL']['y']
    }
    BR_coords = {
        'x': request.query['BR']['x'],
        'y': request.query['BR']['y']
    }
    array_size = {
        'x': request.query['array_size']['x'],
        'y': request.query['array_size']['y']
    }
    spots.set_array_size(array_size)
    spots.set_coords(TL_coords, BR_coords)

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
