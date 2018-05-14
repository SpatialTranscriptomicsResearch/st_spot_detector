# -*- coding: utf-8 -*-

import asyncio
from functools import reduce, wraps
import json
import warnings

import numpy as np
from PIL import Image
import sanic
from sanic import Sanic
from sanic.config import Config
from tissue_recognition import recognize_tissue, get_binary_mask, free

from . import imageprocessor as ip
from .logger import log, INFO, WARNING
from .spots import Spots
from .tilemap import Tilemap
from .utils import bits_to_ascii, chunks_of


MESSAGE_SIZE = 2 * (2 ** 10) ** 2


ENC = json.JSONEncoder().encode
DEC = json.JSONDecoder().decode


warnings.simplefilter('ignore', Image.DecompressionBombWarning)
Image.MAX_IMAGE_PIXELS=None


Config.WEBSOCKET_MAX_SIZE = 200 * (2 ** 10) ** 2

sanic.handlers.INTERNAL_SERVER_ERROR_HTML = '''
Something went wrong! :(
'''

APP = Sanic()
APP.static('', '../client/dist')
APP.static('', '../client/dist/index.html')


class ClientError(RuntimeError):
    # pylint:disable=missing-docstring
    pass

class Result(Exception):
    # pylint:disable=missing-docstring
    def __init__(self, result):
        self.result = result


def progress_request(route):
    def _decorator(fnc):
        @APP.websocket(route)
        @wraps(fnc)
        async def _wrapper(_req, socket, *args, **kwargs):
            # pylint: disable=missing-docstring
            payload = json.loads(await socket.recv())
            try:
                async for progress in fnc(payload, *args, **kwargs):
                    await socket.send(ENC(dict(
                        type='progress',
                        data=progress,
                    )))
            except Result as r:
                sres = ENC(r.result)
                packages = chunks_of(MESSAGE_SIZE, list(sres))
                response_size = len(sres)
                sent = 0
                for data in packages:
                    sent += len(data)
                    await socket.send(ENC(dict(
                        type='package',
                        data=dict(
                            payload=''.join(data),
                            loaded=sent,
                            total=response_size,
                        ),
                    )))
            except ClientError as err:
                await socket.send(ENC(dict(
                    type='error',
                    data=str(err),
                )))
            socket.close()
        return _wrapper
    return _decorator


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


@progress_request('/run')
async def run(data):
    array_size = data.get('array_size')
    if not (isinstance(array_size, list)
            and len(array_size) == 2
            and all([x > 0 for x in array_size])):
        raise ClientError('Invalid array size')

    images = data.get('images')

    if not reduce(
            lambda a, x: a and x,
            map(ip.validate_jpeg_URI, images.values()),
    ):
        raise ClientError(
            'Invalid image format. Please upload only jpeg images.')

    tiles = dict()
    spot_img, spot_sf = None, None
    tissue_img, tissue_sf = None, None
    for key, image in images.items():
        yield f'Transforming {key} image'

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

    if spot_img is not None:
        yield 'Detecting spots'
        spots = get_spots(spot_img, spot_sf, array_size)
    else:
        spots = None

    if tissue_img is not None:
        yield 'Computing tissue mask'
        tissue_mask = dict(
            mask=get_tissue_mask(tissue_img),
            shape=tissue_img.size,
            scale=1 / tissue_sf,
        )
    else:
        tissue_mask = None

    raise Result(dict(
        tiles=tiles,
        spots=spots,
        tissue_mask=tissue_mask,
    ))
