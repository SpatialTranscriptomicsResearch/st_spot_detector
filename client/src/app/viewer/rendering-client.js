/** @module rendering-client */

import _ from 'underscore';

import { Messages, Responses } from 'worker/return-codes';

import { MAX_CACHE_SIZE, WORKER_PATH } from '../config';

/**
 * Return code enum for {@link module:rendering-client~RenderingClient}. Contains the following
 * keys:
 *
 * - OOB (Requested tile is out of bounds; callback will not be called)
 * - SFC (Tile is being served from cache; callback has already been called)
 * - SFW (Tile is being served from worker; callback will be called when the worker returns)
 *
 * @type {object}
 */
const ReturnCodes = Object.freeze({
    OOB: 'Out of bounds',
    SFC: 'Serving from cache',
    SFW: 'Serving from worker',
});

// private members
const cache = Symbol('Tile cache');
const data = Symbol('Tile data');
const fltr = Symbol('Filters');
const cmod = Symbol('Current modifiers');
const mthrd = Symbol('Maximum number of threads');
const queue = Symbol('Rendering queue');
const tn = Symbol('Number of tiles');
const wrk = Symbol('Available workers');

function serializeId(x, y, z) {
    return [x, y, z].join('#');
}

function unserializeId(id) {
    return _.map(id.split('#'), x => parseInt(x, 10));
}

function createImageData(uri) {
    return new Promise((resolve) => {
        const image = new Image();
        image.src = uri;
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = image.width;
            canvas.height = image.height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(image, 0, 0);

            resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
        };
    });
}

/* eslint-disable no-param-reassign */
// (must set the onmessage attribute on the assigned worker.)
function startJob(id, jpg, worker) {
    /* eslint-disable consistent-return */
    // (this function will always return undefined but we need the return statement in order for the
    // VM to do tail call optimization.)
    worker.onmessage = (e) => {
        const [msg, [tileData]] = e.data;
        const [x, y, z] = unserializeId(id);
        if (msg === Responses.SUCCESS) {
            const tile = document.createElement('canvas');
            tile.width = tileData.width;
            tile.height = tileData.height;

            const ctx = tile.getContext('2d');
            ctx.putImageData(tileData, 0, 0);

            this[cache].set(id, tile);
            this.callback(tile, x, y, z);

            // remove tile objects in insertion order until size is below MAX_CACHE_SIZE.
            // (assume image data is stored as uint8 in four channels.)
            const tileSize = tile.height * tile.width * 4;
            const removeN = Math.max(
                0, this[cache].size - Math.floor(MAX_CACHE_SIZE / tileSize));
            Array.from(this[cache].keys()).slice(0, removeN)
                .forEach(key => this[cache].delete(key));
        }

        // replace current job with a new one if there is one in queue
        while (this[queue].length > 0) {
            const [curId, curJpg] = this[queue].pop();
            if (this[cache].has(curId)) {
                return startJob.apply(this, [curId, curJpg, worker]);
            }
            // else: job has already been removed from cache, so we skip it
        }

        // no more jobs in queue, so we retire our worker to the worker pool
        this[wrk].push(worker);
    };

    createImageData(jpg).then((imagedata) => {
        worker.postMessage(
            [
                Messages.AFLTR,
                [imagedata, this[cmod]],
            ],
            [imagedata.data.buffer],
        );
    });
}

/**
 * Tile server. Tiles are rendered using {@link module:rendering-worker}.
 */
class RenderingClient {
    /**
     * Constructs the rendering client.
     *
     * @param {number} maxThreads - The maximum number of concurrent workers.
     * @param {function} callback - The function to call upon completing a tile request. The
     * function will be called with the arguments (tile, x, y, z), where tile is the requested tile
     * and (x, y, z) is its coordinates.
     */
    constructor(maxThreads, callback) {
        this[mthrd] = maxThreads;

        this[cache] = new Map();
        this[fltr] = {};
        this[queue] = [];
        this[wrk] = [];

        const worker = new Worker(WORKER_PATH);
        worker.onmessage = (e) => {
            worker.terminate();
            const [msg, [filters]] = e.data;
            if (msg === Responses.SUCCESS) {
                _.each(filters, (f) => { this[fltr][f] = true; });
            } else {
                throw new Error('Failed to get filters from worker.');
            }
        };
        worker.postMessage([Messages.GFLTR, null]);

        this.callback = callback;
    }

