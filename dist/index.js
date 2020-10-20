// Copyright 2010 William Malone (www.williammalone.com)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/*jslint browser: true */
/*global G_vmlCanvasManager, $ */

var paintBucketApp = (function () {

  "use strict";

  var context,
    contextFillColor,
    contextCrop,
    canvasFillColor,
    canvasCrop,
    canvasWidth = 334,
    canvasHeight = 500,
    // colorPurple = {
    // 	r: 203,
    // 	g: 53,
    // 	b: 148
    // },
    // colorGreen = {
    // 	r: 101,
    // 	g: 155,
    // 	b: 65
    // },
    // colorYellow = {
    // 	r: 255,
    // 	g: 207,
    // 	b: 51
    // },
    // colorBrown = {
    // 	r: 152,
    // 	g: 105,
    // 	b: 40
    // },

    outlineImage = new Image(),
    swatchImage = new Image(),
    backgroundImage = new Image(),
    drawingAreaX = 0,
    drawingAreaY = 0,
    drawingAreaWidth = 334,
    drawingAreaHeight = 500,
    colorLayerData,
    outlineLayerData,
    totalLoadResources = 3,
    curLoadResNum = 0,

    // Clears the canvas.
    clearCanvas = function () {
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    },

    fillColor = function (layer) {
      const tempLayer = layer
      for (let i = 0; i < tempLayer.data.length; i = i + 4) {
        if (tempLayer.data[i] === 255 && tempLayer.data[i + 1] === 255 && tempLayer.data[i + 2] === 255 && tempLayer.data[i + 3] === 255) {
          tempLayer.data[i] = 203
          tempLayer.data[i + 1] = 53
          tempLayer.data[i + 2] = 148
          tempLayer.data[i + 3] = 255
        }
        else {
          tempLayer.data[i] = 0
          tempLayer.data[i + 1] = 0
          tempLayer.data[i + 2] = 0
          tempLayer.data[i + 3] = 0
        }
      }
      return tempLayer
    },

    crop = function (layer) {
      const imageData = layer.data
      const imageProps = layer
      const output = {
        top: null,
        left: null,
        bottom: null,
        right: null,
      };
      const limitLoop = imageData.length / (4 * imageProps.width);
      for (let index = 0; index <= limitLoop; index++) {
        const pixelArrByWidth = imageData.slice(
          index * 4 * imageProps.width,
          (index + 1) * 4 * imageProps.width
        );
        let startColorIndex = pixelArrByWidth.findIndex((x) => x !== 0);
        if (startColorIndex < 0) continue;
        if (typeof output.top !== "number") {
          output.top = index;
          output.bottom = index;
        }
        if (typeof output.bottom === "number" && index > output.bottom) {
          output.bottom = index;
        }
        startColorIndex = Math.floor(startColorIndex / 4);
        if (output.left === null || startColorIndex < output.left) {
          output.left = startColorIndex;
        }
        for (let j = output.left; j < pixelArrByWidth.length; j++) {
          if (pixelArrByWidth[j] === 0) continue;
          if (output.right === null || Math.floor(j / 4) > output.right)
            output.right = Math.floor(j / 4) + 1;
        }
      }
      return output;
    },

    // Draw the elements on the canvas
    redraw = function () {
      // Make sure required resources are loaded before redrawing
      if (curLoadResNum < totalLoadResources) {
        return;
      }
      clearCanvas();
      // Draw the current state of the color layer to the canvas
      context.putImageData(colorLayerData, 0, 0);

      // fill color to image
      const fillColorLayerData = fillColor(outlineLayerData)
      contextFillColor.putImageData(fillColorLayerData, 0, 0);

      const border = crop(outlineLayerData)
      canvasCrop.width = border.right - border.left;
      canvasCrop.height = border.bottom - border.top;
      contextCrop.drawImage(
        canvasFillColor,
        border.left,
        border.top,
        border.right - border.left,
        border.bottom - border.top,
        0,
        0,
        border.right - border.left,
        border.bottom - border.top,
      );

      var a = document.createElement("a");
      a.href = canvasCrop.toDataURL();
      a.download = "Image.png";
      a.click();
      // Draw the background
      context.drawImage(outlineImage, drawingAreaX, drawingAreaY, drawingAreaWidth, drawingAreaHeight);
    },

    // Calls the redraw function after all neccessary resources are loaded.
    resourceLoaded = function () {
      curLoadResNum += 1;
      if (curLoadResNum === totalLoadResources) {
        redraw();
      }
    },

    // Creates a canvas element, loads images, adds events, and draws the canvas for the first time.
    init = function () {
      // Create the canvas to show image
      var canvas = document.createElement('canvas');
      canvas.setAttribute('width', canvasWidth);
      canvas.setAttribute('height', canvasHeight);
      canvas.setAttribute('id', 'canvas');

      // Create the canvas to show image after fill color 
      canvasFillColor = document.createElement('canvas');
      canvasFillColor.setAttribute('width', canvasWidth);
      canvasFillColor.setAttribute('height', canvasHeight);

      // Create the canvas to show image after crop image
      canvasCrop = document.createElement('canvas');
      canvasCrop.setAttribute('width', canvasWidth);
      canvasCrop.setAttribute('height', canvasHeight);

      document.getElementById('canvasDiv').appendChild(canvas);
      document.getElementById('fillColorDiv').appendChild(canvasFillColor);
      document.getElementById('cropDiv').appendChild(canvasCrop);

      if (typeof G_vmlCanvasManager !== "undefined") {
        canvas = G_vmlCanvasManager.initElement(canvas);
      }

      // get context of canvas
      context = canvas.getContext("2d"); // Grab the 2d canvas context
      contextFillColor = canvasFillColor.getContext("2d"); // Grab the 2d canvas context
      contextCrop = canvasCrop.getContext("2d"); // Grab the 2d canvas context

      // Load images
      backgroundImage.onload = resourceLoaded;
      backgroundImage.src = "images/background.png";

      swatchImage.onload = resourceLoaded;
      swatchImage.src = "images/paint-outline.png";

      outlineImage.onload = function () {
        context.drawImage(outlineImage, drawingAreaX, drawingAreaY, drawingAreaWidth, drawingAreaHeight);
        try {
          outlineLayerData = context.getImageData(0, 0, canvasWidth, canvasHeight);
        } catch (ex) {
          window.alert("Application cannot be run locally. Please run on a server.");
          return;
        }
        clearCanvas();
        colorLayerData = context.getImageData(0, 0, canvasWidth, canvasHeight);
        resourceLoaded();
      };
      outlineImage.src = "images/mask.png";
    };
  return {
    init: init
  };
}());