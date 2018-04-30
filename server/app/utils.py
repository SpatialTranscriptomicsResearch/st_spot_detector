"""utility functions"""


from functools import reduce

import numpy as np


def chunks_of(n, list_):
    """
    Splits list into sublists, each of length n. If the length of the list is
    not divisible by n, the last sublist will have length len(list) % n. The
    result is provided as a generator.

    >>> list(chunks_of(3, list(range(10))))
    [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]
    """
    # convert to numpy array first, since slicing in numpy is O(1)
    list_ = np.array(list_)
    while list_.size > 0:
        yield list_[:n].tolist()
        list_ = list_[n:]


def bits_to_int(list_):
    """
    Converts a big-endian bit string to its integer representation.

    >>> bits_to_int([1, 0, 1])
    5
    """
    return reduce(
        lambda a, x: a | (1 << x[1]) if x[0] == 1 else a,
        zip(list_, range(len(list_) - 1, -1, -1)),
        0,
    )

def bits_to_ascii(list_):
    """
    Converts a big-endian bit string to its ASCII-representation.

    >>> bits_to_ascii([1,0,0,1,0,0,0,1,1,0,0,1,0,1,1,1,1,1,0,0,1,0,1,0,0,0,0,1])
    'Hey!'
    """
    return reduce(
        lambda a, x: a + chr(x),
        map(bits_to_int, chunks_of(7, list_)),
        '',
    )

def equal(list_):
    """
    Returns True iff all the elements in a list are equal.

    >>> equal([1,1,1])
    True
    """
    return reduce(
        lambda a, x: a and (x[0] == x[1]),
        zip(list_[1:], list_[:-1]),
        True,
    )
