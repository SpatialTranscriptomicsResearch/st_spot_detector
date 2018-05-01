#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import ast
import copy
from functools import reduce
import json
import time
import traceback

import numpy as np

import bottle
from bottle import BaseRequest, error, get, post, response, request, route, \
    run, static_file

import imageprocessor as ip
from logger import log, INFO, WARNING
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
                        log(WARNING, f'Non-user warning: {message}')
                return _warnings
            try:
                return dict(result=fnc(*args, **kwargs), success=True, warnings=pack_warnings())
            except ClientError as err:
                return dict(result=str(err), success=False, warnings=pack_warnings())
            except Exception as err:
                log(WARNING, f'Non-user exception: {str(err)}')
                traceback.print_exc()
                return dict(
                    result='Unknown error. Please report this to the administrator.',
                    success=False,
                    warnings=pack_warnings())
    return wrapper

@app.get('/session_id')
@return_decorator
def create_session_cache():
    session_cacher.clear_old_sessions() # can be here for now
    return session_cacher.create_session_cache().session_id

@app.get('/detect_spots')
@return_decorator
def get_spots():
    session_id = request.query['session_id']
    session_cache = session_cacher.get_session_cache(session_id)

    if session_cache is None:
        raise ClientError('Session ID expired. Please try again.')

    log(INFO, 'Detecting spots', session=session_cache)
    # ast converts the query strings into python dictionaries
    TL_coords = ast.literal_eval(request.query['TL'])
    BR_coords = ast.literal_eval(request.query['BR'])
    array_size = ast.literal_eval(request.query['array_size'])

    # converts the image into a BW thresholded image for easier
    # keypoint detection

    BCT_image = ip.apply_BCT(session_cache.spot_image)
    keypoints = ip.detect_keypoints(BCT_image)
    spots = Spots(TL_coords, BR_coords, array_size,
        session_cache.spot_scaling_factor)
    spots.create_spots_from_keypoints(keypoints, BCT_image,
        session_cache.spot_scaling_factor)

    log(INFO, 'Spot detection finished', session=session_cache)

    HE_image = session_cache.tissue_image
    if HE_image is not None:
        log(INFO, 'Running tissue recognition', session=session_cache)
        mask = dict(
            data=get_tissue_mask(HE_image),
            shape=HE_image.size,
            scale=1 / session_cache.tissue_scaling_factor,
        )
    else:
        mask = None

    session_cacher.remove_session_cache(session_id)

    spots.calculate_matrix_from_spots()

    return {'spots': spots.wrap_spots(), 'tissue_mask': mask}

def get_tissue_mask(image):
    # Convert image to numpy matrix and preallocate the mask matrix
    image = np.array(image, dtype=np.uint8)
    mask = np.zeros(image.shape[0:2], dtype=np.uint8)

    # Run tissue recognition
    recognize_tissue(image, mask)
    mask = get_binary_mask(mask)

    # Encode mask to bit string
    bit_string = bits_to_ascii((mask == 255).flatten())

    free(mask)

    return bit_string

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
    data = json.loads(request.body.read())
    session_id = data['session_id']
    session_cache = session_cacher.get_session_cache(session_id)

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
        log(INFO, f'Transforming {key} image', session=session_cache)
        image = ip.jpeg_URI_to_Image(image)

        log(INFO, f'Tiling {key} image', session=session_cache)
        tiles_ = Tilemap(image)

        if(key == 'cy3'):
            # we want to save a scaled down version of the image
            # for spot detection later :)
            spot_img, spot_sf = ip.resize_image(image, [4000, 4000])
            session_cache.spot_image = spot_img
            session_cache.spot_scaling_factor = spot_sf

        if(key == 'he'):
            # also save a scaled down version of the tissue image
            tissue_img, tissue_sf = ip.resize_image(image, [500, 500])
            session_cache.tissue_image = tissue_img
            session_cache.tissue_scaling_factor = tissue_sf

        tiles.update({
            key: {
                'histogram': image.histogram(),
                'image_size': image.size,
                'tiles': tiles_.tilemaps,
                'tile_size': [tiles_.tile_width, tiles_.tile_height],
            },
        })

    log(INFO, 'Image tiling complete', session=session_cache)
    #TODO: make sure the large images get cleared out of the memory

    sss = list(map(lambda x: x.get('image_size'), tiles.values()))
    if not any([ss[1:] == ss[:-1] for ss in zip(*sss)]):
        warnings.warn('Images have different widths and heights. '
                      'Check that all images have the correct zoom level.',
                      ClientWarning)

    return tiles

@app.route('/')
@app.route('/<filepath:path>')
def serve_site(filepath='index.html'):
    return static_file(filepath, root='../client/dist')

@app.error(404)
def error404(error):
    return "404 Not Found"

if(__name__ == "__main__"): # if this file is run from the terminal
    app.run(host='0.0.0.0', port=8080, debug=True, reloader=True)
