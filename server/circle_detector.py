# -*- coding: utf-8 -*-

import numpy
from PIL import Image, ImageDraw

class DetectionType:
    EDGES = 1
    WHITENESS = 2

class CircleDetector:
    """Contains functions which returns circles found at given positions in a
    given pixel array.
    """

    __directions = [
        ( 1.0,  0.0),
        ( 1.0,  1.0),
        ( 0.0,  1.0),
        (-1.0,  1.0),
        (-1.0,  0.0),
        (-1.0, -1.0),
        ( 0.0, -1.0),
        ( 1.0, -1.0)
    ]
    __pairs = [(0, 4), (1, 5), (2, 6), (3, 7)]

    __search_radius = 50

    def detect_spots(self, detection_type, image_pixels, positions):
        """Takes an array of positions and image pixels and uses either
        whiteness detection or circle-detection to determine if a spot is
        there or not.
        Returns an array of the corresponding detected spot positions or
        None, if no spot is found there.
        """
        spot_array = []
        if(detection_type == DetectionType.EDGES):
            for position in positions:
                spot_edges = self.__edges_at_position(
                    image_pixels, position, self.__search_radius)
                spot = self.__circle_from_edges(spot_edges)
                spot_array.append(spot)
        elif(detection_type == DetectionType.WHITENESS):
            pass
        else:
            raise Exception('Invalid detection_type parameter; must be DetectionType')
        return spot_array

    def __get_pixel_pos_array(self, position, direction, length):
        """returns an array of positions from a certain position
        in a certain direction for a certain number
        of pixels (length)
        """
        pixels = []
        for i in range(length):
            pixel = (
                position[0] + i * direction[0],
                position[1] + i * direction[1]
            )
            pixels.append(pixel)

        return pixels

    def __intensity_at(self, image_pixels, position):
        r, g, b = image_pixels[position[0], position[1]]
        return r

    def __bb_from_points(self, points):
        """Returns a bounding box containing all the points."""
        min_x = min(points, key=lambda point: (point[0]))[0]
        max_x = max(points, key=lambda point: (point[0]))[0]
        min_y = min(points, key=lambda point: (point[1]))[1]
        max_y = max(points, key=lambda point: (point[1]))[1]
        return(min_x, min_y, max_x, max_y)

    def __edge_detected(self, image_pixels, position, direction, search_radius):
        """Crawls along a line of pixels at a given position and direction
        and determines whether there is a sudden intensity increase
        which may be spot edge.
        """
        pixels = self.__get_pixel_pos_array(position, direction, search_radius)
        intensities = [self.__intensity_at(image_pixels, pixel) for pixel in pixels]
        averages = []
        differences = []
        for i, intensity in enumerate(intensities):
            # these averages check for the last four backwards;
            # probably want to makke them check for ones in front, too
            intensity = float(intensity)
            if(i == 0):
                continue
            elif(i == 1):
                intensity2 = float(intensities[i-1])
                averages.append((intensity + intensity2)/2.0)
            elif(i == 2):
                intensity2 = float(intensities[i-1])
                intensity3 = float(intensities[i-2])
                averages.append((intensity + intensity2 + intensity3)/3.0)
            else:
                intensity2 = float(intensities[i-1])
                intensity3 = float(intensities[i-2])
                intensity4 = float(intensities[i-3])
                averages.append((intensity + intensity2 + intensity3 + intensity4)/4.0)

        for i, average in enumerate(averages):
            if(i == 0):
                continue
            differences.append(average - averages[i - 1])

        peak, index = max([(difference, i) for i, difference in enumerate(differences)])
        difference_mean = numpy.mean(differences)
        difference_std = numpy.std(differences)

        if(peak > difference_mean + 2 * difference_std and difference_mean > 0):
            # also need to check if outlier
            peak = (
                position[0] + (index + 2) * direction[0],
                position[1] + (index + 2) * direction[1]
            )
        else:
            print("No peak.")
            peak = None

        return peak

    def __edges_at_position(self, image_pixels, position, search_radius):
        """Given an image array and a position in the image, determines if
        there is are edges located there at certain directions out from the
        given position.
        Returns an array of edges corresponding to the directions searched.
        """
        edges = [self.__edge_detected(image_pixels, position, direction, search_radius) for direction in self.__directions]

        for pair in self.__pairs:
            edge_a = edges[pair[0]]
            edge_b = edges[pair[1]]
            if(not edge_a or not edge_b):
                continue

            edge_a = numpy.array(edge_a)
            edge_b = numpy.array(edge_b)

            dist = numpy.linalg.norm(edge_a - edge_b)
            if(dist > 58): # quite a "hardcoded" value: will not work as well for stretched images
                print("Discarding a point! It is too far away")
                dist_a = numpy.linalg.norm(numpy.array(position) - edge_a)
                dist_b = numpy.linalg.norm(numpy.array(position) - edge_b)
                if(dist_a > dist_b):
                    edges[pair[0]] = None
                else:
                    edges[pair[1]] = None

        edges = [edge for edge in edges if edge is not None] # remove all "None"s
        return edges
        
    def __circle_from_edges(self, edges):
        """Given an array of edges, determine if they form a circle or not
        based on the distances of the edges from their centre.
        Returns the circle centre if one is found, otherwise returns None.
        """

        if(len(edges) < 4): # not enough edges to be a circle
            print("Not enough edges.")
            return None

        b_box = self.__bb_from_points(edges)
        print(edges)
        print(b_box)
        centre = (
            (b_box[0] + b_box[2]) / 2.0,
            (b_box[1] + b_box[3]) / 2.0
        )
        print(centre)
        # distances of the edges from the centre
        radii = [numpy.linalg.norm(numpy.array(centre) - numpy.array(edge)) for edge in edges]
        radius_mean = numpy.mean(radii)
        radius_std = numpy.std(radii)

        if(radius_std < radius_mean * 0.20):
            print("It seems to be a valid circle!")
            return centre
        else:
            print("Points not circley enough.")
            print("the std radius is %f and there is the mean %f, which is higher than the condition of %f" %(radius_std, radius_mean, radius_mean * 0.20))
            return None
