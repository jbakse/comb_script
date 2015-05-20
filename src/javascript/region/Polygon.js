'use strict';

var _ = require('underscore/underscore.js');
var Region = require('./Region.js');

module.exports = Polygon;

//////////////////////////////////////////////////////////////////////
// Polygon

function Polygon(_data, _parent) {
	Region.call(this, _data, _parent);
	this.type = "Polygon";
	this.isShape = true;
}

Polygon.prototype = Object.create(Region.prototype);
Polygon.prototype.constructor = Polygon;

Polygon.prototype.drawBuild = function(_bounds) {
	// var boundsPath = new paper.Path.RegularPolygon(new paper.Point(0, 0), 8, 50);
	// return boundsPath;
	var polygon;
	if (this.properties.radius){
		console.log("props width " + this.properties.width);
		var r = null;
		r = this.properties.radius.toNumber("px");
		polygon = new paper.Path.RegularPolygon(new paper.Point(_bounds.x + _bounds.width/2, _bounds.y + _bounds.height/2), this.properties.sides, r);

	}else{
		polygon = new paper.Path.RegularPolygon(new paper.Point(_bounds.x + _bounds.width/2, _bounds.y + _bounds.height/2), this.properties.sides, _bounds.height/2);

		if (this.properties.scale === "fit") {
			polygon.scale(_bounds.size.divide(polygon.bounds.size));
		}

		if (this.properties.scale === "cover") {
			var ratio = _bounds.size.divide(polygon.bounds.size);
			polygon.scale(Math.max(ratio.width, ratio.height));
		}

		if (this.properties.scale === "contain") {
			var ratio = _bounds.size.divide(polygon.bounds.size);
			polygon.scale(Math.min(ratio.width, ratio.height));
		}
	}

	return polygon
};

Polygon.prototype.drawBounds = function(_bounds) {
	// return new paper.Path.RegularPolygon(new paper.Point(_bounds.x + _bounds.width/2, _bounds.y + _bounds.height/2), 8, (_bounds.width/2 | _bounds.height/2));
	return new paper.Path.Rectangle(_bounds);
};

