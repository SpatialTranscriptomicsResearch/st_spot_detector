# -*- coding: utf-8 -*-

import ast
import time

from bottle import error, get, post, response, request, route, run, static_file

from imageprocessor import ImageProcessor
from sessioncacher import SessionCacher
from spots import Spots
from tilemap import Tilemap
from PIL import Image

#######################
### ↓ server code ↓ ###
#######################

session_cacher = SessionCacher()
image_processor = ImageProcessor()

@get('/session_id')
def create_session_cache():
    new_session_id = session_cacher.create_session_cache()
    print(new_session_id[:20] + ": New session created.")
    return new_session_id

@get('/detect_spots')
def get_spots():
    session_id = request.query['session_id']
    session_cache = session_cacher.get_session_cache(session_id)
    if(session_cache is not None):
        print(session_id[:20] + ": Detecting spots.")
        # ast converts the query strings into python dictionaries
        TL_coords = ast.literal_eval(request.query['TL'])
        BR_coords = ast.literal_eval(request.query['BR'])
        array_size = ast.literal_eval(request.query['array_size'])
        brightness = float(request.query['brightness'])
        contrast = float(request.query['contrast'])
        threshold = float(request.query['threshold'])

        # converts the image into a BW thresholded image for easier
        # keypoint detection
        session_cache.image['cy3'] = image_processor.apply_BCT(
            session_cache.image['cy3'], brightness, contrast, threshold, True
        )
        keypoints = image_processor.detect_keypoints(session_cache.image['cy3'])
        spots = Spots(TL_coords, BR_coords, array_size)
        spots.create_spots_from_keypoints(keypoints, session_cache.image['cy3'])

        print(session_id[:20] + ": Spot detection finished.")
        return spots.wrap_spots()
    else:
        response.status = 400
        error_message = 'Session ID expired. Please try again.'
        print(session_id[:20] + ": Error. " + error_message)
        return error_message
    
@get('/thumbnail')
def process_thumbnail():
    brightness = float(request.query['brightness'])
    contrast = float(request.query['contrast'])
    threshold = float(request.query['threshold'])
    session_id = request.query['session_id']

    session_cache = session_cacher.get_session_cache(session_id)
    if(session_cache is not None):
        print(session_id[:20] + ": Creating thumbnail.")
        thumbnail = image_processor.process_thumbnail(session_cache.thumbnail,
                                                      brightness, contrast,
                                                      threshold)
        thumbnail = image_processor.Image_to_jpeg_URI(thumbnail)
        thumbnail_dictionary = {
            'thumbnail': thumbnail,
        }
    else:
        response.status = 400
        error_message = 'Session ID expired. Please try again.'
        print(session_id[:20] + ": Error. " + error_message)
        return error_message
    return thumbnail_dictionary

@post('/tiles')
def get_tiles():
    data = ast.literal_eval(request.body.read())
    image_string = {'cy3': data['cy3_image'], 'bf': data['bf_image']}
    session_id = data['session_id']
    session_cache = session_cacher.get_session_cache(session_id)
    if(session_cache is not None):
        valid = {}
        for key, image in image_string.items():
            valid.update({
                key: image_processor.validate_jpeg_URI(image)
            })
        # also do proper type validation here; see
        # https://zubu.re/bottle-security-checklist.html and
        # https://github.com/ahupp/python-magic
        if(valid['cy3']):
            tiles = {}
            for key, image in image_string.items():
                if not valid[key]:
                    continue

                print(session_id[:20] + ": Transforming " + key + " image.")
                image = image_processor.jpeg_URI_to_Image(image)

                # release
                image = image_processor.transform_original_image(image)

                print(session_id[:20] + ": Tiling " + key + " images.")
                tiles_ = Tilemap()
                for x in tiles_.tilemapLevels:
                    tiles_.put_tiles_at(
                        x, image_processor.tile_image(image, x))

                # debug
                #print(session_id[:20] + ": Tiling images.")
                #tiles.put_tiles_at(20, image_processor.tile_image(image, 20))

                session_cache.image[key] = image
                largest_tile = tiles_.tilemapLevels[-1]
                thumbnail = tiles_.tilemaps[largest_tile][0][0]
                thumbnail = image_processor.jpeg_URI_to_Image(thumbnail)
                session_cache.thumbnail[key] = thumbnail

                tiles.update({key: tiles_})
                print(session_id[:20] + ": Image tiling complete.")
        else:
            response.status = 400
            error_message = 'Invalid Cy3 image. Please upload a jpeg image.'
            print(session_id[:20] + ": Error. " + error_message)
            return error_message
    else:
        response.status = 400
        error_message = 'Session ID expired. Please try again.'
        print(session_id[:20] + ": Error. " + error_message)
        return error_message

    return {'cy3_tiles': tiles['cy3'].wrapped_tiles(),
            'bf_tiles': tiles['bf'].wrapped_tiles() if valid['bf'] else None}

@route('/<filepath:path>')
def serve_site(filepath):
    return static_file(filepath, root='./st_alignment')

@error(404)
def error404(error):
    return "404 Not Found"

run(host='0.0.0.0', port=8080, debug=True, reloader=True)