    /**
     * Loads the tile data and initializes the rendering workers.
     *
     * @param {object} tileData - The tiles. Must support the []-operator so that the tile at
     * position (x, y, z) can be retrieved using data[z][x][y].
     * @param {Array} histogram - The histogram of the image. The slices 0-255, 256-511, and 512-767
     * should contain the frequencies of the R, G, and B pixel intensities, respectively. For
     * example, the number of pixels having intensity 100 in the green channel should be equal to
     * histogram[356].
     * @returns {Promise} A promise that resolves to the current instance if the initialization
     * succeeds.
     */
    loadTileData(tileData, histogram) {
        this[data] = tileData;
        this[tn] = Object.entries(this[data]).reduce((acc, [k, v]) => {
            acc[k] = [v.length, v[0].length];
            return acc;
        }, {});

        this[wrk] = [];
        return new Promise((resolve, reject) => {
            let rejected = false;
            let resolveCount = this[mthrd];
            const workers = _.map(_.range(this[mthrd]), () => new Worker(WORKER_PATH));
            _.each(workers, (w) => {
                w.onmessage = (e) => {
                    const [msg, [reason]] = e.data;
                    if (msg === Responses.SUCCESS && rejected === false) {
                        this[wrk].push(w);
                        resolveCount -= 1;
                        if (resolveCount <= 0) {
                            resolve(this);
                        }
                    } else if (rejected === false) {
                        this[wrk] = [];
                        rejected = true;
                        reject(reason);
                    }
                };
                w.postMessage([Messages.RGHST, [histogram]]);
            });
        });
    }

    /**
     * Request tile with coordinates (x, y, z). If the there is no worker available, the request
     * will be pushed to a LIFO queue.
     *
     * @param {number} x - The x coordinate.
     * @param {number} y - The y coordinate.
     * @param {number} z - The z coordinate (i.e., the zoom level).
     * @returns {string} The appropriate return code from {@link
     * module:rendering-client~ReturnCodes}.
     */
    request(x, y, z, modifiers) {
        if (!(
            z in this[tn] &&
            x >= 0 && x < this[tn][z][0] &&
            y >= 0 && y < this[tn][z][1]
        )) {
            return ReturnCodes.OOB;
        }

        const id = serializeId(x, y, z, modifiers);
        const modFilter = _.filter(Object.entries(modifiers), e => e[0] in this[fltr]);

        if (!_.isEqual(modFilter, this[cmod])) {
            // all previous requests are out of date, so we clear the cache and the queue
            this[cache].clear();
            this[queue] = [];
            this[cmod] = modFilter;
        } else if (this[cache].has(id)) {
            const item = this[cache].get(id);
            if (item === null) {
                return ReturnCodes.SFW;
            }
            this.callback(item, x, y, z);
            return ReturnCodes.SFC;
        }

        if (this[wrk].length > 0) {
            const worker = this[wrk].pop();
            startJob.apply(this, [id, this[data][z][x][y], worker]);
        } else {
            this[queue].push([id, this[data][z][x][y]]);
        }
        this[cache].set(id, null);
        return ReturnCodes.SFC;
    }

    /**
     * Generator that calls {@link RenderingClient#request} on all tiles within a given bounding
     * box.
     *
     * @param {number} xmin - The minimum x coordinate.
     * @param {number} ymin - The minimum y coordinate.
     * @param {number} xmax - The maximum x coordinate.
     * @param {number} ymax - The maximum y coordinate.
     * @param {number} z - The z coordinate (i.e., the zoom level).
     * @returns {object} An iterator yielding the Array [x, y, z, returnCode] for each tile within
     * the bounding box, where (x, y, z) is the coordinates of the tile and returnCode is the
     * appropriate return code from {@link module:rendering-client~ReturnCodes}.
     */
    * requestAll(xmin, ymin, xmax, ymax, z, modifiers) {
        for (let x = xmin; x <= xmax; x += 1) {
            for (let y = ymin; y <= ymax; y += 1) {
                yield [x, y, z, this.request(x, y, z, modifiers)];
            }
        }
    }
}

export default RenderingClient;
export { ReturnCodes };
