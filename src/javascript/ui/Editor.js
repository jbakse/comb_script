'use strict';

var _ = require('underscore/underscore.js');
var AceRange = ace.require('ace/range').Range;


////////////////////////////////////////////////////////////////////
// Editor
//
// Manages the ACE code editor

// Published Topics:
// Editor/edited        - sent when *user* edits
// Editor/lineChanged   - sent when *user* changes the line

module.exports = Editor;

function Editor() {
	this.highlightMarker = null;
	this.editor = null;
	this.blockEditedEvents = false;
	this.blockLineChangedEvents = false;
	this.oldLine = 0;
}


Editor.prototype.init = function(_element) {
	this.editor = ace.edit(_element);
	this.editor.setTheme("ace/theme/monokai");

	this.editor.getSession().setMode("ace/mode/yaml");
	this.editor.setShowInvisibles(false);
	this.editor.setShowPrintMargin(false);
	this.editor.setHighlightActiveLine(false);
	this.editor.setHighlightGutterLine(false);
	this.editor.getSession().on('change', _(this._onChange).bind(this));
	this.editor.getSession().selection.on('changeCursor', _(this._onChangeCursor).bind(this));
	this.editor.$blockScrolling = Infinity;



	var self = this;
	this.editor.commands.addCommand({
		name: "Remove Indent",
		bindKey: {
			win: "Ctrl-[",
			mac: "Command-["
		},
		exec: function(_e) {
			var selection = self.editor.getSelectionRange();
			self.editor.getSession().outdentRows(selection);
		}
	});

	this.editor.commands.addCommand({
		name: "Add Indent",
		bindKey: {
			win: "Ctrl-]",
			mac: "Command-]"
		},
		exec: function(_e) {
			var selection = self.editor.getSelectionRange();
			self.editor.getSession().indentRows(selection.start.row, selection.end.row, "\t");
		}
	});

	this.resize();

};

Editor.prototype.resize = function() {
	this.editor.resize();

};

Editor.prototype.setText = function(_text) {
	this.blockEditedEvents = true;
	this.editor.setValue(_text);
	this.editor.clearSelection();
	this.editor.scrollToLine(0);
	this.blockEditedEvents = false;
};

Editor.prototype.getText = function() {
	return this.editor.getValue();
};


Editor.prototype.highlightLine = function(_line, _class) {
	this.highlightLines(_line, _line, _class);
};

Editor.prototype.highlightLines = function(_firstLine, _lastLine, _class) {
	_class = "highlight " + _class;

	this.editor.getSession().removeMarker(this.highlightMarker);

	this.highlightMarker = this.editor.session.addMarker(
		new AceRange(_firstLine, 0, _lastLine, 1), _class, "fullLine"
	);
};

Editor.prototype.gotoLine = function(line, focus) {
	this.blockLineChangedEvents = true;
	this.editor.gotoLine(line, 1000, true);
	this.blockLineChangedEvents = false;
	if (focus) this.editor.focus();
};


Editor.prototype._onChange = function(_e) {
	if (this.blockEditedEvents) return;
	$.Topic("Editor/edited").publish(this.getText());
};

Editor.prototype._onChangeCursor = function() {
	var line = this.editor.selection.getCursor().row + 1;
	if (this.oldLine != line) {
		this.oldLine = line;

		if (!this.blockLineChangedEvents) {
			$.Topic("Editor/lineChanged").publish(line);
		}
	}
};
