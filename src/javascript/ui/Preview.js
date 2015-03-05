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

	$(paper.view.element).bind('contextmenu', function(e) {
		console.log("context");
		return false;
	});


	// handle dragging/panning
	$(paper.view.element).mousedown(function(_e) {
		if (_e.which != 1) {
			_e.preventDefault();
			return false;
		}
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
	var oldDoc = this.doc;
	this.doc = _doc;

	var context = new Context();
	var unit = language.unitScales[this.doc.properties.unit] || 1;
	context.matrix.scale(unit);

	// draw preview/frame
	this.previewLayer.removeChildren();
	this.previewLayer.activate();
	this.doc.preview(context);
	

	// draw build
	this.buildLayer.removeChildren();

	this.buildLayer.activate();
	var buildShapes = this.doc.build(context);
	this.buildLayer.style = settings.buildStyle;


	


	_(buildShapes).each(function(shape) {

		if (shape instanceof paper.Path) return;
		if (shape instanceof paper.CompoundPath) return;
		shape.style = {
			fillColor: undefined,
			strokeWidth: 1,
			strokeColor: "red"
		};
	});


	// draw export
	this.exportLayer.removeChildren();
	this.exportLayer.activate();
	this.doc.build(context);


	var style = settings.exportStyle;

	if (this.doc.properties.cut_color) {
		style.strokeColor = new paper.Color(this.doc.properties.cut_color.red, this.doc.properties.cut_color.green, this.doc.properties.cut_color.blue);
	}
	if (this.doc.properties.cut_width) {
		style.strokeWidth = Math.max(0.5, this.doc.properties.cut_width);
	}

	this.exportLayer.style = style;

	if (oldDoc === null) {
		paper.view.center = new paper.Point(_doc.properties.width * 0.5 * unit, _doc.properties.height * 0.5 * unit);
	}
	// console.log("doc", _doc);
	paper.view.zoom = _doc.properties.zoom;
	paper.view.update();

};

Preview.prototype.redraw = function() {
	paper.view.update();
};
