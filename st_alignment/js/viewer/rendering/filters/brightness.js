class Brightness extends Filter {
  apply(d, h, p) {
    if (p === 0)
      return;
    let brightness = p * 2.55;
    for (let i = 0; i < d.length;) {
      d[i] = d[i++] + brightness;
      d[i] = d[i++] + brightness;
      d[i] = d[i++] + brightness;
      i++; // ignore alpha channel
    }
  }
}

var brightness = new Brightness();
