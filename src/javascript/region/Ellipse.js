'use strict';

var _ = require('underscore');
var Region = require('./Region.js');

module.exports = Ellipse;

//////////////////////////////////////////////////////////////////////
// Ellipse

function Ellipse(_data, _parent) {
	Region.call(this, _data, _parent);
	this.type = "Ellipse";
	this.isShape = true;
}

Ellipse.prototype = Object.create(Region.prototype);
Ellipse.prototype.constructor = Ellipse;

Ellipse.prototype.drawBuild = function(_bounds) {
	var boundsPath = new paper.Path.Ellipse(_bounds);
	return boundsPath;
};


Ellipse.prototype.drawBounds = function(_bounds) {
	return new paper.Path.Ellipse(_bounds);
};

Ellipse.prototype.drawPosition = function(_bounds) {
	return new paper.Path.Ellipse(new paper.Rectangle(-0.5, -0.5, 1, 1));
};
