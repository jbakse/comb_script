
function logJSON(d){
	console.log(JSON.stringify(d, null, '\t'));
}


function Context(_position, _bounds) {
	this.position = new Point(0, 0);
	this.bounds = new Rectangle(0, 0, 0, 0);
	if (_position) {
		this.position = _position;
	}
	if (_bounds) {
		this.bounds = _bounds;
	}
}

Context.prototype.toString = function() {
	return "Context " + this.position + this.bounds;
}

Context.prototype.globalBounds = function() {
	var globalBounds = this.bounds.clone();
	globalBounds.x += this.position.x;
	globalBounds.y += this.position.y;
	return globalBounds;
}

Context.prototype.deriveContext = function(_properties) {
	var derivedContext = new Context(this.position.clone(), new Rectangle(0,0,0,0));

	/////////////////////////////////////////////

	if ('x' in _properties) {
		derivedContext.position.x = this.position.x + _properties.x
	}

	if ('y' in _properties) {
		derivedContext.position.y = this.position.y + _properties.y
	}

	// Calc Top ///////////////////////////////////////////

	if ('top' in _properties) {
		derivedContext.bounds.top = _properties.top
	}

	else if ('margin_top' in _properties) {
		var global_top = this.globalBounds().top + _properties.margin_top;
		derivedContext.bounds.top = global_top - derivedContext.position.y;
	}

	else if ('bottom' in _properties && 'height' in _properties) {
		derivedContext.bounds.top =  _properties.bottom - _properties.height;
	}

	else if ('margin_bottom' in _properties && 'height' in _properties) {
		var global_bottom = this.globalBounds().bottom - _properties.margin_bottom;
		var global_top = global_bottom - _properties.height
		derivedContext.bounds.top = global_top - derivedContext.position.y;
	}

	else if ('height' in _properties) {
		derivedContext.bounds.top = -.5 *_properties.height;
	}

	else if ('bottom' in _properties) {
		derivedContext.bounds.top = _properties.bottom;
	}

	else {
		derivedContext.bounds.top = this.bounds.top;
	}



	// Calc Bottom ///////////////////////////////////////////

	if ('bottom' in _properties) {
		derivedContext.bounds.bottom = _properties.bottom
	}

	else if ('margin_bottom' in _properties) {
		var global_bottom = this.globalBounds().bottom - _properties.margin_bottom;
		derivedContext.bounds.bottom = global_bottom - derivedContext.position.y;
	}

	else if ('top' in _properties && 'height' in _properties) {
		derivedContext.bounds.bottom =  _properties.top + _properties.height;
	}

	else if ('margin_top' in _properties && 'height' in _properties) {
		var global_top = this.globalBounds().top + _properties.margin_top;
		var global_bottom = global_top + _properties.height;
		derivedContext.bounds.bottom = global_bottom - derivedContext.position.y;
	}

	else if ('height' in _properties) {
		derivedContext.bounds.bottom = .5 * _properties.height;
	}

	else if ('top' in _properties) {
		derivedContext.bounds.bottom = _properties.top;
	}

	else {
		derivedContext.bounds.bottom = this.bounds.bottom;
	}



	// Calc left ///////////////////////////////////////////

	if ('left' in _properties) {
		derivedContext.bounds.left = _properties.left
	}

	else if ('margin_left' in _properties) {
		var global_left = this.globalBounds().left + _properties.margin_left;
		derivedContext.bounds.left = global_left - derivedContext.position.y;
	}

	else if ('right' in _properties && 'width' in _properties) {
		derivedContext.bounds.left =  _properties.right - _properties.width;
	}

	else if ('margin_right' in _properties && 'width' in _properties) {
		var global_right = this.globalBounds().right - _properties.margin_right;
		var global_left = global_right - _properties.width
		derivedContext.bounds.left = global_left - derivedContext.position.y;
	}

	else if ('width' in _properties) {
		derivedContext.bounds.left = -.5 * _properties.width;
	}

	else if ('right' in _properties) {
		derivedContext.bounds.left = _properties.right;
	}

	else {
		derivedContext.bounds.left = this.bounds.left;
	}



	// Calc right ///////////////////////////////////////////

	if ('right' in _properties) {
		derivedContext.bounds.right = _properties.right
	}

	else if ('margin_right' in _properties) {
		var global_right = this.globalBounds().right - _properties.margin_right;
		derivedContext.bounds.right = global_right - derivedContext.position.y;
	}

	else if ('left' in _properties && 'width' in _properties) {
		derivedContext.bounds.right =  _properties.left + _properties.width;
	}

	else if ('margin_left' in _properties && 'width' in _properties) {
		var global_left = this.globalBounds().left + _properties.margin_left;
		var global_right = global_left + _properties.width;
		derivedContext.bounds.right = global_right - derivedContext.position.y;
	}

	else if ('width' in _properties) {
		derivedContext.bounds.right = .5 *  _properties.width;
	}

	else if ('left' in _properties) {
		derivedContext.bounds.right = _properties.left;
	}

	else {
		derivedContext.bounds.right = this.bounds.right;
	}

	return derivedContext;
}





function Node(_data) {

	this.type = "Node";
	this.children = [];
	this.properties = {};

	if ('properties' in _data) {
		this.properties = _data.properties;
	}

	if ('children' in _data) {
		this.loadChildren(_data.children);
	}

}


