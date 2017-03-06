import Filter from 'filter';

class Equalize extends Filter {
  apply(d, h) {
    for (let i = 0; i < data.data.length;) {
      d[i] = Math.floor(255 * h.r[d[i++]]);
      d[i] = Math.floor(255 * h.g[d[i++]]);
      d[i] = Math.floor(255 * h.b[d[i++]]);
      i++; // ignore alpha channel
    }
  }
}

var equalize = new Equalize();
