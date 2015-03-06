'use strict';
var _ = require('underscore/underscore.js');




module.exports.downloadDataUri = function(_filename, _data) {
	var link = document.createElement("a");
	link.download = _filename;
	link.href = _data;
	console.log(link);
	link.click();
};


// given a object tree and the name of a key that holds an array of children in each object, returns a flat array of all decendants
module.exports.collectTree = function(_node, _key) {
	var c = [_node];
	_(_node[_key]).each(
		function(_childNode) {
			c = c.concat(module.exports.collectTree(_childNode, _key));
		}
	);
	return c;
};


// given two arrays of objects, adds objects from _new to _base replacing objects with matching _key property, returns results
// does not preserve order
// [{name: abe, age: 30}, {name: beth, age: 30}] , [{name: abe, age: 31}, {name: cathy, age: 26}], "name"
// [{name: beth, age: 30}, {name: abe, age: 31}, {name: cathy, age: 26}]

module.exports.mergeObjectArraysOnKey = function(_base, _new, _key) {
	
	_base = _(_base).filter(function(_baseObject){
		var overridden = _(_new).find( function(_newObject) {
			return _newObject[_key] === _baseObject[_key];
		});
		return !overridden;
	});

	return _base.concat(_new);
}

