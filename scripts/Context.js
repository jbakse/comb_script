function Context(_position, _bounds) {
	this.position = new paper.Point(0, 0);
	this.bounds = new paper.Rectangle(0, 0, 0, 0);
	this.matrix = new paper.Matrix();

	if (_position) {
		this.position = _position;
	}
	if (_bounds) {
		this.bounds = _bounds;
	}
}

Context.prototype.toString = function() {
	return "Context " + this.position + this.bounds;
};

Context.prototype.globalBounds = function() {
	var globalBounds = this.bounds.clone();
	globalBounds.x += this.position.x;
	globalBounds.y += this.position.y;
	return globalBounds;
};


// currentPosition this.globalP


function deriveBound(parentBound, parentPosition, parentOppositeBound, positionRelative, boundRelative, oppositePositionRelative, oppositeBoundRelative, dimension, direction)
{

	if (typeof positionRelative === "number") {
		return parentPosition + positionRelative;
	}

	else if (typeof boundRelative === "number") {
		return parentBound + boundRelative * -direction;
	}

	else if (typeof oppositePositionRelative === "number" && typeof dimension === "number") {
		return  parentPosition + oppositePositionRelative + dimension * direction;
	}

	else if (typeof oppositeBoundRelative === "number" && typeof dimension === "number") {
		return (parentOppositeBound + oppositeBoundRelative * direction) + dimension * direction;
	}

	else if (typeof dimension === "number") {
		return  parentPosition + (dimension * 0.5 * direction);
	}

	else if (typeof oppositePositionRelative === "number") {
		return parentPosition + oppositePositionRelative;
	}

	else {
		return parentBound;
	}
}

Context.prototype.deriveContext = function(_properties) {
	
	var global_top, global_bottom, global_left, global_right;

	var globalBounds = new paper.Rectangle(0,0,0,0);

	globalBounds.top = deriveBound(
		this.globalBounds().top, this.position.y, this.globalBounds().bottom, 
		_properties.top, _properties.margin_top, _properties.bottom, _properties.margin_bottom, _properties.height, -1
	);
	
	globalBounds.bottom = deriveBound(
		this.globalBounds().bottom, this.position.y, this.globalBounds().top, 
		_properties.bottom, _properties.margin_bottom, _properties.top, _properties.margin_top, _properties.height, 1
	);
	
	globalBounds.left = deriveBound(
		this.globalBounds().left, this.position.x, this.globalBounds().right, 
		_properties.left, _properties.margin_left, _properties.right, _properties.margin_right, _properties.width, -1
	);

	globalBounds.right = deriveBound(
		this.globalBounds().right, this.position.x, this.globalBounds().left, 
		_properties.right, _properties.margin_right, _properties.left, _properties.margin_left, _properties.width, 1
	);



	// Calc registration
	var position = this.position;

	if (_properties.registration === "center") {
		position = globalBounds.center;
	}

	// make bounds relative
	var relativeBounds = globalBounds.clone();
	relativeBounds.x -= position.x;
	relativeBounds.y -= position.y;

	var derivedContext = new Context(position, relativeBounds);


	derivedContext.matrix = this.matrix.clone();

	if (_properties.rotation) {
		derivedContext.matrix.rotate(_properties.rotation, derivedContext.position);
	}


	return derivedContext;
};

module.exports = Context;
