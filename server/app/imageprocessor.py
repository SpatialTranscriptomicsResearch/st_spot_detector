# -*- coding: utf-8 -*-
"""Methods related to image processing."""

from base64 import b64encode
from io import BytesIO
import warnings

import cv2
from PIL import Image
from PIL.ImageOps import invert
import numpy


warnings.simplefilter('ignore', Image.DecompressionBombWarning)
Image.MAX_IMAGE_PIXELS = None


def tile_image(image, tile_width, tile_height):
    """Takes a jpeg image, scales its size down and splits it up
    into tiles.

    A 2D array of tiles is returned.
    """
    tiles = []

    tile_size = [tile_width, tile_height]
    # width and height of the tilemap (ints)
    tilemap_size = [
        image.size[0] // tile_size[0] + 1,
        image.size[1] // tile_size[1] + 1
    ]

    for x in range(0, tilemap_size[0]):
        new_row = []
        for y in range(0, tilemap_size[1]):
            crop_start = [
                tile_size[0] * x,
                tile_size[1] * y
            ]
            crop_stop = [
                crop_start[0] + tile_size[0],
                crop_start[1] + tile_size[1]
            ]

            cropped_image = image.crop(
                tuple(crop_start + crop_stop))

            data = BytesIO()
            cropped_image.save(data, 'JPEG', quality=100)
            new_row.append(
                'data:image/jpeg;base64,'
                f'{b64encode(data.getvalue()).decode()}'
            )
        tiles.append(new_row)

    return tiles

def detect_keypoints(image):
    """This function uses OpenCV to threshold an image and do some simple,
    automatic blob detection and returns the keypoints generated.
    The parameters for min and max area are roughly based on an image
    of size 4k x 4k.
    """
    image = numpy.array(invert(image.convert('L')))

    params = cv2.SimpleBlobDetector_Params()
    params.thresholdStep = 1
    params.minThreshold = 1
    params.maxThreshold = 256
    params.filterByArea = True
    params.minArea = 400
    params.maxArea = 5000
    params.filterByConvexity = False

    detector = cv2.SimpleBlobDetector_create(params)
    keypoints = detector.detect(image)

    return keypoints

def resize_image(image, max_size):
    """Resize and return an image and the scaling factor, defined as the
    original image size / resultant image size.
    The aspect ratio is preserved.
    """
    width, height = image.size
    aspect_ratio = float(width) / float(height)
    if aspect_ratio >= 1.0:
        new_width = max_size[0]
        new_height = int(float(new_width) / aspect_ratio)
    else:
        new_height = max_size[1]
        new_width = int(float(new_height) * aspect_ratio)

    scaling_factor = float(width) / float(new_width)

    return image.resize((new_width, new_height), Image.ANTIALIAS), scaling_factor
