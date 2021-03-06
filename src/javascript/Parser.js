'use strict';

var _ = require('underscore/underscore.js');
var jsYAML = require('js-yaml');
var log = require('./ui/Log.js').sharedInstance();
var language = require('./language.js');


//////////////////////////////////////////////////////////////////////
// Parser
//
// responsible for converting YAML into the javascript object data that a Document can load

module.exports.parse = parse;

function parse(_yaml) {
	var data;

	log.appendMessage("Parsing YAML");
	
	// try first without injections, so that errors will have correct line numbers
	try {
		data = jsYAML.safeLoad(_yaml);
	}
	catch (e) {
		log.appendError("Parse Error");
		log.appendParseError(e);
		return false;
	}
	
	if (data === null || typeof data !== 'object') {
		log.appendError("Parse Error");
		return false;
	}


	// parse again, this time with injected meta data properties
	_yaml = injectEditorProperties(_yaml);
	try {
		data = jsYAML.safeLoad(_yaml);
	}
	catch (e) {
		log.appendError("Parse Error (after injection)");
		log.appendParseError(e);
		return false;
	}

	if (data === null || typeof data !== 'object') {
		log.appendError("Parse Error (after injection)");
		return false;
	}

	if (!data.properties) data.properties = {};

	return data;
}

function injectEditorProperties(_yaml) {

	var lines = _yaml.split("\n");

	var regionKeywords = _(language.regionTypes).pluck("keyword");
	regionKeywords = _(regionKeywords).filter( function(_value) {
		return _value; // remove untruthy values
	});
	var regionKeywordsPattern = "(?:" + regionKeywords.join("|") + ")";
	// console.log(regionKeywords);
	var mapPattern = new RegExp(regionKeywordsPattern+":\\s*$");

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

