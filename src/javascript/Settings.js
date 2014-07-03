'use strict';
var _ = require('underscore');


var Context = require('./Context.js');

module.exports.fileURL = "../yaml/styletest.yaml";

module.exports.previewCanvasWidth = 1200;
module.exports.previewCanvasHeight = 1200;
// module.exports.exportWidth = 400;
// module.exports.exportHeight = 400;

module.exports.inspectOnHover = false;

var styles = module.exports.styles = {};


module.exports.getRootContext = function() {
	return new Context(
		new paper.Rectangle(
			new paper.Point(0, 0), new paper.Point(0, 0)
		),
		new paper.Matrix()
	);
};

//colors
var shapeFillColor = new paper.Color("#99f927");
shapeFillColor.alpha=.5;
var shapeStrokeColor = new paper.Color("#738343");

var boundsStrokeColor = new paper.Color("#3ee1ff");
var highlightColor = new paper.Color("#f92772");


var defaultStyle = {
	strokeScaling: false,
	strokeColor: "black",
	strokeWidth: 1,
	fillColor: new paper.Color(0,0,0,0),
	dashArray: []
};

var defaultStyles = {};
defaultStyles.default = _(defaultStyle).clone();
defaultStyles.selected = _(defaultStyle).clone();
defaultStyles.key = _(defaultStyle).clone();
defaultStyles.ghost = _(defaultStyle).clone();
defaultStyles.hover = _(defaultStyle).clone();

var buildStyle = module.exports.buildStyle = _(defaultStyle).clone();
_(buildStyle).extend({
	fillColor: shapeFillColor,
	strokeColor: undefined
});

var exportStyle = module.exports.exportStyle = _(defaultStyle).clone();
_(exportStyle).extend({});


styles.bounds = $.extend(true, {}, defaultStyles);
_(styles.bounds.default).extend({
	strokeColor: boundsStrokeColor
});
_(styles.bounds.selected).extend({
	strokeColor: highlightColor,
	strokeWidth: 2
});

_(styles.bounds.key).extend({
	strokeColor: highlightColor,
	strokeWidth: 3
});
_(styles.bounds.ghost).extend({});
_(styles.bounds.hover).extend({
	strokeColor: boundsStrokeColor,
	strokeWidth: 3
});

styles.shape = $.extend(true, {}, styles.bounds);
_(styles.shape.default).extend({
	strokeColor: shapeStrokeColor,
});
_(styles.shape.selected).extend({});
_(styles.shape.key).extend({});
_(styles.shape.ghost).extend({});
_(styles.shape.hover).extend({});

styles.position = {};
styles.position.default = _(_(defaultStyle).clone()).extend({});
styles.position.selected = _(_(defaultStyle).clone()).extend({});
styles.position.key = _(_(defaultStyle).clone()).extend({});
styles.position.ghost = _(_(defaultStyle).clone()).extend({});
styles.position.hover = _(_(defaultStyle).clone()).extend({});

