'use strict';

var _ = require('underscore/underscore.js');

// module.exports.fileURL = "examples/test/default.yaml";

module.exports.fileURL = "examples/advanced/region_grid.yaml";


module.exports.previewCanvasWidth = 1600;
module.exports.previewCanvasHeight = 1600;
module.exports.inspectOnHover = false;

module.exports.autoTrappingAmmount = 0.01;


//colors
var menuOrange = new paper.Color("#ff6529");
var menuBlue = new paper.Color("#06aaff");
var menuGreen = new paper.Color("#1de982");
var menuYellow = new paper.Color("#fffc01");



// Create Build Style

var shapeFillColor = menuBlue.clone();
shapeFillColor.alpha = 0.25;
var shapeStrokeColor = menuBlue.clone();
shapeStrokeColor.alpha = 0.5;


var buildStyleBase = {
	strokeColor: shapeStrokeColor,
	fillColor: shapeFillColor,
	strokeWidth: 3,
	strokeScaling: false
};

var buildStyles = {};
module.exports.buildStyles = buildStyles;



buildStyles.cut = _(buildStyleBase).clone();

buildStyles.etch = _(buildStyleBase).clone();
buildStyles.etch.strokeWidth = 1;
buildStyles.etch.fillColor = null;

buildStyles.guide = _(buildStyleBase).clone();
buildStyles.guide.strokeWidth = 1.5;
buildStyles.guide.dashArray = [4, 4];
buildStyles.guide.fillColor = null;

// Create Export Style
var exportStyleBase = {
	strokeColor: "black",
	strokeWidth: 1,
	strokeScaling: false
};


var exportStyles = {};
module.exports.exportStyles = exportStyles;

exportStyles.cut = _(exportStyleBase).clone();
exportStyles.cut.strokeColor = "red";

exportStyles.etch = _(exportStyleBase).clone();
exportStyles.etch.strokeColor = "green";

exportStyles.guide = _(exportStyleBase).clone();
exportStyles.guide.strokeColor = "blue";




// Create Preview/Frame Style - Bounds
var previewStyleBase = {
	strokeColor: "black",
	strokeWidth: 1,
	strokeScaling: false,
	fillColor: new paper.Color(0, 0, 0, 0)
};

var previewStyles = {};
module.exports.previewStyles = previewStyles;

previewStyles.bounds = {};

previewStyles.bounds.default = _(previewStyleBase).clone();
previewStyles.bounds.default.strokeColor = new paper.Color(0,0,0,0.1);

previewStyles.bounds.selected = _(previewStyleBase).clone();
previewStyles.bounds.selected.strokeColor = menuOrange;

previewStyles.bounds.key = _(previewStyleBase).clone();
previewStyles.bounds.key.strokeColor = menuOrange;
previewStyles.bounds.key.strokeWidth = 3;

previewStyles.bounds.hover = _(previewStyleBase).clone();
previewStyles.bounds.hover.strokeColor = new paper.Color(0,0,0,0.5);
previewStyles.bounds.hover.strokeWidth = 3;


var positionStyle = {
	strokeColor: new paper.Color(0, 0, 0, 0.5),
	strokeWidth: 0.5,
	strokeScaling: false,
	fillColor: new paper.Color(0, 0, 0, 0)
};

previewStyles.position = {};
previewStyles.position.default = _(positionStyle).clone();
previewStyles.position.selected = _(positionStyle).clone();
previewStyles.position.key = _(positionStyle).clone();
previewStyles.position.hover = _(positionStyle).clone();



