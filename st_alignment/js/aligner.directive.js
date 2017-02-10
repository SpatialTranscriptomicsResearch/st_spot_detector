angular.module('aligner', ['ui.sortable']).directive('alignmentWidget', function() {
  return {
    restrict: 'E',
    link: function(scope, element, attrs, controllers) {
      scope.tools = ['move', 'rotate'];
      var curtool = 0;

      scope.opacity = -1;

      var refresh = function() {
        scope.refreshOpacity();
      };

      scope.getLayers = function() {
        var ret = [];
        for (var layer of scope.layerManager.getLayers())
          ret.push(layer);
        return ret;
      };
      scope.toggleLayer = function(layer) {
        scope.layerManager.setActiveLayer(layer);
        refresh();
      };

      scope.refreshOpacity = function() {
        var layers = scope.layerManager.getActiveLayers();
        if (layers.length != 1) {
          scope.opacity = -1;
          return;
        }
        scope.opacity = scope.layerManager.getModifier(layers[0], 'alpha');
      };
      scope.setOpacity = function(value) {
        scope.layerManager.setModifier(null, 'alpha', value);
      };

      scope.getActiveTool = function() {
        return scope.tools[curtool];
      };
      scope.setActiveTool = function(s) {
        var tool = scope.tools.indexOf(s);
        if (tool == -1)
          throw "Invalid tool name";
        curtool = tool;
      };
    },
    templateUrl: '../aligner.html'
  };
});
