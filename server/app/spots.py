# -*- coding: utf-8 -*-

import itertools as it

import numpy as np
from sklearn.cluster import KMeans

from .circle_detector import CircleDetector, DetectionType


CIRCLE_DETECTOR = CircleDetector()


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
        """Wraps detected spot positions and calibration coordinates in dict"""
        return {
            'positions': self.spots.tolist(),
            'tl': self.tl.tolist(),
            'br': self.br.tolist(),
        }

    def create_spots_from_keypoints(self, keypoints, thresholded_image):
        """Takes keypoints generated from opencv spot detection and
        tries to match them to their correct array positions.
        It also tries to fill in "missing spots" by finding which array
        positions do not have a corresponding keypoint, then analyses the
        pixels around that position to determine if a spot is likely
        to be there or not.
        """
        if len(keypoints) < max(*self.array_size):
            raise RuntimeError('Too few keypoints')

        spots = np.array(list(zip(*[x.pt + (x.size,) for x in keypoints])))

        xmeans, ymeans = [
            np.sort([np.mean(zs[c == k]) for k in range(n)])
            for zs, n, c in zip(
                spots,
                self.array_size,
                [
                    KMeans(n_clusters=k).fit_predict(np.transpose([zs]))
                    for k, zs in zip(self.array_size, spots)
                ]
            )
        ]

        def _bin_search(xs, x):
            def _do(l, h):
                if h - l == 1:
                    return l, h
                m = (h + l) // 2
                if xs[m] >= x:
                    return _do(l, m)
                return _do(m, h)
            l, h = _do(0, len(xs) - 1)
            return h if xs[h] - x < x - xs[l] else l

        bins = np.zeros(self.array_size)
        for x, y, _ in zip(*spots):
            bins[_bin_search(xmeans, x), _bin_search(ymeans, y)] += 1

        missing_spots = []
        for x, y in it.product(*map(range, self.array_size)):
            if bins[x, y] == 0:
                missing_spots.append((x, y))

        image_pixels = thresholded_image.load()

        for x, y in missing_spots:
            for res in (
                    CIRCLE_DETECTOR.detect_spot(
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
