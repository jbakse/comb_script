"use strict";


var _ = require('underscore');
var Context = require('./Context.js');


module.exports.Document = Document;

var regionTypes = {
	"region": Region,
	"region_grid": RegionGrid,
	"rectangle": Rectangle,
	"ellipse": Ellipse
};

function Region(_data) {
	this.type = "Region";
	this.children = [];
	this.properties = {};
	this.typeProperties = {
		strokeColor: '#0088AA'
	};

	this.loadData(_data);
}

Region.prototype.toString = function() {

	return this.type + ": " + (this.properties.name || "unnamed");
};

Region.prototype.tree = function(_depth) {
	_depth = _depth || 0;

	var text = this + "\n";

	_.each(this.children, function(_child) {
		_(_depth + 1).times(function(i) {
			text += "\t";
		}); // indent
		text += _child.tree(_depth + 1);
	});

	return text;
};

Region.prototype.loadData = function(_data) {


	if ('properties' in _data) {
		this.properties = _.clone(_data.properties);
	}

	if ('children' in _data) {
		this.loadChildren(_data.children);
	}
};

Region.prototype.loadChildren = function(_childrenData) {

	_.each(_childrenData, function(_childData) {
		var childKey = _.keys(_childData)[0];
		var childData = _.extend({}, _.values(_childData)[0]);

		if (childKey in regionTypes) {
			var child = new(regionTypes[childKey])(childData);
			this.children.push(child);

		}
		else {
			console.warn("Unknown Region Type: " + childKey);
		}

	}, this);
};


Region.prototype.preview = function(_parentContext) {
	// derive context (pull this out?)
	var context = _parentContext.deriveContext(this.properties);

	// preview children (pull this out?)
	this.previewChildren(context);

	// draw self
	var boundsPath = new paper.Path.Rectangle(context.bounds);
	boundsPath.strokeColor = this.typeProperties.strokeColor;
	boundsPath.strokeWidth = 0.25;

	var positionPath = new paper.Path.Ellipse(new paper.Rectangle(-0.5, -0.5, 1, 1));
	positionPath.strokeColor = this.typeProperties.strokeColor;
	positionPath.strokeWidth = 0.25;


	// todo only if not identity (pull this out?)
	boundsPath.transform(context.matrix);
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

	if (!('boolean' in this.properties)) {
		return childPaths;
	}

	// maps the allowed yaml name to the coresponding paperjs function
	var booleanOperations = {
		"add": "unite",
		"subtract": "subtract",
		"intersect": "intersect"
	};

	if (this.properties.boolean in booleanOperations) {
		var op = booleanOperations[this.properties.boolean];
		childPaths = combinePaths(childPaths, op);
	}

	return childPaths;
};



