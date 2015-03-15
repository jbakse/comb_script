'use strict';
var _ = require('underscore/underscore.js');


// downloadDataUri
//
// prompts the browser to download given data with given filename

module.exports.downloadDataUri = function(_filename, _data) {
	var link = document.createElement("a");
	link.download = _filename;
	link.href = _data;
	link.click();
};


// collect tree
//
// returns an array of decentent nodes in a tree, including the provided root node
// takes the root node, and the property key that should hold an array of children

module.exports.collectTree = function(_node, _key) {
	var c = [_node];
	_(_node[_key]).each(
		function(_childNode) {
			c = c.concat(module.exports.collectTree(_childNode, _key));
		}
	);
	return c;
};


// mergeObjectArraysOnKey
//
// given two arrays of objects, creates an array that merges both. if an object in _base has the same key as an object in _new, the object from _base is discarded.
// does not preserve order
// [{name: abe, age: 30}, {name: beth, age: 30}] , [{name: abe, age: 31}, {name: cathy, age: 26}], "name"
// [{name: beth, age: 30}, {name: abe, age: 31}, {name: cathy, age: 26}]

module.exports.mergeObjectArraysOnKey = function(_base, _new, _key) {

	// strip down _base to just it's objects that don't appear in _new
	_base = _(_base).filter(
		function(_baseObject) {
			var overridden = _(_new).find(
				function(_newObject) {
					return _newObject[_key] === _baseObject[_key];
				}
			);
			return !overridden;
		});
	
	// add in all the new ones
	return _base.concat(_new);
}
