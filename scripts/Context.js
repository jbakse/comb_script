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


function deriveBound(parentBound, parentPosition, parentOppositeBound, positionRelative, boundRelative, oppositePositionRelative, oppositeBoundRelative, dimension)
{	//positionRelative, boundRelative, oppositePositionRelative, oppositeBoundRelative, dimension
	
	var direction = (parentBound - parentOppositeBound) > 0 ? 1 : -1;

	console.log("db", parentBound, parentPosition, parentOppositeBound, positionRelative, boundRelative, oppositePositionRelative, oppositeBoundRelative, dimension);

	if (typeof positionRelative === "number") {
		console.log("if (positionRelative) {");
		return parentPosition + positionRelative;
	}

	else if (typeof boundRelative === "number") {
		console.log("else if (boundRelative) {");
		return parentBound + boundRelative;
	}

	else if (typeof oppositePositionRelative === "number" && typeof dimension === "number") {
		console.log("else if (oppositePositionRelative && dimension) {");
		return  parentPosition + oppositePositionRelative + dimension * direction;
	}

	else if (typeof oppositeBoundRelative === "number" && typeof dimension === "number") {
		console.log("else if (oppositeBoundRelative && dimension) {");
		return (parentOppositeBound + oppositeBoundRelative * direction) + dimension * direction;
	}

	else if (typeof dimension === "number") {
		console.log("else if (dimension) {");
		return  parentPosition + (dimension * 0.5 * direction);
	}

	else if (typeof oppositePositionRelative === "number") {
		console.log("else if (oppositePositionRelative) {");
		return parentPosition + oppositePositionRelative;
	}

	else {
		return parentBound;
	}
}

Context.prototype.deriveContext = function(_properties) {
	
	var global_top, global_bottom, global_left, global_right;

	// var position = new paper.Point(0,0);
	var globalBounds = new paper.Rectangle(0,0,0,0);


	console.log("_p", _properties);

	console.log("check globalBounds.top");
	globalBounds.top = deriveBound(
		this.globalBounds().top, this.position.y, this.globalBounds().bottom, 
		_properties.top, _properties.margin_top, _properties.bottom, _properties.margin_bottom, _properties.height
	);

	console.log("check globalBounds.bottom");
	globalBounds.bottom = deriveBound(
		this.globalBounds().bottom, this.position.y, this.globalBounds().top, 
		_properties.bottom, _properties.margin_bottom, _properties.top, _properties.margin_top, _properties.height
	);
	

	console.log("check globalBounds.left");
	globalBounds.left = deriveBound(
		this.globalBounds().left, this.position.x, this.globalBounds().right, 
		_properties.left, _properties.margin_left, _properties.right, _properties.margin_right, _properties.width
	);
	console.log("left:", globalBounds.left);

	console.log("check globalBounds.right");
	globalBounds.right = deriveBound(
		this.globalBounds().right, this.position.x, this.globalBounds().left, 
		_properties.right, _properties.margin_right, _properties.left, _properties.margin_left, _properties.width
	);
	console.log("right:", globalBounds.right);

	console.log("derived bounds", globalBounds);


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
