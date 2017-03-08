class Equalize extends Filter {
  apply(d, h, p) {
    if (!p)
      return;
    for (let i = 0; i < d.length;) {
      d[i] = Math.floor(255 * h.r[d[i++]]);
      d[i] = Math.floor(255 * h.g[d[i++]]);
      d[i] = Math.floor(255 * h.b[d[i++]]);
      i++; // ignore alpha channel
    }
  }
}

var equalize = new Equalize();
