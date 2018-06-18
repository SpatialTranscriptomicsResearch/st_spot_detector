# -*- coding: utf-8 -*-
""" Instantiates the server
"""

from abc import abstractmethod
import asyncio
from functools import reduce, wraps
from io import BytesIO
import itertools as it
import json
from operator import add
import warnings

import numpy as np
from PIL import Image
import sanic
from sanic import Sanic
from sanic.config import Config
from tissue_recognition import recognize_tissue, get_binary_mask, free

from . import imageprocessor as ip
from .oauth import protect
from .spots import Spots
from .utils import bits_to_ascii, chunks_of


MESSAGE_SIZE = 10 * (2 ** 10) ** 2
TILE_SIZE = [256, 256]


warnings.simplefilter('ignore', Image.DecompressionBombWarning)
Image.MAX_IMAGE_PIXELS = None


Config.WEBSOCKET_MAX_SIZE = 200 * (2 ** 10) ** 2

sanic.handlers.INTERNAL_SERVER_ERROR_HTML = '''
Something went wrong! :(
'''

APP = Sanic()

_ADD_ROUTE = APP.router.add
def add_protected_route(self, uri, methods, handler, *args, **kwargs):
    return _ADD_ROUTE(uri, methods, protect(handler), *args, **kwargs)
APP.router.add = add_protected_route.__get__(APP, sanic.router.Router)

APP.static('', '../client/dist')
APP.static('', '../client/dist/index.html')


class ClientError(RuntimeError):
    pass


class Result(Exception):
    def __init__(self, result):
        super().__init__()
        self.result = result


class Message(object):
    # pylint: disable=missing-docstring
    # pylint: disable=too-few-public-methods
    @staticmethod
    def _generate_header(response_type, identifier, chunks, length):
        return f'{response_type}:{identifier}:{chunks}:{length}'
    @abstractmethod
    def chunks(self):
        pass

class Error(Message):
    # pylint: disable=missing-docstring
    # pylint: disable=too-few-public-methods
    def __init__(self, message):
        self.message = message
    def chunks(self):
        return [
            self._generate_header('error', '', 1, len(self.message)),
            self.message,
        ]

class Json(Message):
    # pylint: disable=missing-docstring
    # pylint: disable=too-few-public-methods
    def __init__(self, identifier, data):
        self.identifier = identifier
        self.data = json.JSONEncoder().encode(data)
    def chunks(self):
        chunks = list(map(''.join, chunks_of(MESSAGE_SIZE, list(self.data))))
        return [
            self._generate_header(
                'json',
                self.identifier,
                len(chunks),
                len(self.data),
            ),
            *chunks,
        ]

class Status(Message):
    # pylint: disable=missing-docstring
    # pylint: disable=too-few-public-methods
    def __init__(self, status):
        self.status = status
    def chunks(self):
        return [
            self._generate_header('status', '', 1, len(self.status)),
            self.status,
        ]


def _async_request(route):
    def _decorator(fnc):
        @APP.websocket(route)
        @wraps(fnc)
        async def _wrapper(_req, socket, *args, **kwargs):
            async def _receive():
                async for header in socket:
                    if header == '\0':
                        break
                    [type_, identifier, chunks] = header.split(':')
                    data = [await socket.recv() for _ in range(int(chunks))]
                    yield [type_, identifier, reduce(add, data)]
            async def _send(message):
                for chunk in message.chunks():
                    await socket.send(chunk)
            try:
                async for message in fnc(_receive(), *args, **kwargs):
                    await _send(message)
            except ClientError as err:
                await _send(Error(str(err)))
            await socket.send('\0')
            await socket.recv()
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
    image = np.array(image, dtype=np.uint8)
    mask = np.zeros(image.shape[0:2], dtype=np.uint8)
    recognize_tissue(image, mask)
    mask = get_binary_mask(mask)
    bit_string = bits_to_ascii((mask == 255).flatten())
    free(mask)
    return bit_string


@_async_request('/run')
async def run(packages, loop=None):
    """ Tiles the received images and runs spot and tissue detection
    """
    if loop is None:
        loop = asyncio.get_event_loop()
    execute = lambda f, *args: \
        loop.run_in_executor(None, f, *args)

    array_size = []

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
            cur = await execute(lambda: cur.resize(list(map(int, s))))
            tilemap[l] = await loop.run_in_executor(
                None, ip.tile_image, cur, *TILE_SIZE)
        raise Result(dict(
            image_size=image.size,
            tiles=tilemap,
            tile_size=TILE_SIZE,
        ))

    async def _do_spot_detection(image):
        if not (isinstance(array_size, list)
                and len(array_size) == 2
                and all([x > 0 for x in array_size])):
            raise ClientError('Invalid array size')
        image, scale = await execute(ip.resize_image, image, [4000, 4000])
        return await execute(_get_spots, image, scale, array_size)

    async def _do_mask_detection(image):
        image, scale = await execute(ip.resize_image, image, [500, 500])
        return dict(
            data=await execute(_get_tissue_mask, image),
            shape=image.size,
            scale=1 / scale,
        )

    async def _process_image(identifier, image_data):
        try:
            yield Status(f'Inflating {identifier} image data')
            image = await execute(lambda: Image.open(BytesIO(image_data)))
        except:
            raise ClientError(
                'Invalid image format. Please upload only jpeg images.')
        try:
            async for level, i, n in _do_image_tiling(image):
                yield Status(f'Tiling {identifier}: level {level} ({i}/{n})')
        except Result as r:
            yield Status(f'Computing {identifier} histogram')
            r.result.update(histogram=await execute(image.histogram))
            yield Json(identifier, r.result)

        if identifier == 'Cy3':
            yield Status('Detecting spots')
            yield Json('spots', await _do_spot_detection(image))
        elif identifier == 'HE':
            yield Status('Computing tissue mask')
            yield Json('mask', await _do_mask_detection(image))

    async for [type_, identifier, data] in packages:
        if type_ == 'image':
            async for response in _process_image(identifier, data):
                yield response
        elif type_ == 'json_string' and identifier == 'array_size':
            array_size = json.JSONDecoder().decode(data)
