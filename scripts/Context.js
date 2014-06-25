function Context(_bounds, _matrix) {
	this.bounds = _bounds || new paper.Rectangle(0, 0, 0, 0);
	this.matrix = _matrix || new paper.Matrix();
}

Context.prototype.toString = function() {
	return "Context: " + this.bounds;
};

// Context.prototype.globalBounds = function() {
// 	var globalBounds = this.bounds.clone();
// 	globalBounds.x += this.position.x;
// 	globalBounds.y += this.position.y;
// 	return globalBounds;
// };


// currentPosition this.globalP


function deriveBound(parentBound, parentOppositeBound, positionRelative, boundRelative, oppositePositionRelative, oppositeBoundRelative, dimension, direction) {

	if (typeof positionRelative === "number") {
		return positionRelative;
	}

	else if (typeof boundRelative === "number") {
		return parentBound + boundRelative * -direction;
	}

	else if (typeof oppositePositionRelative === "number" && typeof dimension === "number") {
		return oppositePositionRelative + dimension * direction;
	}

	else if (typeof oppositeBoundRelative === "number" && typeof dimension === "number") {
		return (parentOppositeBound + oppositeBoundRelative * direction) + dimension * direction;
	}

	else if (typeof dimension === "number") {
		return (dimension * 0.5 * direction);
	}

	else if (typeof oppositePositionRelative === "number") {
		return oppositePositionRelative;
	}
	
	else {
		return parentBound;
	}
}


Context.prototype.deriveContext = function(_properties) {

	var global_top, global_bottom, global_left, global_right;

	var derivedBounds = new paper.Rectangle(0, 0, 0, 0);

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



	// Calc registration
	var position = new paper.Point(0, 0);

	if (_properties.registration === "center") {
		position = globalBounds.center;
		//and we got to update the transofrm
	}

	// make bounds relative
	var newBounds = derivedBounds.clone();
	newBounds.x -= position.x;
	newBounds.y -= position.y;

	var derivedContext = new Context(newBounds);


	derivedContext.matrix = this.matrix.clone();

	if (_properties.rotation) {
		derivedContext.matrix.rotate(_properties.rotation, derivedContext.position);
	}

	return derivedContext;
};

module.exports = Context;
