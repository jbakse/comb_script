'use strict';

var _ = require('underscore');
var jsYAML = require('js-yaml');
var UI = require('./UI.js');


module.exports.parse = parse;

//////////////////////////////////////////////////////////////////////
// Parser

function parse(_yaml) {
	var data;

	UI.log.appendMessage("Parsing YAML");
	_yaml = injectEditorProperties(_yaml);


	try {
		data = jsYAML.safeLoad(_yaml);
	}
	catch (e) {
		return UI.log.appendParseError(e);
	}

	if (data === null || typeof data !== "object") {
		return UI.log.appendError("Couldn't parse YAML.");
	}

	// todo default document goes here
	if (!data.properties) data.properties = {};

	return data;
}

function injectEditorProperties(_yaml) {

	var lines = _yaml.split("\n");
	var mapPattern = /-\s+\w*:\s*$/;

	var firstLine;
	var lastLine;

	var ranges = [];

	var documentData = {
		firstLine: 0,
		lastLine: lines.length
	};


	for (var i = 0; i < lines.length; i++) {

		var isTarget = mapPattern.test(lines[i]);

		if (isTarget) {
			var indent = "    ";
			var whitespace = /^(\s*)/.exec(lines[i])[1];

			for (var ii = i + 1; ii < lines.length; ii++) {
				if (lines[ii].trim() === '') {
					continue;
				}
				if (lines[ii].indexOf(whitespace + indent) !== 0) {
					break;
				}
			}

			firstLine = i;
			lastLine = ii - 1;
			ranges.push({
				firstLine: firstLine,
				lastLine: lastLine,
				injectIndent: whitespace + indent
			});
		}
	}

	for (var r = ranges.length - 1; r >= 0; r--) {
		var data = {
			firstLine: ranges[r].firstLine,
			lastLine: ranges[r].lastLine
		};
		var injection = ranges[r].injectIndent + "editor_properties: " + JSON.stringify(data);
		lines.splice(ranges[r].firstLine + 1, 0, injection);
	}


	lines.splice(0, 0, "editor_properties: " + JSON.stringify(documentData));

	// console.log(lines.join("\n"));

	return lines.join("\n");


}



var oldInjectEditorProperties = function(_yaml) {

	var lines = _yaml.split("\n");
	var lastLine = lines.length;

	// todo language file
	var targets = ["Region:", "Rectangle:", "Ellipse:", "Region_grid:"];

	for (var i = lines.length - 1; i >= 0; i--) {
		var isTarget = false;
		for (var t = 0; t < targets.length; t++) {
			if (lines[i].indexOf(targets[t]) >= 0) {
				isTarget = true;
				break;
			}
		}

		var isLibraryCall = lines[i].indexOf("- *") >= 0;
		var isLibraryDef = lines[i].indexOf("- &") >= 0;

		if (isTarget) {
			var whitespace = /^(\s*)/.exec(lines[i])[1];
			var editorProperties = {
				firstLine: i + 1,
				lastLine: lastLine + 1
			};
			var injection = whitespace + "    " + "editor_properties: " + JSON.stringify(editorProperties);
			lines.splice(i + 1, 0, injection);
			lastLine = i - 1;
		}
		else if (isLibraryCall || isLibraryDef) {
			lastLine = i - 1;
		}


	}
	console.log(lines.join("\n"));

	return lines.join("\n");


};
