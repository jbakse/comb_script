'use strict';

var _ = require('underscore/underscore.js');
// var math = require('mathjs/math.min.js');

var Context = require('../Context.js');
var Region = require('./Region.js');
var log = require('../ui/Log.js').sharedInstance();

module.exports = RegionGrid;

//////////////////////////////////////////////////////////////////////
// RegionGrid

function RegionGrid(_data, _parent) {
	Region.call(this, _data, _parent);
	this.type = "RegionGrid";
	this.childrenData = null;
}

RegionGrid.prototype = Object.create(Region.prototype);
RegionGrid.prototype.constructor = RegionGrid;



RegionGrid.prototype.loadChildren = function(_childrenData) {
	if (_childrenData === null || typeof _childrenData === "undefined") {
		return;
	}

	if (!(_childrenData instanceof Array)) {
		log.appendWarning("Children should be an array. Prepend child nodes with a dash and space.");
		return;
	}

	// _.each(_childrenData, this.loadChild, this);
	this.childrenData = _childrenData;
	this.generateChildren();
};


RegionGrid.prototype.generateChildren = function() {

	this.children = [];

	var gridContexts = this.generateContexts();


	_.each(gridContexts, function(gridContext, i) {
		var gridChild = new Region();
		gridChild.parent = this;
		gridChild.editorProperties = this.editorProperties;
		gridChild.constants = this.constants;
		gridChild.root = this.root;
		gridChild.properties.name = this.properties.name + "_" + i;
		gridChild.context = gridContext;
		gridChild.properties.boolean_pass = true;
		

		this.children.push(gridChild);

		if (this.properties.populate === 'repeat') {
			_(this.childrenData).each(gridChild.loadChild, gridChild);
		}

		if (this.properties.populate === 'alternate') {
			gridChild.loadChild(this.childrenData[i % this.childrenData.length]);
		}

	}, this);
};

RegionGrid.prototype.generateContexts = function() {

	var _gridContext = this.context;

	// calculate rows/cols to draw
	var rows = 1;
	rows = this.properties.rows || rows;
	if (this.properties.row_height) {
		rows = _gridContext.bounds.height / this.properties.row_height.toNumber("px");
	}

	var cols = 1;
	cols = this.properties.columns || cols;
	if (this.properties.column_width) {
		cols = _gridContext.bounds.width / this.properties.column_width.toNumber("px");
	}

	var width = _gridContext.bounds.width / cols;
	var height = _gridContext.bounds.height / rows;
	var baseX = _gridContext.bounds.left;
	var baseY = _gridContext.bounds.top;

	if (this.properties.column_align === 'right') {
		baseX = _gridContext.bounds.right - width * Math.floor(cols);
	}
	if (this.properties.column_align === 'center') {
		baseX = _gridContext.bounds.center.x - width * Math.floor(cols) * 0.5;
	}
	if (this.properties.row_align === 'bottom') {
		baseY = _gridContext.bounds.bottom - height * Math.floor(rows);
	}
	if (this.properties.row_align === 'center') {
		baseY = _gridContext.bounds.center.y - height * Math.floor(rows) * 0.5;
	}

	var generatedContexts = [];

	for (var row = 0; row < Math.floor(rows); row++) {
		for (var col = 0; col < Math.floor(cols); col++) {

			// generate bounds			

			var x = baseX + col * width;
			var y = baseY + row * height;

			// var gridRectangle = new paper.Rectangle(
			// 	new paper.Point(x, y),
			// 	new paper.Size(width, height)
			// );

			var gridContext = _gridContext.deriveContext({
				top: math.unit(y, "px"),
				bottom: math.unit(y + height, "px"),
				left: math.unit(x, "px"),
				right: math.unit(x + width, "px"),
				registration: this.properties.registration
			});


			generatedContexts.push(gridContext);
		}
	}

	return generatedContexts;

};
