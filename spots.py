# -*- coding: utf-8 -*-

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
        spot_dictionary = {'spots': self.spots}
        return spot_dictionary
        
    def create_spots(self):
        """Temporary function manually creates some 'arbitrary' spots"""
        self.spacer = {'x': 330, 'y': 333};
        self.TL_coords = {'x': 5100, 'y': 4730};
        for i in range(0, array_size['x']):
            for j in range(0, array_size['y']):
                self.spots.append({
                    'arrayPosition': {'x': j + 1, 'y': i + 1},
                    'renderPosition': {'x': self.spacer['x'] * j + self.TL_coords['x'],
                                       'y': self.spacer['y'] * i + self.TL_coords['y']},
                    'selected': False,
                    'size': 90
                })
        spot_dictionary = {'spots': self.spots}
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

    def create_spots_from_keypoints(self):
        """Takes keypoints generated from opencv and tries to match them to
        their correct array coordinate.
        An array of spots wrapped in a dictionary is returned.
        """
        threshold_distance = 80
        for i in range(0, self.array_size['x']):
            for j in range(0, self.array_size['y']):
                predicted_position = {'x': self.spacer['x'] * j + self.TL_coords['x'],
                                      'y': self.spacer['y'] * i + self.TL_coords['y']
                }
                for kp in self.keypoints:
                    kp_position = {
                        'x': kp.pt[0],
                        'y': kp.pt[1]
                    }
                    if(distance_between(kp_position, predicted_position) < threshold_distance):
                        self.spots.append({
                            'arrayPosition': {'x': j + 1, 'y': i + 1},
                            'renderPosition': {'x': kp_position['x'],
                                               'y': kp_position['y']
                            },
                            'selected': False,
                            'size': 90
                        })
                        if(kp_position['x'] > 11790):
                            print("This exceeds the x limit")
                            print(str(kp_position['x']) + ", " + str(kp_position['y']))
        spot_dictionary = {'spots': self.spots}
        return spot_dictionary
