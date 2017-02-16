angular.module('aligner', ['ui.sortable']).directive('alignmentWidget',
  function() {
    return {
      restrict: 'E',
      link: function(scope, element, attrs, controllers) {
        scope.aligner.layerListOptions = {
          axis: 'x'
        };

        // TODO: Need to clone array in order to avoid infinite recursion when
        // reversing. Why does this happen, though?
        scope.aligner.getLayers = function() {
          return scope.layerManager.layerOrder.slice(); // .reverse();
        };

        scope.aligner.opacity = function(value) {
          if (arguments.length) {
            scope.layerManager.setModifier(null, 'alpha', value, false);
            return true;
          }
          var layers = scope.layerManager.getActiveLayers();
          if (layers.length != 1)
            return -1;
          return scope.layerManager.getModifier(layers[0], 'alpha');
        };

        scope.aligner.contrast = function(value) {
          if (arguments.length) {
            scope.layerManager.setModifier(null, 'contrast', value);
            return true;
          }
          var layers = scope.layerManager.getActiveLayers();
          if (layers.length != 1)
            return -1;
          return scope.layerManager.getModifier(layers[0], 'contrast');
        };
      },
      templateUrl: '../aligner.html'
    };
  }
);
