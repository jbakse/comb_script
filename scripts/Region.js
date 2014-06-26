var _ = require('underscore');
var Context = require('./Context.js');


module.exports.Region = Region;
module.exports.Document = Document;
module.exports.Rectangle = Rectangle;


regionTypes = {"region": Region, "region_grid": RegionGrid, "rectangle": Rectangle, "ellipse": Ellipse};

function Region(_data) {
	this.type = "Region";
	this.children = [];
	this.properties = {};
	this.variables = {};
	this.typeProperties = {strokeColor: 'red'};

	this.loadData(_data);
}

Region.prototype.toString = function() {
	
	return this.type + ": " + (this.properties.name || "unnamed");
};

Region.prototype.tree = function(_depth) {
	_depth = _depth || 0;

	var text = this + "\n";

	_.each(this.children, function(_child) {
		_(_depth + 1).times( function(i) { text += "\t"; }); // indent
		text += _child.tree(_depth+1);
	});
	
	return text;
};

Region.prototype.loadData = function(_data) {

	if ('variables' in _data) {
		this.variables = _.clone(_data.variables);
	}

	if ('properties' in _data) {
		this.properties = _.clone(_data.properties);
	}

	if ('children' in _data) {
		this.loadChildren(_data.children);
	}
}; 

Region.prototype.loadChildren = function(_childrenData) {	

	_.each(_childrenData, function (_childData) {
		var childKey = _.keys(_childData)[0];
		var childData = _.extend({}, _.values(_childData)[0]);

		if (childKey in regionTypes) {
			var child = new (regionTypes[childKey])(childData);
			this.children.push(child);

		} else {
			console.warn ("Unknown Region Type: " + childKey);
		}
		
	}, this);
};

Region.prototype.preview = function(_parentContext) {


	// find context
	var context = _parentContext.deriveContext(this.properties);

	if (this.properties.log) console.log("Log of " + this.properties.name + " context.",context);

	// draw children
	this.previewChildren(context);

	// draw bounds
	// var boundsRect = context.bounds.clone();
	// boundsRect.x += context.position.x;
	// boundsRect.y += context.position.y;
	var boundsPath = new paper.Path.Rectangle(context.bounds);
	boundsPath.strokeColor = this.typeProperties.strokeColor;
	boundsPath.strokeWidth = 0.25;

	// todo only if not identity
	
	boundsPath.transform(context.matrix);
	
	// draw rect
	var positionRect = new paper.Rectangle(-0.5, -0.5, 1, 1);
	var positionPath = new paper.Path.Ellipse(positionRect);
	positionPath.strokeColor = this.typeProperties.strokeColor;
	positionPath.strokeWidth = 0.25;


	// todo only if not identity
	positionPath.transform(context.matrix);

};

Region.prototype.previewChildren = function(_context) {
	_.each(this.children, function(_child) {
		_child.preview(_context);
	});
};

Region.prototype.build = function(_parentContext) {
	var context = _parentContext.deriveContext(this.properties);
	var childPaths = this.buildChildren(context);

	if (! ('boolean' in this.properties)) {
		return childPaths;
	}
	
	// maps the allowed yaml name to the coresponding paperjs function
	var booleanOperations = {"add": "unite", "subtract": "subtract", "intersect": "intersect"};
	if (this.properties.boolean in booleanOperations) {
		var op = booleanOperations[this.properties.boolean];
		childPaths =  combinePaths(childPaths, op);
	}

	return childPaths;
};





Region.prototype.buildChildren = function(_context) {
	var childPaths = [];

	_.each(this.children, function(_child) {
		s = _child.build(_context);

		if (Array.isArray(s)) {
			childPaths = childPaths.concat(s);
		} else {
			childPaths.push(s);
		}

	});

	return childPaths;
};



function Document(_data) {
	Region.call(this, _data);
	this.type = "Document";
	this.typeProperties.strokeColor = "blue";
}

Document.prototype = Object.create(Region.prototype);
Document.prototype.constructor = Document;


function RegionGrid(_data) {
	Region.call(this, _data);
	this.type = "RegionGrid";
	this.typeProperties.strokeColor = "#BBBBBB";
}

RegionGrid.prototype = Object.create(Region.prototype);
RegionGrid.prototype.constructor = RegionGrid;


