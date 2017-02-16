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
    self.spotSize = 11;
    self.prevState = new Map();
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
    // TODO: should detect which layers that have been modified and rerender
    // only those.
    renderImages: function(images, redraw) {
      var i, l, ctx, tmat, tmat_, translation, rotation, redraw_,
        prevState;

      for (l of self.layerManager.getLayers()) {
        var mod = self.layerManager.getModifiers(l);
        if (!mod.get('visible'))
          continue;

        tmat = mod.get('tmat');
        prevState = self.prevState.get(l);
        ctx = self.layerManager.getCanvas(l).getContext('2d');

        // Disallow quick refresh (not redrawing) if we don't know the previous
        // state of the layer. (This should never happen).
        redraw_ = redraw | (prevState === undefined);
        console.assert(redraw == redraw_);

        translation = tmat.subset(math.index([0, 1], 2));
        // TODO: use mathjs instead of Vec2?
        translation = Vec2.Vec2(
          math.subset(translation, math.index(0, 0)),
          math.subset(translation, math.index(1, 0))
        );
        rotation = Math.acos(math.subset(tmat, math.index(0, 0)));
        if (math.subset(tmat, math.index(1, 0)) < 0)
          rotation = -rotation;

        if (redraw_) {
          var [height, width] = ['y', 'x'].map(function(s) {
            return images[l].reduce((acc, val) => Math.max(acc, val.renderPosition[
              s] + val.scaledSize[s]), 0);
          });
          var canvas_ = $(
              `<canvas width='${width}' height='${height}' />`)[0],
            ctx_ = canvas_.getContext('2d');

          for (i = 0; i < images[l].length; ++i)
            ctx_.drawImage(images[l][i], images[l][i].renderPosition.x,
              images[l][i].renderPosition.y,
              images[l][i].scaledSize.x,
              images[l][i].scaledSize.y);

          var imageData = ctx_.getImageData(0, 0, ctx_.canvas.width, ctx_
            .canvas.height);
          var contrast = mod.get('contrast');
          if (contrast && contrast !== 0) {
            contrast += 1;
            ctx.filter = `contrast(${contrast})`;
            // contrast = 62.75 * contrast * contrast + 63.75 * contrast + 1;
            // for (i = 0; i < imageData.data.length; i += 4) {
            //   imageData.data[i] = contrast * (imageData.data[i] - 127.5) + 127.5;
            //   imageData.data[i+1] = contrast * (imageData.data[i+1] - 127.5) + 127.5;
            //   imageData.data[i+2] = contrast * (imageData.data[i+2] - 127.5) + 127.5;
            // }
            // ctx_.putImageData(imageData, 0, 0);
          }

          self.prevState.set(l, canvas_);
        }

        self.clearCanvas(ctx);
        self.camera.begin(translation, rotation, ctx);
        ctx.drawImage(self.prevState.get(l), 0, 0);
        self.camera.end(ctx);

        $(ctx.canvas).css('opacity', mod.get('alpha'));
      }
    },
    renderRotationPoint: function(options) {
      if (!options.rotationPoint)
        options.rotationPoint =
        self.camera.mouseToCameraPosition(Vec2.Vec2(self.ctx.canvas.width /
          2, self.ctx.canvas.height / 2));

      self.camera.begin();
      self.ctx.beginPath();
      var spotColor =
        'hsla(' + self.spotColorHSL + ',' + self.spotColorA + ')';
      self.ctx.fillStyle = spotColor;
      self.ctx.arc(options.rotationPoint.x, options.rotationPoint.y, 20,
        0, Math.PI * 2);
      self.ctx.closePath();
      self.ctx.fill();
      self.camera.end();
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
