# -*- coding: utf-8 -*-
""" Instantiates the server
"""

import asyncio
from functools import wraps
import itertools as it
import json
import warnings

import numpy as np
from PIL import Image
import sanic
from sanic import Sanic
from sanic.config import Config
from tissue_recognition import recognize_tissue, get_binary_mask, free

from . import imageprocessor as ip
from .spots import Spots
from .utils import bits_to_ascii, chunks_of


MESSAGE_SIZE = 2 * (2 ** 10) ** 2
TILE_SIZE = [256, 256]


ENC = json.JSONEncoder().encode
DEC = json.JSONDecoder().decode


warnings.simplefilter('ignore', Image.DecompressionBombWarning)
Image.MAX_IMAGE_PIXELS = None


Config.WEBSOCKET_MAX_SIZE = 200 * (2 ** 10) ** 2

sanic.handlers.INTERNAL_SERVER_ERROR_HTML = '''
Something went wrong! :(
'''

APP = Sanic()
APP.static('', '../client/dist')
APP.static('', '../client/dist/index.html')


class ClientError(RuntimeError):
    pass

class Result(Exception):
    def __init__(self, result):
        super().__init__()
        self.result = result


def _progress_request(route):
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
                await socket.send(ENC(dict(
                    type='state',
                    data='END',
                )))
                await socket.recv()
            except ClientError as err:
                await socket.send(ENC(dict(
                    type='error',
                    data=str(err),
                )))
            socket.close()
        return _wrapper
    return _decorator


def _get_spots(img, scale_factor, array_size):
    bct_image = ip.apply_bct(img)

    keypoints = ip.detect_keypoints(bct_image)
    spots = Spots(array_size, scale_factor)
    try:
        spots.create_spots_from_keypoints(keypoints, bct_image)
    except RuntimeError:
        raise ClientError('Spot detection failed.')

    return spots.wrap_spots()


def _get_tissue_mask(image):
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


@_progress_request('/run')
async def run(data, loop=None):
    """ Tiles the received images and runs spot and tissue detection
    """
    if loop is None:
        loop = asyncio.get_event_loop()
    execute = lambda f, *args: \
        loop.run_in_executor(None, f, *args)

    array_size = data.get('array_size')
    if not (isinstance(array_size, list)
            and len(array_size) == 2
            and all([x > 0 for x in array_size])):
        raise ClientError('Invalid array size')

    images = data.get('images')
    if not all(map(ip.validate_jpeg_uri, images.values())):
        raise ClientError(
            'Invalid image format. Please upload only jpeg images.')


    async def _do_image_tiling(image):
        tilemap = dict()
        tilemap_sizes = list(it.takewhile(
            lambda x: all([a > b for a, b in zip(x[1], TILE_SIZE)]),
            ((l, [x / l for x in image.size])
             for l in (2 ** k for k in it.count())),
        ))
        cur = image
        for i, (l, s) in enumerate(tilemap_sizes):
            yield l, i + 1, len(tilemap_sizes)
            cur = cur.resize(list(map(int, s)))
            tilemap[l] = await loop.run_in_executor(
                None, ip.tile_image, cur, *TILE_SIZE)
        raise Result({
            'histogram': image.histogram(),
            'image_size': image.size,
            'tiles': tilemap,
            'tile_size': TILE_SIZE,
        })

    async def _do_spot_detection(image):
        image, scale = await execute(ip.resize_image, image, [4000, 4000])
        return await execute(_get_spots, image, scale, array_size)

    async def _do_mask_detection(image):
        image, scale = await execute(ip.resize_image, image, [500, 500])
        return dict(
            data=await execute(_get_tissue_mask, image),
            shape=image.size,
            scale=1 / scale,
        )

    async def _go():
        tiles = dict()
        mask, spots = None, None
        for key, image in images.items():
            yield f'Decompressing {key} image data'
            image = await execute(ip.jpeg_uri_to_image, image)

            try:
                async for level, i, n in _do_image_tiling(image):
                    yield f'Tiling {key} image: level {level} ({i}/{n})'
            except Result as tilemap:
                tiles.update({key: tilemap.result})

            if key == 'Cy3':
                yield 'Detecting spots'
                spots = await _do_spot_detection(image)
            elif key == 'HE':
                yield 'Computing tissue mask'
                mask = await _do_mask_detection(image)

        raise Result(dict(
            tiles=tiles,
            spots=spots,
            tissue_mask=mask,
        ))


    async for msg in _go():
        yield msg
