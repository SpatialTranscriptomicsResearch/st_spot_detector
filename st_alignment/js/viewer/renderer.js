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
    renderImages: function(images, redraw) {
      var i, l, ctx, tmat, tmat_, translation, rotation, redraw_,
        prevState;
      redraw = false; // redraw || true;

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
        // assert(redraw == redraw_);

        if (!redraw_)
          tmat_ = math.multiply(tmat, math.inv(prevState.mat));
        else tmat_ = tmat;

        translation = tmat_.subset(math.index([0, 1], 2));
        // TODO: use mathjs instead of Vec2?
        translation = Vec2.Vec2(
          math.subset(translation, math.index(0, 0)),
          math.subset(translation, math.index(1, 0))
        );
        rotation = Math.acos(math.subset(tmat_, math.index(0, 0)));
        if (math.subset(tmat_, math.index(1, 0)) < 0)
          rotation = -rotation;

        if (redraw_) {
          // self.clearCanvas(ctx);

          // self.camera.begin(translation, rotation, ctx);

          for (i = 0; i < images[l].length; ++i) {
            if (ctx.canvas.width < images[l][i].renderPosition.x +
              images[l][i].scaledSize.x)
              ctx.canvas.width = images[l][i].renderPosition.x +
              images[l][i].scaledSize.x;
            if (ctx.canvas.height < images[l][i].renderPosition.y +
              images[l][i].scaledSize.y)
              ctx.canvas.height = images[l][i].renderPosition.y +
              images[l][i].scaledSize.y;
            ctx.drawImage(images[l][i], images[l][i].renderPosition.x,
              images[l][i].renderPosition.y,
              images[l][i].scaledSize.x,
              images[l][i].scaledSize.y);
          }

          var imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas
            .height);
          for (i = 0; i < imageData.data.length; ++i)
            imageData.data[i] = 5 * (imageData.data[i] - 127) + 300;
          ctx.putImageData(imageData, 0, 0);

          prevState = {
            mat: math.clone(tmat),
            canvas: (function() {
              var ret = $(
                `<canvas width='${ctx.canvas.width}' height='${ctx.canvas.height}' />`
              )[0];
              ret.getContext('2d').drawImage(ctx.canvas, 0, 0);
              return ret;
            })()
          };
          self.prevState.set(l, prevState);

          // self.camera.end(ctx);
        } else {
          // self.clearCanvas(ctx);
          // ctx.save();
          // // self.camera.applyScale(ctx);
          // // self.camera.applyTranslation(ctx);
          // translation = Vec2.scale(translation, self.camera.scale);
          // ctx.translate(translation.x, translation.y);
          // ctx.rotate(rotation);
          // // ctx.scale(1 / self.camera.scale, 1 / self.camera.scale);
          // ctx.drawImage(prevState.canvas, 0, 0);
          // ctx.restore();
          // self.clearCanvas(ctx);
          // self.camera.begin(translation, rotation, ctx);
          // ctx.drawImage(prevState.canvas, 0, 0);
          // self.camera.end(ctx);
        }

        self.clearCanvas(ctx);
        self.camera.begin(translation, rotation, ctx);
        ctx.drawImage(prevState.canvas, 0, 0);
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
