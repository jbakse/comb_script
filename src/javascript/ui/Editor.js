'use strict';

/* global ace */
var _ = require('underscore');
var Range = ace.require('ace/range').Range;

module.exports = Editor;

////////////////////////////////////////////////////////////////////
// Editor

function Editor() {
	this.highlightMarker = null;
	this.editor = null;
	this.sendChangeEvents = true;
	this.sendChangeCursorEvents = true;
}



Editor.prototype.init = function(_element) {
	this.editor = ace.edit("editor");
	this.editor.setTheme("ace/theme/monokai");
	this.editor.getSession().setMode("ace/mode/yaml");
	this.editor.setShowInvisibles(false);
	this.editor.setShowPrintMargin(false);
	this.editor.setHighlightActiveLine(false);
	this.editor.getSession().on('change', _(this.onChange).bind(this));
	this.editor.getSession().selection.on('changeCursor', _(this.onChangeCursor).bind(this));


	// this.editor.commands.addCommand({
	// 	name: "Rebuild",
	// 	bindKey: {
	// 		win: "Ctrl-B|Ctrl-R",
	// 		mac: "Command-B|Command-R"
	// 	},
	// 	// exec: _.bind(controller.rebuild, controller)
	// 	exec: function(_e) {
	// 		$.Topic("UI/command/rebuild").publish(_e);
	// 	}
	// });

};

Editor.prototype.resize = function() {
	this.editor.resize();
};

Editor.prototype.setText = function(_text) {
	this.sendChangeEvents = false;

	this.editor.setValue(_text);
	this.editor.clearSelection();
	this.editor.scrollToLine(0);
	this.sendChangeEvents = true;
	this.onChange();
};

Editor.prototype.getText = function() {
	return this.editor.getValue();
};

Editor.prototype.onChange = function(_e) {
	if (!this.sendChangeEvents) return;
	$.Topic("UI/onContentChange").publish(_e);
};



Editor.prototype.highlightLine = function(_line, _class) {
	this.highlightLines(_line, _line, _class);
};

Editor.prototype.highlightLines = function(_firstLine, _lastLine, _class) {
	_class = "highlight " + _class;

	this.editor.getSession().removeMarker(this.highlightMarker);

	this.highlightMarker = this.editor.session.addMarker(
		new Range(_firstLine, 0, _lastLine, 1), _class, "fullLine"
	);
};

Editor.prototype.gotoLine = function(line, focus) {

	this.sendChangeCursorEvents = false;
	this.editor.gotoLine(line, 1000, true);
	this.sendChangeCursorEvents = true;

	$.Topic("UI/onLineChange").publish(line);

	if (focus) this.editor.focus();
};


var oldLine = 0;
Editor.prototype.onChangeCursor = function() {
	if (!this.sendChangeCursorEvents) return;
	var line = this.editor.selection.getCursor().row + 1;
	if (oldLine != line) {
		$.Topic("UI/onLineChange").publish(line);
		oldLine = line;
	}
};