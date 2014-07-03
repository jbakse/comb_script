'use strict';
var _ = require('underscore');


var Context = require('./Context.js');

module.exports.fileURL = "../yaml/symbol.yaml";

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
	strokeColor: undefined,
	strokeWidth: 0,
	fillColor: new paper.Color(0,0,0,0.2)
});

var exportStyle = module.exports.exportStyle = _(defaultStyle).clone();
_(exportStyle).extend({});


styles.bounds = $.extend(true, {}, defaultStyles);
_(styles.bounds.default).extend({
	strokeColor: "cyan"
});
_(styles.bounds.selected).extend({
	strokeColor: "red",
	strokeWidth: 1
});
_(styles.bounds.key).extend({
	strokeColor: "red",
	strokeWidth: 3
});
_(styles.bounds.ghost).extend({});
_(styles.bounds.hover).extend({
	strokeColor: "red"
});

styles.shape = $.extend(true, {}, styles.bounds);
_(styles.shape.default).extend({
	strokeColor: "black",
	dashArray: undefined
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

