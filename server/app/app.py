# -*- coding: utf-8 -*-

from functools import reduce
import traceback
import warnings

import numpy as np
from PIL import Image
import sanic
from sanic import Sanic, response
from tissue_recognition import recognize_tissue, get_binary_mask, free

from . import imageprocessor as ip
from .logger import log, INFO, WARNING
from .spots import Spots
from .tilemap import Tilemap
from .utils import bits_to_ascii

warnings.simplefilter('ignore', Image.DecompressionBombWarning)
Image.MAX_IMAGE_PIXELS=None

APP = Sanic()
APP.static('', '../client/dist')
APP.static('', '../client/dist/index.html')

sanic.handlers.INTERNAL_SERVER_ERROR_HTML = '''
Something went wrong! :(
'''

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
                return response.json(dict(
                    result=fnc(*args, **kwargs),
                    success=True,
                    warnings=pack_warnings(),
                ))
            except ClientError as err:
                return response.json(dict(
                    result=str(err),
                    success=False,
                    warnings=pack_warnings(),
                ))
            except Exception as err:
                log(WARNING, f'Non-user exception: {str(err)}')
                traceback.print_exc()
                return response.json(dict(
                    result='Unknown error. Please report this to the administrator.',
                    success=False,
                    warnings=pack_warnings(),
                ))
    return wrapper

def get_spots(img, scale_factor, array_size):
    log(INFO, 'Detecting spots')

    bct_image = ip.apply_BCT(img)

    keypoints = ip.detect_keypoints(bct_image)
    spots = Spots(array_size, scale_factor)
    try:
        spots.create_spots_from_keypoints(keypoints, bct_image)
    except RuntimeError:
        raise ClientError('Spot detection failed.')

    return spots.wrap_spots()

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

@APP.route('/run', methods=['POST'])
@return_decorator
def run(req):
    """Here we receive the Cy3 image (and optionally HE image) from the client,
    then firstly scale it to approximately 20k x 20k.
    The scaling factor for this is saved and sent to the client.
    The images are tiled and the tilemaps are saved and sent to the client.
    A Cy3 image of approximately 3k x 3k is saved on the server for further
    spot detection later on.
    """
    data = req.json

    array_size = data.get('array_size')
    if not (isinstance(array_size, list)
            and len(array_size) == 2
            and all([x > 0 for x in array_size])):
        raise ClientError('Invalid array size')

    images = []
    if 'cy3_image' not in data:
        raise ClientError('No Cy3 image has been uploaded')
    images.append(('Cy3', data['cy3_image']))
    if 'he_image' in data and data['he_image'] != '':
        images.append(('HE', data['he_image']))

    if not reduce(
            lambda a, x: a and x,
            map(lambda x: ip.validate_jpeg_URI(x[1]), images),
    ):
        raise ClientError(
            'Invalid image format. Please upload only jpeg images.')

    tiles = dict()
    spot_img, spot_sf = None, None
    tissue_img, tissue_sf = None, None
    for key, image in images:
        log(INFO, f'Transforming {key} image')
        image = ip.jpeg_URI_to_Image(image)

        log(INFO, f'Tiling {key} image')
        tiles_ = Tilemap(image)

        if key == 'Cy3':
            spot_img, spot_sf = ip.resize_image(image, [4000, 4000])
        elif key == 'HE':
            tissue_img, tissue_sf = ip.resize_image(image, [500, 500])

        tiles.update({
            key: {
                'histogram': image.histogram(),
                'image_size': image.size,
                'tiles': tiles_.tilemaps,
                'tile_size': [tiles_.tile_width, tiles_.tile_height],
            },
        })
    image = None
    log(INFO, 'Image tiling complete')

    sss = list(map(lambda x: x.get('image_size'), tiles.values()))
    if not any([ss[1:] == ss[:-1] for ss in zip(*sss)]):
        warnings.warn('Images have different widths and heights. '
                      'Check that all images have the correct zoom level.',
                      ClientWarning)

    return dict(
        tiles=tiles,
        spots=get_spots(spot_img, spot_sf, array_size) \
            if spot_img is not None else None,
        tissue_mask=dict(
            data=get_tissue_mask(tissue_img),
            shape=tissue_img.size,
            scale=1 / tissue_sf,
        ) if tissue_img is not None else None,
    )
