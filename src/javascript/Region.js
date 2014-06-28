'use strict';

var _ = require('underscore');
var Context = require('./Context.js');
var paperUtil = require('./paper_util.js');
var util = require('./util.js');

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
	this.parent = null;
	this.children = [];
	this.properties = {};
	this.typeProperties = {};
	this.editorProperties = {};

	this.previewGroup = null;
	this.previewBounds = null;
	this.previewPosition = null;

	this.id = Math.floor(Math.random() * 1000);

	this.typeProperties.boundsStyle = {
		strokeWidth: 1,
		strokeColor: '#99AAEE',
		fillColor: new paper.Color(0, 0, 0, 0)
	};

	this.typeProperties.positionStyle = {
		strokeWidth: 1,
		strokeColor: '#99CCEE',
		fillColor: '#AA8800'
	};

	this.loadData(_data);
}


//////////////////////////////////////////////////////////////////////
// Loading

Region.prototype.loadData = function(_data) {
	if ('editor_properties' in _data) {
		this.editorProperties = _.clone(_data.editor_properties);
	}

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
			child.parent = this;
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
	var s = this.type;
	if (this.editorProperties.line) {
		s += "(" + this.editorProperties.line + ")";
	}
	s += ": ";
	s += this.properties.name || "unnamed";
	return s;
};

Region.prototype.breadCrumb = function() {
	var bc = ["" + this];

	if (this.parent !== null) {
		bc = this.parent.breadCrumb().concat(bc);
	}
	return bc;
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

	var newChildren = this.drawPreview(context.bounds);
	newChildren.transform(context.matrix);

	this.previewGroup = new paper.Group();
	this.previewGroup.addChildren(newChildren.children);
	this.previewGroup.onMouseEnter = _.bind(this.mouseEnter, this);
	this.previewGroup.onMouseLeave = _.bind(this.mouseLeave, this);

	this.previewChildren(context);
};


Region.prototype.drawPreview = function(_bounds) {
	this.previewBounds = new paper.Path.Rectangle(_bounds);
	this.previewBounds.style = this.typeProperties.boundsStyle;

	this.previewPosition = new paper.Path.Ellipse(new paper.Rectangle(-0.5, -0.5, 1, 1));
	this.previewPosition.style = this.typeProperties.positionStyle;

	return new paper.Group([this.previewBounds, this.previewPosition]);
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
// Events

Region.prototype.mouseEnter = function() {
	$.Topic( "region/mouseEnter" ).publish( this );

	// this.previewGroup.selected = true;
	this.previewBounds.style = {strokeColor: "red", strokeWidth: 3};
	this.previewPosition.style = {strokeColor: "red"};

	// $("#tool-tip").html(this.breadCrumb().join("<br />"));
	// console.log(this);
};

Region.prototype.mouseLeave = function() {
	$.Topic( "region/mouseLeave" ).publish( this );

	// this.previewGroup.selected = false;
	
	this.previewBounds.style = this.typeProperties.boundsStyle;
	this.previewPosition.style = this.typeProperties.positionStyle;
	
	// $("#tool-tip").text('');
};




//////////////////////////////////////////////////////////////////////
// Document

function Document(_data) {
	Region.call(this, _data);
	this.type = "Document";

	this.regions = util.collectTree(this, "children");


	

	console.log("Flatter?");
	console.log(this);
	console.log(this.regions);

}

Document.prototype = Object.create(Region.prototype);
Document.prototype.constructor = Document;


Document.prototype.mouseEnter = function() {};
Document.prototype.mouseLeave = function() {};



//////////////////////////////////////////////////////////////////////
// Rectangle

function Rectangle(_data) {
	Region.call(this, _data);
	this.type = "Rectangle";
	_.extend(this.typeProperties.boundsStyle, {
		strokeColor: '#888'
	});
}

Rectangle.prototype = Object.create(Region.prototype);
Rectangle.prototype.constructor = Rectangle;

Rectangle.prototype.drawBuild = function(_bounds) {
	var boundsPath = new paper.Path.Rectangle(_bounds, this.properties.radius || 0);
	return boundsPath;
};

Rectangle.prototype.drawPreview = function(_bounds) {
	this.previewBounds = new paper.Path.Rectangle(_bounds, this.properties.radius || 0);
	this.previewBounds.style = this.typeProperties.boundsStyle;

	this.previewPosition = new paper.Path.Ellipse(new paper.Rectangle(-0.5, -0.5, 1, 1));
	this.previewPosition.style = this.typeProperties.positionStyle;

	return new paper.Group([this.previewBounds, this.previewPosition]);
};



//////////////////////////////////////////////////////////////////////
// Ellipse

function Ellipse(_data) {
	Region.call(this, _data);
	this.type = "Ellipse";
	_.extend(this.typeProperties.boundsStyle, {
		strokeColor: '#888'
	});
}

Ellipse.prototype = Object.create(Region.prototype);
Ellipse.prototype.constructor = Ellipse;

Ellipse.prototype.drawBuild = function(_bounds) {
	var boundsPath = new paper.Path.Ellipse(_bounds);
	return boundsPath;
};


Ellipse.prototype.drawPreview = function(_bounds) {
	this.previewBounds = new paper.Path.Ellipse(_bounds);
	this.previewBounds.style = this.typeProperties.boundsStyle;

	this.previewPosition = new paper.Path.Ellipse(new paper.Rectangle(-0.5, -0.5, 1, 1));
	this.previewPosition.style = this.typeProperties.positionStyle;

	return new paper.Group([this.previewBounds, this.previewPosition]);
};



//////////////////////////////////////////////////////////////////////
// RegionGrid

function RegionGrid(_data) {
	Region.call(this, _data);
	this.type = "RegionGrid";
	_.extend(this.typeProperties, {
		strokeColor: '#BBBBBB'
	});
}

RegionGrid.prototype = Object.create(Region.prototype);
RegionGrid.prototype.constructor = RegionGrid;

RegionGrid.prototype.preview = function(_parentContext) {
	var context = _parentContext.deriveContext(this.properties);

	this.previewGroup = new paper.Group();
	var gridContexts = this.generateContexts(context);

	_.each(gridContexts, function(gridContext) {
		// draw preview bounds
		var gridPath = new paper.Path.Rectangle(gridContext.bounds);
		gridPath.style = this.typeProperties.boundsStyle;
		gridPath.transform(gridContext.matrix);


		this.previewGroup.addChild(gridPath);


		this.previewChildren(gridContext);

	}, this);

	this.previewGroup.onMouseEnter = _.bind(this.mouseEnter, this);
	this.previewGroup.onMouseLeave = _.bind(this.mouseLeave, this);

};

RegionGrid.prototype.build = function(_parentContext) {
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
