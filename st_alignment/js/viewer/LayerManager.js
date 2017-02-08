export default class {
  constructor(layerMod, updateFunc) {
    this.active_layer = 'he';
    this.rotation = 0;
    this.translation = Vec2.Vec2(0, 0);

    this.layerMod = layerMod;
    this.update = updateFunc;
  }

  move(diff) {
    this.translation = Vec2.subtract(this.translation, diff);
    var upd = {};
    upd[this.active_layer] = {'trans' : this.translation};
    this.update(upd);
  }

  getOffset(type) {
    switch (type) {
    case 'rotation':
      return this.rotation;
    case 'x':
      return this.translation.x;
    case 'y':
      return this.translation.y;
    }
  }
};

//                    var layers = [];
//                    var layerMod = {};
//                    var layerModDef = {
//                        'visible': true,
//                        'trans': Vec2.Vec2(0, 0),
//                        'rot': 0, 
//                        'rotpoint': Vec2.Vec2(0, 0),
//                        'alpha': 0.5
//                    };
//
//                    scope.initLayerMod = function() {
//                        for (var l of layers) {
//                            layerMod[l] = {};
//                            for (var k in layerModDef)
//                                layerMod[l][k] = layerModDef[k];
//                        }
//                    };
//
//                    /* Returns a deep copy of layerMod */
//                    scope.getLayerMod = function() {
//                        var ret = {};
//                        for (var l in layerMod)
//                            ret[l] = Object.assign({}, layerMod[l]);
//                        return ret;
//                    };
//
//                    scope.updateLayerMod = function(update) {
//                        for (var l in update) {
//                            if (!(l in layerMod))
//                                throw "Failed to update layerMod: layer " + l +
//                                    " does not exist!";
//                            for (var k in update[l])
//                                layerMod[l][k] = update[l][k];
//                        }
//                        refreshCanvas();
//                    };
