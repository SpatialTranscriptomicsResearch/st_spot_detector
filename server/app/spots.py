# -*- coding: utf-8 -*-

from functools import partial
import itertools as it
import warnings

from PIL import Image
import numpy as np
from sklearn.cluster import KMeans

from .circle_detector import CircleDetector, DetectionType

warnings.simplefilter('ignore', Image.DecompressionBombWarning)
Image.MAX_IMAGE_PIXELS=None

circle_detector = CircleDetector()

class Spots:
    """Holds the spot data. These spots are stored with positions relative
    to the originally-uploaded Cy3 image.
    """
    # pylint: disable=invalid-name

    def __init__(self, array_size, scaling_factor):
        self.spots = []
        self.tissue_spots = []
        self.array_size = array_size
        self.scaling_factor = scaling_factor
        self.tl = [0, 0]
        self.br = [0, 0]

    def wrap_spots(self):
        spot_dictionary = {
            'positions': self.spots.tolist(),
            'tl': self.tl.tolist(),
            'br': self.br.tolist(),
        }
        return spot_dictionary

    def create_spots_from_keypoints(self, keypoints, thresholded_image):
        """Takes keypoints generated from opencv spot detection and
        tries to match them to their correct array positions.
        It also tries to fill in "missing spots" by finding which array
        positions do not have a corresponding keypoint, then analyses the
        pixels around that position to determine if a spot is likely
        to be there or not.
        """
        spots = np.array(list(zip(*[x.pt + (x.size,) for x in keypoints])))

        labels = [
            KMeans(n_clusters=k).fit_predict(np.transpose([zs]))
            for k, zs in zip(self.array_size, spots)
        ]
        xmeans, ymeans = [
            np.sort([np.mean(zs[c == k]) for k in range(n)])
            for zs, n, c in zip(spots, self.array_size, labels)
        ]

        def bin_search(xs, x):
            # pylint: disable=missing-docstring
            def do(l, h):
                if h - l == 1:
                    return l, h
                m = (h + l) // 2
                if xs[m] >= x:
                    return do(l, m)
                return do(m, h)
            l, h = do(0, len(xs) - 1)
            return h if xs[h] - x < x - xs[l] else l

        bins = np.zeros(self.array_size)
        for x, y, _ in zip(*spots):
            bins[bin_search(xmeans, x), bin_search(ymeans, y)] += 1

        missing_spots = []
        for x, y in it.product(*map(range, self.array_size)):
            if bins[x, y] == 0:
                missing_spots.append((x, y))

        image_pixels = thresholded_image.load()

        for x, y in missing_spots:
            for res in (
                    circle_detector.detect_spot(
                        t,
                        image_pixels,
                        (xmeans[x], ymeans[y]),
                    ) for t in (
                        DetectionType.EDGES,
                        DetectionType.WHITENESS,
                    )
            ):
                if res is not None:
                    spots = np.concatenate([
                        spots,
                        np.transpose([res + (0,)]),
                    ], axis=1)
                    break

        self.spots = np.transpose(spots) * self.scaling_factor
        self.tl, self.br = np.transpose([
            xmeans[[0, -1]],
            ymeans[[0, -1]],
        ]) * self.scaling_factor
