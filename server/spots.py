# -*- coding: utf-8 -*-

from PIL import Image
import math
import numpy as np
import random

def distance_between(a, b):
    w = a['x'] - b['x']
    h = a['y'] - b['y']
    dist = math.sqrt(w * w + h * h)
    return dist

class Spots:
    """Holds the spot data"""

    def __init__(self, TL, BR, array_size, scaling_factor):
        self.spots = []
        self.tissue_spots = []
        self.array_size = array_size
        self.transform_matrix = None

        # we recieve the TL and BR coordinates in the size of the client
        # image which is ~20k x 20k, so we scale it down to the size of
        # the stored Cy3 image.

        # the expected position of the centre of the top left spot
        self.TL_coords = {
            'x': TL['x'] / scaling_factor,
            'y': TL['y'] / scaling_factor
        }
        # the expected position of the centre of bottom right left spot
        self.BR_coords = {
            'x': BR['x'] / scaling_factor,
            'y': BR['y'] / scaling_factor
        }
        # the average expected space between each spot
        self.spacer_unscaled = {
            'x': ((BR['x'] - TL['x']) / (array_size['x'] - 1)),
            'y': ((BR['y'] - TL['y']) / (array_size['y'] - 1)),
        }
        self.spacer = {
            k: v / scaling_factor for (k, v) in self.spacer_unscaled.items()
        }

    def wrap_spots(self):
        spot_dictionary = {
            'positions': self.spots,
            'spacer': self.spacer_unscaled,
            'transform_matrix': self.transform_matrix
        }
        return spot_dictionary
        
    def create_spots_from_keypoints(self, keypoints, thresholded_image, scaling_factor):
        """Takes keypoints generated from opencv spot detection and
        tries to match them to their correct array positions.
        It also tries to fill in "missing spots" by finding which array
        positions do not have a corresponding keypoint, then analyses the
        black/white content of the thresholded image at the missing spot
        position in order to determine if a spot is likely to be there or not.
        """

        missing_spots = []
        threshold_distance = self.spacer['x'] / 2 # this can be adjusted for stringency

        # these arrays are used to calculate the average position at which
        # each spot column and row are at within the spot array
        row_position_sum = [0.0] * self.array_size['y']
        col_position_sum = [0.0] * self.array_size['x']
        row_position_count = [0] * self.array_size['y']
        col_position_count = [0] * self.array_size['x']

        def get_surrounding_pixels(position, radius):
            """Returns an array with the positions of pixels surrounding
            a particular point at a given radius from it.
            """
            # will return out-of-bound pixels, may need to fix this if
            # spots are close to the image edge
            pixels = []
            for y in range(int(position['y'] - radius), int(position['y'] + radius)):
                for x in range(int(position['x'] - radius), int(position['x'] + radius)):
                    pixel = {
                        'x': x,
                        'y': y
                    }
                    # this check ensures pixels are in a circle
                    if(distance_between(pixel, position) < radius):
                        pixels.append(pixel)
            return pixels

        # now iterating through the "expected" array positions
        avg_diam, n_diam = 0, 0
        for i in range(1, self.array_size['y'] - 1):
            for j in range(1, self.array_size['x'] - 1):
                spot_detected = False
                predicted_position = {
                    'x': self.spacer['x'] * j + self.TL_coords['x'],
                    'y': self.spacer['y'] * i + self.TL_coords['y']
                }
                for kp in keypoints:
                # iterate through the keypoints to see if one of them is at
                # the current "expected" array position
                    kp_position = {
                        'x': kp.pt[0],
                        'y': kp.pt[1]
                    }
                    if(distance_between(kp_position, predicted_position)
                            < threshold_distance):
                    # a keypoint is at the expected position if it is close
                    # enough to it
                        difference = {
                            'x': kp_position['x'] - predicted_position['x'],
                            'y': kp_position['y'] - predicted_position['y']
                        }
                        array_position_offset = {
                            'x': difference['x'] / self.spacer['x'],
                            'y': difference['y'] / self.spacer['y']
                        }
                        array_position = {
                            'x': j + 1,
                            'y': i + 1
                        }
                        new_array_position = {
                            'x': array_position['x']
                                 + array_position_offset['x'],
                            'y': array_position['y']
                                 + array_position_offset['y']
                        }
                        self.spots.append({
                            'arrayPosition': array_position,
                            'newArrayPosition': new_array_position,
                            'renderPosition': {
                                'x': int(kp_position['x']),
                                'y': int(kp_position['y'])
                            },
                            'diameter': kp.size,
                            'selected': False
                        })
                        avg_diam = (avg_diam * n_diam + kp.size) / (n_diam + 1)
                        n_diam = n_diam + 1

                        if(not spot_detected):
                            spot_detected = True
                            # the first spot detected at this position is used
                            # to calculate the average row and column positions
                            row_position_count[i] += 1
                            col_position_count[j] += 1
                            row_position_sum[i] += new_array_position['y']
                            col_position_sum[j] += new_array_position['x']

                        break # to only get one spot per keypoint

                if(not spot_detected):
                # if no spot has been detected at this array position,
                # then there is a spot deemed missing, unless it is
                # actually part of the frame
                    if(i == 0 or i == self.array_size['y']
                        or j == 1 or j == self.array_size['x']):
                        missing_spots.append({'x': j, 'y': i})

        # Calculate the average row and column positions. This is to help us
        # determine the most likely positions of the missing spots.
        row_position_average = [0] * self.array_size['y']
        col_position_average = [0] * self.array_size['x']
        for row, position in enumerate(row_position_average):
            # do not do anything if there is no data for this row
            if(row_position_count[row] != 0):
                row_position_average[row] = (row_position_sum[row]
                                            / float(row_position_count[row]))

        for col, position in enumerate(col_position_average):
            # do not do anything if there is no data for this column
            if(col_position_count[col] != 0):
                col_position_average[col] = (col_position_sum[col]
                                            / float(col_position_count[col]))

        # Open up processed (brightness, contrast, threshold) image for
        # reading of pixel values. This is very RAM-intensive for large
        # images.
        image_pixels = thresholded_image.load()
        filled_in_spots = []
        for spot in missing_spots:
            x = spot['x']
            y = spot['y']

            if(col_position_average[x] == 0 or row_position_average[y] == 0):
                # if no average has been calculated, then we can not guess
                # the position of the missing spot
                continue;

            array_position = {
                'x': x + 1,
                'y': y + 1
            }

            new_array_position = {
                # we need to do something else if the average is 0
                'x': col_position_average[x],
                'y': row_position_average[y]
            }


            pixel_position = {
                'x': (int((new_array_position['x'] - 1.0) * self.spacer['x']
                      + self.TL_coords['x'])),
                'y': (int((new_array_position['y'] - 1.0) * self.spacer['y']
                      + self.TL_coords['y']))
            }

            whiteness = 0
            whiteness_threshold = 200.0

            pixels = get_surrounding_pixels(pixel_position, self.spacer['x'] / 5)
            for pixel in pixels:
                # calculating the "whiteness" of area at that position
                # these should all be 255 if white, 0 if black
                r, g, b = image_pixels[pixel['x'], pixel['y']]
                # greyscale so only one channel needs to be checked
                whiteness += r
                
            whiteness_average = float(whiteness) / float(len(pixels))
            if(whiteness_average < whiteness_threshold):
                # not yet added in order
                filled_in_spots.append({
                    'arrayPosition': array_position,
                    'newArrayPosition': new_array_position,
                    'renderPosition': {
                        'x': pixel_position['x'],
                        'y': pixel_position['y']
                    },
                    'diameter': avg_diam,
                    'selected': False
                })

        # Inserting the filled-in spots in the correct order in the spots array
        # this is identical to the JS version in spot-adjuster.js
        for new_spot in filled_in_spots:
            new_spot_order = (new_spot['arrayPosition']['y']
                              * self.array_size['x']
                              + new_spot['arrayPosition']['x'])
            for i in range(0, len(self.spots)):
                spot = self.spots[i]
                spot_order = (spot['arrayPosition']['y'] * self.array_size['x']
                              + spot['arrayPosition']['x'])
                if(new_spot_order <= spot_order):
                    self.spots.insert(i, new_spot)
                    break
                elif(new_spot_order > spot_order):
                    # if the order is higher than last spot, append to array
                    if(i == len(self.spots) - 1):
                        self.spots.append(new_spot)
                        break

        # Spot detection complete

        # spots scaled up to client-side image size
        self.scale_spots(scaling_factor)

    def scale_spots(self, scaling_factor):
        """Spot detection is run on a scaled down image; this function
        scales up the spot pixel coordinates to a non-scaled version, 
        rending for sending back to the client.
        """
        for spot in self.spots:
            spot['renderPosition'] = {
                'x': float(spot['renderPosition']['x']) * scaling_factor,
                'y': float(spot['renderPosition']['y']) * scaling_factor,
            }
            spot['diameter'] = spot['diameter'] * scaling_factor

    def calculate_matrix_from_spots(self, num_spots=20):
        """Calculates a 3x3 affine transformation matrix which transforms
        the adjusted array coordinates into the adjusted pixel coordinates.
        The matrix is saved as a string in the form
        a11 a12 a13 a21 a22 a23 a31 a32 a33
        to be later sent to the client side to download.
	:param num_spots: The number of spots to used in the computation.
	"""

        adjusted_array = []
        pixel_array = []
	# Not including all the spots for computational reasons
	# (NOTE: spots are chosen from a random distribution)
        for spot in random.sample(self.spots, num_spots) \
	if len(self.spots) > num_spots else self.spots:
            array_coord = [
                spot['newArrayPosition']['x'],
                spot['newArrayPosition']['y']
            ]
            pixel_coord = [
                spot['renderPosition']['x'],
                spot['renderPosition']['y']
            ]
            adjusted_array.append(array_coord)
            pixel_array.append(pixel_coord)

        # Primary corresponds to adjusted array coordinates
        # Secondary corresponds to the respective adjusted pixel coordinates
        primary = np.array(adjusted_array)
        secondary = np.array(pixel_array)

        # Pad the data with ones, so that our transformation can do translations too
        pad = lambda x: np.hstack([x, np.ones((x.shape[0], 1))])
        X = pad(primary)
        Y = pad(secondary)

        # Solve the least squares problem X * A = Y to find our transformation matrix A
        A, res, rank, s = np.linalg.lstsq(X, Y)

        # Transpose A to the usual form (right-multiplicative by column vector)
        A = np.transpose(A)

        # the matrix is serialized to a string for sending over network as JSON
        matrix = ""
        for row in A:
            for entry in row:
                matrix += '%f ' % round(entry, 4)
        self.transform_matrix = matrix
