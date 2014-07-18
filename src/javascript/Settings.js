'use strict';
var _ = require('underscore');

module.exports.fileURL = "./examples/box.yaml";
// module.exports.fileURL = "../yaml/tricky_grid.yaml";
module.exports.previewCanvasWidth = 1200;
module.exports.previewCanvasHeight = 1200;
module.exports.inspectOnHover = false;



//colors
var shapeFillColor = new paper.Color(0.6, 1.0, 0.2, 0.5);
var shapeStrokeColor = new paper.Color(0.0,0.0,0.0, 0.15);
var boundsStrokeColor = new paper.Color(0.0, 1.0, 1.0, 0.75);
var highlightColor = new paper.Color("#f92772");

// Create Default Style
var defaultStyle = {
	strokeScaling: false,
	strokeColor: "black",
	strokeWidth: 1,
	fillColor: new paper.Color(0, 0, 0, 0),
	dashArray: []
};

var defaultStyles = {};
defaultStyles.default = _(defaultStyle).clone();
defaultStyles.selected = _(defaultStyle).clone();
defaultStyles.key = _(defaultStyle).clone();
defaultStyles.ghost = _(defaultStyle).clone();
defaultStyles.hover = _(defaultStyle).clone();


// Create Build Style
var buildStyle = _(defaultStyle).clone();
_(buildStyle).extend({
	fillColor: shapeFillColor,
	strokeColor: new paper.Color(0.0,0.0,0.0, 0.5),
	strokeWidth: 2
});

// Create Export Style
var exportStyle = _(defaultStyle).clone();
_(exportStyle).extend({});


// Create Preview/Frame Style - Bounds
var styles = {};
styles.bounds = $.extend(true, {}, defaultStyles);
_(styles.bounds.default).extend({
	strokeColor: boundsStrokeColor
});
_(styles.bounds.selected).extend({
	strokeColor: highlightColor,
	strokeWidth: 1
});
_(styles.bounds.key).extend({
	strokeColor: highlightColor,
	strokeWidth: 3
});
_(styles.bounds.ghost).extend({});
_(styles.bounds.hover).extend({
	strokeColor: "black",
	strokeWidth: 3
});

// Create Preview/Frame Style - Shape
styles.shape = $.extend(true, {}, styles.bounds);
_(styles.shape.default).extend({
	strokeColor: shapeStrokeColor,
});
_(styles.shape.selected).extend({});
_(styles.shape.key).extend({});
_(styles.shape.ghost).extend({});
_(styles.shape.hover).extend({});

// Create Preview/Frame Style - Shape
styles.position = $.extend(true, {}, defaultStyles);


module.exports.styles = styles;
module.exports.exportStyle = exportStyle;
module.exports.buildStyle = buildStyle;
