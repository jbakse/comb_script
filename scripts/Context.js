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

Context.prototype.deriveContext = function(_properties) {
	
	var global_top, global_bottom, global_left, global_right;

	var derivedContext = new Context(this.position.clone(), new paper.Rectangle(0,0,0,0));

	/////////////////////////////////////////////

	if ('x' in _properties) {
		derivedContext.position.x = this.position.x + _properties.x;
	}

	if ('y' in _properties) {
		derivedContext.position.y = this.position.y + _properties.y;
	}

	// Calc Top ///////////////////////////////////////////

	if ('top' in _properties) {
		derivedContext.bounds.top = _properties.top;
	}

	else if ('margin_top' in _properties) {
		global_top = this.globalBounds().top + _properties.margin_top;
		derivedContext.bounds.top = global_top - derivedContext.position.y;
	}

	else if ('bottom' in _properties && 'height' in _properties) {
		derivedContext.bounds.top =  _properties.bottom - _properties.height;
	}

	else if ('margin_bottom' in _properties && 'height' in _properties) {
		global_bottom = this.globalBounds().bottom - _properties.margin_bottom;
		global_top = global_bottom - _properties.height;
		derivedContext.bounds.top = global_top - derivedContext.position.y;
	}

	else if ('height' in _properties) {
		derivedContext.bounds.top = -0.5 *_properties.height;
	}

	else if ('bottom' in _properties) {
		derivedContext.bounds.top = _properties.bottom;
	}

	else {
		derivedContext.bounds.top = this.bounds.top;
	}



	// Calc Bottom ///////////////////////////////////////////

	if ('bottom' in _properties) {
		derivedContext.bounds.bottom = _properties.bottom;
	}

	else if ('margin_bottom' in _properties) {
		global_bottom = this.globalBounds().bottom - _properties.margin_bottom;
		derivedContext.bounds.bottom = global_bottom - derivedContext.position.y;
	}

	else if ('top' in _properties && 'height' in _properties) {
		derivedContext.bounds.bottom =  _properties.top + _properties.height;
	}

	else if ('margin_top' in _properties && 'height' in _properties) {
		global_top = this.globalBounds().top + _properties.margin_top;
		global_bottom = global_top + _properties.height;
		derivedContext.bounds.bottom = global_bottom - derivedContext.position.y;
	}

	else if ('height' in _properties) {
		derivedContext.bounds.bottom = 0.5 * _properties.height;
	}

	else if ('top' in _properties) {
		derivedContext.bounds.bottom = _properties.top;
	}

	else {
		derivedContext.bounds.bottom = this.bounds.bottom;
	}



	// Calc left ///////////////////////////////////////////

	if ('left' in _properties) {
		derivedContext.bounds.left = _properties.left;
	}

	else if ('margin_left' in _properties) {
		global_left = this.globalBounds().left + _properties.margin_left;
		derivedContext.bounds.left = global_left - derivedContext.position.y;
	}

	else if ('right' in _properties && 'width' in _properties) {
		derivedContext.bounds.left =  _properties.right - _properties.width;
	}

	else if ('margin_right' in _properties && 'width' in _properties) {
		global_right = this.globalBounds().right - _properties.margin_right;
		global_left = global_right - _properties.width;
		derivedContext.bounds.left = global_left - derivedContext.position.y;
	}

	else if ('width' in _properties) {
		derivedContext.bounds.left = -0.5 * _properties.width;
	}

	else if ('right' in _properties) {
		derivedContext.bounds.left = _properties.right;
	}

	else {
		derivedContext.bounds.left = this.bounds.left;
	}



	// Calc right ///////////////////////////////////////////

	if ('right' in _properties) {
		derivedContext.bounds.right = _properties.right;
	}

	else if ('margin_right' in _properties) {
		global_right = this.globalBounds().right - _properties.margin_right;
		derivedContext.bounds.right = global_right - derivedContext.position.y;
	}

	else if ('left' in _properties && 'width' in _properties) {
		derivedContext.bounds.right =  _properties.left + _properties.width;
	}

	else if ('margin_left' in _properties && 'width' in _properties) {
		global_left = this.globalBounds().left + _properties.margin_left;
		global_right = global_left + _properties.width;
		derivedContext.bounds.right = global_right - derivedContext.position.y;
	}

	else if ('width' in _properties) {
		derivedContext.bounds.right = 0.5 *  _properties.width;
	}

	else if ('left' in _properties) {
		derivedContext.bounds.right = _properties.left;
	}

	else {
		derivedContext.bounds.right = this.bounds.right;
	}


	// Calc registration

	if (_properties.registration === "center") {
		
		var delta = derivedContext.bounds.center;

		derivedContext.bounds.x -= delta.x;
		derivedContext.bounds.y -= delta.y;
		
		derivedContext.position = derivedContext.position.add(delta);
		// derivedContext.position = derivedContext.bounds.center.clone();
	}

	derivedContext.matrix = this.matrix.clone();

	if (_properties.rotation) {
		derivedContext.matrix.rotate(_properties.rotation, derivedContext.position);
	}


	return derivedContext;
};

module.exports = Context;
