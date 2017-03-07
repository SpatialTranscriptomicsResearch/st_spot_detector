/* jshint loopfunc: true */

// TODO: limit cache size
(function() {
  "use strict";


  // TODO: Move to some kind of global config file
  const WORKER_PATH = 'js/viewer/rendering/worker.js';


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

    constructor(data, callback, ...args) {
      this._tileSize = new Array(2);
      this._zoomLevels = [];
      this._orig = {};
      this._cache = new Map();
      this._histogram = new Array(256);

      if (data !== undefined)
        this.loadTilemap(data, callback, ...args);

      this._worker = new Worker(WORKER_PATH);
      this._worker.postMessage([RWMSG.INIT, [filters, this._histogram]]);
    }

    loadTilemap(data, callback, ...args) {
      this._cache.clear();

      var numLeft = 0;
      for (let t of Object.values(data))
        numLeft += t.reduce((acc, r) => acc + r.length, 0);

      var callback_ = (function() {
        if (--numLeft === 0) {
          [this._tileSize[0], this._tileSize[1]] = [
            this._orig[this._zoomLevels[0]][0][0].width,
            this._orig[this._zoomLevels[0]][0][0].height
          ];
          //this._histogram = this.getHistogram(this._zoomLevels[0]);
          // FIXME: chrome crashes when computing histogram on zoom level 0
          // probably OK to compute it at higher zoom level, although the 'black
          // border' problem needs to be fixed then.
          this._histogram = this.getHistogram(this._zoomLevels[4]);
          if (callback !== undefined)
            callback(...args);
        }
      }).bind(this);

      for (let [z, tiles] of Object.entries(data)) {
        this._zoomLevels.push(parseInt(z));
        this._orig[z] = [];
        for (let r = 0; r < tiles.length; ++r) {
          let imarr = new Array(tiles[r].length);
          this._orig[z].push(imarr);
          for (let c = 0; c < tiles[r].length; ++c) {
            createImageBitmap(
              dataURItoBlob(tiles[r][c])
            ).then(function(im) {
              imarr[c] = im;
              callback_();
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

    getTile(z, r, c, filters, callback, ...args) {
      filters = filters || [];
      var id = `${z}-${r}-${c}-${filters.join('')}`;
      if (this._cache.has(id)) {
        let ret = this._cache.get(id);
        if (ret !== 0)
          return {
            msg: Tilemap.MSG.SUCCESS,
            tile: this._createTileObject(ret, z, r, c)
          };
        else
          return {
            msg: Tilemap.MSG.IGNORED,
            tile: this._createTileObject(this._getTile(z, r, c), z, r, c)
          };
      }

      this._cache.set(id, 0);

      // We need to pre-draw the tile to the canvas, since the worker API does
      // not have access to the DOM.
      // It will be better to draw to an OffscreenCanvas in the worker once it
      // has wider browser support:
      // https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas#Browser_compatibility
      var tile = this._getTile(z, r, c);
      var canvas = document.createElement('canvas');
      [canvas.width, canvas.height] = this._tileSize;
      var context = canvas.getContext('2d');
      context.drawImage(tile, 0, 0);
      var data = context.getImageData(0, 0, ...this._tileSize);

      var worker = new Worker(WORKER_PATH);
      worker.onmessage = (function(e) {
        worker.onmessage = (function(e) {
          let imageData = new ImageData(
            new Uint8ClampedArray(e.data[1]),
            ...this._tileSize
          );
          context.putImageData(imageData, 0, 0);
          createImageBitmap(canvas).then((function(im) {
            this._cache.set(id, im);
            callback(...args);
          }).bind(this));
          worker.postMessage([RWMSG.CLOSE, null]);
        }).bind(this);
        worker.postMessage(
          [RWMSG.PROCESS_TILE, data.data.buffer], [data.data.buffer]
        );
      }).bind(this);
      worker.postMessage([RWMSG.INIT, [filters, this._histogram]]);

      return {
        msg: Tilemap.MSG.WAIT,
        tile: _createTileObject(tile, z, r, c)
      };
    }

    getTilesIn(z, xmin, ymin, xmax, ymax, filters, callback, ...args) {
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
            let ret = this.getTile(z, r, c, filters, callback, ...args);
            if (ret.msg === Tilemap.MSG.ERROR)
              throw new Exception();
            tiles.push(ret.tile);
          } catch (err) {
            continue;
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
  };

  this.Tilemap.MSG = Object.freeze({
    ERROR: -1,
    SUCCESS: 0,
    WAIT: 1,
    IGNORED: 2
  });

}).call(this);
