
'use strict';

var _ = require('underscore/underscore.js');
var Region = require('./Region.js');

module.exports = Rectangle;

//////////////////////////////////////////////////////////////////////
// Rectangle

function Rectangle(_data, _parent) {
	Region.call(this, _data, _parent);
	this.type = "Rectangle";
	this.isShape = true;
}

Rectangle.prototype = Object.create(Region.prototype);
Rectangle.prototype.constructor = Rectangle;

Rectangle.prototype.drawBuild = function(_bounds) {
	console.log(this.properties);
	var r = 0;
	if (this.properties.radius) r = this.properties.radius.toNumber("px");

	var boundsPath = new paper.Path.Rectangle(_bounds, r);
	return boundsPath;
};

Rectangle.prototype.drawBounds = function(_bounds) {
	var r = 0;
	if (this.properties.radius) r = this.properties.radius.toNumber("px");

	return new paper.Path.Rectangle(_bounds, r);
};

