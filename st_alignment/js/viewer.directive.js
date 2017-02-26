// this directive controls the rendering and input of the canvas element
// used for viewing the image and spots.

angular.module('stSpots')
  .directive('viewer',
    function() {
      return {
        restrict: 'A',
        scope: false,
        link: function(scope, element) {
          var fgcvs = $(element[0]).find('#fg')[0];
          var layerContainer = $(element[0]).find('#layers')[0];

          var fgctx = fgcvs.getContext('2d');

          // prevents the context menu from appearing on right click
          fgcvs.oncontextmenu = function(e) {
            e.preventDefault();
          };

          var tilemap = new Tilemap();
          var scaleManager = new ScaleManager();
          var curScale = null;

          var tilemapLevel = 2;
          var tilemapLevels = [];
          var tilePosition;

          scope.camera = new Camera(fgctx);

          scope.layerManager = new LayerManager(layerContainer, refreshCanvas)
            .addModifier('brightness', 0)
            .addModifier('contrast', 0);

          var renderer = new Renderer(fgctx, scope.camera, scope.layerManager);

          var calibrator = new Calibrator(scope.camera);

          scope.setCanvasCursor = function(cursor) {
            if (arguments.length === 0)
              return scope.classes.canvas;
            scope.$apply(function() {
              scope.classes.canvas = cursor;
            });
          };
          scope.toolsManager = new ToolsManager(refreshCanvas);

          var spots = new SpotManager();
          var spotSelector = new SpotSelector(scope.camera, spots);
          var spotAdjuster = new SpotAdjuster(
            scope.camera, spots, calibrator.calibrationData);
          scope.defLogicHandler =
            new DefLogicHandler(fgcvs, scope.camera, scope.layerManager,
              scope.toolsManager,
              spotSelector, spotAdjuster, calibrator, refreshCanvas, scope.setCanvasCursor
            );
          scope.eventHandler = new EventHandler(scope.data, fgcvs,
            scope.camera, scope.defLogicHandler);

          var images = [];

          scope.loadSpots = function(spotData) {
            spots.loadSpots(spotData);
            refreshCanvas();
          };

          scope.getSpots = function() {
            return spots.getSpots();
          };

          scope.getCalibrationData = function() {
            return {
              TL: calibrator.calibrationData.TL,
              BR: calibrator.calibrationData.BR,
              array_size: calibrator.calibrationData.arraySize,
              brightness: calibrator.calibrationData.brightness,
              contrast: calibrator.calibrationData.contrast,
              threshold: calibrator.calibrationData.threshold,
            };
          };

          scope.clickSpotColor = function(color, type) {
            renderer.changeSpotColor(color, type);
            refreshCanvas();
          };

          function refreshCanvas(redraw) {
            if (redraw === undefined)
              redraw = true;

            scaleManager.updateScaleLevel(scope.camera.scale);
            tilemapLevel = 1 / scaleManager.currentScaleLevel;

            // Always redraw if we get to a new tilemap level
            if (tilemapLevel != curScale) {
              curScale = tilemapLevel;
              redraw = true;
            }

            images = {};
            for (var layer of scope.layerManager.getLayers()) {
              var position = math.multiply(
                //scope.layerManager.getModifier(layer, tmat),
                math.eye(3),
                math.matrix([
                  [scope.camera.position.x],
                  [scope.camera.position.y],
                  [1]
                ])
              );
              tilePosition =
                tilemap.getTilePosition(Vec2.mathjsToVec2(position),
                  tilemapLevel);
              images[layer] = tilemap.getRenderableImages(tilePosition,
                tilemapLevel);
            }

            renderer.renderImages(images, redraw);

            renderer.clearCanvas(fgctx);
            if (scope.data.state == 'state_predetection') {
              renderer.renderCalibrationPoints(calibrator.calibrationData);
            } else if (scope.data.state == 'state_alignment' &&
              scope.toolsManager.activeTool() == 'rotate') {
              scope.camera.begin();
              scope.toolsManager.options('rotate').drawRotationPoint(fgctx);
              scope.camera.end();
            } else if (scope.data.state == 'state_adjustment') {
              renderer.renderSpots(spots.spots);
              renderer.renderSpotSelection(spotSelector.renderingRect);
              if (logicHandler.addingSpots) {
                renderer.renderSpotToAdd(spots.spotToAdd);
              }
            }
          }
          scope.refreshFunc = function() {
            refreshCanvas(true);
          };

          scope.addSpots = function() {
            logicHandler.addingSpots = true;
            scope.visible.spotAdjuster.button_addSpots = false;
            scope.visible.spotAdjuster.button_finishAddSpots = true;
            scope.visible.spotAdjuster.button_deleteSpots = false;
            scope.addSpotsToasts(); // in the main controller
            refreshCanvas();
          };

          scope.finishAddSpots = function() {
            logicHandler.addingSpots = false;
            scope.visible.spotAdjuster.button_addSpots = true;
            scope.visible.spotAdjuster.button_finishAddSpots = false;
            scope.visible.spotAdjuster.button_deleteSpots = true;
            refreshCanvas();
          };

          scope.deleteSpots = function() {
            spotAdjuster.deleteSelectedSpots();
            refreshCanvas();
          };

          scope.receiveTilemap = function(tilemapData, callback) {
            var [width, height] = ['width', 'height'].map(s =>
              $(fgcvs).attr(s));

            tilemap.loadTilemap(tilemapData, function() {
              scope.camera.position = {
                x: 1000,
                y: 1000
              };
              scope.camera.scale = 1 / tilemapLevel;
              scope.camera.updateViewport();

              scaleManager.setTilemapLevels(tilemap.tilemapLevels,
                tilemapLevel);

              callback();
            });

            for (var layer in tilemapData.tilemaps) {
              try {
                layer = scope.layerManager.addLayer(
                  layer,
                  `<canvas id='layer-{name}' class='fullscreen' width='${width}'
                  height='${height}' />`
                );
              } catch (e) {}
            }
          };

          scope.zoom = function(direction) {
            scope.camera.navigate(keyevents[direction]);
            refreshCanvas();
          };

          scope.exportSpots = function(type, selection) {
            var spotDataString = spots.exportSpots(type, selection);

            var blob = new Blob([spotDataString]);
            var filename = "spot_data-" + new Date().toISOString().slice(0,
              10) + ".tsv";

            // the next 11 lines are adapted from https://github.com/mholt/PapaParse/issues/175
            if (window.navigator.msSaveOrOpenBlob) { // IE hack; see http://msdn.microsoft.com/en-us/library/ie/hh779016.aspx
              window.navigator.msSaveBlob(blob, filename);
            } else {
              var a = window.document.createElement("a");
              a.href = window.URL.createObjectURL(blob, {
                type: 'text/tsv'
              });
              a.download = filename;
              document.body.appendChild(a);
              a.click(); // IE: "Access is denied"; see: https://connect.microsoft.com/IE/feedback/details/797361/ie-10-treats-blob-url-as-cross-origin-and-denies-access
              document.body.removeChild(a);
            }
          };

          scope.uploadImage(true);

        }
      };
    });
