var _ = require('underscore');


module.exports.editor = null;

module.exports.clearLog = function(_message) {
	$("#log").empty();
};

module.exports.appendLog = function(_message) {
	$("#log").append(_message);
};

module.exports.parseErrorTemplate = 
		_.template('<li class = "error">Error: Line <%= mark.line %><br /> <%= reason %></li>');


var Range = ace.require('ace/range').Range;
var selectedRegionMarker = null;

module.exports.hilightEditorLine = function(_line) {

	module.exports.editor.getSession().removeMarker(selectedRegionMarker);

	selectedRegionMarker = module.exports.editor.session.addMarker(
    	new Range(_line - 1, 0, _line - 1, 1), "selected-region", "fullLine"
 	);
};
