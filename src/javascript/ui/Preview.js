'use strict';

var Context = require('../Context.js');
var language = require('../language.js');
var settings = require('../settings.js');
var _ = require('underscore');

module.exports = Preview;


////////////////////////////////////////////////////////////////////
// Preview

function Preview() {
	this.previewLayer = null;
	this.buildLayer = null;
	this.exportLayer = null;

	this.doc = null;


	var self = this;
	$.Topic("UI/command/toggleViewPreview").subscribe(
		function(_state) {
			if (_state === undefined) {
				_state = !self.previewLayer.visible;
			}
			self.previewLayer.visible = _state;
			paper.view.update();
		}
	);
	$.Topic("UI/command/toggleViewBuild").subscribe(
		function(_state) {
			if (_state === undefined) {
				_state = !self.buildLayer.visible;
			}
			self.buildLayer.visible = _state;
			paper.view.update();
		}
	);
	$.Topic("UI/command/toggleViewExport").subscribe(
		function(_state) {
			if (_state === undefined) {
				_state = !self.exportLayer.visible;
			}
			self.exportLayer.visible = _state;
			paper.view.update();
		}
	);



}

Preview.prototype.init = function(_element) {
	paper.setup(_element);
	this.buildLayer = new paper.Layer();
	this.exportLayer = new paper.Layer();
	this.previewLayer = new paper.Layer();

	var drag = false;
	var lastMouse;

	// handle dragging/panning
	$(paper.view.element).mousedown(function(_e) {
		drag = true;
		lastMouse = new paper.Point(_e.originalEvent.screenX, _e.originalEvent.screenY);
	});

	$(window).mouseup(function(_e) {
		drag = false;
	});

	$(window).mousemove(function(_e) {
		if (!drag) return;
		var thisMouse = new paper.Point(_e.originalEvent.screenX, _e.originalEvent.screenY);
		paper.view.scrollBy(lastMouse.subtract(thisMouse));
		lastMouse = thisMouse;
	});

};

Preview.prototype.setDocument = function(_doc) {
	this.doc = _doc;

	var context = new Context();
	var unit = language.unitScales[this.doc.properties.unit] || 1;
	context.matrix.scale(unit);
	// module.exports.inspector.setUnit(this.doc.properties.unit);

	// draw preview/frame
	this.previewLayer.removeChildren();
	paper.project.activeLayer = this.previewLayer;
	this.doc.preview(context);

	// draw build
	this.buildLayer.removeChildren();
	
	paper.project.activeLayer = this.buildLayer;
	var buildShapes = this.doc.build(context);
	this.buildLayer.style = settings.buildStyle;
	
	// console.log("childs", this.buildLayer.children);
	// console.log("buildShapes", buildShapes);
	// _(buildShapes).each(function(shape) {

	// 	// shape.style = settings.buildStyle;
	// 	shape.style = 
	// 	{
	// 		fillColor: "red",
	// 		strokeWidth: 1,
	// 		strokeColor: "blue"
	// 	};
	// });

	// draw export
	this.exportLayer.removeChildren();
	paper.project.activeLayer = this.exportLayer;
	this.doc.build(context);
	this.exportLayer.style = settings.exportStyle;


	paper.view.center = new paper.Point(_doc.properties.width * 0.5 * unit, _doc.properties.height * 0.5 * unit);
	paper.view.update();

};

Preview.prototype.redraw = function() {
	paper.view.update();
};
