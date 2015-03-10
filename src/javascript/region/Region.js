'use strict';


var _ = require('underscore/underscore.js');
var math = require('mathjs/math.min.js');

//insert 'px' unit so math js can covert to/from px
math.type.Unit.UNITS.px = {
	name: 'px',
	base: math.type.Unit.BASE_UNITS.LENGTH,
	prefixes: math.type.Unit.PREFIXES.NONE,
	value: 0.0254 / 72.0,
	offset: 0
};


var paperUtil = require('../paper_util.js');
var util = require('../util.js');
var settings = require('../Settings.js');
var regionTypes = require('./regionTypes.js');
var Context = require('../Context.js');

var language = require('../language.js');
var log = require('../ui/Log.js').sharedInstance();


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
	this.root = (this.parent && this.parent.root) || this;

	this.children = [];
	this.properties = {};

	this.editorProperties = {};

	this.previewBoundsGroup = null;
	this.previewPositionGroup = null;
	this.context = null;

	this.isShape = false;
}

Region.prototype.proxy = function() {
	var proxy = Object.create(this);
	return proxy;
};


//////////////////////////////////////////////////////////////////////
// Loading

Region.prototype.loadData = function(_data) {

	if (typeof _data.editor_properties === "object" && _data.editor_properties !== null) {
		this.editorProperties = _.clone(_data.editor_properties);
	}

	this.loadConstants(_data.constants);
	this.loadProperties(_data.properties);

	var parentContext = this.parent ? this.parent.context : new Context();
	this.evalMathProperties(parentContext);
	this.buildContext(parentContext);

	this.loadChildren(_data.children);

	console.log(this);
	return this;
};


Region.prototype.loadConstants = function(_contstants) {
	var self = this;

	if (typeof _contstants === 'undefined') {
		_contstants = {};
	}

	if (typeof _contstants !== 'object') {
		logPropertyError(self, null, "constants should be a key/value map", "received " + typeof _properties);
		_contstants = {};
	}


	if (this.parent) {
		this.constants = _(this.parent.constants).clone();
	}
	else {
		this.constants = {};
	}

	_(_contstants).each(function(value, key) {
		var scope = {};
		if (self.parent) scope = _(self.parent.constants).clone();
		try {
			self.constants[key] = evalMathjsExpression(value, scope);
		}
		catch (e) {
			logPropertyError(self, key, e.message);
		}
	});



};

Region.prototype.getPropertyDefinitions = function() {
	//todo recurse?
	var definitions = language.regionTypes[this.type].properties;
	if (!Array.isArray(definitions)) {
		definitions = [];
	}
	var superClass = language.regionTypes[this.type].extends;
	if (superClass) {
		definitions = util.mergeObjectArraysOnKey(language.regionTypes[superClass].properties, definitions, "keyword");
	}
	return definitions;
};


function logPropertyError(region, property, message, details) {
	var m = region.toString() + "<br/>";
	if (property) {
		m += property + ": ";
	}
	m += message + "<br/>";
	if (details) {
		m += details;
	}
	log.appendWarning(m);
}

Region.prototype.loadProperties = function(_properties) {

	var self = this;

	var definitions = this.getPropertyDefinitions();

	if (typeof _properties === 'undefined') {
		_properties = {};
	}

	if (typeof _properties !== 'object') {
		logPropertyError(self, null, "properties should be a key/value map", "received " + typeof _properties);
		_properties = {};
	}

	////////////////////////////////////////////////////////////////////
	// Validate and import provided properties.

	_(_properties).each(function(pValue, pKey) {

		var def = _(definitions).find(function(_def) {
			return _def.keyword === pKey;
		});

		// property known
		if (!def) {
			logPropertyError(self, pKey, "unrecognized property");
			return;
		}

		var allowedInputTypes;

		if (def.type == "string") {
			allowedInputTypes = ["string"];
		}

		if (def.type == "dimension") {
			allowedInputTypes = ["string"];
		}

		if (def.type == "number") {
			allowedInputTypes = ["number", "string"];
		}

		if (def.type === "color") {
			// todo make sure correct properties are in color object
			allowedInputTypes = ["object"];
		}

		// correct color type
		if (!_(allowedInputTypes).contains(typeof pValue)) {
			logPropertyError(self, pKey, "incorrect type", "\""+pValue+"\" is a " + typeof pValue + "; expected " + def.type);
			return;
		}

		// value in allowed set
		if (def.values && !_(def.values).contains(pValue)) {
			logPropertyError(self, pKey, "unrecognized property value", "received \"" + pValue + "\"; expected [" + def.values.join(", ") + "]");
			return;
		}

		self.properties[pKey] = pValue;
	});


	////////////////////////////////////////////////////////////////////
	// Populate defaults

	_(definitions).chain()
		.filter(function(_def) {
			// find property definitions that have defaults
			return _def && _def.default;
		})
		.each(function(_def) {
			// use default if property not set by user
			self.properties[_def.keyword] = self.properties[_def.keyword] || _def.default;
		});


	////////////////////////////////////////////////////////////////////
	// Enforce required

	_(definitions).chain()
		.filter(function(_def) {
			// find property definitions that have requrired set true
			return _def && _def.required === true;
		})
		.each(function(_def) {
			// warn if not set
			if (self.properties[_def.keyword] === undefined) {
				logPropertyError(self, _def.keyword, "missing required property");
			}
		});

};


