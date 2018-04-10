import $ from 'jquery';
import _ from 'underscore';
import math from 'mathjs';

import Vec2 from './viewer/vec2';

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

/**
 * Computes the ''inner integer bounding box'' of a hypercube, given its center and side length.
 */
export function intBounds(center, length) {
    return _.map(center, c => _.map([-1, 1], k => k * Math.floor(length + (k * c))));
}

/**
 * Computes all possible combinations between the elements in two arrays.
 */
export function combinations(arr1, arr2) {
    return _.reduce(
        _.map(arr1, a1 => _.map(arr2, a2 => [a1, a2])),
        (a, x) => a.concat(x),
        [],
    );
}

/**
 * Splits an array a into subarrays, each of length n. If the length of a isn't divisible by n, the
 * last subarray will have length n % a.length.
 */
export function chunksOf(n, a) {
    if (a.length <= n) {
        return [a];
    }
    const ret = [_.take(a, n)];
    ret.push(...chunksOf(n, _.drop(a, n)));
    return ret;
}

/**
 * Sets the current cursor.
 */
export function setCursor(name) {
    // FIXME: remove when there's wider support for unprefixed names
    const tryAdd = ([prefix, ...rest]) => {
        if (prefix === undefined) {
            throw new Error(`Unable to set cursor '${name}'`);
        }
        const prefixName = `${prefix}${name}`;
        $('body').css('cursor', prefixName);
        if ($('body').css('cursor') !== prefixName) {
            tryAdd(rest);
        }
    };
    tryAdd([
        '',
        '-webkit-',
        '-moz-',
        '-ms-',
        '-o-',
    ]);
}
