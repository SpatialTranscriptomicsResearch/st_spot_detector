(function(utils) {

  utils.computeHistogram = function(data) {
    var hist = {
      r: Array(256).fill(0),
      g: Array(256).fill(0),
      b: Array(256).fill(0)
    };

    for (let i = 0; i < data.length;) {
      hist.r[data[i++]]++;
      hist.g[data[i++]]++;
      hist.b[data[i++]]++;
      i++; // ignore alpha channel
    }

    hist.r.map((v, i, a) => a[i] = (i > 0 ? a[i - 1] : 0) + v);
    hist.g.map((v, i, a) => a[i] = (i > 0 ? a[i - 1] : 0) + v);
    hist.b.map((v, i, a) => a[i] = (i > 0 ? a[i - 1] : 0) + v);

    hist.r.map((v, i, a) => a[i] = v / data.length * 4);
    hist.g.map((v, i, a) => a[i] = v / data.length * 4);
    hist.b.map((v, i, a) => a[i] = v / data.length * 4);

    return hist;
  };

  utils.mathjsToTransform = function(matrix) {
    return [
      ...matrix.subset(math.index([0, 1], 0))._data,
      ...matrix.subset(math.index([0, 1], 1))._data,
      ...matrix.subset(math.index([0, 1], 2))._data
    ];
  };

  utils.transformToMathjs = function(matrix) {
    return math.matrix([
      [matrix.a, matrix.c, matrix.e],
      [matrix.b, matrix.d, matrix.f],
      [0, 0, 1],
    ]);
  };

  // http://stackoverflow.com/questions/12168909/blob-from-dataurl
  utils.dataURItoBlob = function(dataURI) {
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
  };

})(this.utils = {});
