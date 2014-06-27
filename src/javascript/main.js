'use strict';

var _ = require('underscore');
var Region = require('./Region.js');
var Context = require('./Context.js');

var file_url = "../yaml/drawbot.yaml";

var editor;
var doc;

// kick
$(function() {
	main();
});

function main() {
	console.log("Hello, Main!");
	
	// paper.setup($('#paper-canvas').get(0));

	// /* global ace */
	// editor = ace.edit("editor");
	// editor.setTheme("ace/theme/twilight");
	// editor.getSession().setMode("ace/mode/yaml");
	// document.getElementById('editor').style.fontSize='15px';


	// $.ajax({
	// 	url: file_url,
	// 	success: function(data) {
	// 		parseYAML(data);
	// 	},
	// 	cache: false
	// });
}

function injectYAML(_yaml) {
	var lines = _yaml.split("\n");
	var targets = ["region:", "rectangle:", "ellipse:", "region_grid:"];

	for (var i = lines.length - 1; i >= 0; i--) {
		var isTarget = false;
		for (var t = 0; t < targets.length; t++) {
			if (lines[i].indexOf(targets[t]) >= 0) {
				isTarget = true;
				break;
			} 
		}

		if (isTarget) {
			// console.log(i);
			var whitespace = /^(\s*)/.exec(lines[i])[1];
			var editorProperties = {
				line: i+1
			};
			var injection = whitespace + "    " + "editor_properties: " + JSON.stringify(editorProperties);
			lines.splice(i + 1, 0, injection);
		}
	}

	// console.log(lines.join("\n"));

	return lines.join("\n");


}

function changeCursor(e) {
	console.log("change", editor.selection.getCursor());
	var t = searchTree(doc, editor.selection.getCursor().row + 1);
	console.log("t", t);
	if (t !== null) {
		t.mouseEnter();
	}
	paper.view.update();
}


function searchTree(_node, _line){
	if(_node.editorProperties.line === _line) {
		return _node;
	}else{
		var result = null;
		for (var i = 0; result === null && i < _node.children.length; i++) {
			result = searchTree(_node.children[i], _line);
		}
		return result;
	}

}

function parseYAML(_yaml) {
	console.log("YAML Retrieved");
	editor.setValue(_yaml);
	editor.clearSelection();
	editor.scrollToLine(0);

	editor.getSession().selection.on('changeCursor', changeCursor);


	_yaml = injectYAML(_yaml);
	// Load Document
	var yamlData = jsyaml.load(_yaml);
	console.log(yamlData);
	doc = new Region.Document(yamlData);
	console.log("Tree");
	console.log(doc.tree());


	// Preview
	var context = new Context(
		new paper.Rectangle(
			new paper.Point(-200, -200), new paper.Point(200, 200)), (new paper.Matrix()).translate(200, 200).scale(doc.properties.scale || 1)
	);



	// Build Vector
	var outputLayer = new paper.Layer();
	var output = doc.build(context);

	// _.each(output, function(path) {
	// 	outputLayer.addChild(path);
	// });

	outputLayer.style = {
		strokeScaling: false,
		strokeColor: "red",
		strokeWidth: 1,
		fillColor: "#FFFF00"
	};

	$("#paper-svg").get(0).appendChild(paper.project.exportSVG());
	outputLayer.visible = false;

	// Build Preview
	//using scale instead of zoom until paper.js has stable build with strokescaling
	context.matrix.scale(doc.properties.zoom || 1);
	var previewLayer = new paper.Layer();
	doc.preview(context);



	// paper.view.zoom = doc.properties.zoom || 1;
	paper.view.center = new paper.Point(200, 200);
	paper.view.update();
}
