# -*- coding: utf-8 -*-
"""Methods related to image processing."""

from base64 import b64encode
from io import BytesIO
import warnings

import cv2
from PIL import Image, ImageOps
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

def apply_bct(image, apply_thresholding=True):
    """Performs colour invert on a PIL image, then converts it to an OpenCV
    image and applies automatic brightness and contrast equalisation (CLAHE) and
    thresholding, then converts it back and returns a processed PIL Image.
    """
    # the image is inverted to colour the features darkest
    image = ImageOps.invert(image)

    # convert the image into a grayscale
    image = numpy.array(image.convert('L'))

    # create a CLAHE object
    clahe = cv2.createCLAHE(clipLimit=20.0, tileGridSize=(1, 1))

    image = clahe.apply(image)

    if apply_thresholding:
        # Mean adaptive threshold has been chosen here because Gaussian
        # adaptive thresholding is very slow, takes about 15 minutes for a
        # 20k x 20k image and does not yield significantly better results
        image = cv2.adaptiveThreshold(image, 255,
                                      cv2.ADAPTIVE_THRESH_MEAN_C,
                                      cv2.THRESH_BINARY,
                                      103, 20)

    return Image.fromarray(image).convert('RGB')


def detect_keypoints(image):
    """This function uses OpenCV to threshold an image and do some simple,
    automatic blob detection and returns the keypoints generated.
    The parameters for min and max area are roughly based on an image
    of size 4k x 4k.
    """
    image = numpy.array(image.convert('L'))

    params = cv2.SimpleBlobDetector_Params()
    params.thresholdStep = 5.0
    params.minThreshold = 170.0
    params.maxThreshold = params.minThreshold + 50.0
    params.filterByArea = True
    params.minArea = 800
    params.maxArea = 5000

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
