'use strict';
var _ = require('underscore');

module.exports.greet = function() {
	console.log("Hello, Util!");
};


module.exports.downloadDataUri = function(options) {
	var link = document.createElement("a");
	link.download = options.filename;
	link.href = options.data;
	link.click();
};


module.exports.collectTree = function(_node, _property) {
	var c = [_node];
	_(_node[_property]).each(
		function(_childNode) {
			c = c.concat(module.exports.collectTree(_childNode, _property));
		}
	);
	return c;
};

