(function() {
  "use strict";

  const FILTERS_DIR = './filters/';

  importScripts('rwmsg.js');
  importScripts(FILTERS_DIR + 'filter.js');
  importScripts(FILTERS_DIR + 'filters.js');

  var histogram;

  onmessage = function(e, t) {
    var [id, data] = e.data;
    switch (id) {
      case RWMSG.INIT:
        histogram = data;
        importFilters();
        postMessage([RWMSG.SUCESS, null]);
        break;
      case RWMSG.PROCESS_TILE:
        let image = new Uint8ClampedArray(data[0]);
        let filters = data[1];
        let ret;
        try {
          ret = render(image, filters);
        } catch (err) {
          console.log(err);
        }
        if (ret === undefined)
          postMessage([RWMSG.ERROR, null]);
        else
          postMessage([RWMSG.SUCESS, ret.buffer], [ret.buffer]);
        break;
      case RWMSG.CLOSE:
        close();
        break;
      default:
        console.log("Unknown message " + id);
        postMessage(RWMSG.ERROR);
    }
  };

  var importFilters = function() {
    for (let filter of FILTERS) {
      let filename = FILTERS_DIR + filter + ".js";
      //console.log("Importing " + filename + "...");
      importScripts(filename);
    }
  };

  var render = function(data, filters) {
    for (let filter of filters)
      self[filter].apply(data, histogram);
    return data;
  };
})();
