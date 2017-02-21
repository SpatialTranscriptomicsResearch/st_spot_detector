// TODO: toolsManager should belong entirely to aligner directive and not be
// used anywhere else
angular.module('aligner', ['ui.sortable']).directive('alignmentWidget',
  function() {
    return {
      restrict: 'E',
      link: function(scope, element, attrs, controllers) {
        scope.aligner.rotationPointColor = 'rgba(255, 0, 0, 1.0)';
        scope.aligner.rotationPointRadius = 16;

        scope.aligner.layerListOptions = {
          axis: 'x'
        };

        // TODO: Need to clone array in order to avoid infinite recursion when
        // reversing. Why does this happen, though?
        scope.aligner.getLayers = function() {
          return scope.layerManager.layerOrder.slice(); // .reverse();
        };

        // TODO: handle this in a smarter way when more than one layer is
        // selected
        scope.aligner.opacity = function(value) {
          if (arguments.length) {
            scope.layerManager.setModifier(null, 'alpha', value, false);
            return true;
          }
          var layers = scope.layerManager.getActiveLayers();
          if (layers.length === 0)
            return 0;
          return scope.layerManager.getModifier(layers[0], 'alpha');
        };

        scope.aligner.brightness = function(value) {
          if (arguments.length) {
            scope.layerManager.setModifier(null, 'brightness', parseInt(
              value));
            return true;
          }
          var layers = scope.layerManager.getActiveLayers();
          if (layers.length === 0)
            return 0;
          return scope.layerManager.getModifier(layers[0], 'brightness');
        };

        scope.aligner.contrast = function(value) {
          if (arguments.length) {
            scope.layerManager.setModifier(null, 'contrast', parseInt(
              value));
            return true;
          }
          var layers = scope.layerManager.getActiveLayers();
          if (layers.length === 0)
            return 0;
          return scope.layerManager.getModifier(layers[0], 'contrast');
        };

        scope.toolsManager
          .addTool('move')
          .addTool('rotate', {
            rotationPoint: Vec2.Vec2(1000, 1000), // TODO: this should not be hardcoded
            drawRotationPoint: function(ctx) {
              ctx.save();

              ctx.fillStyle = scope.aligner.rotationPointColor;
              ctx.strokeStyle = scope.aligner.rotationPointColor;
              ctx.lineWidth = scope.aligner.rotationPointRadius / 2;

              var outerCircle = new Path2D();
              outerCircle.arc(
                this.rotationPoint.x,
                this.rotationPoint.y,
                scope.aligner.rotationPointRadius,
                0, Math.PI * 2
              );

              var innerCircle = new Path2D();
              innerCircle.arc(
                this.rotationPoint.x,
                this.rotationPoint.y,
                scope.aligner.rotationPointRadius / 4,
                0, Math.PI * 2
              );

              ctx.stroke(outerCircle);
              ctx.fill(innerCircle);

              ctx.restore();
            },
            hoverRotationPoint: function(pos) {
              if (Vec2.distanceBetween(pos, this.rotationPoint) < scope
                .aligner.rotationPointRadius)
                return true;
              return false;
            }
          });
      },
      templateUrl: '../aligner.html'
    };
  });
