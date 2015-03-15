'use strict';

var language = require('../language.js');
var settings = require('../Settings.js');
var _ = require('underscore/underscore.js');


////////////////////////////////////////////////////////////////////
// Preview
//
// renders the CombScript document canvas

module.exports = Preview;

function Preview() {
	this.previewLayer = null;
	this.buildLayer = null;
	this.exportLayer = null;

	this.doc = null;
}

Preview.prototype.init = function(_element) {
	paper.setup(_element);

	this.buildLayer = new paper.Layer();
	this.exportLayer = new paper.Layer();
	this.previewLayer = new paper.Layer();

	

	$(paper.view.element).bind('contextmenu', function(e) {
		return false;
	});


	setupDragging();
	this.attachHandlers();

	

	Mousetrap.bindGlobal('command+=', function() {
		$.Topic("UI/command/zoomIn").publish();
		// paper.view.zoom *= 2;
		return false;
	});

	Mousetrap.bindGlobal('command+-', function() {
		$.Topic("UI/command/zoomOut").publish();
		// paper.view.zoom *= 0.5;
		return false;
	});


};

Preview.prototype.attachHandlers = function() {
	var self = this;

	$.Topic("File/opened").subscribe(
		function() {
			self.newFileFlag = true;
		}
	);

	$.Topic("UI/command/toggleViewPreview").subscribe(
		function(_state) {
			_state = typeof _state === 'undefined' ? !self.previewLayer.visible : _state;
			self.previewLayer.visible = _state;
			paper.view.update();
		}
	);

	$.Topic("UI/command/toggleViewBuild").subscribe(
		function(_state) {
			_state = typeof _state === 'undefined' ? !self.buildLayer.visible : _state;
			self.buildLayer.visible = _state;
			paper.view.update();
		}
	);

	$.Topic("UI/command/toggleViewExport").subscribe(
		function(_state) {
			_state = typeof _state === 'undefined' ? !self.exportLayer.visible : _state;
			self.exportLayer.visible = _state;
			paper.view.update();
		}
	);

	$.Topic("UI/command/zoomIn").subscribe(
		function() {
			self.setZoom(paper.view.zoom * 2);
		}
	);

	$.Topic("UI/command/zoomOut").subscribe(
		function() {
			self.setZoom(paper.view.zoom * 0.5);
		}
	);
};

Preview.prototype.setZoom = function(_zoom) {
	paper.view.zoom = _zoom;
	$("#zoom-level").text(paper.view.zoom * 100 + "%");
};

function setupDragging() {

	var isDragging = false;
	var oldMouseLoc;

	$(paper.view.element).mousedown(function(_e) {
		if (_e.which != 1) return;
		isDragging = true;
		oldMouseLoc = new paper.Point(_e.originalEvent.screenX, _e.originalEvent.screenY);
	});

	$(window).mouseup(function(_e) {
		isDragging = false;
	});

	$(window).mousemove(function(_e) {
		if (!isDragging) return;
		var newMouseLoc = new paper.Point(_e.originalEvent.screenX, _e.originalEvent.screenY);
		paper.view.scrollBy(oldMouseLoc.subtract(newMouseLoc).multiply(1.0 / paper.view.zoom));
		oldMouseLoc = newMouseLoc;
	});

}

Preview.prototype.setDocument = function(_doc) {
	// var oldDoc = this.doc;
	this.doc = _doc;


	// draw preview/frame
	this.previewLayer.activate();
	this.previewLayer.removeChildren();
	this.doc.preview();

	// draw build
	this.buildLayer.activate();
	this.buildLayer.removeChildren();
	var buildShapes = this.doc.build();

	// re-style build layer
	this.buildLayer.style = settings.buildStyle;
	// _(buildShapes).each(function(shape) {

	// 	if (shape instanceof paper.Path) return;
	// 	if (shape instanceof paper.CompoundPath) return;
	// 	shape.style = {
	// 		fillColor: undefined,
	// 		strokeWidth: 1,
	// 		strokeColor: "red"
	// 	};
	// });


	// draw export
	this.exportLayer.removeChildren();
	this.exportLayer.activate();
	this.doc.build();


	// re-style export layer
	var style = settings.exportStyle;

	if (this.doc.properties.cut_color) {
		style.strokeColor = new paper.Color(this.doc.properties.cut_color.red, this.doc.properties.cut_color.green, this.doc.properties.cut_color.blue);
	}
	if (this.doc.properties.cut_width) {
		style.strokeWidth = Math.max(0.5, this.doc.properties.cut_width);
	}

	this.exportLayer.style = style;


	function floorPow2(aSize) {
		return Math.pow(2, Math.floor(Math.log(aSize) / Math.log(2)));
	}

	if (this.newFileFlag) {

		// zoom to fit
		var zX = $("#preview").width() / this.previewLayer.bounds.width;
		var zY = $("#preview").height() / this.previewLayer.bounds.height;
		var z = Math.min(zX, zY);
		z = floorPow2(z);
		paper.view.zoom = z;
		$("#zoom-level").text(paper.view.zoom * 100 + "%");

		// center
		paper.view.center = new paper.Point(_doc.properties.width.toNumber("px") * 0.5, _doc.properties.height.toNumber("px") * 0.5);

		// just the first time
		this.newFileFlag = false;
	}

	// paper.view.zoom = _doc.properties.zoom;
	paper.view.update();

};

Preview.prototype.redraw = function() {
	paper.view.update();
};
