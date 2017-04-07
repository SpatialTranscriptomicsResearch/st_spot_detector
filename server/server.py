# -*- coding: utf-8 -*-

import ast
import copy
import time

import numpy as np

import bottle
from bottle import BaseRequest, error, get, post, response, request, route, \
    run, static_file

from imageprocessor import ImageProcessor
from logger import Logger
from sessioncacher import SessionCacher
from spots import Spots
from tilemap import Tilemap
from PIL import Image

from tissue_recognition import recognize_tissue, get_binary_mask, free

# Increases the request limit to 1 MB.
# Avoids server throwing 403 error when posting to /select_spots_inside
BaseRequest.MEMFILE_MAX = 1024 * 1024

session_cacher = SessionCacher()
image_processor = ImageProcessor()

app = application = bottle.Bottle()

logger = Logger("st_aligner.log", toFile=False)

@app.get('/session_id')
def create_session_cache():
    session_cacher.clear_old_sessions(logger) # can be here for now
    new_session_id = session_cacher.create_session_cache()
    logger.log(new_session_id[:20] + ": New session created.")
    logger.log("Current session caches: ")
    for cache in session_cacher.session_caches:
        logger.log(cache.session_id[:20])
    return new_session_id

@app.get('/detect_spots')
def get_spots():
    session_id = request.query['session_id']
    session_cache = session_cacher.get_session_cache(session_id, logger)
    if(session_cache is not None):
        logger.log(session_id[:20] + ": Detecting spots.")
        # ast converts the query strings into python dictionaries
        TL_coords = ast.literal_eval(request.query['TL'])
        BR_coords = ast.literal_eval(request.query['BR'])
        array_size = ast.literal_eval(request.query['array_size'])
        brightness = float(request.query['brightness'])
        contrast = float(request.query['contrast'])
        threshold = float(request.query['threshold'])

        # converts the image into a BW thresholded image for easier
        # keypoint detection

        BCT_image = image_processor.apply_BCT(
            session_cache.spot_image, brightness, contrast, threshold
        )
        keypoints = image_processor.detect_keypoints(BCT_image)
        spots = Spots(TL_coords, BR_coords, array_size,
            session_cache.spot_scaling_factor)
        spots.create_spots_from_keypoints(keypoints, BCT_image,
            session_cache.spot_scaling_factor)

        logger.log(session_id[:20] + ": Spot detection finished.")

        HE_image = session_cache.tissue_image
        if HE_image is not None:
            logger.log(session_id[:20] + ": Running tissue recognition.")
            spots = select_tissue_spots(spots, HE_image)

        session_cacher.remove_session_cache(session_id, logger)

        spots.calculate_matrix_from_spots()

        return spots.wrap_spots()
    else:
        response.status = 400
        error_message = 'Session ID expired. Please try again.'
        logger.log(session_id[:20] + ": Error. " + error_message)
        return error_message

def select_tissue_spots(spots, image):
    # Downsample to max 500x500
    max_size = np.array([500] * 2, dtype=float)
    ratio = min(min(max_size / image.size), 1)
    new_size = [ratio * s for s in image.size]

    # hack for now whilst spots are based on 20k x 20k image
    ratio = float(500) / float(20000)

    image = image.copy()
    image.thumbnail(new_size, Image.ANTIALIAS)

    # Convert image to numpy matrix and preallocate the mask matrix
    image = np.array(image, dtype=np.uint8)
    mask = np.zeros(image.shape[0:2], dtype=np.uint8)
    recognize_tissue(image, mask)
    mask = get_binary_mask(mask)

    tissue_spots = []

    def inner_bounds(center, radius):
        return [int(k * np.floor(radius + k * center)) for k in (-1, 1)]

    def set_selection(spot, tissue_spots, threshold):
        """Given a particular spot, the spot is set to selected or not
        depending on whether it is located on the tissue or not.
        The threshold parameter determines the percentage of how many pixels
        in the tissue it needs to overlap in order to be classified as being
        under the tissue.
        """
        coords = [ratio * c for c in spot.get('renderPosition').values()]
        radius = (ratio * spot.get('diameter')) / 2

        hit_count = 0 # the number of times the spot hits a pixel
        total_count = 0 # the number of checks
        r_min, r_max = inner_bounds(coords[0], radius)
        for r in range(r_min, r_max + 1):
            c_min, c_max = inner_bounds(
                coords[1], np.sqrt(radius ** 2 - (r - coords[0]) ** 2))
            for c in range(c_min, c_max + 1):
                total_count += 1
                if mask[r, c]:
                    # if the pixel is in the tissue mask
                    hit_count += 1

        if(float(hit_count) / float(total_count) >= threshold):
            # if over the threshold, then append to tissue_spot array
            # and set the spot to selected
            tissue_spot = {'arrayPosition': spot['arrayPosition']}
            tissue_spots.append(tissue_spot)
            spot['selected'] = True

    for spot in spots.spots:
        set_selection(spot, tissue_spots, 0.5)

    spots.tissue_spots = tissue_spots

    free(mask)

    return spots

