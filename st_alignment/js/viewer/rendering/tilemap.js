/* jshint loopfunc: true */

(function() {
  "use strict";


  // TODO: Move to some kind of global config file
  const WORKER_PATH = 'js/viewer/rendering/worker.js';
  const CACHE_MAX_SIZE = 200;


  this.Tile = class {
    constructor(image, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight) {
      this.image = image;
      this.sx = sx;
      this.sy = sy;
      this.sWidth = sWidth;
      this.sHeight = sHeight;
      this.dx = dx;
      this.dy = dy;
      this.dWidth = dWidth;
      this.dHeight = dHeight;
    }
  };


  this.Tilemap = class {

    constructor(data, callback1, callback2) {
      this._tileSize = new Array(2);
      this._zoomLevels = [];
      this._orig = {};
      this._cache = new Map();
      this._histogram = new Array(256);

      var [cb1, ...args1] = callback1;
      var [cb2, ...args2] = callback2;

      if (data !== undefined)
        this.loadTilemap(data, cb1, ...args1);

      this._worker = new Worker(WORKER_PATH);
      this._worker.onmessage = (e, t) => {
        if (e[0] === RWMSG.ERROR)
          throw new Exception(e[1]);

        this._worker.onmessage = (e, t) => {
          var [
            msg, [
              [z, r, c, filters], tile
            ]
          ] = e.data;
          if (msg !== RWMSG.SUCESS)
            return;
          this._arrayBufferToBitmap(tile).then(
            (im) => {
              this._cache.set(
                this._serializeId(z, r, c, filters),
                im
              );
              while (this._cache.size > CACHE_MAX_SIZE)
                this._cache.delete(this._cache.keys().next().value);
              cb2(this._createTileObject(im, z, r, c), ...args2);
            }
          );
        };
      };
      this._worker.postMessage([RWMSG.INIT, null]);
    }

    loadTilemap(data, callback, ...args) {
      var numLeft = 0;
      for (let t of Object.values(data))
        numLeft += t.reduce((acc, r) => acc + r.length, 0);

      var callback_ = () => {
        if (--numLeft === 0) {
          [this._tileSize[0], this._tileSize[1]] = [
            this._orig[this._zoomLevels[0]][0][0].width,
            this._orig[this._zoomLevels[0]][0][0].height
          ];

          // tileCanvas is used as a "throw-away" canvas for the conversion
          // between ArrayBuffer and ImageBitmap. It is only used in the
          // _arrayBufferToBitmap and _bitmapToArrayBuffer routines (and below
          // for creating the null tile). Nevertheless, we create it here only
          // once, since creating DOM elements is costly.
          // TODO: It will be better to draw to an OffscreenCanvas in the worker
          // once there is wider browser support:
          // https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas#Browser_compatibility
          // Optimally, all rendering work (apart from drawing the
          // OffscreenCanvas to the DOM canvas) should be done in worker
          // threads.
          this._tileCanvas = document.createElement('canvas');
          this._tileContext = this._tileCanvas.getContext('2d');
          [this._tileCanvas.height, this._tileCanvas.width] = this._tileSize;

          // FIXME: chrome crashes when computing histogram on zoom level 0
          // probably OK to compute it at a higher zoom level, although the
          // 'black border' problem needs to be fixed.
          this._histogram = this.getHistogram(this._zoomLevels[4]);
          this._worker.postMessage([RWMSG.SET_HISTOGRAM, this._histogram]);
          // TODO: should wait for worker to pass back success

          this._tileContext.fillRect(
            0, 0, this._tileSize[1], this._tileSize[0]
          );
          createImageBitmap(this._tileCanvas).then((im) => {
            this._nullTile = im;

            this._cache.clear();

            if (callback !== undefined)
              callback(...args);
          });
        }
      };

      for (let [z, tiles] of Object.entries(data)) {
        this._zoomLevels.push(parseInt(z));
        this._orig[z] = [];
        for (let r = 0; r < tiles.length; ++r) {
          let imarr = new Array(tiles[r].length);
          this._orig[z].push(imarr);
          for (let c = 0; c < tiles[r].length; ++c) {
            createImageBitmap(
              dataURItoBlob(tiles[r][c])
            ).then((im) => {
              imarr[c] = im;
              callback_(...args);
            });
          }
        }
      }

      this._zoomLevels.sort((a, b) => a > b ? 1 : -1);
    }

    getHistogram(z) {
      var [r, c] = [
        this._orig[z].length,
        this._orig[z][0].length
      ];

      var canvas = document.createElement('canvas');
      [canvas.width, canvas.height] = [
        c, r
      ].map((v, i) => v * this._tileSize[i]);

      var context = canvas.getContext('2d');
      for (let i = 0; i < r; ++i)
        for (let j = 0; j < c; ++j)
          context.drawImage(
            this._orig[z][i][j],
            j * this._tileSize[1],
            i * this._tileSize[0]
          );

      var imageData = context.getImageData(0, 0, canvas.width, canvas.height);

      return computeHistogram(imageData.data);
    }

    getTileSize() {
      return this._tileSize;
    }

    getZoomLevels() {
      return this._zoomLevels;
    }

    getTile(z, r, c, filters) {
      filters = filters || [];
      var id = this._serializeId(z, r, c, filters);
      if (this._cache.has(id)) {
        let ret = this._cache.get(id);
        if (ret !== 0)
          return {
            msg: Tilemap.FLAG.SUCCESS,
            tile: this._createTileObject(ret, z, r, c)
          };
        else
          return {
            msg: Tilemap.FLAG.IGNORED,
            tile: this._createTileObject(this._getTile(z, r, c), z, r, c)
          };
      }

      this._cache.set(id, 0);

      var tile = this._getTile(z, r, c);
      this._bitmapToArrayBuffer(tile)
        .then(
          (data) => this._worker.postMessage(
            [RWMSG.PROCESS_TILE, [
              [z, r, c, filters], filters, data
            ]], [data]
          )
        );

      return {
        msg: Tilemap.FLAG.WAIT,
        tile: this._createTileObject(tile, z, r, c)
      };
    }

    getTilesIn(z, xmin, ymin, xmax, ymax, filters) {
      var [
        [cmin, rmin],
        [cmax, rmax]
      ] = [
        [xmin, ymin],
        [xmax, ymax]
      ]
      .map(v => math.dotDivide(v, this._tileSize))
        .map(v => math.dotDivide(v, z))
        .map(v => math.floor(v));

      var tiles = [];
      for (let r = rmin; r <= rmax; ++r)
        for (let c = cmin; c <= cmax; ++c) {
          try {
            let ret = this.getTile(z, r, c, filters);
            if (ret.msg === Tilemap.FLAG.ERROR)
              throw new Exception();
            tiles.push(ret);
          } catch (err) {
            tiles.push({
              msg: Tilemap.FLAG.NULL,
              tile: this._createTileObject(this._nullTile, z, r, c)
            });
          }
        }
      return tiles;
    }

    _getTile(z, r, c) {
      try {
        let tile = this._orig[z][r][c];
        if (!(tile instanceof ImageBitmap))
          throw new Exception();
        return tile;
      } catch (err) {
        throw `Tile does not exist! (${z}x${r}x${c}, ${err})`;
      }
    }

    _serializeId(z, r, c, filters) {
      return `${z};${r};${c};${JSON.stringify(filters)}`;
    }

    _createTileObject(image, z, r, c) {
      return new Tile(
        image,
        0,
        0,
        this._tileSize[1],
        this._tileSize[0],
        z * c * this._tileSize[1],
        z * r * this._tileSize[0],
        z * this._tileSize[1],
        z * this._tileSize[0]
      );
    }

    _arrayBufferToBitmap(data) {
      return new Promise((resolve, reject) => {
        data = new ImageData(
          new Uint8ClampedArray(data),
          ...this._tileSize
        );
        this._tileContext.putImageData(data, 0, 0);
        createImageBitmap(this._tileCanvas)
          .then((im) => resolve(im))
          .catch((err) => reject(err));
      });
    }

    // Not asynchronous, but use Promise API to keep symmetry with
    // _arrayBufferToBitmap
    _bitmapToArrayBuffer(bitmap) {
      return new Promise((resolve, reject) => {
        this._tileContext.drawImage(bitmap, 0, 0);
        resolve(
          this._tileContext.getImageData(
            0, 0, ...this._tileSize
          ).data.buffer
        );
      });
    }
  };


  this.Tilemap.FLAG = Object.freeze({
    SUCCESS: 1 << 1,
    WAIT: 1 << 2,
    IGNORED: 1 << 3,
    NULL: 1 << 4,
    ERROR: 1 << 15
  });

}).call(this);