Node.prototype.loadChildren = function(_childrenData)
{
	for (var i = 0; i < _childrenData.length; i++) {
		
		var childKey = Object.keys(_childrenData[i])[0];
		var childData = _childrenData[i][childKey];
		if (childData === null) {
			childData = {};
		}
		
		var child = null;

		if (childKey === "region") {
			child = new Region(childData);
		}

		// if (childKey === "region_grid") {
		// 	child = new RegionGrid(childData);
		// }

		if (childKey === "rectangle") {
			child = new VPRectangle(childData);
		}

		if (child !== null) {
			this.children.push(child);
		}
	}
}


Node.prototype.draw = function(_context){
	console.log("Drawing Node" + this.properties.name);

	var childShapes = this.drawChildren(_context);


	var bounds_rectangle = new Rectangle(_context.globalBounds());
	var bounds_path = new Path.Rectangle(bounds_rectangle);
	bounds_path.strokeColor = 'blue';

	var loc_rectangle = new Rectangle(_context.position - new Point(4, 4), new Size(8, 8));
	var loc_path = new Path.Ellipse(loc_rectangle);
	loc_path.strokeColor = 'blue';


	console.log("Root childShapes");
	console.log(childShapes);

	for (var i = 0; i < childShapes.length; i++){
		project.activeLayer.addChild(childShapes[i]);
	}



	return childShapes;

};

Node.prototype.drawChildren = function(_context){
	var childShapes = [];

	for (var i = 0; i < this.children.length; i++) {
		s = this.children[i].draw(_context);

		if (Array.isArray(s)) {
			childShapes = childShapes.concat(s);
		} else {
			childShapes.push(s);
		}

	}

	return childShapes;
};


function Region(_data) {
	console.log("Creating a Region");
	Node.call(this, _data);
	this.type = "Region";
}

Region.prototype = Object.create(Node.prototype);
Region.prototype.constructor = Region;

Region.prototype.draw = function(_context){
	console.log("Draw Region");
	
	var derivedContext = _context.deriveContext(this.properties);
	
	//info
	var bounds_rectangle = derivedContext.globalBounds();
	var bounds_path = new Path.Rectangle(bounds_rectangle);
	bounds_path.strokeColor = new Color(1, 0, 0, .2);

	var loc_rectangle = new Rectangle(derivedContext.position - new Point(4, 4), new Size(8, 8));
	var loc_path = new Path.Ellipse(loc_rectangle);
	loc_path.strokeColor = new Color(1, 0, 0, .2);


	//render
	var childShapes = this.drawChildren(derivedContext);
	if (! ('boolean' in this.properties)) {
		return childShapes;
	}

	if ('boolean' in this.properties && this.properties.boolean == 'subtract') {
		if (childShapes.length < 1) return [];

		new_path = childShapes[0];
		for (i = 1; i < childShapes.length; i++) {
			var new_path = new_path.subtract(childShapes[i]);
			new_path.remove();
		}
		
		new_path.strokeColor = new Color(0, 0, 0, 1);
		new_path.fillColor = new Color(0, 0, 0, .1);

		return new_path;
	}

	if ('boolean' in this.properties && this.properties.boolean == 'add') {
		if (childShapes.length < 1) return [];

		new_path = childShapes[0];
		for (i = 1; i < childShapes.length; i++) {
			var new_path = new_path.unite(childShapes[i]);
			new_path.remove();
		}
		
		new_path.strokeColor = new Color(0, 0, 0, 1);
		new_path.fillColor = new Color(0, 0, 0, .1);

		return new_path;
	}




	return childShapes;


};

function VPRectangle(_data) {
	console.log("Creating a VPRectangle");
	Node.call(this, _data);
	this.type = "VPRectangle";
}

VPRectangle.prototype = Object.create(Node.prototype);
VPRectangle.prototype.constructor = VPRectangle;



VPRectangle.prototype.draw = function(_context){
	console.log("Draw Rectangle" + _context);
	

	var bounds_rectangle = _context.globalBounds();
	var bounds_path = new Path.Rectangle(bounds_rectangle);
	bounds_path.strokeColor = new Color(0, 0, 0, 1);
	bounds_path.fillColor = new Color(0, 0, 0, .1);
	bounds_path.remove();

	return bounds_path;

	// if ('boolean' in this.properties && this.properties.boolean == 'subtract') {
	// 	console.log("subtract");
		
	// 	var new_path = current_render_path.subtract(bounds_path);
	// 	new_path.strokeColor = new Color(0, 0, 0, 1);
	// 	new_path.fillColor = new Color(0, 0, 0, .1);

	// 	bounds_path.remove();
	// 	current_render_path.remove();

	// 	current_render_path = new_path;

	// } else if ('boolean' in this.properties && this.properties.boolean == 'unite') {
	// 	console.log("unite");
		
	// 	var new_path = current_render_path.unite(bounds_path);
	// 	new_path.strokeColor = new Color(0, 0, 0, 1);
	// 	new_path.fillColor = new Color(0, 0, 0, .1);

	// 	bounds_path.remove();
	// 	current_render_path.remove();

	// 	current_render_path = new_path;

	// }
	// else {
	// 	current_render_path = bounds_path;
	// }
};






function parseYAML(_yaml) {
	console.log("Loaded YAML");
	var doc = jsyaml.load(_yaml);
	
	var root = new Node(doc);

	console.log("ROOT");
	console.log(root);
	logJSON(root);

	// root.draw(new Context(new Point(0, 0), new Rectangle(new Point(0,0), new Size(500, 500))));
	root.draw(new Context(new Point(400, 400), new Rectangle(new Point(-400,-400), new Point(400, 400))));

	view.update();
	// document.getElementById('svg').appendChild(project.exportSVG());
}


$.ajax({
	url: "../yaml/boolean.yaml", 
	success: function(data) {
		parseYAML(data);
	},
	cache: false
});
