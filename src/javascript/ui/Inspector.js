'use strict';

var _ = require('underscore/underscore.js');
var language = require('../language.js');


////////////////////////////////////////////////////////////////////
// Inspector
//
// Shows information about the current selection in inspector view

module.exports = Inspector;

function Inspector() {
	this.element = null;
}

Inspector.prototype.init = function(_element) {
	this.element = _element;
	this.clear();
	
	this.unit = "px";
	this.units = ["px", "mm", "in"];
	this.keyRegion = null;

	$.Topic("App/selectionChanged").subscribe(_.bind(this.selectionChanged, this));
	$.Topic("UI/command/changeInspectorUnit").subscribe(_.bind(this.changeInspectorUnit, this));
};


Inspector.prototype.changeInspectorUnit = function(_unit) {

	if (_unit && _(this.units).contains(_unit)) {
		this.unit = _unit;
	}
	else {
		var currentIndex = _(this.units).indexOf(this.unit);
		var nextIndex = (currentIndex + 1) % this.units.length;
		this.unit = this.units[nextIndex];
	}

	this.redraw();

};

Inspector.prototype.selectionChanged = function(_selection) {

	if (_selection && _selection.key) {
		this.keyRegion = _selection.key;
	}
	this.redraw();

};

Inspector.prototype.redraw = function() {

	var _region = this.keyRegion;
	if (!_region) return;

	this.clear();

	// build breadcrumbs
	
	var _r = _region;
	var breadCrumbs = $('<ul class="breadcrumbs">');
	$(this.element).append(breadCrumbs);

	while (_r) {
		var item = $("<li>").text(_r.properties.name || _r.type.toLowerCase());
		item.click(this.buildSelectRegionHandler(_r));
		breadCrumbs.prepend(item);
		_r = _r.parent;
	}



	// build data table

	var table = $("<table>");
	$(this.element).append(table);

	var top_row = $("<tr>");
	table.append(top_row);

	var bottom_row = $("<tr>");
	table.append(bottom_row);

	var self = this;
	function format(label, value, unit) {
		var convertedValue = math.unit(value, "px").toNumber(self.unit);
		return (
			"<td class=\"label\">" + label + ":</td>" +
			"<td class=\"value\">" + convertedValue.toFixed(2) + "</td>" +
			"<td class=\"unit\">" + unit + "</td>"
		);
	}

	top_row.append($(format("x", _region.previewBoundsGroup.bounds.center.x, this.unit)));
	bottom_row.append($(format("y", _region.previewBoundsGroup.bounds.center.y, this.unit)));

	top_row.append($(format("width", _region.previewBoundsGroup.bounds.width, this.unit)));
	bottom_row.append($(format("height", _region.previewBoundsGroup.bounds.width, this.unit)));

	top_row.append($(format("top", _region.previewBoundsGroup.bounds.top, this.unit)));
	bottom_row.append($(format("left", _region.previewBoundsGroup.bounds.left, this.unit)));
	top_row.append($(format("bottom", _region.previewBoundsGroup.bounds.bottom, this.unit)));
	bottom_row.append($(format("right", _region.previewBoundsGroup.bounds.right, this.unit)));



};


Inspector.prototype.buildSelectRegionHandler = function(_region) {
	return function() {
		$.Topic("Region/clicked").publish(_region);
	};
};

Inspector.prototype.clear = function(_element) {
	$(this.element).empty();
};
