'use strict';

var _ = require('underscore/underscore.js');
var Region = require('./Region.js');
var log = require('../ui/Log.js').sharedInstance();

module.exports = SVG;


//////////////////////////////////////////////////////////////////////
// SVG

function SVG(_data, _parent) {
	Region.call(this, _data, _parent);
	this.type = "SVG";
	this.isShape = true;

	

}

SVG.prototype = Object.create(Region.prototype);
SVG.prototype.constructor = SVG;


SVG.prototype.drawBuild = function(_bounds) {
	if (!this.properties.svg_data) {
		return new paper.Group();
	}



	var g = new paper.Group().importSVG(this.properties.svg_data, {
		expandShapes: true
	});
	var boundsPath = new paper.Path.Rectangle(_bounds);

	g.transformContent = true;
	
	g.translate(boundsPath.position.subtract(g.position));

	if (this.properties.scale === "fit") {
		g.scale(boundsPath.bounds.size.divide(g.bounds.size));
	}

	if (this.properties.scale === "cover") {
		var ratio = boundsPath.bounds.size.divide(g.bounds.size);
		g.scale(Math.max(ratio.width, ratio.height));
	}

	if (this.properties.scale === "contain") {
		var ratio = boundsPath.bounds.size.divide(g.bounds.size);
		g.scale(Math.min(ratio.width, ratio.height));
	}



	return g.children;
};

SVG.prototype.drawBounds = function(_bounds) {
	return new paper.Path.Rectangle(_bounds);
};
