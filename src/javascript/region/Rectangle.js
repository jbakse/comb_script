'use strict';

var _ = require('underscore');
var Region = require('./Region.js');

module.exports = Rectangle;

//////////////////////////////////////////////////////////////////////
// Rectangle

function Rectangle(_data, _parent) {
	Region.call(this, _data, _parent);
	this.type = "Rectangle";
	_.extend(this.typeProperties.boundsStyle, {
		strokeColor: '#888'
	});
}

Rectangle.prototype = Object.create(Region.prototype);
Rectangle.prototype.constructor = Rectangle;

Rectangle.prototype.drawBuild = function(_bounds) {
	var boundsPath = new paper.Path.Rectangle(_bounds, this.properties.radius || 0);
	return boundsPath;
};



Rectangle.prototype.drawBounds = function(_bounds) {
	return new paper.Path.Rectangle(_bounds, this.properties.radius || 0);
};

Rectangle.prototype.drawPosition = function(_bounds) {
	return new paper.Path.Ellipse(new paper.Rectangle(-0.5, -0.5, 1, 1));
};
