'use strict';

var _ = require('underscore');
var Context = require('./Context.js');
var paperUtil = require('./paper_util.js');
var util = require('./util.js');
var UI = require('./UI.js');

module.exports.Document = Document;

// maps the allowed yaml name to the region type
var regionTypes = {
	"region": Region,
	"region_grid": RegionGrid,
	"rectangle": Rectangle,
	"ellipse": Ellipse,
	"svg": SVG
};


// maps the allowed yaml name to the coresponding paperjs function
var booleanOperations = {
	"add": "unite",
	"subtract": "subtract",
	"intersect": "intersect"
};



function Region(_data, _parent) {
	this.type = "Region";
	this.parent = _parent || null;
	this.root = this.parent && this.parent.root || this;

	this.children = [];
	this.properties = {};
	this.typeProperties = {};
	this.editorProperties = {};


	this.previewBoundsGroup = new paper.Group();
	this.previewBoundsGroup.onMouseEnter = _.bind(this.onMouseEnter, this);
	this.previewBoundsGroup.onMouseLeave = _.bind(this.onMouseLeave, this);
	this.previewBoundsGroup.onClick = _.bind(this.onClick, this);

	this.previewPositionGroup = new paper.Group();

	this.id = Math.floor(Math.random() * 1000);

	this.typeProperties.boundsStyle = {
		strokeWidth: 1,
		strokeColor: '#99AAEE',
		fillColor: new paper.Color(0, 0, 0, 0)
	};

	this.typeProperties.positionStyle = {
		strokeWidth: 1,
		strokeColor: undefined,
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
			var child = new(regionTypes[childKey])(childData, this);
			// child.parent = this;
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

	// move this preview to the active layer
	paper.project.activeLayer.addChild(this.previewBoundsGroup);
	paper.project.activeLayer.addChild(this.previewPositionGroup);

	// bounds
	var bounds = this.drawBounds(context.bounds);
	bounds.transform(context.matrix);
	bounds.style = this.typeProperties.boundsStyle;
	this.previewBoundsGroup.addChild(bounds);

	// pos
	var position = this.drawPosition(context.position);
	position.transform(context.matrix);
	position.style = this.typeProperties.positionStyle;
	this.previewPositionGroup.addChild(position);

	// children
	this.previewChildren(context);
};


Region.prototype.previewChildren = function(_context) {
	_.each(this.children, function(_child) {
		_child.preview(_context);
	});
};

Region.prototype.drawBounds = function(_bounds) {
	return new paper.Path.Rectangle(_bounds);
};

Region.prototype.drawPosition = function(_bounds) {
	return new paper.Path.Ellipse(new paper.Rectangle(-.5, -.5, 1, 1));
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

Region.prototype.onMouseEnter = function() {
	$.Topic("region/onMouseEnter").publish(this);
};

Region.prototype.onClick = function() {
	$.Topic("region/onClick").publish(this);
};

Region.prototype.onMouseLeave = function() {
	$.Topic("region/onMouseLeave").publish(this);
};

Region.prototype.setStyle = function(_style, _recursive) {
	if (_style === "highlight") {
		if (this.previewBoundsGroup) {
			this.previewBoundsGroup.style = {
				strokeColor: "red",
				strokeWidth: 3
			};
		}
		if (this.previewPositionGroup) {
			this.previewPositionGroup.style = {
				strokeColor: "red"
			};
		}
	}
	else if (_style === "hover") {
		if (this.previewBoundsGroup) {
			this.previewBoundsGroup.style = {
				strokeColor: "red",
				strokeWidth: 1
			};
		}
		if (this.previewPositionGroup) {
			this.previewPositionGroup.style = {
				strokeColor: "red"
			};
		}
	}
	else {
		if (this.previewBoundsGroup) this.previewBoundsGroup.style = this.typeProperties.boundsStyle;
		if (this.previewPositionGroup) this.previewPositionGroup.style = this.typeProperties.positionStyle;
	}

	if (_recursive) {
		_(this.children).invoke('setStyle', _style, true);
	}

};



//////////////////////////////////////////////////////////////////////
// Document

function Document(_data, _parent) {
	this.waitList = [];
	Region.call(this, _data, _parent);
	this.type = "Document";



	this.typeProperties.boundsStyle.strokeColor = '#999999';

	this.regions = util.collectTree(this, "children");


}

Document.prototype = Object.create(Region.prototype);
Document.prototype.constructor = Document;


Document.prototype.onMouseEnter = function() {};
Document.prototype.onMouseLeave = function() {};
Document.prototype.onClick = function() {};



//////////////////////////////////////////////////////////////////////
// Rectangle

function Rectangle(_data, _parent) {
	Region.call(this, _data, _parent);
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



Rectangle.prototype.drawBounds = function(_bounds) {
	return new paper.Path.Rectangle(_bounds, this.properties.radius || 0);
};

Rectangle.prototype.drawPosition = function(_bounds) {
	return new paper.Path.Ellipse(new paper.Rectangle(-0.5, -0.5, 1, 1));
};



//////////////////////////////////////////////////////////////////////
// Ellipse

function Ellipse(_data, _parent) {
	Region.call(this, _data, _parent);
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


Ellipse.prototype.drawBounds = function(_bounds) {
	return new paper.Path.Ellipse(_bounds);
};

Ellipse.prototype.drawPosition = function(_bounds) {
	return new paper.Path.Ellipse(new paper.Rectangle(-0.5, -0.5, 1, 1));
};



//////////////////////////////////////////////////////////////////////
// RegionGrid

function RegionGrid(_data, _parent) {
	Region.call(this, _data, _parent);
	this.type = "RegionGrid";
	_.extend(this.typeProperties, {
		strokeColor: '#BBBBBB'
	});
}

RegionGrid.prototype = Object.create(Region.prototype);
RegionGrid.prototype.constructor = RegionGrid;

RegionGrid.prototype.preview = function(_parentContext) {
	var context = _parentContext.deriveContext(this.properties);

	paper.project.activeLayer.addChild(this.previewBoundsGroup);

	var gridContexts = this.generateContexts(context);

	_.each(gridContexts, function(gridContext) {
		// draw preview bounds
		var gridPath = new paper.Path.Rectangle(gridContext.bounds);
		gridPath.style = this.typeProperties.boundsStyle;
		gridPath.transform(gridContext.matrix);
		this.previewBoundsGroup.addChild(gridPath);


		this.previewChildren(gridContext);

	}, this);

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



//////////////////////////////////////////////////////////////////////
// SVG

function SVG(_data, _parent) {
	Region.call(this, _data, _parent);
	this.type = "SVG";

	this.svgMarkup = undefined;

	_.extend(this.typeProperties.boundsStyle, {
		strokeColor: '#888'
	});

	var self = this;


	if (this.properties.source) {
		UI.log.appendMessage("Loading SVG " + this.properties.source);
		var jqXHR = $.ajax({
			url: this.properties.source,
			dataType: "text",
			success: function(_data) {
				console.log("x", _data);
				UI.log.appendSuccess("Loaded SVG Markup" + self.properties.source);
				self.svgMarkup = _data;
			},

			error: function(_data) {
				UI.log.appendError("Couldn't retrieve SVG " + self.properties.source);
			},

			cache: false
		});
		this.root.waitList.push(jqXHR);
	}
}

SVG.prototype = Object.create(Region.prototype);
SVG.prototype.constructor = SVG;

SVG.prototype.drawBuild = function(_bounds) {
	if (!this.svgMarkup) {
		return [];
	}
	var p = new paper.Group().importSVG(this.svgMarkup, {
		expandShapes: true
	});
	return p.children;
};

SVG.prototype.drawBounds = function(_bounds) {
	var g = new paper.Group();
	if (!this.svgMarkup) {
		return g;
	}

	// var boundsPath = new paper.Path.Rectangle(_bounds, this.properties.radius || 0);
	var svg = new paper.Group().importSVG(this.svgMarkup, {
		expandShapes: true
	});
	// svg.translate(boundsPath.position.subtract(svg.position));
	// svg.scale(boundsPath.bounds.size.divide(svg.bounds.size));

	// g.addChild(boundsPath);
	g.addChild(svg);

	return g;
};

SVG.prototype.drawPosition = function(_bounds) {
	return new paper.Path.Rectangle(new paper.Rectangle(-0.5, -0.5, 1, 1));
};
