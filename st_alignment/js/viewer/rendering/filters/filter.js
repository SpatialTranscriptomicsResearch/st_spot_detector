export default class Filter {
    constructor() {
      if (new.target === LogicHandler)
        throw new TypeError(
          "Call of new on abstract class Filter not allowed.");
    }

    // Abstract methods
    apply(d, h) {
      throw "Abstract method not implemented.";
    }
}
