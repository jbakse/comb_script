'use strict';

var _ = require('underscore/underscore.js');
var Context = require('../Context.js');
var Region = require('./Region.js');

module.exports = RegionGrid;

//////////////////////////////////////////////////////////////////////
// RegionGrid

function RegionGrid(_data, _parent) {
	Region.call(this, _data, _parent);
	this.type = "RegionGrid";
	this.specifiedChildren = undefined;
}

RegionGrid.prototype = Object.create(Region.prototype);
RegionGrid.prototype.constructor = RegionGrid;



RegionGrid.prototype.preview = function(_parentContext) {
	var context = _parentContext.deriveContext(this.properties);

	this.previewBoundsGroup = new paper.Group();
	this.previewPositionGroup = new paper.Group();

	this.previewBoundsGroup.onMouseEnter = _.bind(this.onMouseEnter, this);
	this.previewBoundsGroup.onMouseLeave = _.bind(this.onMouseLeave, this);
	this.previewBoundsGroup.onClick = _.bind(this.onClick, this);


	if (!this.specifiedChildren) {
		this.generateChildren(context);
	}
	_.each(this.children, function(child) {
		child.preview(child.context);
	}, this);

	this.setStyle("default");
};

RegionGrid.prototype.build = function(_parentContext) {
	var context = _parentContext.deriveContext(this.properties);



	if (!this.specifiedChildren) {
		this.generateChildren(context);
	}

	var childPaths = [];
	_.each(this.children, function(child) {
		childPaths = childPaths.concat(child.buildChildren(child.context));
	}, this);



	// var gridContexts = this.generateContexts(context);
	// var childPaths = [];
	// _.each(gridContexts, function(gridContext) {
	// 	childPaths = childPaths.concat(this.buildChildren(gridContext));
	// }, this);

	return childPaths;
};

RegionGrid.prototype.generateChildren = function(_context) {
	this.specifiedChildren = this.children;
	this.children = [];

	var gridContexts = this.generateContexts(_context);

	var i = 0;
	_.each(gridContexts, function(gridContext) {
		var gridChild = new Region();
		gridChild.parent = this;
		gridChild.editorProperties = this.editorProperties;
		gridChild.properties.name = this.properties.name + "_" + i++;
		_(this.specifiedChildren).each(function(_child) {
			var proxy = _child.proxy();
			proxy.parent = gridChild;
			gridChild.children.push(proxy);
		}, this);

		gridChild.context = gridContext;
		this.children.push(gridChild);
		// gridChild.preview(gridContext);
	}, this);
};

RegionGrid.prototype.generateContexts = function(_gridContext) {
	// calculate rows/cols to draw
	var rows = 1;
	rows = this.properties.rows || rows;
	rows = (_gridContext.bounds.height / this.properties.row_height) || rows;

	var cols = 1;
	cols = this.properties.columns || cols;
	cols = (_gridContext.bounds.width / this.properties.column_width) || cols;

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

			var gridRectangle = new paper.Rectangle(
				new paper.Point(x, y),
				new paper.Size(width, height)
			);

			var gridContext = _gridContext.deriveContext({
				top: y,
				bottom: y+height,
				left: x,
				right: x+width,
				registration: this.properties.registration
			});

			generatedContexts.push(gridContext);
		}
	}

	return generatedContexts;

};
