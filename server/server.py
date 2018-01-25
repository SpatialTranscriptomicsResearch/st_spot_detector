# -*- coding: utf-8 -*-

import ast
import copy
from functools import reduce
import time
import traceback

import numpy as np

import bottle
from bottle import BaseRequest, error, get, post, response, request, route, \
    run, static_file

import imageprocessor as ip
from logger import Logger
from sessioncacher import SessionCacher
from spots import Spots
from tilemap import Tilemap
from PIL import Image

import warnings
warnings.simplefilter('ignore', Image.DecompressionBombWarning)
Image.MAX_IMAGE_PIXELS=None

from tissue_recognition import recognize_tissue, get_binary_mask, free

from utils import bits_to_ascii, equal

session_cacher = SessionCacher()

app = application = bottle.Bottle()

logger = Logger("st_aligner.log", toFile=False)

class ClientError(RuntimeError):
    # pylint:disable=missing-docstring
    pass

class ClientWarning(UserWarning):
    # pylint:disable=missing-docstring
    pass

def return_decorator(fnc):
    """Catches any ClientError or ClienWarnings while evaluating the decorated
    function and returns a dict with the result of the evaluation.
    """
    def wrapper(*args, **kwargs):
        # pylint:disable=missing-docstring, broad-except
        with warnings.catch_warnings(record=True) as wlog:
            warnings.simplefilter('always', ClientWarning)
            def pack_warnings():
                _warnings = []
                for warning in wlog:
                    message = str(warning.message)
                    if warning.category == ClientWarning:
                        _warnings.append(message)
                    else:
                        logger.log('Non-user warning: ' + message)
                return _warnings
            try:
                return dict(result=fnc(*args, **kwargs), success=True, warnings=pack_warnings())
            except ClientError as err:
                return dict(result=str(err), success=False, warnings=pack_warnings())
            except Exception as err:
                logger.log('Non-user exception: ' + str(err))
                traceback.print_exc()
                return dict(
                    result='Unknown error. Please report this to the administrator.',
                    success=False,
                    warnings=pack_warnings())
    return wrapper

@app.get('/session_id')
@return_decorator
def create_session_cache():
    session_cacher.clear_old_sessions(logger) # can be here for now
    new_session_id = session_cacher.create_session_cache()
    logger.log(new_session_id[:20] + ": New session created.")
    logger.log("Current session caches: ")
    for cache in session_cacher.session_caches:
        logger.log(cache.session_id[:20])
    return new_session_id

@app.get('/detect_spots')
@return_decorator
def get_spots():
    session_id = request.query['session_id']
    session_cache = session_cacher.get_session_cache(session_id, logger)

    if session_cache is None:
        raise ClientError('Session ID expired. Please try again.')

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

    BCT_image = ip.apply_BCT(session_cache.spot_image)
    keypoints = ip.detect_keypoints(BCT_image)
    spots = Spots(TL_coords, BR_coords, array_size,
        session_cache.spot_scaling_factor)
    spots.create_spots_from_keypoints(keypoints, BCT_image,
        session_cache.spot_scaling_factor)

    logger.log(session_id[:20] + ": Spot detection finished.")

    HE_image = session_cache.tissue_image
    if HE_image is not None:
        logger.log(session_id[:20] + ": Running tissue recognition.")
        mask = get_tissue_mask(HE_image)
    else:
        mask = None

    session_cacher.remove_session_cache(session_id, logger)

    spots.calculate_matrix_from_spots()

    return {'spots': spots.wrap_spots(), 'tissue_mask': mask}

def get_tissue_mask(image):
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

    # Run tissue recognition
    recognize_tissue(image, mask)
    mask = get_binary_mask(mask)

    # Encode mask to bit string
    bit_string = bits_to_ascii((mask == 255).flatten())

    free(mask)

    return {'data': bit_string, 'shape': new_size, 'scale': ratio}

@app.post('/tiles')
@return_decorator
def get_tiles():
    """Here we receive the Cy3 image (and optionally HE image) from the client,
    then firstly scale it to approximately 20k x 20k.
    The scaling factor for this is saved and sent to the client.
    The images are tiled and the tilemaps are saved and sent to the client.
    A Cy3 image of approximately 3k x 3k is saved on the server for further
    spot detection later on.
    """
    data = ast.literal_eval(request.body.read())
    session_id = data['session_id']
    session_cache = session_cacher.get_session_cache(session_id, logger)

    if session_cache is None:
        raise ClientError('Session ID expired. Please try again.')

    image_string = {'cy3': data['cy3_image']}
    if data['he_image'] != '':
        image_string['he'] = data['he_image']

    if not reduce(lambda a, x: a and x,
                  map(ip.validate_jpeg_URI, image_string.values())):
        raise ClientError('Invalid image format. Please upload only jpeg images.')

    tiles = dict()
    for key, image in image_string.items():
        logger.log(session_id[:20] + ": Transforming " + key + " image.")
        image = ip.jpeg_URI_to_Image(image)
        image_size = image.size
        # scaled down to 20k x 20k
        image, scaling_factor = ip.transform_original_image(image)

        logger.log(session_id[:20] + ": Tiling " + key + " images.")
        tiles_ = Tilemap()
        for x in tiles_.tilemapLevels:
            tiles_.put_tiles_at(x,
                ip.tile_image(image, x))

        session_cache.tiles[key] = tiles_

        if(key == 'cy3'):
            # we want to save a scaled down version of the image
            # for spot detection later :)
            spot_img, spot_sf = ip.resize_image(image, [4000, 4000])
            session_cache.spot_image = spot_img
            session_cache.spot_scaling_factor = spot_sf

        if(key == 'he'):
            # also save a scaled down version of the tissue image
            tissue_img = ip.resize_image(image, [500, 500])[0]
            session_cache.tissue_image = tissue_img

        tiles.update({
            key: {
                'histogram': image.histogram(),
                # we want to send back the scaling factor of the image to
                # the client, so it can convert its spot data back to the
                # original image size.
                # if the image is scaled down to 4k the scaling factor
                # will for example be 20k / 4k, i.e. 5
                'scaling_factor': scaling_factor,
                'image_size': image_size,
                'tiles': tiles_.tilemaps,
            },
        })

    logger.log(session_id[:20] + ": Image tiling complete.")
    #TODO: make sure the large images get cleared out of the memory

    if not equal(map(lambda x: x.get('scaling_factor'), tiles.values())):
        warnings.warn('Images are not all of equal scale.', ClientWarning)

    return dict(tiles=tiles,
                levels=Tilemap.tilemapLevels,
                dim=[Tilemap.tileWidth, Tilemap.tileHeight])

@app.route('/')
@app.route('/<filepath:path>')
def serve_site(filepath='index.html'):
    return static_file(filepath, root='../client/dist')

@app.error(404)
def error404(error):
    return "404 Not Found"

if(__name__ == "__main__"): # if this file is run from the terminal
    app.run(host='0.0.0.0', port=8080, debug=True, reloader=True)
