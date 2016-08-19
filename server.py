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
        jpeg_string = base64.b64encode(jpeg_data.getbuffer())
        jpeg_string = self.URI_header + jpeg_string

        # convert the string from a raw literal to utf-8 encoding
        jpeg_string = str(jpeg_string, 'utf-8')
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

#######################
### ↓ server code ↓ ###
#######################

spots = Spots()
tiles = Tilemap()
image_processor = ImageProcessor()

@get('/spots')
def get_spots():
    return spots.create_spots()
    
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
            #tiles.put_tiles_at(x, image_processor.tile_image(my_image, x))
            tiles.put_tiles_at(x, image_processor.tile_image_dummy(my_image, 20))

        print(time.time() - timer_start)
        return
    else:
        response.status = 400
        return 'Invalid image. Please upload a jpeg image.'

@error(404)
def error404(error):
    return "404 Not Found"

run(host='localhost', port=8081, debug=True, reloader=True)
