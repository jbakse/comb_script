'use strict';

var _ = require('underscore');
var Context = require('./Context.js');
var paperUtil = require('./paperUtil.js');

module.exports.Document = Document;

// maps the allowed yaml name to the region type
var regionTypes = {
	"region": Region,
	"region_grid": RegionGrid,
	"rectangle": Rectangle,
	"ellipse": Ellipse
};


// maps the allowed yaml name to the coresponding paperjs function
var booleanOperations = {
	"add": "unite",
	"subtract": "subtract",
	"intersect": "intersect"
};





function Region(_data) {
	this.type = "Region";
	this.children = [];
	this.properties = {};
	this.typeProperties = {};

	this.typeProperties.boundsStyle = {
		strokeWeight: 1,
		strokeColor: '#0088AA'
	};

	this.typeProperties.positionStyle = {
		strokeWeight: 1,
		strokeColor: '#0088AA',
		fillColor: '#AA8800'
	};

	this.loadData(_data);
}


//////////////////////////////////////////////////////////////////////
// Loading

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


//////////////////////////////////////////////////////////////////////
// Util

Region.prototype.toString = function() {
	return this.type + ": " + (this.properties.name || "unnamed");
};

Region.prototype.tree = function(_depth) {
	_depth = _depth || 0;

	var text = this + "\n";

	_.each(this.children, function(_child) {
		// create indent
		_(_depth + 1).times(function(i) {
			text += "\t";
		});

		text += _child.tree(_depth + 1);
	});

	return text;
};


//////////////////////////////////////////////////////////////////////
// Preview

Region.prototype.preview = function(_parentContext) {
	var context = _parentContext.deriveContext(this.properties);

	var previewGroup = this.drawPreview(context.bounds);
	previewGroup.transform(context.matrix);

	this.previewChildren(context);
};


Region.prototype.drawPreview = function(_bounds) {
	var boundsPath = new paper.Path.Rectangle(_bounds);
	boundsPath.style = this.typeProperties.boundsStyle;

	var positionPath = new paper.Path.Ellipse(new paper.Rectangle(-0.5, -0.5, 1, 1));
	positionPath.style = this.typeProperties.positionStyle;

	return new paper.Group([boundsPath, positionPath]);
};

Region.prototype.previewChildren = function(_context) {
	_.each(this.children, function(_child) {
		_child.preview(_context);
	});
};


//////////////////////////////////////////////////////////////////////
// Build

Region.prototype.build = function(_parentContext) {

	var context = _parentContext.deriveContext(this.properties);

	var ownPaths = [].concat(this.drawBuild(context.bounds));
	_.each(ownPaths, function(p) {
		p.transform(context.matrix);
	}, this);

	var childPaths = ownPaths.concat(this.buildChildren(context));


	if (!('boolean' in this.properties)) {
		return childPaths;
	}
	else {
		var op = booleanOperations[this.properties.boolean];
		childPaths = paperUtil.combinePaths(childPaths, op);
	}

	return childPaths;
};


Region.prototype.drawBuild = function(_bounds) {
	return [];
};

Region.prototype.buildChildren = function(_context) {
	var childPaths = [];

	_.each(this.children, function(_child) {
		var s = _child.build(_context);
		childPaths = childPaths.concat(s);
	});

	return childPaths;
};


//////////////////////////////////////////////////////////////////////
// Document

function Document(_data) {
	Region.call(this, _data);
	this.type = "Document";
	this.typeProperties.strokeColor = "blue";
}

Document.prototype = Object.create(Region.prototype);
Document.prototype.constructor = Document;




//////////////////////////////////////////////////////////////////////
// Rectangle

function Rectangle(_data) {
	Region.call(this, _data);
	this.type = "Rectangle";
	this.typeProperties.boundsStyle = {
		strokeWeight: 1,
		strokeColor: '#333333'
	};
}

Rectangle.prototype = Object.create(Region.prototype);
Rectangle.prototype.constructor = Rectangle;

Rectangle.prototype.drawBuild = function(_bounds) {
	var boundsPath = new paper.Path.Rectangle(_bounds, this.properties.radius || 0);
	return boundsPath;
};

Rectangle.prototype.drawPreview = function(_bounds) {
	var boundsPath = new paper.Path.Rectangle(_bounds, this.properties.radius || 0);
	boundsPath.style = this.typeProperties.boundsStyle;

	var positionPath = new paper.Path.Ellipse(new paper.Rectangle(-0.5, -0.5, 1, 1));
	positionPath.style = this.typeProperties.positionStyle;

	return new paper.Group([boundsPath, positionPath]);
};




//////////////////////////////////////////////////////////////////////
// Ellipse

function Ellipse(_data) {
	Region.call(this, _data);
	this.type = "Ellipse";
	this.typeProperties.boundsStyle = {
		strokeWeight: 1,
		strokeColor: '#33333'
	};
}

Ellipse.prototype = Object.create(Region.prototype);
Ellipse.prototype.constructor = Ellipse;

Ellipse.prototype.drawBuild = function(_bounds) {
	var boundsPath = new paper.Path.Ellipse(_bounds);
	return boundsPath;
};


Ellipse.prototype.drawPreview = function(_bounds) {
	var boundsPath = new paper.Path.Ellipse(_bounds);
	boundsPath.style = this.typeProperties.boundsStyle;

	var positionPath = new paper.Path.Ellipse(new paper.Rectangle(-0.5, -0.5, 1, 1));
	positionPath.style = this.typeProperties.positionStyle;

	return new paper.Group([boundsPath, positionPath]);
};





//////////////////////////////////////////////////////////////////////
// RegionGrid

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
			}

			generatedContexts.push(gridContext);
		}
	}

	return generatedContexts;

};

