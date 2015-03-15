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
	$.Topic("App/selectionChanged").subscribe(_.bind(this.selectionChanged, this));
};


Inspector.prototype.selectionChanged = function(_selection) {

	this.clear();

	var _region = _selection.key;
	if (!_region) return;


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

	function format(label, value, unit) {
		return (
		"<td class=\"label\">"+label+":</td>"+
		"<td class=\"value\">"+value.toFixed(2)+"</td>"+
		"<td class=\"unit\">"+unit+"</td>"
		);
	}

	top_row.append( $(format("x", _region.previewBoundsGroup.bounds.center.x, "px") ) );
	bottom_row.append( $(format("y", _region.previewBoundsGroup.bounds.center.y, "px") ) );

	top_row.append( $(format("width", _region.previewBoundsGroup.bounds.width, "px") ) );
	bottom_row.append( $(format("height", _region.previewBoundsGroup.bounds.width, "px") ) );

	top_row.append( $(format("top", _region.previewBoundsGroup.bounds.top, "px") ) );
	bottom_row.append( $(format("left", _region.previewBoundsGroup.bounds.left, "px") ) );
	top_row.append( $(format("bottom", _region.previewBoundsGroup.bounds.bottom, "px") ) );
	bottom_row.append( $(format("right", _region.previewBoundsGroup.bounds.right, "px") ) );


	



};


Inspector.prototype.buildSelectRegionHandler = function(_region) {
	return function() {
		$.Topic("region/onClick").publish(_region);
	};
};

Inspector.prototype.clear = function(_element) {
	$(this.element).empty();
};
