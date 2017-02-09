angular.module('stSpots').directive('alignmentWidget', function() {
  return {
    restrict: 'E',
    link: function(scope, element, attrs, controllers) {
      scope.getLayers = function() {
        var ret = [];
        for (var layer of scope.layerManager.getLayers())
          ret.push(layer);
        return ret;
      };
      scope.toggle = function(layer) {
        scope.layerManager.setModifier(layer, 'active',
            !scope.layerManager .getModifier(layer, 'active'));
      };
    },
    templateUrl: '../aligner.html'
  };
});
