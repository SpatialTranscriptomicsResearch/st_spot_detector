# -*- coding: utf-8 -*-

import numpy as np
from sklearn.cluster import DBSCAN


def keypoints2spots(kps):
    """ Converts keypoints to spots
    """
    xs, ys, sizes = spots = \
        np.array(list(zip(*[x.pt + (x.size,) for x in kps])))

    def _find_groups(zs):
        labels = DBSCAN(np.mean(sizes) / 2).fit_predict(zs.reshape(-1, 1))
        means = np.sort([
            np.mean(vals)
            for vals in
            [
                zs[labels == k]
                for k in range(labels.max())
            ]
            if len(vals) > 10
        ])
        if len(means) == 0:  # pylint: disable=len-as-condition
            raise RuntimeError('Failed to find spot groups')
        spacing = np.median(means[1:] - means[:-1])
        fst, lst = means[0], means[-1]
        n = round((lst - fst) / spacing) + 1
        return fst, lst, n

    x0, x1, nx = _find_groups(xs)
    y0, y1, ny = _find_groups(ys)

    return dict(
        positions=np.transpose(spots),
        tl=np.array([x0, y0]),
        br=np.array([x1, y1]),
        nx=nx,
        ny=ny,
    )
