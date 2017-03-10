class Contrast extends Filter {
  apply(d, h, p) {
    if (p === 0)
      return;
    let contrast = Math.pow(p / 100 + 1, 6),
      intercept = 127.5 * (1 - contrast);
    for (let i = 0; i < d.length;) {
      d[i] = intercept + contrast * d[i++];
      d[i] = intercept + contrast * d[i++];
      d[i] = intercept + contrast * d[i++];
      i++; // ignore alpha channel
    }
  }
}

var contrast = new Contrast();
