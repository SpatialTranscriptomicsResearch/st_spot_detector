'use strict';

(function() {
  
    var self;
    var Renderer = function(context, camera) {
        self = this;
        self.ctx = context;
        self.camera = camera;
        self.bgColor = 'pink';
        self.spotColor = 'hsla(0, 100%, 50%, 0.5)'; // red
        self.selectedSpotColor = 'hsla(120, 100%, 50%, 0.5)'; // green
        self.spotMiddleColor = 'black';
        self.ctx.textAlign = "center";
        self.ctx.font = "bold 48px Courier";
        self.fontColor = 'lightgray';
        self.fontOutlineColor = 'black';
        self.calibrationColor = {
            TL: 'cyan',
            BR: 'orange'
        }
        self.calibrationLineWidth = 60.0;
        self.calibrationLineWidthHighlighted = 10.0;
        self.spotSize = 110;
        self.spotCentreSize = 4;
    };
  
    Renderer.prototype = {
        clearCanvas: function() {
            self.ctx.fillStyle = self.bgColor;
            self.ctx.fillRect(0, 0, self.ctx.canvas.width, self.ctx.canvas.height);
        },
        renderText: function(text) {
            self.ctx.fillStyle = self.fontColor;
            self.ctx.strokeStyle = self.fontOutlineColor;
            self.ctx.fillText(text, self.ctx.canvas.width / 2, self.ctx.canvas.height / 2);
            self.ctx.strokeText(text, self.ctx.canvas.width / 2, self.ctx.canvas.height / 2);
        },
        renderImages: function(images) {
            self.camera.begin();
                for(var i = 0; i < images.length; ++i) {
                    self.ctx.drawImage(images[i], images[i].renderPosition.x, images[i].renderPosition.y, images[i].scaledSize.x, images[i].scaledSize.y);
                }
            self.camera.end();
        },
        renderSpots: function(spots) {
            self.camera.begin();
                for(var i = 0; i < spots.length; ++i) {
                    var spot = spots[i];

                    self.ctx.beginPath();
                        if(spot.selected) {
                            self.ctx.fillStyle = self.selectedSpotColor;
                        }
                        else {
                            self.ctx.fillStyle = self.spotColor;
                        }
                        self.ctx.arc(spot.renderPosition.x, spot.renderPosition.y, self.spotSize, 0, Math.PI * 2);
                    self.ctx.closePath();
                    self.ctx.fill();

                    self.ctx.beginPath();
                        self.ctx.fillStyle = self.spotMiddleColor;
                        self.ctx.arc(spot.renderPosition.x, spot.renderPosition.y, self.spotCentreSize, 0, Math.PI * 2);
                    self.ctx.closePath();
                    self.ctx.fill();
                }
            self.camera.end();
        },
        renderSpotToAdd: function(spot) {
            self.camera.begin();
                self.ctx.beginPath();
                    self.ctx.fillStyle = self.selectedSpotColor;
                    self.ctx.arc(spot.renderPosition.x, spot.renderPosition.y, self.spotSize, 0, Math.PI * 2);
                self.ctx.closePath();
                self.ctx.fill();
            self.camera.end();
        },
        renderCalibrationPoints: function(data) {
            function drawLine(x1, y1, x2, y2, highlighted) {
                if(highlighted) {
                    self.ctx.lineWidth = self.calibrationLineWidthHighlighted;
                }
                else {
                    self.ctx.lineWidth = self.calibrationLineWidth;
                }
                self.ctx.beginPath();
                self.ctx.moveTo(x1, y1);
                self.ctx.lineTo(x2, y2);
                self.ctx.stroke();
                self.ctx.closePath();

            };
            self.camera.begin();
                self.ctx.strokeStyle = self.calibrationColor.TL;
                drawLine(        0, data.TL.y,     20000, data.TL.y, data.highlighted.includes('T'));
                drawLine(data.TL.x,         0, data.TL.x,     20000, data.highlighted.includes('L'));

                self.ctx.strokeStyle = self.calibrationColor.BR;
                drawLine(        0, data.BR.y,     20000, data.BR.y, data.highlighted.includes('B'));
                drawLine(data.BR.x,         0, data.BR.x,     20000, data.highlighted.includes('R'));
            self.camera.end();
        },
        renderSpotSelection: function(rectCoords) {
            self.ctx.strokeStyle = "rgba(30, 30, 30, 0.9)";
            self.ctx.setLineDash([4, 3]);
            self.ctx.strokeRect(rectCoords.TL.x, rectCoords.TL.y, rectCoords.WH.x, rectCoords.WH.y);
        }
  };

  this.Renderer = Renderer;
  
}).call(this);