// evalMathProperties
Region.prototype.evalMathProperties = function(context) {
	var definitions = this.getPropertyDefinitions();
	var self = this;

	var scope = _(self.constants).clone();
	scope = _(scope).extend(context.scope());

	// process defined "number" properties
	_(definitions).chain()
	.filter(function(_def) {
		return _def && _def.type === "number" && (typeof self.properties[_def.keyword] !== "undefined");
	})
	.each(function(_def) {
		try {
			self.properties[_def.keyword] = evalMathjsNumber(self.properties[_def.keyword], scope);
		} catch (e) {
			logPropertyError(self, _def.keyword, e.message);
		}
	});

	_(definitions).chain()
	.filter(function(_def) {
		return _def && _def.type === "dimension" && (typeof self.properties[_def.keyword] !== "undefined");
	})
	.each(function(_def) {
		try {
			self.properties[_def.keyword] = evalMathjsDimension(self.properties[_def.keyword], scope);
		} catch (e) {
			logPropertyError(self, _def.keyword, e.message);
		}
	});




	// var dimensionProperties = _(definitions).filter(function(_def) {
	// 	return _def && _def.type === "number";
	// });

	// _(definitions).chain()
	// 	.filter(function(_def) {
	// 		return _def && _def.type === "number";
	// 	})
	// 	.each(function(_def) {
	// 		var pValue = self.properties[_def.keyword];
	// 		if (typeof pValue === "undefined") {
	// 			return;
	// 		}

	// 		var scope = _(self.constants).clone();
	// 		scope = _(scope).extend(context.scope());
	// 		try {
	// 			var result = evalMathjsExpression(pValue, scope);
	// 			if (result instanceof math.type.Unit) {
	// 				result = result.toNumber("px");
	// 			}
	// 			self.properties[_def.keyword] = result;
	// 		}
	// 		catch (e) {
	// 			logPropertyError(self, _def.keyword, e.message);
	// 		}

	// 	});

};

function evalMathjsNumber(_expression, _scope) {
	var result = evalMathjsExpression(_expression, _scope);
	if (typeof result !== "number") {
		throw new Error("expression should result in a number (result should not include a unit).");
	}
	return result;
}

function evalMathjsDimension(_expression, _scope) {
	var result = evalMathjsExpression(_expression, _scope);
	if (!(result instanceof math.type.Unit)) {
		throw new Error("expression should result in a dimension (you may need to include a unit).");
	}
	return result;
}

function evalMathjsExpression(_expression, _scope) {

	if (typeof _expression === "number") {
		return _expression;
	}

	if (typeof _expression === "string") {
		try {
			var result = math.eval(_expression, _scope);
			return result;
		}
		catch (e) {
			throw new Error("unable to evaluate expression<br/>" + e.message);
		}
	}

	throw new Error("invalid type");
}


Region.prototype.buildContext = function(parentContext) {
	this.context = parentContext.deriveContext(this.properties);
};

Region.prototype.loadChildren = function(_childrenData) {
	if (_childrenData === null || typeof _childrenData === "undefined") {
		return;
	}

	if (!(_childrenData instanceof Array)) {
		log.appendWarning("Children should be an array. Prepend child nodes with a dash and space.");
		return;
	}

	_.each(_childrenData, this.loadChild, this);
};

