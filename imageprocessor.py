# -*- coding: utf-8 -*-

import base64
import io
import cv2
import numpy

from PIL import Image, ImageOps, ImageEnhance

class ImageProcessor:
    """Takes the jpeg image and performs various methods on it."""
    URI_header = b'data:image/jpeg;base64,'

    def PIL_to_CV2_image(self, PIL_image):
        CV2_image = cv2.cvtColor(numpy.array(PIL_image), cv2.COLOR_RGB2GRAY)
        return CV2_image

    def CV2_to_PIL_image(self, CV2_image):
        CV2_image = cv2.cvtColor(numpy.array(CV2_image), cv2.COLOR_GRAY2RGB)
        PIL_image = Image.fromarray(CV2_image)
        return PIL_image

    def validate_jpeg_URI(self, jpeg_URI):
        """Checks that it is a valid base64-encoded jpeg URI."""
        # valid = (jpeg_URI.find(self.URI_header) == 0)
        return True

    def jpeg_URI_to_Image(self, jpeg_URI):
        """Take a jpeg base64-encoded URI and return a PIL Image object."""
        # remove 'data:image/jpeg;base64,' and decode the string
        jpeg_data = base64.b64decode(jpeg_URI[23:])
        # stream the data as a bytes object and open as an image
        image = Image.open(io.BytesIO(jpeg_data))
        return image

    def Image_to_jpeg_URI(self, image):
        """Take a PIL Image object and return a jpeg base64-encoded URI."""
        # save the image to a byte stream encoded as jpeg
        jpeg_data = io.BytesIO()
        image.save(jpeg_data, 'JPEG')

        # encode the data into a URI with the header added
        jpeg_string = base64.b64encode(jpeg_data.getvalue())
        jpeg_string = self.URI_header + jpeg_string

        # convert the string from a raw literal to utf-8 encoding
        jpeg_string = jpeg_string.decode('utf-8')
        return jpeg_string


    def tile_image(self, image, tilemap_level):
        """Takes a jpeg image, scales its size down and splits it up 
        into tiles, the amount depends on the "level" of tile splitting.

        A 2D array of tiles is returned.
        """
        tiles = []

        photoWidth = image.size[0]
        photoHeight = image.size[1]
        tileWidth = 496;
        tileHeight = 496;
        tilemapWidth = int((photoWidth / tilemap_level) / tileWidth) + 1
        tilemapHeight = int((photoHeight / tilemap_level) / tileHeight) + 1

        if(tilemap_level != 1):
            newPhotoWidth = int(photoWidth / tilemap_level)
            newPhotoHeight = int(photoHeight / tilemap_level)
            scaled_image = image.resize((newPhotoWidth, newPhotoHeight))
        else:
            scaled_image = image

        for y in range(0, tilemapWidth):
            new_row = []
            for x in range(0, tilemapHeight):
                widthOffset = tileWidth * x
                heightOffset = tileHeight * y

                image_tile = scaled_image.crop((
                    widthOffset, 
                    heightOffset, 
                    widthOffset + tileWidth, 
                    heightOffset + tileHeight
                ))

                new_row.append(self.Image_to_jpeg_URI(image_tile))
            tiles.append(new_row)

        return tiles

    def apply_BCT(self, image, brightness, contrast, threshold,
                  large_image=False):
        """First inverts, then applies brightness and contrast
        transforms on a PIL Image, converts it to an OpenCV
        image for thresholding, then converts it back and
        returns a processed PIL Image.
        """
        brightness = (brightness / 100.0) + 1.0
        contrast = (contrast / 100.0) + 1.0

        # the image is inverted to color the features darkest
        image = ImageOps.invert(image)

        # the image enhancers take a copy of the image, not a reference,
        # so they need to be created after each operation as necessary
        brightnessEnhancer = ImageEnhance.Brightness(image)
        image = brightnessEnhancer.enhance(brightness)

        contrastEnhancer = ImageEnhance.Contrast(image)
        image = contrastEnhancer.enhance(contrast)

        # convert the image into a grayscale cv2 formatted image
        cv2_image = self.PIL_to_CV2_image(image)

        # may make it possible to choose between normal thresholding and
        # adaptive thresholding
        #retval, thresholded_image = cv2.threshold(cv2_image, threshold,
        #                                          255, cv2.THRESH_BINARY)
        block_size = 103
        if(large_image):
            block_size = 2061
        # Mean adaptive threshold has been chosen here because Gaussian
        # adaptive thresholding is very slow, takes about 15 minutes for a
        # 20k x 20k image and does not yield significantly better results
        thresholded_image = cv2.adaptiveThreshold(cv2_image, 255,
                                                  cv2.ADAPTIVE_THRESH_MEAN_C,
                                                  cv2.THRESH_BINARY,
                                                  block_size, 20)

        # convert the image back into a PIL image
        image = self.CV2_to_PIL_image(thresholded_image)
        return image

    def process_thumbnail(self, thumbnail, brightness, contrast, threshold):
        thumbnail = self.apply_BCT(thumbnail, brightness, contrast, threshold)
        return thumbnail

    def detect_keypoints(self, image):
        """This function takes an image and first inverts it (to color the
        features darkest), then applies brightness and contrast (input 
        values from -100 to 100).
        It then uses OpenCV to do threshold the image and do some simple,
        automatic blob detection and returns the keypoints generated.
        """
        # convert the image to an OpenCV image for blob detection
        cv2_image = self.PIL_to_CV2_image(image)

        params = cv2.SimpleBlobDetector_Params()
        # these values seem good "for now"
        params.thresholdStep = 5.0
        params.minThreshold = 170.0
        params.maxThreshold = params.minThreshold + 50.0;
        params.filterByArea = True
        params.minArea = 3200
        params.maxArea = 11200

        detector = cv2.SimpleBlobDetector_create(params)
        keypoints = detector.detect(cv2_image)

        return keypoints

    def transform_original_image(self, image):
        """Here we take an original fluorescently stained image (~30k x 30k),
        rotate it 180° and scale it down to ~20k x 20k and return it.
        """
        # resize image
        width, height = image.size
        aspect_ratio = float(width) / float(height)
        if(aspect_ratio >= 1.0):
            new_width = 8000
            new_height = int(float(new_width) / aspect_ratio)
        else:
            new_height = 8000
            new_width = int(float(new_height) * aspect_ratio)
        scaled_image = image.resize((new_width, new_height), Image.ANTIALIAS)

        # rotate image
        transformed_image = scaled_image.rotate(180)

        return transformed_image
