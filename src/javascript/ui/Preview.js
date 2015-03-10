'use strict';






var language = require('../language.js');
var settings = require('../Settings.js');
var _ = require('underscore/underscore.js');

module.exports = Preview;


////////////////////////////////////////////////////////////////////
// Preview

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

	var drag = false;
	var lastMouse;

	$(paper.view.element).bind('contextmenu', function(e) {
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
		paper.view.scrollBy(lastMouse.subtract(thisMouse).multiply(1.0 / paper.view.zoom));
		lastMouse = thisMouse;
	});


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


	Mousetrap.bindGlobal('command+=', function() { paper.view.zoom *= 2; return false; } );
	Mousetrap.bindGlobal('command+-', function() { paper.view.zoom *= 0.5; return false; } );


};

Preview.prototype.setDocument = function(_doc) {
	var oldDoc = this.doc;
	this.doc = _doc;


	


	console.log(paper.view);
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



	if (oldDoc === null) {
		paper.view.center = new paper.Point(_doc.properties.width.toNumber("px") * 0.5, _doc.properties.height.toNumber("px") * 0.5);
	}

	// paper.view.zoom = _doc.properties.zoom;
	paper.view.update();

};

Preview.prototype.redraw = function() {
	paper.view.update();
};
