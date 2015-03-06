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
	console.log(_bounds);

	// var boundsPath = new paper.Path.RegularPolygon(new paper.Point(0, 0), 8, 50);
	// return boundsPath;

	return this.drawBounds(_bounds);

	// var boundsPath = new paper.Path.RegularPolygon(_bounds, 3, this.properties.radius || 0);
	// return boundsPath;
};

Polygon.prototype.drawBounds = function(_bounds) {
	// return new paper.Path.RegularPolygon(new paper.Point(_bounds.x + _bounds.width/2, _bounds.y + _bounds.height/2), 8, (_bounds.width/2 | _bounds.height/2));
	return new paper.Path.RegularPolygon(new paper.Point(_bounds.x + _bounds.width/2, _bounds.y + _bounds.height/2), this.properties.sides, this.properties.radius/2 || _bounds.height/2);
	// return new paper.Path.RegularPolygon(new paper.Point(0, 0), 8, 50);
};

