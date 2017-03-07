class Filter {
    constructor() {
      if (new.target === Filter)
        throw new TypeError(
          "Call of new on abstract class Filter not allowed.");
    }

    apply(d, h) {
      throw "Abstract method not implemented.";
    }
}
