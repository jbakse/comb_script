'use strict';

var _ = require('underscore/underscore.js');

module.exports.fileURL = "./examples/test/default.yaml";
module.exports.previewCanvasWidth = 1600;
module.exports.previewCanvasHeight = 1600;
module.exports.inspectOnHover = false;



//colors
var menuOrange = new paper.Color("#ff6529");
var menuBlue = new paper.Color("#06aaff");
var menuGreen = new paper.Color("#1de982");
var menuYellow = new paper.Color("#fffc01");




// Create Default Style
var defaultStyle = {
	strokeColor: "black",
	strokeWidth: 1,
	strokeScaling: false,
	fillColor: new paper.Color(0, 0, 0, 0)
};

// var defaultStyles = {};
// defaultStyles.default = _(defaultStyle).clone();
// defaultStyles.selected = _(defaultStyle).clone();
// defaultStyles.key = _(defaultStyle).clone();
// defaultStyles.ghost = _(defaultStyle).clone();
// defaultStyles.hover = _(defaultStyle).clone();


// Create Build Style
var shapeFillColor = menuBlue.clone();
shapeFillColor.alpha = 0.25;
var shapeStrokeColor = menuBlue.clone();
shapeStrokeColor.alpha = 0.5;
var buildStyle = {
	fillColor: shapeFillColor,
	strokeColor: shapeStrokeColor,
	strokeWidth: 3,
	strokeScaling: false,
};
module.exports.buildStyle = buildStyle;

// Create Export Style
var exportStyle = _(defaultStyle).clone();
_(exportStyle).extend({});
module.exports.exportStyle = exportStyle;


// Create Preview/Frame Style - Bounds
var previewStyles = {};
previewStyles.bounds = {};

previewStyles.bounds.default = _(defaultStyle).clone();
previewStyles.bounds.default.strokeColor = new paper.Color(0,0,0,.1);

previewStyles.bounds.selected = _(defaultStyle).clone();
previewStyles.bounds.selected.strokeColor = menuOrange;

previewStyles.bounds.key = _(defaultStyle).clone();
previewStyles.bounds.key.strokeColor = menuOrange;
previewStyles.bounds.key.strokeWidth = 3;

previewStyles.bounds.hover = _(defaultStyle).clone();
previewStyles.bounds.hover.strokeColor = new paper.Color(0,0,0,.5);
previewStyles.bounds.hover.strokeWidth = 3;



var positionStyle = {
	strokeColor: new paper.Color(0, 0, 0, .5),
	strokeWidth: 0.5,
	strokeScaling: false,
	fillColor: new paper.Color(0, 0, 0, 0)
};

previewStyles.position = {};
previewStyles.position.default = _(positionStyle).clone();
previewStyles.position.selected = _(positionStyle).clone();
previewStyles.position.key = _(positionStyle).clone();
previewStyles.position.hover = _(positionStyle).clone();

// $.extend(true, {}, defaultpreviewStyles);
// _(previewStyles.bounds.default).extend({
// 	strokeColor: new paper.Color("black")
// });
// _(previewStyles.bounds.selected).extend({
// 	strokeColor: new paper.Color("orange"),
// 	strokeWidth: 1
// });
// _(previewStyles.bounds.key).extend({
// 	strokeColor: new paper.Color("orange"),
// 	strokeWidth: 3
// });
// _(previewStyles.bounds.ghost).extend({});
// _(previewStyles.bounds.hover).extend({
// 	strokeColor: "black",
// 	strokeWidth: 3
// });


// // Create Preview/Frame Style - Shape
// styles.position = $.extend(true, {}, defaultStyles);


module.exports.previewStyles = previewStyles;


