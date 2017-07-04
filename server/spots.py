# -*- coding: utf-8 -*-

from PIL import Image
import math
import numpy as np
import random
from circle_detector import CircleDetector, DetectionType

circle_detector = CircleDetector()

class Spots:
    """Holds the spot data. These spots are stored with positions relative
    to the originally-uploaded Cy3 image.
    """

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
        pixels around that position to determine if a spot is likely
        to be there or not.
        """

        missing_spots = []
        threshold_dist = self.spacer['x'] / 2 # this can be adjusted for stringency

        # these arrays are used to calculate the average position at which
        # each spot column and row are at within the spot array
        row_position_sum = [0.0] * self.array_size['y']
        col_position_sum = [0.0] * self.array_size['x']
        row_position_count = [0] * self.array_size['y']
        col_position_count = [0] * self.array_size['x']

        def within_threshold(kp_pos, predicted_pos, threshold):
            dist = np.linalg.norm(np.array(kp_pos) - np.array(predicted_pos))
            return dist < threshold
            
        # now iterating through the "expected" array positions
        avg_diam, n_diam = 0, 0
        for i in range(1, self.array_size['y'] - 1):
            for j in range(1, self.array_size['x'] - 1):
                spot_detected = False
                predicted_position = (
                    self.spacer['x'] * j + self.TL_coords['x'],
                    self.spacer['y'] * i + self.TL_coords['y']
                )
                for keypoint in keypoints:
                # iterate through the keypoints to see if one of them is at
                # the current "expected" array position
                    kp = keypoint.pt
                    if(within_threshold(kp, predicted_position, threshold_dist)):
                    # a keypoint is at the expected position if it is close
                    # enough to it
                        difference = (
                            kp[0] - predicted_position[0],
                            kp[1] - predicted_position[1]
                        )
                        array_position_offset = (
                            difference[0] / self.spacer['x'],
                            difference[1] / self.spacer['y']
                        )
                        array_position = (j + 1, i + 1)

                        new_array_position = (
                            array_position[0] + array_position_offset[0],
                            array_position[1] + array_position_offset[1]
                        )
                        new_spot = self.__create_spot(
                            array_position, new_array_position,
                            kp, keypoint.size, False
                        )
                        self.spots.append(new_spot)

                        avg_diam = (avg_diam * n_diam + keypoint.size) / (n_diam + 1)
                        n_diam = n_diam + 1

                        if(not spot_detected):
                            spot_detected = True
                            # the first spot detected at this position is used
                            # to calculate the average row and column positions
                            row_position_count[i] += 1
                            col_position_count[j] += 1
                            row_position_sum[i] += new_array_position[1]
                            col_position_sum[j] += new_array_position[0]

                        break # to only get one spot per keypoint

                if(not spot_detected):
                # if no spot has been detected at this array position,
                # then there is a spot deemed missing, unless it is
                # actually part of the frame
                    missing_spots.append((j, i))

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

        edge_spots = []
        whiteness_spots = []

        image_pixels = thresholded_image.load()

        for spot in missing_spots:
            x = spot[0]
            y = spot[1]

            if(col_position_average[x] == 0 or row_position_average[y] == 0):
                # if no average has been calculated, then we can not guess
                # the position of the missing spot
                #TODO: we can still guess it as array position * spacer
                continue;

            new_array_position = (
                col_position_average[x],
                row_position_average[y]
            )
            pixel_position = (
                int((new_array_position[0] - 1.0) * self.spacer['x']
                      + self.TL_coords['x']),
                int((new_array_position[1] - 1.0) * self.spacer['y']
                      + self.TL_coords['y'])
            )

            edge_spot = False
            possible_spot = circle_detector.detect_spot(DetectionType.EDGES,
                image_pixels, pixel_position)

            if(not possible_spot):
                possible_spot = circle_detector.detect_spot(DetectionType.WHITENESS,
                    image_pixels, pixel_position)
            else:
                edge_spot = True # spot from edges

            if(possible_spot):
                array_position = (x, y)
                new_spot = self.__create_spot(array_position, new_array_position,
                    possible_spot, avg_diam, False)
                if(edge_spot):
                    edge_spots.append(new_spot)
                else:
                    whiteness_spots.append(new_spot)

        #return (self.spots, edge_spots, whiteness_spots)
        self.__merge_spots(edge_spots)
        self.__merge_spots(whiteness_spots)

        ## Spot detection complete

        ## spots scaled up to client-side image size
        self.__scale_spots(scaling_factor)

    def __scale_spots(self, scaling_factor):
        """Spot detection is run on a scaled down image; this function
        scales up the spot pixel coordinates to a non-scaled version, 
        rending for sending back to the client.
        """
        for spot in self.spots:
            spot['renderPosition'] = {
                'x': spot['renderPosition']['x'] * scaling_factor,
                'y': spot['renderPosition']['y'] * scaling_factor,
            }
            spot['diameter'] = spot['diameter'] * scaling_factor

    def __merge_spots(self, new_spots):
        """Inserts new spots into the currently existing spots in the correct
        array order.
        """
        for new_spot in new_spots:
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

    def __create_spot(self, array_pos, new_array_pos, render_pos, diam, sel):
        """Takes tuple values of spot positions and returns a JS friendly
        dictionary spot to add to the self.spots array.
        """
        return {
            'arrayPosition': {
                'x': array_pos[0],
                'y': array_pos[1]
            },
            'newArrayPosition': {
                'x': new_array_pos[0],
                'y': new_array_pos[1]
            },
            'renderPosition': {
                'x': render_pos[0],
                'y': render_pos[1]
            },
            'diameter': diam,
            'selected': sel
        }
        

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
