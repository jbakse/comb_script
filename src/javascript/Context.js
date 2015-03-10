"use strict";

var math = require('mathjs/math.min.js');

module.exports = Context;



function Context(_bounds, _matrix) {
	this.bounds = _bounds ? _bounds.clone() : new paper.Rectangle(0, 0, 0, 0);
	this.matrix = _matrix ? _matrix.clone() : new paper.Matrix();
}

Context.prototype.toString = function() {
	return "Context: " + this.bounds;
};


Context.prototype.scope = function(){
	
	return {
		parent_height: math.unit(this.bounds.height, 'px'),
		parent_width: math.unit(this.bounds.width, 'px'),
		parent_left: math.unit(this.bounds.left, 'px'),
		parent_right: math.unit(this.bounds.right, 'px'),
		parent_top: math.unit(this.bounds.top, 'px'),
		parent_bottom: math.unit(this.bounds.bottom, 'px')
	};
};

Context.prototype.deriveContext = function(_properties) {

	// Calculate Bounds
	var derivedBounds = new paper.Rectangle();

	derivedBounds.top = deriveBound(
		this.bounds.top, this.bounds.bottom,
		_properties.top, _properties.margin_top, _properties.bottom, _properties.margin_bottom, _properties.height, -1
	);

	derivedBounds.bottom = deriveBound(
		this.bounds.bottom, this.bounds.top,
		_properties.bottom, _properties.margin_bottom, _properties.top, _properties.margin_top, _properties.height, 1
	);

	derivedBounds.left = deriveBound(
		this.bounds.left, this.bounds.right,
		_properties.left, _properties.margin_left, _properties.right, _properties.margin_right, _properties.width, -1
	);

	derivedBounds.right = deriveBound(
		this.bounds.right, this.bounds.left,
		_properties.right, _properties.margin_right, _properties.left, _properties.margin_left, _properties.width, 1
	);



	// Calculate Matrix
	var derivedMatrix = this.matrix.clone();
	var derivedContext = new Context(derivedBounds, derivedMatrix);

	if (_properties.registration === "center") {
		derivedContext.moveRegistration(derivedContext.bounds.center.x, derivedContext.bounds.center.y);
	}
	if (_properties.registration === "top") {
		derivedContext.moveRegistration(derivedContext.bounds.center.x, derivedContext.bounds.top);
	}
	if (_properties.registration === "bottom") {
		derivedContext.moveRegistration(derivedContext.bounds.center.x, derivedContext.bounds.bottom);
	}
	if (_properties.registration === "left") {
		derivedContext.moveRegistration(derivedContext.bounds.left, derivedContext.bounds.center.y);
	}
	if (_properties.registration === "right") {
		derivedContext.moveRegistration(derivedContext.bounds.right, derivedContext.bounds.center.y);
	}
	if (_properties.registration === "top_left") {
		derivedContext.moveRegistration(derivedContext.bounds.left, derivedContext.bounds.top);
	}
	if (_properties.registration === "top_right") {
		derivedContext.moveRegistration(derivedContext.bounds.right, derivedContext.bounds.top);
	}
	if (_properties.registration === "bottom_left") {
		derivedContext.moveRegistration(derivedContext.bounds.left, derivedContext.bounds.bottom);
	}
	if (_properties.registration === "bottom_right") {
		derivedContext.moveRegistration(derivedContext.bounds.right, derivedContext.bounds.bottom);
	}

	if (_properties.translate_x || _properties.translate_y) {
		derivedContext.matrix.translate(_properties.translate_x || 0, _properties.translate_y || 0);
	}

	if (_properties.rotation) {
		derivedContext.matrix.rotate(_properties.rotation);
	}

	if (_properties.scale_x || _properties.scale_y) {
		derivedContext.matrix.scale(_properties.scale_x || 1, _properties.scale_y || 1);
	}

	if (_properties.trapping) {
		derivedContext.bounds.x -= _properties.trapping;
		derivedContext.bounds.y -= _properties.trapping;
		derivedContext.bounds.width += _properties.trapping * 2;
		derivedContext.bounds.height += _properties.trapping * 2;	
	}

	return derivedContext;
};


Context.prototype.moveRegistration = function(_x, _y) {
	this.bounds.x -= _x;
	this.bounds.y -= _y;
	this.matrix.translate(_x, _y);
};

Context.prototype.centerRegistration = function() {
	var oldCenter = this.bounds.center;
	this.bounds.x -= oldCenter.x;
	this.bounds.y -= oldCenter.y;
	this.matrix.translate(oldCenter);
};



function deriveBound(parentBound, parentOppositeBound, positionRelative, boundRelative, oppositePositionRelative, oppositeBoundRelative, dimension, direction) {

	if (typeof positionRelative === "number") { //top
		return positionRelative;
	}

	else if (typeof boundRelative === "number") { //margin_top
		return parentBound + boundRelative * -direction;
	}

	else if (typeof oppositePositionRelative === "number" && typeof dimension === "number") { //bottom + height
		return oppositePositionRelative + dimension * direction;
	}

	else if (typeof oppositeBoundRelative === "number" && typeof dimension === "number") { //margin_bottom + height
		return (parentOppositeBound + oppositeBoundRelative * direction) + dimension * direction;
	}

	else if (typeof dimension === "number") { // height
		return (dimension * 0.5 * direction);
	}

	// else if (typeof oppositePositionRelative === "number") { // bottom
	// 	return oppositePositionRelative;
	// }

	else {
		return parentBound;
	}
}
