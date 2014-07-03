'use strict';


var _ = require('underscore');
var paperUtil = require('../paper_util.js');
var util = require('../util.js');

var regionTypes = require('./regionTypes.js');
var Context = require('../Context.js');

var UI = require('../UI.js'); //todo remove UI dependency
var language = require('../language.js');


module.exports = Region;



// todo move this
// maps the allowed yaml name to the coresponding paperjs function
var booleanOperations = {
	"add": "unite",
	"subtract": "subtract",
	"intersect": "intersect"
};



function Region(_parent) {
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
}



//////////////////////////////////////////////////////////////////////
// Loading

Region.prototype.loadData = function(_data) {

	if (typeof _data.editor_properties === "object" && _data.editor_properties !== null) {
		this.editorProperties = _.clone(_data.editor_properties);
	}

	if (typeof _data.properties === "object" && _data.properties !== null) {
		this.loadProperties(_data.properties);
	}

	if (typeof _data.children === "object" && _data.children !== null) {
		this.loadChildren(_data.children);
	}

	return this;
};


Region.prototype.loadProperties = function(_properties) {

	var self = this;

	//todo recurse?
	var definitions = language.regionTypes[this.type].properties;
	var superClass = language.regionTypes[this.type].extends;
	if (superClass) {
		definitions = util.mergeObjectArraysOnKey(language.regionTypes[superClass].properties, definitions, "keyword");
	}


	// Build message prefix
	// todo factor this out
	var messagePrefix = this.type + ": ";
	if (this.editorProperties.firstLine) {
		messagePrefix = "[Line " + this.editorProperties.firstLine + " " + this.type + "] ";
	}

	// Validate and import provided properties.
	_(_properties).each(function(pValue, pKey) {
		var def = _(definitions).find(function(_def) {
			return _def.keyword === pKey;
		});

		if (!def) {
			UI.log.appendWarning(messagePrefix + "Unknown property: " + pKey);
			return;
		}

		if (typeof pValue !== def.type) {
			UI.log.appendWarning(messagePrefix + "Incorrect type: " + pKey + " (received " + typeof pValue + ", expected " + def.type + ")");
			return;
		}

		self.properties[pKey] = pValue;
	});


	// Populate defaults
	_(definitions).chain()
		.filter(function(_def) {
			return _def.default;
		})
		.each(function(_def) {
			self.properties[_def.keyword] = _def.default;
		});


	// Enforce required
	_(definitions).chain()
		.filter(function(_def) {
			return _def.required === true;
		})
		.each(function(_def) {
			if (self.properties[_def.keyword] === undefined) {
				UI.log.appendWarning(
					messagePrefix + "Missing required property: " + _def.keyword
				);
			}
		});

};

Region.prototype.loadChildren = function(_childrenData) {

	_.each(_childrenData, function(_childData) {
		var childKey = _.keys(_childData)[0];
		var childData = _.values(_childData)[0];


		var def = _(language.regionTypes).find(function(_def) {
			return _def.keyword === childKey;
		});
		var targetClass = def && def.class;


		if (targetClass && targetClass in regionTypes) {
			var child = new(regionTypes[targetClass])(this);
			child.loadData(childData);
			this.children.push(child);
		}
		else {
			if (childData.editor_properties) {
				UI.log.appendWarning("[Line " + childData.editor_properties.firstLine + "] Unknown Region Type: " + childKey);
			}
			else {
				UI.log.appendWarning("Unknown Region Type: " + childKey);
			}
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



//////////////////////////////////////////////////////////////////////
// Build

Region.prototype.build = function(_parentContext) {
	var context = _parentContext.deriveContext(this.properties);

	var ownPaths = [].concat(this.drawBuild(context.bounds));
	_.each(ownPaths, function(p) {
		p.transform(context.matrix);
	}, this);

	var childPaths = ownPaths.concat(this.buildChildren(context));

	console.log(this.properties);

	if (!('boolean' in this.properties)) {
		return childPaths;
	}
	else {
		var op = booleanOperations[this.properties.boolean];
		childPaths = paperUtil.combinePaths(childPaths, op);
	}

	return childPaths;
};


Region.prototype.buildChildren = function(_context) {
	var childPaths = [];

	_.each(this.children, function(_child) {
		var s = _child.build(_context);
		childPaths = childPaths.concat(s);
	});

	return childPaths;
};

////////////////////////////////////////////////////////////////////
// Handy

Region.prototype.getDecendants = function() {
	return util.collectTree(this, "children");
};

Region.prototype.getAncestors = function() {
	var a = [];
	if (this.parent) {
		return [this.parent].concat(this.parent.getAncestors());
	}
	return [];
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



////////////////////////////////////////////////////////////////////
// Functions to Override


Region.prototype.drawBounds = function(_bounds) {
	return new paper.Path.Rectangle(_bounds);
};

Region.prototype.drawPosition = function(_bounds) {
	return new paper.Path.Ellipse(new paper.Rectangle(-0.5, -0.5, 1, 1));
};

Region.prototype.drawBuild = function(_bounds) {
	return [];
};
