(function() {
  "use strict";

  // const DIR = 'js/viewer/rendering/';

  importScripts('rwmsg.js');
  importScripts('tilemap.js');

  var renderStack = [];
  var tilemap;

  onmessage = function(e) {
    var [id, data] = e.data;
    switch (id) {
      case RWMSG.INIT:
        tilemap = new Tilemap(data, function() {
          postMessage(RWMSG.SUCESS);
        });
        break;
      default:
        console.log("Unknown message " + id);
        postMessage(RWMSG.ERROR);
    }
  };

  var render = function(imageData) {};
})();
