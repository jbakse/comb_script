'use strict';

var _ = require('underscore');
var language = require('../language.js');

module.exports = Inspector;

////////////////////////////////////////////////////////////////////
// Inspector

function Inspector() {
	this.element = null;
	this.unit = "px";
}

Inspector.prototype.init = function(_element) {
	this.element = _element;
	this.clear();
	$.Topic("UI/updateInspector").subscribe(_.bind(this.update, this));
};


Inspector.prototype.setUnit = function(_unit) {
	this.unit = _unit;
};

Inspector.prototype.update = function(_regions) {
	// _region = this.controller && this.controller.hoverRegion || this.controller && this.controller.selectedRegion;

	$(this.element).empty();

	if (_regions.length === 0) return;
	if (_regions[0] === null) return;

	if (_regions.length > 1) {
		$(this.element).append("Multiple Selections");
		return;
	}

	var t = function(_term, _data) {
		return "<dt>" + _term + "</dt><dd>" + _data + "</dd>";
	};

	var _region = _regions[0];

	var _r = _region;
	var breadCrumbs = $('<ul class="breadcrumbs">');
	var item;
	while (_r) {
		item = $("<li>").text(_r.properties.name || _r.type);
		item.click(this.buildSelectRegionHandler(_r));
		breadCrumbs.prepend(item);
		_r = _r.parent;
	}

	$(this.element).append(breadCrumbs);
	$(this.element).append(t("Type", _region.type));
	$(this.element).append(t("Name", _region.properties.name || "unnamed"));
	$(this.element).append(t("Line", _region.editorProperties.firstLine + 1));
	
	var center = {
		x: _region.previewBoundsGroup.bounds.center.x,
		y: _region.previewBoundsGroup.bounds.center.y,
	};
	$(this.element).append(t("Center", this.formatDimensionObject(center) || "{}"));

	var size = {
		width: _region.previewBoundsGroup.bounds.width,
		height: _region.previewBoundsGroup.bounds.height,
	};
	$(this.element).append(t("Height", this.formatDimensionObject(size) || "{}"));


	var bounds = {
		left: _region.previewBoundsGroup.bounds.left,
		top: _region.previewBoundsGroup.bounds.top,
		bottom: _region.previewBoundsGroup.bounds.bottom,
		right: _region.previewBoundsGroup.bounds.right,
	};
	$(this.element).append(t("Bounds", this.formatDimensionObject(bounds)));


};

Inspector.prototype.formatDimensionObject = function(_o) {
	var self = this;
	var props = [];
	_(_o).each( function(_value, _key) {
		props.push ( _key + ": " + self.formatDimension(_value) );
	});
	var s = "{ " + props.join(", ") + " }";
	
	return s;
};

Inspector.prototype.formatDimension = function(_v) {
	var value = +(_v / language.unitScales[this.unit] || 1).toFixed(3);
	return value + " " + this.unit;
};

Inspector.prototype.buildSelectRegionHandler = function(_region) {
	return function() {
		$.Topic("region/onClick").publish(_region);
	};
};

Inspector.prototype.clear = function(_element) {
	$(this.element).empty();
};