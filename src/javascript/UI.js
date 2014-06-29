'use strict';
/* global ace */

var _ = require('underscore');
var Range = ace.require('ace/range').Range;
// var controller = require('./controller.js');
var settings = require('./settings.js');


module.exports.editor = new Editor();
module.exports.preview = new Preview();
module.exports.menu = new Menu();
module.exports.inspector = new Inspector();
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
	this.editor.setHighlightActiveLine(false);
	this.editor.getSession().selection.on('changeCursor', _(this.onChangeCursor).bind(this));
 
	this.editor.commands.addCommand({
		name: "Rebuild",
		bindKey: {
			win: "Ctrl-B|Ctrl-R",
			mac: "Command-B|Command-R"
		},
		// exec: _.bind(controller.rebuild, controller)
		exec: function(_e) {
			$.Topic( "UI/rebuild" ).publish(_e);
		}
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

Editor.prototype.highlightLine = function(_line, _class) {
	this.highlightLines(_line, _line, _class);
};

Editor.prototype.highlightLines = function(_firstLine, _lastLine, _class) {
	_class = "highlight " + _class;

	this.editor.getSession().removeMarker(this.highlightMarker);

	this.highlightMarker = this.editor.session.addMarker(
		new Range(_firstLine - 1, 0, _lastLine - 1, 1), _class, "fullLine"
	);
};


var oldLine = 0;
Editor.prototype.onChangeCursor = function() {
	var line = this.editor.selection.getCursor().row + 1;
	if (oldLine != line) {
		$.Topic( "UI/lineChange" ).publish(line);
		oldLine = line;
	}
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
		strokeColor: "#090",
		strokeWidth: 3,
		fillColor: new paper.Color(0, 1, 1, 0.5)
	};

	this.previewLayer.remove();
	this.previewLayer = new paper.Layer();
	_doc.preview(context);


	paper.view.update();
};

Preview.prototype.redraw = function() {
		paper.view.update();
	};



////////////////////////////////////////////////////////////////////
// Menu

function Menu() {
	this.element = null;
}

Menu.prototype.init = function(_element) {
	this.element = _element;
	
	$('#svg-export-button').click(
		//_.bind(controller.exportSVG, controller)
		function() {
			$.Topic( "UI/exportSVG" ).publish();
		}
	);
};


////////////////////////////////////////////////////////////////////
// Inspector

function Inspector() {
	this.element = null;

}

Inspector.prototype.init = function(_element) {
	this.element = _element;

	$.Topic( "region/mouseEnter" ).subscribe( _.bind(this.showRegion, this) );
	$.Topic( "region/mouseLeave" ).subscribe( _.bind(this.clear, this) );

};

Inspector.prototype.showRegion = function(_region) {
	$(this.element).empty();
	

	var t = function(_term, _data) {
		return "<dt>"+_term+"</dt><dd>"+_data+"</dd>";
	}
		
	$(this.element).append(t("Type", _region.type));
	$(this.element).append(t("Name", _region.properties.name || "unnamed"));
	$(this.element).append(t("Line", _region.editorProperties.line || "-"));
	$(this.element).append(t("Bounds", _region.previewBounds.bounds || "{}"));
	$(this.element).append(t("Center", _region.previewBounds.bounds.center || "{}"));
	// $(this.element).append(t("Bounds", _region.previewGroup.bounds));
	// $(this.element).append(t("Center", _region.previewGroup.bounds.center));
	// $(this.element).append(t("Size", _region.previewGroup.bounds.size));
};

Inspector.prototype.clear = function(_element) {
	$(this.element).empty();
};


////////////////////////////////////////////////////////////////////
// Log

function Log() {
	this.parseErrorTemplate =
		_.template('<li class = "error"><span class="line">Line <%= mark.line %></span> <span class="message"><%= reason %></span></li>');

	this.debugTemplate =
		_.template('<li class = "debug"><span class="message"><%= message %></span></li>');

	this.successTemplate =
		_.template('<li class = "success"><span class="message"><%= message %></span></li>');

	this.messageTemplate =
		_.template('<li class = "message"><span class="message"><%= message %></span></li>');

	this.warningTemplate =
		_.template('<li class = "warning"><span class="message"><%= message %></span></li>');

	this.errorTemplate =
		_.template('<li class = "error"><span class="message"><%= message %></span></li>');
}

Log.prototype.clear = function(_message) {
	$("#log").empty();
};

function stringArguments(_arguments) {
	var args = Array.prototype.slice.call(_arguments);
	return args.join(" ");
}

Log.prototype.appendDebug = function() {
	$("#log").append(this.debugTemplate({
		message: stringArguments(arguments)
	}));
	var d = $('#log');
	d.scrollTop(d.prop("scrollHeight"));

};

Log.prototype.appendSuccess = function() {
	$("#log").append(this.successTemplate({
		message: stringArguments(arguments) 
	}));
};

Log.prototype.appendMessage = function() {
	$("#log").append(this.messageTemplate({
		message: stringArguments(arguments) 
	}));
};

Log.prototype.appendWarning = function() {
	$("#log").append(this.warningTemplate({
		message: stringArguments(arguments) 
	}));
};

Log.prototype.appendError = function() {
	$("#log").append(this.errorTemplate({
		message: stringArguments(arguments) 
	}));
};

Log.prototype.appendParseError = function(_YAMLException) {
	$("#log").append(this.parseErrorTemplate(_YAMLException));
	//todo add click to this
};
