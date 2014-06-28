'use strict';

require('./jquery_util.js');

var UI = require('./UI.js');
var controller = require('./controller.js');
var settings = require('./settings.js');


function main() {
	UI.log.appendDebug("Starting...");

	$('div.split-pane').splitPane();
	$('#right-side-inner > .split-pane-resize-shim').mousemove(function() {
		UI.editor.resize();
	});

	UI.preview.init($('#paper-canvas').get(0));
	UI.editor.init($('#editor').get(0));
	UI.inspector.init($('#inspector').get(0));
	UI.menu.init($('#menu').get(0));


	UI.log.appendMessage("Loading " + settings.fileURL);
	controller.loadYAMLfromURL(settings.fileURL);
}


$(function() {
	main();
});



// function editorChangeCursor(e) {
// 	console.log("change", UI.editor.selection.getCursor());
// 	var t = searchTree(this.doc, UI.editor.selection.getCursor().row + 1);
// 	console.log("t", t);
// 	if (t !== null) {
// 		t.mouseEnter();
// 	}
// 	paper.view.update();
// }
// function searchTree(_node, _line) {
// 	if (_node.editorProperties.line === _line) {
// 		return _node;
// 	}
// 	else {
// 		var result = null;
// 		for (var i = 0; result === null && i < _node.children.length; i++) {
// 			result = searchTree(_node.children[i], _line);
// 		}
// 		return result;
// 	}

// }
