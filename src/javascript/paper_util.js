
// takes an array of _paths and combines the first item with all remaining items using the boolean _operation 

// module.exports.combinePaths = function(_paths, _operation) {
// 	if (_paths.length < 1) return [];

	
// 	var newPath = _paths[0];
// 	for (var i = 1; i < _paths.length; i++) {
// 		newPath.remove();
// 		_paths[i].remove();
// 		newPath = newPath[_operation](_paths[i]);
// 	}

// 	return newPath;
// };

module.exports.newCombinePaths = function(_basePath, _paths, _operation){
	if (_paths.length < 1) return [_basePath];

	_resultPath = _basePath;
	for (var i = 0; i < _paths.length; i++) {
		if (!(_paths[i] instanceof paper.Path)) continue;

		_resultPath.remove();
		_paths[i].remove();
		_resultPath = _resultPath[_operation](_paths[i]);
	}

	return _resultPath;

};
