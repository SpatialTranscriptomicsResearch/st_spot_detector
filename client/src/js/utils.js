import math from 'mathjs';

/**
 * Transforms a mathjs matrix to an array that can be used with the
 * CanvasRenderingContext2d.setTransform method.
 */
export function mathjsToTransform(matrix) {
    /* eslint-disable no-underscore-dangle */
    return [
        ...matrix.subset(math.index([0, 1], 0))._data,
        ...matrix.subset(math.index([0, 1], 1))._data,
        ...matrix.subset(math.index([0, 1], 2))._data,
    ];
}

/**
 * Transforms an array compatible with the
 * CanvasRenderingContext2d.setTransform method to a mathjs matrix.
 */
export function transformToMathjs(matrix) {
    return math.matrix([
        [matrix[0], matrix[2], matrix[4]],
        [matrix[1], matrix[3], matrix[5]],
        [0, 0, 1],
    ]);
}