Region.prototype.loadChild = function(_childData) {

	var childKey = _.keys(_childData)[0];
	var childData = _.values(_childData)[0];
	if (typeof childKey === "undefined" || typeof childData === "undefined") {
		log.appendWarning("Undefined Child in " + this);
		return;
	}
	if (childData === null) {
		log.appendWarning("Illegal Empty Child (" + childKey + ")");
		return;
	}

	//make sure this child isn't somehow it's own father/grandfather
	var ancestors = this.getAncestors();
	var firstLines = _(ancestors).map(function(ancestor) {
		return ancestor.editorProperties && ancestor.editorProperties.firstLine;
	});
	if (_(firstLines).contains(childData.editor_properties.firstLine)) {
		log.appendWarning("Illegal: Child contains itself  (" + childData.editor_properties.firstLine + ")");
		return;
	}


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
			log.appendWarning("[Line " + childData.editor_properties.firstLine + "] Unknown region type: " + childKey);
		}
		else {
			log.appendWarning("Unknown region type: " + childKey);
		}
	}


};



//////////////////////////////////////////////////////////////////////
// Util

Region.prototype.toString = function() {
	var s = this.type;
	if (this.editorProperties.firstLine) {
		s += "(" + (this.editorProperties.firstLine + 1) + "-" + (this.editorProperties.lastLine + 1) + ")";
	}
	if (this.properties.name) {
		s += " \"" + this.properties.name + "\" ";
	}
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

	var context = this.context;

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

	var context = this.context;

	// build own paths
	var ownPaths = [].concat(this.drawBuild(context.bounds));
	_.each(ownPaths, function(p) {
		p.transform(context.matrix);
	}, this);



	// collect child paths/ops
	var childPathSets = [];
	var childOps = [];

	// collectBooleanChildren
	// we are about to boolean each of this region's children against this region
	// if a child has boolean pass set, we need to include that child's children (recursively)
	// this function collects the eligible decendants
	var booleanChildren = [];

	function collectBooleanChildren(_node) {
		_(_node.children).each(
			function(_childNode) {
				if (_childNode.properties.boolean === 'pass') {
					collectBooleanChildren(_childNode);
				}
				else {
					booleanChildren = booleanChildren.concat(_childNode);
				}
			}
		);

	}
	collectBooleanChildren(this);


	_.each(booleanChildren, function(_child) {
		var s = _child.build(context);
		childPathSets.push(s);
		childOps.push(booleanOperations[_child.properties.boolean]);
	});



	// arrange operands
	var leftPathSet = ownPaths;
	var rightPathSets = childPathSets;
	var ops = childOps;
	var resultPaths = [];

	if (ownPaths.length === 0) {
		leftPathSet = rightPathSets.splice(0, 1)[0];
		ops.splice(0, 1);
	}


	// filter out non booleanable paths (skips)
	var skips = _(leftPathSet).filter(function(_path) {
		return !(_path instanceof paper.Path || _path instanceof paper.CompoundPath);
	});
	resultPaths = resultPaths.concat(skips);
	leftPathSet = _(leftPathSet).difference(skips);

	_(rightPathSets).each(function(pathSet, pathSetIndex) {
		skips = _(pathSet).filter(function(_path) {
			return !(_path instanceof paper.Path || _path instanceof paper.CompoundPath);
		});
		resultPaths = resultPaths.concat(skips);
		rightPathSets[pathSetIndex] = _(pathSet).difference(skips);
	});


	// process the booleans
	_(leftPathSet).each(function(leftPath, leftIndex) {
		_(rightPathSets).each(function(rightPathSet, rightIndex) {
			if (typeof ops[rightIndex] === 'undefined') {
				resultPaths = resultPaths.concat(rightPathSet);
				return;
			}
			var boolResult = this._combinePaths(leftPathSet[leftIndex], rightPathSet, ops[rightIndex]);
			leftPathSet[leftIndex] = boolResult;
		}, this);
	}, this);


	resultPaths = resultPaths.concat(leftPathSet);

	return resultPaths;

};


Region.prototype._combinePaths = function(_leftPath, _rightPathSet, _op) {

	if (_rightPathSet.length < 1) return _leftPath;
	// if (typeof _op === 'undefined') return _leftPath;

	_(_rightPathSet).each(function(_rightPath) {

		try {

			var temp = _leftPath[_op](_rightPath);
			_leftPath.remove();
			_rightPath.remove();
			_leftPath = temp;

		}
		catch (e) {
			log.appendWarning("Failed to resolve boolean opperation.");
			console.warn(e); // throw(e);
		}
	});


	return _leftPath;
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
	}
	else {
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
	return new paper.Path.Ellipse(rect.scale(1 / scaling.x, 1 / scaling.y));
};
