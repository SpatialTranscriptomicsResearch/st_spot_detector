(function() {
  "use strict";

  // http://stackoverflow.com/questions/12168909/blob-from-dataurl
  function dataURItoBlob(dataURI) {
    // convert base64 to raw binary data held in a string
    // doesn't handle URLEncoded DataURIs - see SO answer #6850276 for code that
    // does this
    var byteString = atob(dataURI.split(',')[1]);

    // separate out the mime component
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    // write the bytes of the string to an ArrayBuffer
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++)
      ia[i] = byteString.charCodeAt(i);

    // write the ArrayBuffer to a blob, and you're done
    var blob = new Blob([ab], {
      type: mimeString
    });
    return blob;
  }


  this.Tilemap = class {

    constructor(data, callback, ...args) {
      this._tileSize = new Array(2);
      this._zoomLevels = [];
      this._tiles = {};

      if (data !== undefined)
        this.loadTilemap(data, callback, ...args);
    }

    loadTilemap(data, callback, ...args) {
      var numLeft = 0;
      for (let t of Object.values(data))
        numLeft += t.reduce((acc, r) => acc + r.length, 0);

      var callback_ = function() {
        console.log(numLeft);
        if (--numLeft > 0) {
          [this._tileSize[0], this._tileSize[1]] = [
            this._tiles[this._zoomLevels[0]][0][0].width,
            this._tiles[this._zoomLevels[0]][0][0].height
          ];
          if (callback !== undefined)
            callback(...args);
        }
      };

      for (let [z, tiles] of Object.entries(data)) {
        this._zoomLevels.push(parseInt(z));
        this._tiles[z] = [];
        for (let r = 0; r < tiles.length; ++r) {
          let imarr = new Array(tiles[r].length);
          this._tiles[z].push(imarr);
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

    getZoomLevels() {
      return this._zoomLevels;
    }

    getTile(z, r, c) {
      try {
        return this._tiles[z][r][c];
      } catch (e) {
        throw "Tile does not exist!";
      }
    }

    getTileAt(z, x, y, filter) {
      var [r, c] = [x, y].map((v, i) => v / this._tileSize[i]).map(
        Math.floor);
      return this.getTile(z, r, c);
    }

  };

}).call(this);
