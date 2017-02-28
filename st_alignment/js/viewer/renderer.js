/* jshint loopfunc: true */

(function() {

  var self;
  var Renderer = function(fgcontext, camera, layerManager, tilemap) {
    self = this;
    self.ctx = fgcontext;
    self.camera = camera;
    self.layerManager = layerManager;
    self.tilemap = tilemap;
    self.bgColor = 'black';
    self.spotColorHSL = "6, 78%, 57%"; // red
    self.spotColorA = "0.60";
    self.selectedSpotColor = 'hsla(140, 63%, 42%, 0.50)'; // green
    self.calibrationColor = 'hsla(204, 64%, 44%, 0.95)'; // blue
    self.spotSelectionColor = 'rgba(150, 150, 150, 0.95)'; // grey
    self.calibrationLineWidth = 6.0;
    self.calibrationLineWidthHighlighted = 10.0;
    self.spotSize = 11;
    self.cache = new Map();
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
    clearCanvas: function(ctx) {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
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
    getTilemapLevel: function() {
      // TODO: This could be done in O(1) if we maintain a map floor(zoom
      // level) -> tilemaplevel (as long as tilemap levels belong to N).
      // Alternatively, we could do a binary tree search in O(log n)
      var i = 0,
        cur;
      do {
        cur = self.tilemap.tilemapLevels[i++];
        if (i >= self.tilemap.tilemapLevels.length)
          break;
      } while (cur < 1 / self.camera.scale);
      return cur;
    },
    renderImages: function() {
      // TODO: this should probably be split into multiple functions
      // TODO: don't top declare variables
      var i, l, ctx, translation, rotation, canvas;

      var tilemapLevel = self.getTilemapLevel();

      for (var layer of self.layerManager.getLayers()) {

        var mod = self.layerManager.getModifiers(layer);
        if (!mod.get('visible'))
          continue;


        var redraw = false;


        // Load modifiers
        var tmat = mod.get('tmat');


        // Get cache
        var cache;
        if (!self.cache.has(layer)) {
          cache = {
            canvas: $('<canvas />')[0],
            tilemapLevel: tilemapLevel,
            boundaries: {
              topleft: Vec2.Vec2(Infinity, Infinity),
              bottomright: Vec2.Vec2(-Infinity, -Infinity)
            },
            destructiveModifiers: {
              equalize: null
            }
          };
          self.cache.set(layer, cache);
          redraw = true;
        } else cache = self.cache.get(layer);


        // Transform viewport boundaries to tilemap space
        // TODO: consider keeping track of inverse in LayerManager instead of
        // recomputing it each time
        // TODO: could probably also use some kind of convex hull algo to find
        // the right tiles, though don't think performance would improve?
        var tmat_ = math.inv(tmat);
        var bounds = [
            Vec2.Vec2(0, 0),
            Vec2.Vec2(self.ctx.canvas.width, 0),
            Vec2.Vec2(0, self.ctx.canvas.height),
            Vec2.Vec2(self.ctx.canvas.width, self.ctx.canvas.height)
          ]
          .map(v => self.camera.mouseToCameraPosition(v))
          .map(v => Vec2.vec2ToMathjs(v))
          .map(v => math.multiply(tmat_, v))
          .map(v => Vec2.mathjsToVec2(v))
          .map(v => self.tilemap.getTilePosition(v, tilemapLevel));

        var topleft = Vec2.Vec2();
        topleft.x = Math.min(...bounds.map(v => v.x));
        topleft.y = Math.min(...bounds.map(v => v.y));

        var bottomright = Vec2.Vec2();
        bottomright.x = Math.max(...bounds.map(v => v.x));
        bottomright.y = Math.max(...bounds.map(v => v.y));


        // Force redraw if we're at a new tilemap level
        if (tilemapLevel !== cache.tilemapLevel)
          redraw = true;


        // Make sure cache boundaries larger than current ditos
        if (!Vec2.all(Vec2.test2(
            cache.boundaries.topleft,
            topleft,
            (c1, c2) => c1 <= c2)))
          redraw = true;
        if (!Vec2.all(Vec2.test2(
            cache.boundaries.bottomright,
            bottomright,
            (c1, c2) => c1 >= c2)))
          redraw = true;


        // Force redraw if destructive modifiers have been updated
        for (var dmod in cache.destructiveModifiers)
          if (mod.get(dmod) !== cache.destructiveModifiers[dmod]) {
            redraw = true;
            break;
          }


        // Redraw if necessary
        if (redraw) {

          // Update cache
          cache.tilemapLevel = tilemapLevel;
          cache.boundaries.topleft = topleft;
          cache.boundaries.bottomright = bottomright;
          for (dmod in cache.destructiveModifiers) {
            var dmodCur = mod.get(dmod);
            if (dmodCur !== cache.destructiveModifiers[dmod])
              cache.destructiveModifiers[dmod] = dmodCur;
          }

          var images = self.tilemap.getImages(
            layer, tilemapLevel, topleft, bottomright);

          var [height, width] = ['y', 'x'].map(function(s) {
            return images.reduce((acc, val) => Math.max(acc,
              val.renderPosition[s] + val.scaledSize[s]), 0);
          });
          cache.canvas.width = width;
          cache.canvas.height = height;

          ctx = cache.canvas.getContext('2d');

          for (i = 0; i < images.length; ++i)
            ctx.drawImage(images[i], images[i].renderPosition.x,
              images[i].renderPosition.y,
              images[i].scaledSize.x,
              images[i].scaledSize.y);

          // var imageData = ctx_.getImageData(0, 0, ctx_.canvas.width, ctx_
          //   .canvas.height);
        }


        // Load context
        ctx = self.layerManager.getCanvas(layer).getContext('2d');


        // Apply non-destructive/css filters
        var [brightness, contrast] = [
          'brightness', 'contrast'
        ].map(s => mod.get(s));

        var filters = [];
        if (brightness && brightness !== 0) {
          brightness = (brightness + 100) / 100;
          filters.push(`brightness(${brightness})`);
        }
        if (contrast && contrast !== 0) {
          contrast = Math.pow((contrast + 100) / 100, 5);
          filters.push(`contrast(${contrast})`);
        }

        if (filters.length > 0)
          ctx.filter = filters.join(" ");
        $(ctx.canvas).css('opacity', mod.get('alpha'));


        translation = tmat.subset(math.index([0, 1], 2));
        translation = Vec2.Vec2(
          math.subset(translation, math.index(0, 0)),
          math.subset(translation, math.index(1, 0))
        );
        rotation = Math.acos(math.subset(tmat, math.index(0, 0)));
        if (math.subset(tmat, math.index(1, 0)) < 0)
          rotation = -rotation;

        self.clearCanvas(ctx);
        self.camera.begin(translation, rotation, ctx);
        ctx.drawImage(cache.canvas, 0, 0);
        self.camera.end(ctx);

      }

      self.cleanUpCache();
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
            'hsla(' + self.spotColorHSL + ',' + self.spotColorA + ')';
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
      drawLine(0, data.TL.y, 2000, data.TL.y, data.highlighted.includes(
        'T'));
      drawLine(data.TL.x, 0, data.TL.x, 2000, data.highlighted.includes(
        'L'));
      drawLine(0, data.BR.y, 2000, data.BR.y, data.highlighted.includes(
        'B'));
      drawLine(data.BR.x, 0, data.BR.x, 2000, data.highlighted.includes(
        'R'));
      self.camera.end();
    },
    renderSpotSelection: function(rectCoords) {
      self.ctx.strokeStyle = self.spotSelectionColor;
      self.ctx.setLineDash([4, 3]);
      self.ctx.strokeRect(rectCoords.TL.x, rectCoords.TL.y, rectCoords.WH
        .x,
        rectCoords.WH.y);
    }
  };

  this.Renderer = Renderer;

}).call(this);
