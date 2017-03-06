var equalize = function(canvas, hist) {
  var ctx = canvas.getContext('2d'),
    data = ctx.getImageData(0, 0, canvas.width, canvas.height);

  hist = hist || computeHistogram(canvas);

  for (let i = 0; i < data.data.length;) {
    data.data[i] = Math.floor(255 * hist.r[data.data[i++]]);
    data.data[i] = Math.floor(255 * hist.g[data.data[i++]]);
    data.data[i] = Math.floor(255 * hist.b[data.data[i++]]);
    i++; // ignore alpha channel
  }

  ctx.putImageData(data, 0, 0);
};

var computeHistogram = function(canvas) {
  var ctx = canvas.getContext('2d'),
    data = ctx.getImageData(0, 0, canvas.width, canvas.height);

  var hist = {
    r: Array(256).fill(0),
    g: Array(256).fill(0),
    b: Array(256).fill(0)
  };

  for (let i = 0; i < data.data.length;) {
    hist.r[data.data[i++]]++;
    hist.g[data.data[i++]]++;
    hist.b[data.data[i++]]++;
    i++; // ignore alpha channel
  }

  hist.r.map((v, i, a) => a[i] = (i > 0 ? a[i - 1] : 0) + v);
  hist.g.map((v, i, a) => a[i] = (i > 0 ? a[i - 1] : 0) + v);
  hist.b.map((v, i, a) => a[i] = (i > 0 ? a[i - 1] : 0) + v);

  hist.r.map((v, i, a) => a[i] = v / data.data.length * 4);
  hist.g.map((v, i, a) => a[i] = v / data.data.length * 4);
  hist.b.map((v, i, a) => a[i] = v / data.data.length * 4);

  return hist;
};


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