@app.post('/tiles')
def get_tiles():
    """Here we receive the Cy3 image (and optionally HE image) from the client,
    then firstly scale it to approximately 20k x 20k then rotate it 180°.
    The scaling factor for this is saved and sent to the client.
    The images are tiled and the tilemaps are saved and sent to the client.
    A Cy3 image of approximately 3k x 3k is saved on the server for further
    spot detection later on.
    """
    data = ast.literal_eval(request.body.read())
    image_string = {'cy3': data['cy3_image'], 'he': data['he_image']}
    rotate = True if data['rotate'] == 'true' else False
    session_id = data['session_id']
    session_cache = session_cacher.get_session_cache(session_id, logger)
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
            # dict holding Tilemap(s) of Cy3 and HE tiles
            tiles = {}
            for key, image in image_string.items():
                if not valid[key]:
                    continue

                logger.log(session_id[:20] + ": Transforming " + key + " image.")
                image = image_processor.jpeg_URI_to_Image(image)
                # rotated and scaled down to 20k x 20k
                image, scaling_factor = image_processor.transform_original_image(image, rotate)

                logger.log(session_id[:20] + ": Tiling " + key + " images.")
                tiles_ = Tilemap()
                for x in tiles_.tilemapLevels:
                    tiles_.put_tiles_at(x,
                        image_processor.tile_image(image, x))

                session_cache.tiles[key] = tiles_

                if(key == 'cy3'):
                    # we want to send back the scaling factor of the image to
                    # the client, so it can convert its spot data back to the
                    # original image size.
                    tiles.update({'scaling_factor': scaling_factor})
                    
                    # we also want to save a scaled down version of the image
                    # for spot detection later :)
                    # if the image is scaled down to 4k the scaling factor
                    # will for example be 20k / 4k, i.e. 5
                    spot_img, spot_sf = image_processor.resize_image(image,
                        [4000, 4000])
                    session_cache.spot_image = spot_img
                    session_cache.spot_scaling_factor = spot_sf

                if(key == 'he'):
                    # also save a scaled down version of the tissue image
                    tissue_img = image_processor.resize_image(image,
                        [500, 500])[0]
                    session_cache.tissue_image = tissue_img

                tiles.update({key: tiles_})
                logger.log(session_id[:20] + ": Image tiling complete.")
            #TODO: make sure the large images get cleared out of the memory
        else:
            response.status = 400
            error_message = 'Invalid Cy3 image. Please upload a jpeg image.'
            logger.log(session_id[:20] + ": Error. " + error_message + "")
            return error_message
    else:
        response.status = 400
        error_message = 'Session ID expired. Please try again.'
        logger.log(session_id[:20] + ": Error. " + error_message)
        return error_message

    return {'cy3_tiles': tiles['cy3'].wrapped_tiles(),
            'he_tiles': tiles['he'].wrapped_tiles() if valid['he'] else None,
            'scaling_factor': scaling_factor}

@app.route('/<filepath:path>')
def serve_site(filepath):
    return static_file(filepath, root='../client/devel')

@app.error(404)
def error404(error):
    return "404 Not Found"

if(__name__ == "__main__"): # if this file is run from the terminal
    app.run(host='0.0.0.0', port=1337, debug=True, reloader=True)
