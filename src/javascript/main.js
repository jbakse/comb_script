'use strict';

var _ = require('underscore');
var Region = require('./Region.js');
var Context = require('./Context.js');
var UI = require('./UI.js');

var file_url = "../yaml/simple.yaml";

var editor;
var doc;

// kick
$(function() {
	main();
});

var previewSize = 1200;
var previewLayer;
var buildLayer;


function main() {
	console.log("Hello, Main!");

	$('div.split-pane').splitPane();
	// $('#document > .split-pane-resize-shim').mousemove(resizePreview);
	// $('#document > .split-pane-resize-shim').mouseup(resizePreview);



	paper.setup($('#paper-canvas').get(0));
	previewLayer = new paper.Layer();
	buildLayer = new paper.Layer();

	/* global ace */
	editor = ace.edit("editor");
	editor.setTheme("ace/theme/twilight");
	editor.getSession().setMode("ace/mode/yaml");
	// editor.getSession().selection.on('changeCursor', editorChangeCursor);
	// editor.getSession().on('change', editorChange);

	editor.commands.addCommand({
		name: "Reload iFrame",
		bindKey: {
			win: "Ctrl-B|Ctrl-R|Ctrl-S",
			mac: "Command-B|Command-R|Command-S"
		},
		exec: reloadEditor
	});


	// document.getElementById('editor').style.fontSize = '15px';
	$('#right-side-inner > .split-pane-resize-shim').mousemove(
		function() {
			console.log("resize");
			editor.resize();
		}
	);


	$.ajax({
		url: file_url,
		success: function(data) {
			editor.setValue(data);
			editor.clearSelection();
			editor.scrollToLine(0);
			updateYAML(data);
			// updateYAML(data);
		},
		fail: function(data) {
			console.log("couldn't retrieve yaml");
		},
		cache: false
	});
}

// function resizePreview(e){
// 	console.log($("#preview").width(), $("#paper-canvas").get(0).width);
// 	var w = $("#preview").width();
// 	var h = $("#preview").height();
// 	$("#paper-canvas").get(0).width = w;
// 	$("#paper-canvas").get(0).height = h;
// 	paper.view.viewSize = [w, h]; 
// 	paper.view.update();

// 	// paper.view.center = new paper.Point($("#preview").width() * 0.5, 200);


// }
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
				line: i + 1
			};
			var injection = whitespace + "    " + "editor_properties: " + JSON.stringify(editorProperties);
			lines.splice(i + 1, 0, injection);
		}
	}

	// console.log(lines.join("\n"));

	return lines.join("\n");


}

function editorChange(e) {
	// console.log("change");
	// console.log(editor.getValue());
	updateYAML(editor.getValue());
}
function reloadEditor(editor){
	updateYAML(editor.getValue());
}

function editorChangeCursor(e) {
	console.log("change", editor.selection.getCursor());
	var t = searchTree(doc, editor.selection.getCursor().row + 1);
	console.log("t", t);
	if (t !== null) {
		t.mouseEnter();
	}
	paper.view.update();
}


function searchTree(_node, _line) {
	if (_node.editorProperties.line === _line) {
		return _node;
	}
	else {
		var result = null;
		for (var i = 0; result === null && i < _node.children.length; i++) {
			result = searchTree(_node.children[i], _line);
		}
		return result;
	}

}


function updateYAML(_yaml) {
	UI.clearLog();
	UI.appendLog("Parsing YAML.");

	_yaml = injectYAML(_yaml);
	var yamlData;
	try {
		yamlData = jsyaml.safeLoad(_yaml);
	} catch (e) {
		console.log(e);
		var parseErrorTemplate = 
		_.template('<li class = "error">Error: Line <%= mark.line %><br /> <%= reason %></li>');

		UI.appendLog(parseErrorTemplate(e));
		return
	} 

	if (yamlData === null) return UI.appendLog("Couldn't parse YAML.");
	if (typeof yamlData !== "object") return UI.appendLog("Couldn't parse YAML.");
	if (yamlData.children === undefined) return UI.appendLog("Couldn't parse YAML.");

	UI.appendLog("Success.");
	
	doc = new Region.Document(yamlData);


	var context = new Context(
		new paper.Rectangle(
			new paper.Point(-200, -200), new paper.Point(200, 200)
		),

		new paper.Matrix()
	);

	context.matrix.translate(previewSize * 0.5, previewSize * 0.5);
	context.matrix.scale(doc.properties.scale || 1);
	context.matrix.scale(doc.properties.zoom || 1);
	



	buildLayer.remove();
	buildLayer = new paper.Layer();
	doc.build(context);
	buildLayer.style = {
		strokeScaling: false,
		strokeColor: "red",
		strokeWidth: 3,
		fillColor: new paper.Color(0, 1, 1, .5)
	};

	previewLayer.remove();
	previewLayer = new paper.Layer();
	doc.preview(context);


	paper.view.update();
}