RegionGrid.prototype.preview = function(_parentContext) {	
	var context = _parentContext.deriveContext(this.properties);
	
	var rows = 1;
	rows = (context.bounds.height / this.properties.row_height) || rows;
	rows = this.properties.rows || rows;

	var cols = 1;
	cols = (context.bounds.height / this.properties.column_width) || cols;
	cols = this.properties.cols || cols;

	for (var row = 0; row < rows; row++) {
		for (var col = 0; col < cols; col++) {
			var width = context.bounds.width / cols;
			var height = context.bounds.height / rows;
			var x = context.globalBounds().left + col * width;
			var y = context.globalBounds().top + row * height;

			var grid_rectangle = new paper.Rectangle(new paper.Point(x, y), new paper.Size(width, height));
			var grid_path = new paper.Path.Rectangle(grid_rectangle);
			grid_path.strokeColor = new paper.Color(0, 0, 1, 0.2);
			grid_path.strokeWidth = 0.25;

			this.previewChildren(new Context(grid_rectangle.center, grid_rectangle));
		}		
	}


};

RegionGrid.prototype.build = function(_parentContext) {	
	var context = _parentContext.deriveContext(this.properties);
	
	var rows = 1;
	rows = (context.bounds.height / this.properties.row_height) || rows;
	rows = this.properties.rows || rows;

	var cols = 1;
	cols = (context.bounds.height / this.properties.column_width) || cols;
	cols = this.properties.cols || cols;

	childPaths = [];

	for (var row = 0; row < rows; row++) {
		for (var col = 0; col < cols; col++) {
			var width = context.bounds.width / cols;
			var height = context.bounds.height / rows;
			var x = context.globalBounds().left + col * width;
			var y = context.globalBounds().top + row * height;

			var grid_rectangle = new paper.Rectangle(new paper.Point(x, y), new paper.Size(width, height));
			// var grid_path = new paper.Path.Rectangle(grid_rectangle);
			// grid_path.strokeColor = new paper.Color(0, 0, 1, 0.2);
			// grid_path.strokeWidth = 0.25;

			childPaths = childPaths.concat(this.buildChildren(new Context(grid_rectangle.center, grid_rectangle)));
		}		
	}

	return childPaths;

};








function Rectangle(_data) {
	Region.call(this, _data);
	this.type = "Rectangle";
	this.typeProperties.strokeColor = "#BBBBBB";
}

Rectangle.prototype = Object.create(Region.prototype);
Rectangle.prototype.constructor = Rectangle;

Rectangle.prototype.build = function(_parentContext) {
	var context = _parentContext.deriveContext(this.properties);

	var boundsRect = context.bounds.clone();
	boundsRect.x += context.position.x;// + _.random(-100, 100) * 0.000001;
	boundsRect.y += context.position.y;// + _.random(-100, 100) * 0.000001;
	
	var boundsPath = new paper.Path.Rectangle(boundsRect, this.properties.radius || 0);

	boundsPath.remove();

	return boundsPath;
};

Rectangle.prototype.preview = function(_parentContext) {

	// find context
	var context = _parentContext.deriveContext(this.properties);


	// draw bounds
	var boundsRect = context.bounds.clone();
	boundsRect.x += context.position.x;
	boundsRect.y += context.position.y;
	var boundsPath = new paper.Path.Rectangle(boundsRect, this.properties.radius || 0);
	boundsPath.strokeColor = this.typeProperties.strokeColor;
	boundsPath.strokeWidth = 0.25;

};


function Ellipse(_data) {
	Region.call(this, _data);
	this.type = "Ellipse";
	this.typeProperties.strokeColor = "#BBBBBB";
}

Ellipse.prototype = Object.create(Region.prototype);
Ellipse.prototype.constructor = Ellipse;

Ellipse.prototype.build = function(_parentContext) {
	var context = _parentContext.deriveContext(this.properties);

	var boundsRect = context.bounds.clone();
	boundsRect.x += context.position.x;// + _.random(-100, 100) * 0.000001;
	boundsRect.y += context.position.y;// + _.random(-100, 100) * 0.000001;
	
	var boundsPath = new paper.Path.Ellipse(boundsRect);

	boundsPath.remove();

	return boundsPath;
};


Ellipse.prototype.preview = function(_parentContext) {

	// find context
	var context = _parentContext.deriveContext(this.properties);


	// draw bounds
	var boundsRect = context.bounds.clone();
	boundsRect.x += context.position.x;
	boundsRect.y += context.position.y;
	var boundsPath = new paper.Path.Ellipse(boundsRect);
	boundsPath.strokeColor = this.typeProperties.strokeColor;
	boundsPath.strokeWidth = 0.25;

};











function combinePaths(_paths, _operation) {
	if (_paths.length < 1) return [];
	

	var newPath = _paths[0];
	for (i = 1; i < _paths.length; i++) {
		newPath = newPath[_operation](_paths[i]);
		newPath.remove();
	}

	return newPath;
}
