# -*- coding: utf-8 -*-

from imageprocessor import ImageProcessor
import numpy
from PIL import Image, ImageDraw

image_processor = ImageProcessor()

image = Image.open("circles/testimage.jpg")
image_pixels = image.load()

positions = [

    (116, 195), (200, 195),
                (200, 282),             (366, 282), (462, 282), (542, 282),
    (116, 370),             (287, 370)
]
#positions = [
#    (116, 106), (200, 106), (287, 106), (366, 106), (462, 106), (542, 106), (631, 106),
#    (116, 195), (200, 195), (287, 195), (366, 195), (462, 195), (542, 195), (631, 195),
#    (116, 282), (200, 282), (287, 282), (366, 282), (462, 282), (542, 282), (631, 282),
#    (116, 370), (200, 370), (287, 370), (366, 370), (462, 370), (542, 370), (631, 370)
#]

def get_pixel_pos_array(position, direction, length):
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

def intensity_at(position):
    r, g, b = image_pixels[position[0], position[1]]
    return r

def is_circle(position, search_radius):
    directions = [
        ( 1.0,  0.0),
        ( 1.0,  1.0),
        ( 0.0,  1.0),
        (-1.0,  1.0),
        (-1.0,  0.0),
        (-1.0, -1.0),
        ( 0.0, -1.0),
        ( 1.0, -1.0)
    ]
    
    def bb_from_points(points):
        """Returns a bounding box containing all the points."""
        min_x = min(points, key=lambda point: (point[0]))[0]
        max_x = max(points, key=lambda point: (point[0]))[0]
        min_y = min(points, key=lambda point: (point[1]))[1]
        max_y = max(points, key=lambda point: (point[1]))[1]
        return(min_x, min_y, max_x, max_y)

    def edge_detected(position, direction, search_radius):
        pixels = get_pixel_pos_array(position, direction, search_radius)
        intensities = [intensity_at(pixel) for pixel in pixels]
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

    edges = [edge_detected(position, direction, search_radius) for direction in directions]
    edges = [edge for edge in edges if edge is not None] # remove all "None"s
    
    if(len(edges) < 4): # not enough edges to be a circle
        print("Not enough edges.")
        return False

    b_box = bb_from_points(edges)
    print(edges)
    print(b_box)
    centre = (
        (b_box[0] + b_box[2]) / 2.0,
        (b_box[1] + b_box[3]) / 2.0
    )
    print(centre)
    # distances of the edges from the centroid
    radii = [numpy.linalg.norm(numpy.array(centre) - numpy.array(edge)) for edge in edges]
    radius_mean = numpy.mean(radii)
    radius_std = numpy.std(radii)

    if(radius_std < radius_mean * 0.20):
        print("It seems to be a valid circle!")
        return centre
    else:
        print("Points not circley enough.")
        print("the std radius is %f and there is the mean %f, which is higher than the condition of %f" %(radius_std, radius_mean, radius_mean * 0.20))
        return False

pixel_length = 50
bolp = []
for i, position in enumerate(positions):
    print("number %d" %i)
    bolp.append(is_circle(position, pixel_length))
    print("\n")

spot_radius = 10
canvas = ImageDraw.Draw(image)
for bol in bolp:
    if(bol):
        render_spot = [
            bol[0] - spot_radius,
            bol[1] - spot_radius,
            bol[0] + spot_radius,
            bol[1] + spot_radius
        ]
        canvas.ellipse(render_spot, fill=(255, 255, 0), outline=None)

image.save("circletestoutput.jpg")
