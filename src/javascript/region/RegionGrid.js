'use strict';

var _ = require('underscore');
var Context = require('../Context.js');
var Region = require('./Region.js');

module.exports = RegionGrid;

//////////////////////////////////////////////////////////////////////
// RegionGrid

function RegionGrid(_data, _parent) {
	Region.call(this, _data, _parent);
	this.type = "RegionGrid";
	this.specifiedChildren = [];
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


	this.specifiedChildren = this.children;
	this.children = [];

	var gridContexts = this.generateContexts(context);

	var i = 0;
	_.each(gridContexts, function(gridContext) {
		var gridChild = new Region();
		gridChild.parent = this;
		gridChild.editorProperties = this.editorProperties;
		gridChild.properties.name = this.properties.name + "_" + i++;
		_(this.specifiedChildren).each( function(_child) {
			var proxy = _child.proxy();
			proxy.parent = gridChild;
			console.log(proxy);
			gridChild.children.push(proxy);
		}, this);

		// gridChild.children = this.specifiedChildren;
		this.children.push(gridChild);
		gridChild.preview(gridContext);
	}, this);

	// var gridContexts = this.generateContexts(context);

	// _.each(gridContexts, function(gridContext) {
		
	// 	var gridPath = new paper.Path.Rectangle(gridContext.bounds);
	// 	gridPath.transform(gridContext.matrix);
	// 	this.previewBoundsGroup.addChild(gridPath);


	// 	this.previewChildren(gridContext);

	// }, this);

	// this.previewChildren(gridContext);

	this.setStyle("default");
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
	cols = this.properties.columns || cols;

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
