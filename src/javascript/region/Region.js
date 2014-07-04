'use strict';


var _ = require('underscore');
var paperUtil = require('../paper_util.js');
var util = require('../util.js');
var settings = require('../settings.js');
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
	
	this.editorProperties = {};

	this.previewBoundsGroup = null;
	this.previewPositionGroup = null;

	this.isShape = false;
}

Region.prototype.proxy = function() {
	// var proxy = new this.constructor();
	// proxy.parent = this.parent;
	// proxy.root = this.root;
	// proxy.
	var proxy = Object.create(this);
	// proxy.previewBoundsGroup = null;
	return proxy;
};


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
	if (!Array.isArray(definitions)) {
		definitions = [];
	}
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

	console.log(this.type, definitions);
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
			UI.log.appendWarning(messagePrefix + "Incorrect type: " + pKey + "<br />Received " + typeof pValue + ". Expected " + def.type + ".");
			return;
		}

		if (def.values && !_(def.values).contains(pValue)) {
			UI.log.appendWarning(messagePrefix + "Unrecognized value for property: " + pKey + "<br />Received \"" + pValue + "\". Expected " + def.values.join(", ") + ".");
			return;
		}

		self.properties[pKey] = pValue;
	});


	// Populate defaults
	
	_(definitions).chain()
		.filter(function(_def) {
			return _def && _def.default;
		})
		.each(function(_def) {
			self.properties[_def.keyword] = self.properties[_def.keyword] || _def.default;
		});


	// Enforce required
	_(definitions).chain()
		.filter(function(_def) {
			return _def && _def.required === true;
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
				UI.log.appendWarning("[Line " + childData.editor_properties.firstLine + "] Unknown region type: " + childKey);
			}
			else {
				UI.log.appendWarning("Unknown region type: " + childKey);
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

	this.previewBoundsGroup = new paper.Group();
	this.previewPositionGroup = new paper.Group();

	this.previewBoundsGroup.onMouseEnter = _.bind(this.onMouseEnter, this);
	this.previewBoundsGroup.onMouseLeave = _.bind(this.onMouseLeave, this);
	this.previewBoundsGroup.onClick = _.bind(this.onClick, this);

	// bounds
	var bounds = this.drawBounds(context.bounds);
	bounds.transform(context.matrix);
	this.previewBoundsGroup.addChild(bounds);

	// pos
	var position = this.drawPosition(context.position, context.matrix);
	position.transform(context.matrix);
	this.previewPositionGroup.addChild(position);

	this.setStyle("default");

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
	_style = _style || "default";
	if (!settings.styles.bounds[_style]) return;

	if (this.isShape) {
		this.previewBoundsGroup.style = settings.styles.shape[_style];
	} else {
		this.previewBoundsGroup.style = settings.styles.bounds[_style];
	}
	this.previewPositionGroup.style = settings.styles.position[_style];

	if (_recursive) {
		_(this.children).invoke('setStyle', _style, true);
	}
};



////////////////////////////////////////////////////////////////////
// Functions to Override


Region.prototype.drawBounds = function(_bounds) {
	return new paper.Path.Rectangle(_bounds);
};


Region.prototype.drawBuild = function(_bounds) {
	return [];
};


Region.prototype.drawPosition = function(_bounds, _matrix) {
	var scaling = _matrix.scaling;
	var rect = new paper.Rectangle(-0.5, -0.5, 1, 1); //.scale(1/scaling.x, 1/scaling.y)
	return new paper.Path.Ellipse(rect.scale(1/scaling.x, 1/scaling.y));
};
