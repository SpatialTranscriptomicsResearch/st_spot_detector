(function() {
  "use strict";

  const FILTERS_DIR = './filters/';

  importScripts('rwmsg.js');

  var filters;
  var histogram;

  onmessage = function(e, t) {
    var [id, data] = e.data;
    switch (id) {
      case RWMSG.INIT:
        [filters, histogram] = data;
        importFilters();
        postMessage([RWMSG.SUCESS, null]);
        break;
      case RWMSG.PROCESS_TILE:
        data = new Uint8ClampedArray(data);
        let ret;
        try {
          ret = render(data);
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

  // TODO: This seems a bit hackish, would be better to have a 'plugin' file
  // that maps filter => script file
  var importFilters = function() {
    for (let filter of filters) {
      console.log("Importing " + filter + "...");
      importScripts(filter);
      console.log(filter);
    }
  };

  var render = function(data) {
    for (let filter of filters)
      filter.apply(data, histogram);
    return data;
  };
})();
