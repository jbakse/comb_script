'use strict';
/* global ace */

var _ = require('underscore');
var Range = ace.require('ace/range').Range;
var controller = require('./controller.js');
var settings = require('./settings.js');


module.exports.editor = new Editor();
module.exports.preview = new Preview();
module.exports.menu = new Menu();
module.exports.log = new Log();

////////////////////////////////////////////////////////////////////
// Editor

function Editor() {
	this.highlightMarker = null;
	this.editor = null;
}

Editor.prototype.init = function(_element) {
	this.editor = ace.edit("editor");
	this.editor.setTheme("ace/theme/monokai");
	this.editor.getSession().setMode("ace/mode/yaml");
	this.editor.setShowInvisibles(false);
	this.editor.setShowPrintMargin(false);
	this.editor.commands.addCommand({
		name: "Rebuild",
		bindKey: {
			win: "Ctrl-B|Ctrl-R",
			mac: "Command-B|Command-R"
		},
		exec: _.bind(controller.rebuild, controller)
	});

};

Editor.prototype.resize = function() {
	this.editor.resize();
};

Editor.prototype.setText = function(_text) {
	this.editor.setValue(_text);
	this.editor.clearSelection();
	this.editor.scrollToLine(0);
};

Editor.prototype.getText = function() {
	return this.editor.getValue();
};

Editor.prototype.higlightLine = function(_line, _class) {
	if (_class) {
		_class = "highlight " + _class.toLowerCase();
	}
	else {
		_class = "highlight";
	}

	this.editor.getSession().removeMarker(this.highlightMarker);

	this.highlightMarker = module.exports.editor.session.addMarker(
		new Range(_line - 1, 0, _line - 1, 1), _class, "fullLine"
	);
};



////////////////////////////////////////////////////////////////////
// Preview

function Preview() {
	this.previewLayer = null;
	this.buildLayer = null;

}

Preview.prototype.init = function(_element) {
	paper.setup(_element);
	this.previewLayer = new paper.Layer();
	this.buildLayer = new paper.Layer();
};

Preview.prototype.setDocument = function(_doc) {
	var context = settings.getRootContext();


	context.matrix.translate(settings.previewCanvasWidth * 0.5, settings.previewCanvasHeight * 0.5);
	context.matrix.scale(_doc.properties.scale || 1);
	context.matrix.scale(_doc.properties.zoom || 1);



	this.buildLayer.remove();
	this.buildLayer = new paper.Layer();
	_doc.build(context);
	this.buildLayer.style = {
		strokeScaling: false,
		strokeColor: "red",
		strokeWidth: 3,
		fillColor: new paper.Color(0, 1, 1, 0.5)
	};

	this.previewLayer.remove();
	this.previewLayer = new paper.Layer();
	_doc.preview(context);


	paper.view.update();
};


////////////////////////////////////////////////////////////////////
// Menu

function Menu() {
	$('#svg-export-button').click(controller.exportSVG);
}


////////////////////////////////////////////////////////////////////
// Log

function Log() {
	this.parseErrorTemplate =
		_.template('<li class = "error"><span class="line">Line <%= mark.line %></span> <span class="message"><%= reason %></span></li>');

	this.goodTemplate =
		_.template('<li class = "good"><span class="message"><%= message %></span></li>');

	this.messageTemplate =
		_.template('<li class = "message"><span class="message"><%= message %></span></li>');

	this.warnTemplate =
		_.template('<li class = "warn"><span class="message"><%= message %></span></li>');

	this.errorTemplate =
		_.template('<li class = "error"><span class="message"><%= message %></span></li>');
}

Log.prototype.clear = function(_message) {
	$("#log").empty();
};


Log.prototype.appendGood = function(_message) {
	$("#log").append(this.goodTemplate({
		message: _message
	}));
};

Log.prototype.appendMessage = function(_message) {
	$("#log").append(this.messageTemplate({
		message: _message
	}));
};

Log.prototype.appendWarning = function(_message) {
	$("#log").append(this.warnTemplate({
		message: _message
	}));
};

Log.prototype.appendError = function(_message) {
	$("#log").append(this.errorTemplate({
		message: _message
	}));
};

Log.prototype.appendParseError = function(_YAMLException) {
	$("#log").append(this.parseErrorTemplate(_YAMLException));
	//todo add click to this
};
