
// takes an array of _paths and combines the first item with all remaining items using the boolean _operation 

module.exports.combinePaths = function(_paths, _operation) {
	if (_paths.length < 1) return [];

	console.log("cp", _paths, _operation);
	
	var newPath = _paths[0];
	for (var i = 1; i < _paths.length; i++) {
		newPath.remove();
		_paths[i].remove();
		newPath = newPath[_operation](_paths[i]);
	}

	return newPath;
};
