# -*- coding: utf-8 -*-

from PIL import Image
import math

def distance_between(a, b):
    w = a['x'] - b['x']
    h = a['y'] - b['y']
    dist = math.sqrt(w * w + h * h)
    return dist

class Spots:
    """Holds the spot data"""
    spots = []
    keypoints = [] # generated from OpenCV spot detection

    array_size = {'x': 33, 'y': 35}
    TL_coords = { # the position of the centre of the top left spot
        'x': 1251,
        'y': 676
    }
    BR_coords = { # the position of the centre of the bottom right spot
        'x': 11780, 
        'y': 11982
    }
    spacer = {'x': 330, 'y': 333}

    def get_spots(self):
        spot_dictionary = {
            'spots': self.spots,
            'spacer': self.spacer,
        }
        return spot_dictionary
        
    def set_array_size(self, size):
        self.array_size = size

    def set_coords(self, TL, BR):
        self.TL_coords = TL
        self.BR_coords = BR
        self.spacer = {
            'x': (self.BR_coords['x'] - self.TL_coords['x'])
                 / (self.array_size['x'] - 1),
            'y': (self.BR_coords['y'] - self.TL_coords['y'])
                 / (self.array_size['y'] - 1)
        }

    def create_spots_from_keypoints(self, keypoints, size, TL, BR):
        """Takes keypoints generated from opencv and tries to match them to
        their correct array positions.
        It also tries to fill in "missing spots" by finding which array positions
        do not have a corresponding keypoint, then analyses the black/white 
        content of the thresholded image at the missing spot position in order
        to determine if a spot is likely to be there or not.
        An array of spots wrapped in a dictionary is returned.
        """
        self.keypoints = keypoints
        self.set_array_size(size)
        self.set_coords(TL, BR)

        threshold_distance = 180 # this can be adjusted for stringency

        missing_spots = []

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
            for y in range(position['y'] - radius, position['y'] + radius):
                for x in range(position['x'] - radius, position['x'] + radius):
                    pixel = {
                        'x': x,
                        'y': y
                    }
                    # this check ensures pixels are in a circle
                    if(distance_between(pixel, position) < radius):
                        pixels.append(pixel)
            return pixels

        # now iterating through the "expected" array positions
        for i in range(0, self.array_size['y']):
            for j in range(0, self.array_size['x']):
                spot_detected = False
                predicted_position = {
                    'x': self.spacer['x'] * j + self.TL_coords['x'],
                    'y': self.spacer['y'] * i + self.TL_coords['y']
                }
                for kp in self.keypoints:
                # iterate through the keypoints to see if one of them is at
                # the current "expected" array position
                    kp_position = {
                        'x': kp.pt[0],
                        'y': kp.pt[1]
                    }
                    if(distance_between(kp_position, predicted_position) < threshold_distance):
                    # a keypoint is at the expected position if it is close enough to it
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
                            'x': array_position['x'] + array_position_offset['x'],
                            'y': array_position['y'] + array_position_offset['y']
                        }
                        self.spots.append({
                            'arrayPosition': array_position,
                            'newArrayPosition': new_array_position,
                            'renderPosition': {
                                'x': kp_position['x'],
                                'y': kp_position['y']
                            },
                            'selected': False
                        })
                        if(spot_detected):
                            print("Warning: more than one spot detected for this keypoint!")
                        else:
                            spot_detected = True
                            # the first spot detected at this position is used
                            # to calculate the average row and column positions
                            row_position_count[i] += 1
                            col_position_count[j] += 1
                            row_position_sum[i] += new_array_position['y']
                            col_position_sum[j] += new_array_position['x']

                        #break # to only get one spot per keypoint

                if(not spot_detected):
                # if no spot has been detected at this array position,
                # then there is a spot deemed missing
                    missing_spots.append({'x': j, 'y': i})

        # Calculate the average row and column positions. This is to help us
        # determine the most likely positions of the missing spots.
        row_position_average = [0] * self.array_size['y']
        col_position_average = [0] * self.array_size['x']
        for row, position in enumerate(row_position_average):
            # do not do anything if there is no data for this row
            if(row_position_count[row] != 0):
                row_position_average[row] = row_position_sum[row] / float(row_position_count[row])

        for col, position in enumerate(col_position_average):
            # do not do anything if there is no data for this column
            if(col_position_count[col] != 0):
                col_position_average[col] = col_position_sum[col] / float(col_position_count[col])

        # Open up processed (brightness, contrast, threshold) image for reading
        # of pixel values. This is very RAM heavy. Alternatively, one may
        # crop out each surrounding pixel area, and analyse the whiteness of these
        thresholded_image = Image.open("BCT_image_after.jpg")
        image_pixels = thresholded_image.load()
        filled_in_spots = []
        for spot in missing_spots:
            x = spot['x']
            y = spot['y']
            array_position = {
                'x': x + 1,
                'y': y + 1
            }

            new_array_position = {
                'x': col_position_average[x],
                'y': row_position_average[y]
            }
            pixel_position = {
                'x': int((new_array_position['x'] - 1.0) * self.spacer['x'] + self.TL_coords['x']),
                'y': int((new_array_position['y'] - 1.0) * self.spacer['y'] + self.TL_coords['y'])
            }

            whiteness = 0
            whiteness_threshold = 254.0

            pixels = get_surrounding_pixels(pixel_position, 50)
            for pixel in pixels:
                # calculating the "whiteness" of area at that position
                # these should all be 255 if white, 0 if black
                pixel_r, pixel_g, pixel_b = image_pixels[pixel['x'], pixel['y']]
                # the images are in greyscale so only one channel needs to be checked
                whiteness += pixel_r
                
            whiteness_average = float(whiteness) / float(len(pixels))
            if(whiteness_average < whiteness_threshold):
                # not yet added in order
                filled_in_spots.append({
                    'arrayPosition': array_position,
                    'newArrayPosition': new_array_position,
                    'renderPosition': pixel_position,
                    'selected': True
                })

        # Inserting the filled-in spots in the correct order in the spots array
        # this is identical to the JS version in spot-adjuster.js
        for new_spot in filled_in_spots:
            new_spot_order = new_spot['arrayPosition']['y'] * self.array_size['x'] + new_spot['arrayPosition']['x']
            for i in range(0, len(self.spots)):
                spot = self.spots[i]
                spot_order = spot['arrayPosition']['y'] * self.array_size['x'] + spot['arrayPosition']['x']
                if(new_spot_order <= spot_order):
                    self.spots.insert(i, new_spot)
                    break
                elif(new_spot_order > spot_order):
                    # if the order is higher than the last spot, append to array
                    if(i == len(self.spots) - 1):
                        self.spots.append(new_spot)
                        break

        spot_dictionary = {'spots': self.spots}
        return spot_dictionary
