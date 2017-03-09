# -*- coding: utf-8 -*-

import ast
import time

import numpy as np

import bottle
from bottle import BaseRequest, error, get, post, response, request, route, \
    run, static_file

from imageprocessor import ImageProcessor
from sessioncacher import SessionCacher
from spots import Spots
from tilemap import Tilemap
from PIL import Image

from tissue_recognition import recognize_tissue, get_binary_mask, free

#######################
### ↓ server code ↓ ###
#######################

# Increases the request limit to 1 MB.
# Avoids server throwing 403 error when posting to /select_spots_inside
BaseRequest.MEMFILE_MAX = 1024 * 1024

session_cacher = SessionCacher()
image_processor = ImageProcessor()

app = application = bottle.Bottle()

@app.get('/session_id')
def create_session_cache():
    new_session_id = session_cacher.create_session_cache()
    print(new_session_id[:20] + ": New session created.")
    return new_session_id

@app.get('/detect_spots')
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

@app.post('/select_spots_inside')
def select_spots_inside():
    data = request.json

    spots = data['spots']
    if spots is None:
        response.status = 400
        error_message = 'Could not read spot data.'
        print(session_id[:20] + ": Error. " + error_message)
        return error_message

    session_id = data['session_id']
    session_cache = session_cacher.get_session_cache(session_id)
    if session_cache is None:
        response.status = 400
        error_message = 'Session ID expired. Please try again.'
        print(session_id[:20] + ": Error. " + error_message)
        return error_message

    image = session_cache.image['he']
    if image is None:
        response.status = 500
        error_message = 'Image cache is empty.'
        print(session_id[:20] + ": Error. " + error_message)
        return error_message

    # Downsample to max 500x500
    max_size = np.array([500] * 2, dtype=float)
    ratio = min(min(max_size / image.size), 1)
    new_size = [ratio * s for s in image.size]

    image = image.copy()
    image.thumbnail(new_size, Image.ANTIALIAS)

    # Convert image to numpy matrix and preallocate the mask matrix
    image = np.array(image, dtype=np.uint8)
    mask = np.zeros(image.shape[0:2], dtype=np.uint8)

    print(session_id[:20] + ": Running tissue recognition")
    recognize_tissue(image, mask)

    mask = get_binary_mask(mask)

    def inner_bounds(center, radius):
        return [int(k * np.floor(radius + k * center)) for k in (-1, 1)]

    def set_selection(spot):
        # Do not deselect already selected spots
        if spot['selected']:
            return

        coords, diam = [[ratio*c for c in coords] for coords in (
            spot.get('renderPosition').values(), [spot.get('diameter')])]
        radius = diam[0] / 2

        # Select spot if any pixel within its inner bounds is in the tissue
        # mask
        r_min, r_max = inner_bounds(coords[0], radius)
        for r in range(r_min, r_max + 1):
            c_min, c_max = inner_bounds(
                coords[1], np.sqrt(radius ** 2 - (r - coords[0]) ** 2))
            for c in range(c_min, c_max + 1):
                if mask[r, c]:
                    spot['selected'] = True
                    return

    for spot in spots:
        set_selection(spot)

    free(mask)

    return {'spots': spots, 'spacer': data.get('spacer')}

@app.get('/thumbnail')
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

@app.post('/tiles')
def get_tiles():
    data = eval(request.body.read())

    session_id = data['session_id']
    session_cache = session_cacher.get_session_cache(session_id)
    if session_cache is None:
        response.status = 400
        error_message = 'Session ID expired. Please try again.'
        print(session_id[:20] + ": Error. " + error_message)
        return error_message

    # also do proper type validation here; see
    # https://zubu.re/bottle-security-checklist.html and
    # https://github.com/ahupp/python-magic
    for key, image in data['images'].items():
        if not image_processor.validate_jpeg_URI(image):
            response.status = 400
            error_message = ('Invalid image (%s). Please upload a jpeg image.'
                             % key)
            print(session_id[:20] + ": Error. " + error_message)
            return error_message

    tilemap = Tilemap()
    for key, image in data['images'].items():
        print(session_id[:20] + ": Transforming " + key + " image.")
        image = image_processor.jpeg_URI_to_Image(image)
        image = image_processor.transform_original_image(image)

        print(session_id[:20] + ": Tiling " + key + " images.")
        for x in tilemap.tilemapLevels:
            tilemap.put_tiles_at(
                x, image_processor.tile_image(image, x), key)
        print(session_id[:20] + ": Image tiling complete.")

        session_cache.image[key] = image

    import json
    with open('/tmp/response.json', 'w') as f:
        json.dump(tilemap.wrapped_tiles(), f)
    return tilemap.wrapped_tiles()

@app.route('/<filepath:path>')
def serve_site(filepath):
    return static_file(filepath, root='./st_alignment')

@app.error(404)
def error404(error):
    return "404 Not Found"

if(__name__ == "__main__"): # if this file is run from the terminal
    app.run(host='0.0.0.0', port=8080, debug=True, reloader=True)
