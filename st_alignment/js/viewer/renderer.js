/* jshint loopfunc: true */

(function() {

  var self;
  var Renderer = function(fgcontext, camera, layerManager) {
    self = this;
    self.ctx = fgcontext;
    self.camera = camera;
    self.layerManager = layerManager;
    self.bgColor = 'black';
    self.spotColorHSL = "6, 78%, 57%"; // red
    self.spotColorA = "0.60";
    self.selectedSpotColor = 'hsla(140, 63%, 42%, 0.50)'; // green
    self.calibrationColor = 'hsla(204, 64%, 44%, 0.95)'; // blue
    self.spotSelectionColor = 'rgba(150, 150, 150, 0.95)'; // grey
    self.calibrationLineWidth = 6.0;
    self.calibrationLineWidthHighlighted = 10.0;
    self.spotSize = 44;
  };

  Renderer.prototype = {
    changeSpotColor: function(color, type) {
      var currentColor = self.spotColor;
      if (type == "color") {
        self.spotColorHSL = color;
      } else if (type == "opacity") {
        self.spotColorA = color;
      }
    },
    cleanUpCache: function() {
      var seen = {},
        layer;
      for (layer in self.layerManager.getLayers())
        seen.layer = true;
      for (layer in self.cache.keys())
        if (seen.layer !== true)
          self.cache.delete(layer);
    },
    getTilemapLevel: function(tilemap) {
      // TODO: This could be done in O(1) if we maintain a map floor(zoom
      // level) -> tilemaplevel (as long as tilemap levels belong to N).  Alternatively, we could do a binary tree search in O(log n)
      var tilemapLevels = tilemap.getZoomLevels();
      var i = tilemapLevels.length,
        cur;
      do {
        cur = tilemapLevels[--i];
        if (i <= 0)
          break;
      } while (cur > 1 / self.camera.scale);
      return cur;
    },
    renderImages: function() {
      for (let layer of self.layerManager.getLayers()) {
        let modifiers = self.layerManager.getModifiers(layer);
        if (!modifiers.get('visible'))
          continue;

        let tilemap = self.layerManager.getData(layer)[0],
          canvas = self.layerManager.getCanvas(layer),
          context = canvas.getContext('2d');

        let tileSize = tilemap.getTileSize(),
          z = self.getTilemapLevel(tilemap);

        let tmat = math.multiply(
            self.camera.getTransform(), modifiers.get('tmat')),
          tmat_ = math.inv(tmat);

        // TODO: should be possible to pass parameters to filters
        let filters = ['equalize'].filter(f => modifiers.get(f));

        let bounds = [
            [0, 0, 1],
            [canvas.width, 0, 1],
            [0, canvas.height, 1],
            [canvas.width, canvas.height, 1]
          ]
          .map(v => math.matrix(v))
          .map(v => math.transpose(v))
          .map(v => math.multiply(tmat_, v))
          .map(v => math.subset(v, math.index([0, 1])))
          .map(v => v._data);

        let tiles = tilemap.getTilesIn(
          z,
          ...math.min(bounds, 0),
          ...math.max(bounds, 0),
          filters,
          self.renderImages
        );

        context.clearRect(0, 0, canvas.width, canvas.height);

        context.save();

        context.transform(
          ...tmat.subset(math.index([0, 1], 0))._data,
          ...tmat.subset(math.index([0, 1], 1))._data,
          ...tmat.subset(math.index([0, 1], 2))._data
        );

        for (let tile of tiles)
          context.drawImage(
            tile.image,
            tile.sx,
            tile.sy,
            tile.sWidth,
            tile.sHeight,
            tile.dx,
            tile.dy,
            tile.dWidth,
            tile.dHeight
          );

        context.restore();
      }
    },
    renderSpots: function(spots) {
      self.camera.begin();
      for (var i = 0; i < spots.length; ++i) {
        var spot = spots[i];

        self.ctx.beginPath();
        if (spot.selected) {
          self.ctx.fillStyle = self.selectedSpotColor;
        } else {
          var spotColor =
            'hsla(' + self.spotColorHSL + ',' + self.spotColorA +
            ')';
          self.ctx.fillStyle = spotColor;
        }
        self.ctx.arc(spot.renderPosition.x, spot.renderPosition.y,
          self.spotSize, 0, Math.PI * 2);
        self.ctx.closePath();
        self.ctx.fill();
      }
      self.camera.end();
    },
    renderSpotToAdd: function(spot) {
      self.camera.begin();
      self.ctx.beginPath();
      self.ctx.fillStyle = self.selectedSpotColor;
      self.ctx.arc(spot.renderPosition.x, spot.renderPosition.y,
        self.spotSize, 0, Math.PI * 2);
      self.ctx.closePath();
      self.ctx.fill();
      self.camera.end();
    },
    renderCalibrationPoints: function(data) {
      function drawLine(x1, y1, x2, y2, highlighted) {
        if (highlighted) {
          self.ctx.lineWidth = self.calibrationLineWidthHighlighted;
        } else {
          self.ctx.lineWidth = self.calibrationLineWidth;
        }
        self.ctx.beginPath();
        self.ctx.moveTo(x1, y1);
        self.ctx.lineTo(x2, y2);
        self.ctx.stroke();
        self.ctx.closePath();
      }
      self.camera.begin();
      self.ctx.strokeStyle = self.calibrationColor;
      drawLine(0, data.TL.y, 8000, data.TL.y, data.highlighted.includes(
        'T'));
      drawLine(data.TL.x, 0, data.TL.x, 8000, data.highlighted.includes(
        'L'));
      drawLine(0, data.BR.y, 8000, data.BR.y, data.highlighted.includes(
        'B'));
      drawLine(data.BR.x, 0, data.BR.x, 8000, data.highlighted.includes(
        'R'));
      self.camera.end();
    },
    renderSpotSelection: function(rectCoords) {
      self.ctx.strokeStyle = self.spotSelectionColor;
      self.ctx.setLineDash([4, 3]);
      self.ctx.strokeRect(rectCoords.TL.x, rectCoords.TL.y,
        rectCoords.WH
        .x,
        rectCoords.WH.y);
    }
  };

  this.Renderer = Renderer;

}).call(this);
