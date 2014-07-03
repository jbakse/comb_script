'use strict';

var _ = require('underscore');
var Region = require('./Region.js');
var UI = require('../UI.js');

module.exports.SVG = SVG;


//////////////////////////////////////////////////////////////////////
// SVG

function SVG(_data, _parent) {
	Region.call(this, _data, _parent);
	
	this.type = "SVG";
	this.isShape = true;
	this.svgMarkup = undefined;

	_.extend(this.typeProperties.boundsStyle, {
		strokeColor: '#888'
	});
}

SVG.prototype = Object.create(Region.prototype);
SVG.prototype.constructor = SVG;

SVG.prototype.loadData = function(_data) {
	Region.prototype.loadData.call(this, _data);
	var self = this;
	if (this.properties.source) {
		UI.log.appendMessage("Loading SVG " + this.properties.source);
		var jqXHR = $.ajax({
			url: this.properties.source,
			dataType: "text",
			success: function(_data) {
				UI.log.appendSuccess("Loaded SVG Markup" + self.properties.source);
				self.svgMarkup = _data;
			},

			error: function(_data) {
				UI.log.appendError("Couldn't retrieve SVG " + self.properties.source);
			},

			cache: false
		});
		this.root.waitList.push(jqXHR);
	}
}


SVG.prototype.drawBuild = function(_bounds) {
	if (!this.svgMarkup) {
		return [];
	}
	var p = new paper.Group().importSVG(this.svgMarkup, {
		expandShapes: true
	});
	return p.children;
};

SVG.prototype.drawBounds = function(_bounds) {
	var g = new paper.Group();
	if (!this.svgMarkup) {
		return g;
	}

	// var boundsPath = new paper.Path.Rectangle(_bounds, this.properties.radius || 0);
	var svg = new paper.Group().importSVG(this.svgMarkup, {
		expandShapes: true
	});
	// svg.translate(boundsPath.position.subtract(svg.position));
	// svg.scale(boundsPath.bounds.size.divide(svg.bounds.size));

	// g.addChild(boundsPath);
	g.addChild(svg);

	return g;
};

SVG.prototype.drawPosition = function(_bounds) {
	return new paper.Path.Rectangle(new paper.Rectangle(-0.5, -0.5, 1, 1));
};
