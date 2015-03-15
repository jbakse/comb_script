'use strict';

var language = require('../language.js');
var settings = require('../Settings.js');
var _ = require('underscore/underscore.js');


////////////////////////////////////////////////////////////////////
// Preview
//
// handles graphic display of the CombScript document
// handles graphic display interactions (picking, dragging)

module.exports = Preview;

function Preview() {
	this.previewLayer = null;
	this.buildLayer = null;
	this.exportLayer = null;
	this.element = null;

	this.doc = null;
}

Preview.prototype.init = function(_element) {
	this.element = _element;

	paper.setup(this.element);

	this.buildLayer = new paper.Layer();
	this.exportLayer = new paper.Layer();
	this.previewLayer = new paper.Layer();


	setupDragging();
	setupPicking();
	this.attachHandlers();
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


////////////////////////////////////////////////////////////////////
// TODO: Put somewhere else!

function setupPicking() {
	var picker = new paper.Tool();

	var hoveredRegion = null;
	var mouseDownRegion = null;

	picker.onMouseDown = function(e) {
		mouseDownRegion = hoveredRegion;
	};

	picker.onMouseUp = function(e) {
		if (hoveredRegion && hoveredRegion === mouseDownRegion) {
			hoveredRegion.onClick();
		}
	};

	picker.onMouseMove = function(e) {
		// find the "picked" region, strokes get priority over fills so that you can pick thorugh a overlapping shape

		// check just strokes first
		var hit = paper.project.hitTest(e.point, {
			tolerance: 5,
			stroke: true
		});

		// if the cursor isn't over a stroke, check for a fill
		if (hit === null) {
			hit = paper.project.hitTest(e.point, {
				tolerance: 5,
				fill: true
			});
		}

		var oldHoveredRegion = hoveredRegion;

		if (hit === null) {
			hoveredRegion = null;
		} else {
			hoveredRegion = hit.item.region;
		}

		if (oldHoveredRegion && oldHoveredRegion !== hoveredRegion) {
			oldHoveredRegion.onMouseLeave();
		}

		if (hoveredRegion && oldHoveredRegion !== hoveredRegion) {
			hit.item.region.onMouseEnter();
		}

	};
}



Preview.prototype.attachHandlers = function() {
	var self = this;

	$.Topic("File/opened").subscribe(
		function() {
			self.newFileFlag = true;
		}
	);

	$.Topic("App/selectionChanged").subscribe(_.bind(this.selectionChanged, this));

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


	// block context menu
	$(paper.view.element).bind('contextmenu', function(e) {
		return false;
	});

};

Preview.prototype.setZoom = function(_zoom) {
	paper.view.zoom = _zoom;
	$("#zoom-level").text(paper.view.zoom * 100 + "%");
};

Preview.prototype.zoomToFit = function() {
	// zoom to fit
	var zX = $("#preview").width() / this.previewLayer.bounds.width;
	var zY = $("#preview").height() / this.previewLayer.bounds.height;
	var z = Math.min(zX, zY);

	function floorPow2(aSize) {
		return Math.pow(2, Math.floor(Math.log(aSize) / Math.log(2)));
	}
	z = floorPow2(z);

	this.setZoom(z);

	// center
	paper.view.center = new paper.Point(this.doc.properties.width.toNumber("px") * 0.5, this.doc.properties.height.toNumber("px") * 0.5);
};


//	selectionChanged - called when selection changes to update the preview with new styles
Preview.prototype.selectionChanged = function(_selection) {
	if (!this.doc) {
		console.error("selectRegionsForLine called without this.doc set");
		return;
	}

	this.doc.setStyle("default", true);

	_(_selection.regions).each(function(_region) {
		_region.setStyle("selected");
	});

	if (_selection.key) _selection.key.setStyle("key");
	if (_selection.hover) _selection.hover.setStyle("hover");

	paper.view.update();
};



Preview.prototype.setDocument = function(_doc) {
	this.doc = _doc;

	// draw preview/frame
	this.previewLayer.activate();
	this.previewLayer.removeChildren();
	this.doc.preview();

	// draw build
	this.buildLayer.activate();
	this.buildLayer.removeChildren();
	this.doc.build();
	this.buildLayer.style = settings.buildStyle;

	// draw export
	this.exportLayer.removeChildren();
	this.exportLayer.activate();
	this.doc.build();

	var style = settings.exportStyle;
	if (this.doc.properties.cut_color) {
		style.strokeColor = new paper.Color(this.doc.properties.cut_color.red, this.doc.properties.cut_color.green, this.doc.properties.cut_color.blue);
	}
	if (this.doc.properties.cut_width) {
		style.strokeWidth = Math.max(0.5, this.doc.properties.cut_width);
	}
	this.exportLayer.style = style;

	if (this.newFileFlag) {
		this.zoomToFit();
		this.newFileFlag = false;
	}

	paper.view.update();
};

