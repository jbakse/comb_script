'use strict';


var Context = require('./Context.js');

module.exports.fileURL = "../yaml/simple.yaml";

module.exports.previewCanvasWidth = 1200;
module.exports.previewCanvasHeight = 1200;
module.exports.exportWidth = 400;
module.exports.exportHeight = 400;

module.exports.getRootContext = function() {
	return new Context(
		new paper.Rectangle(
			new paper.Point(-200, -200), new paper.Point(200, 200)
		),
		new paper.Matrix()
	);
};