Region.prototype.buildChildren = function(_context) {
	var childPaths = [];

	_.each(this.children, function(_child) {
		var s = _child.build(_context);

		if (Array.isArray(s)) {
			childPaths = childPaths.concat(s);
		}
		else {
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
	// derive context (pull this out?)
	var context = _parentContext.deriveContext(this.properties);

	var gridContexts = this.generateContexts(context);

	_.each(gridContexts, function(gridContext) {
		// draw preview bounds
		var gridPath = new paper.Path.Rectangle(gridContext.bounds);
		gridPath.strokeColor = "#FF0000";
		gridPath.strokeWidth = 0.25;
		console.log(gridPath);
		gridPath.transform(gridContext.matrix);

		this.previewChildren(gridContext);

	}, this);


};

RegionGrid.prototype.build = function(_parentContext) {
	// derive context (pull this out?)
	var context = _parentContext.deriveContext(this.properties);

	var gridContexts = this.generateContexts(context);

	var childPaths = [];
	_.each(gridContexts, function(gridContext) {
		childPaths = childPaths.concat(this.buildChildren(gridContext));
	}, this);

	return childPaths;
};

RegionGrid.prototype.generateContexts = function(_gridContext) {
	// calculate rows/cols to draw
	var rows = 1;
	rows = (_gridContext.bounds.height / this.properties.row_height) || rows;
	rows = this.properties.rows || rows;

	var cols = 1;
	cols = (_gridContext.bounds.height / this.properties.column_width) || cols;
	cols = this.properties.cols || cols;

	var generatedContexts = [];

	for (var row = 0; row < rows; row++) {
		for (var col = 0; col < cols; col++) {

			// generate bounds			
			var width = _gridContext.bounds.width / cols;
			var height = _gridContext.bounds.height / rows;
			var x = _gridContext.bounds.left + col * width;
			var y = _gridContext.bounds.top + row * height;

			var gridRectangle = new paper.Rectangle(
				new paper.Point(x, y),
				new paper.Size(width, height)
			);

			// generate context
			var gridContext = new Context(gridRectangle, _gridContext.matrix);
			if (this.properties.registration === "center") {
				gridContext.centerRegistration();
				console.log("center");
				console.log(gridContext);
			}

			generatedContexts.push(gridContext);
		}
	}

	return generatedContexts;

};


function Rectangle(_data) {
	Region.call(this, _data);
	this.type = "Rectangle";
	this.typeProperties.strokeColor = "#333333";
}

Rectangle.prototype = Object.create(Region.prototype);
Rectangle.prototype.constructor = Rectangle;

Rectangle.prototype.build = function(_parentContext) {
	// derive context (pull this out?)
	var context = _parentContext.deriveContext(this.properties);

	// build shape
	var boundsPath = new paper.Path.Rectangle(context.bounds, this.properties.radius || 0);
	boundsPath.transform(context.matrix);
	boundsPath.remove();

	return boundsPath;
};

Rectangle.prototype.preview = function(_parentContext) {
	// derive context (pull this out?)
	var context = _parentContext.deriveContext(this.properties);

	// preview children (pull this out?)
	this.previewChildren(context);

	// draw self
	var boundsPath = new paper.Path.Rectangle(context.bounds, this.properties.radius || 0);
	boundsPath.strokeColor = this.typeProperties.strokeColor;

	var positionPath = new paper.Path.Ellipse(new paper.Rectangle(-0.5, -0.5, 1, 1));
	positionPath.strokeColor = "#0088AA";


	// todo only if not identity (pull this out?)
	boundsPath.transform(context.matrix);
	positionPath.transform(context.matrix);

};



function Ellipse(_data) {
	Region.call(this, _data);
	this.type = "Ellipse";
	this.typeProperties.strokeColor = "#333333";
}

Ellipse.prototype = Object.create(Region.prototype);
Ellipse.prototype.constructor = Ellipse;

Ellipse.prototype.build = function(_parentContext) {
	// derive context (pull this out?)
	var context = _parentContext.deriveContext(this.properties);

	// build shape
	var boundsPath = new paper.Path.Ellipse(context.bounds);
	boundsPath.transform(context.matrix);
	boundsPath.remove();

	return boundsPath;
};


Ellipse.prototype.preview = function(_parentContext) {
	// derive context (pull this out?)
	var context = _parentContext.deriveContext(this.properties);

	// preview children (pull this out?)
	this.previewChildren(context);

	// draw self
	var boundsPath = new paper.Path.Ellipse(context.bounds);
	boundsPath.strokeColor = this.typeProperties.strokeColor;

	var positionPath = new paper.Path.Ellipse(new paper.Rectangle(-0.5, -0.5, 1, 1));
	positionPath.strokeColor = "#0088AA";


	// todo only if not identity (pull this out?)
	boundsPath.transform(context.matrix);
	positionPath.transform(context.matrix);

};



function combinePaths(_paths, _operation) {
	if (_paths.length < 1) return [];


	var newPath = _paths[0];
	for (var i = 1; i < _paths.length; i++) {
		newPath = newPath[_operation](_paths[i]);
		newPath.remove();
	}

	return newPath;
}
