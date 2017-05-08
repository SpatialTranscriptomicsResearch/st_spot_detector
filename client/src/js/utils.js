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

/**
 * Left-multiply Vec2 vector by mathjs transformation matrix
 */
export function mulVec2(matrix, vector) {
    return _.compose(
        /* eslint-disable no-underscore-dangle */
        v => Vec2.Vec2(...v._data),
        v => math.subset(v, math.index([0, 1])),
        v => math.multiply(matrix, v),
        v => math.matrix([v.x, v.y, 1]),
    )(vector);
}

/**
 * Transforms canvas vector to its corresponding image coordinates in a given layer
 */
export function toLayerCoordinates(layer, vector) {
    return mulVec2(math.inv(layer.tmat), vector);
}

/**
 * Transforms the image coordinates of a point in a given layer to its corresponding canvas vector
 * (inverse of {@link toLayerCoordinates})
 */
export function fromLayerCoordinates(layer, vector) {
    return mulVec2(layer.tmat, vector);
}
