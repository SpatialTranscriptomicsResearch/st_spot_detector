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

          var camera = new Camera(fgctx);

          scope.layerManager = new LayerManager(layerContainer, refreshCanvas)
            .addModifier('contrast', 0)
            .addModifier('brightness', 0);

          var renderer = new Renderer(fgctx, camera, scope.layerManager);

          var calibrator = new Calibrator(camera);

          scope.setCanvasCursor = function(cursor) {
            scope.$apply(function() {
              scope.classes.canvas = cursor;
            });
          };
          scope.toolsManager = new ToolsManager(refreshCanvas)
            .addTool('move')
            .addTool('rotate', {
              'rotationPoint': undefined
            });

          var spots = new SpotManager();
          var spotSelector = new SpotSelector(camera, spots);
          var spotAdjuster = new SpotAdjuster(
            camera, spots, calibrator.calibrationData);
          var logicHandler =
            new LogicHandler(fgcvs, camera, scope.layerManager, scope.toolsManager,
              spotSelector, spotAdjuster, calibrator, refreshCanvas, scope.setCanvasCursor
            );
          var eventHandler = new EventHandler(scope.data, fgcvs,
            camera, logicHandler);

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

            scaleManager.updateScaleLevel(camera.scale);
            tilemapLevel = 1 / scaleManager.currentScaleLevel;

            // Always redraw if we get to a new tilemap level
            if (tilemapLevel != curScale) {
                curScale = tilemapLevel;
                console.log(curScale);
                redraw = true;
            }

            tilePosition = tilemap.getTilePosition(camera.position,
              tilemapLevel);
            images = tilemap.getRenderableImages(tilePosition,
              tilemapLevel);

            renderer.renderImages(images, redraw);

            renderer.clearCanvas(fgctx);
            if (scope.data.state == 'state_predetection') {
              renderer.renderCalibrationPoints(calibrator.calibrationData);
            } else if (scope.data.state == 'state_alignment' &&
              scope.toolsManager.activeTool() == 'rotate') {
              renderer.renderRotationPoint(scope.toolsManager.options(
                'rotate'));
            } else if (scope.data.state == 'state_adjustment') {
              renderer.renderSpots(spots.spots);
              renderer.renderSpotSelection(spotSelector.renderingRect);
              if (logicHandler.addingSpots) {
                renderer.renderSpotToAdd(spots.spotToAdd);
              }
            }
          }

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

          scope.receiveTilemap = function(tilemapData) {
            tilemap.loadTilemap(tilemapData, function() {});
            scaleManager.setTilemapLevels(tilemap.tilemapLevels,
              tilemapLevel);
            tilePosition = tilemap.getTilePosition(camera.position,
              tilemapLevel);
            images = tilemap.getRenderableImages(tilePosition, tilemapLevel);

            camera.position = {
              x: (1024 / 2) * tilemapLevel, // centers the camera to the middle of the image
              y: (1024 / 2) * tilemapLevel
            };
            camera.scale = 1 / tilemapLevel;
            camera.updateViewport();

            var [width, height] = ['width', 'height'].map(s =>
              $(fgcvs).attr(s));
            for (var layer in tilemapData.tilemaps)
              layer = scope.layerManager.addLayer(
                layer,
                `<canvas id='layer-{name}' class='fullscreen' width='${width}'
                height='${height}' />`
              );

            refreshCanvas();
          };

          scope.zoom = function(direction) {
            camera.navigate(keyevents[direction]);
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

        }
      };
    });
